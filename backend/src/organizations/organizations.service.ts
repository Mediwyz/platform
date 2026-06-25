import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Create a healthcare entity ──────────────────────────────────────────

  async create(
    founderUserId: string,
    dto: {
      name: string;
      type: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
      website?: string;
    },
  ) {
    // Check uniqueness manually (name + city + country unique constraint)
    const existing = await (this.prisma.healthcareEntity as any).findFirst({
      where: {
        name: dto.name,
        city: dto.city ?? null,
        country: dto.country ?? 'MU',
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'A healthcare entity with this name already exists in this city.',
      );
    }

    const entity = await (this.prisma.healthcareEntity as any).create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        country: dto.country ?? 'MU',
        phone: dto.phone,
        email: dto.email,
        website: dto.website,
        founderUserId,
        isVerified: false,
        isActive: true,
      },
    });

    // Add founder as primary active member with Founder role
    await (this.prisma.providerWorkplace as any).create({
      data: {
        providerUserId: founderUserId,
        healthcareEntityId: entity.id,
        role: 'Founder',
        isPrimary: true,
        isActive: true,
        status: 'active',
      },
    });

    this.logger.log(`HealthcareEntity created: ${entity.id} by ${founderUserId}`);
    return entity;
  }

  // ─── Public paginated search ──────────────────────────────────────────────

  async findAll(query: {
    q?: string;
    type?: string;
    city?: string;
    country?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (query.type) where.type = query.type;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.country) where.country = query.country;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { address: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [entities, total] = await Promise.all([
      (this.prisma.healthcareEntity as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
        include: {
          providers: {
            where: { status: 'active', isActive: true },
            take: 5,
            include: {
              provider: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  userType: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      }),
      (this.prisma.healthcareEntity as any).count({ where }),
    ]);

    const mapped = entities.map((entity: any) => {
      const { providers, ...rest } = entity;
      return {
        ...rest,
        providerCount: providers.length,
        sampleProviders: providers.map((pw: any) => ({
          id: pw.provider.id,
          firstName: pw.provider.firstName,
          lastName: pw.provider.lastName,
          userType: pw.provider.userType,
          profileImage: pw.provider.profileImage,
          role: pw.role,
        })),
      };
    });

    return { entities: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── My organisations (owned + member-of), for the "My Company" overview ──
  //
  // Returns every healthcare entity the user founded (owned) plus every entity
  // they are an active member of. The frontend groups these by `type`
  // (clinic / hospital / laboratory / pharmacy / self_employed / …) and shows a
  // create + invite affordance per category. Insurance/employer companies live
  // in the corporate subsystem and are surfaced separately on the same page.

  /** True if the user founded a pharmacy / health-shop entity. */
  async ownsInventoryOrg(userId: string): Promise<boolean> {
    const rows = await (this.prisma.healthcareEntity as any).findMany({
      where: { founderUserId: userId, isActive: true },
      select: { type: true },
    });
    return rows.some((r: { type: string }) => /pharmac|health[\s_-]?shop|drugstore/i.test(r.type || ''));
  }

  async getMyOrganisations(userId: string) {
    const entitySelect = {
      id: true,
      name: true,
      type: true,
      city: true,
      country: true,
      logoUrl: true,
      isVerified: true,
    };

    const [ownedRaw, memberships] = await Promise.all([
      (this.prisma.healthcareEntity as any).findMany({
        where: { founderUserId: userId, isActive: true },
        select: entitySelect,
        orderBy: { name: 'asc' },
      }),
      (this.prisma.providerWorkplace as any).findMany({
        where: { providerUserId: userId, isActive: true, status: 'active' },
        select: {
          role: true,
          isPrimary: true,
          entity: { select: { ...entitySelect, founderUserId: true, isActive: true } },
        },
      }),
    ]);

    // Active-member counts for the owned entities (one grouped query, no N+1).
    const ownedIds: string[] = ownedRaw.map((e: any) => e.id);
    const countRows: any[] = ownedIds.length
      ? await (this.prisma.providerWorkplace as any).groupBy({
          by: ['healthcareEntityId'],
          where: { healthcareEntityId: { in: ownedIds }, status: 'active', isActive: true },
          _count: { _all: true },
        })
      : [];
    const memberCountByEntity = new Map<string, number>(
      countRows.map((r: any) => [r.healthcareEntityId, r._count?._all ?? 0]),
    );

    const owned = ownedRaw.map((e: any) => ({
      ...e,
      isOwner: true,
      memberCount: memberCountByEntity.get(e.id) ?? 0,
    }));

    // Entities the user belongs to but did NOT found (exclude owned to avoid dupes).
    const member = memberships
      .filter((m: any) => m.entity && m.entity.isActive && m.entity.founderUserId !== userId)
      .map((m: any) => {
        const { founderUserId, isActive, ...rest } = m.entity;
        return { ...rest, isOwner: false, role: m.role, isPrimary: m.isPrimary };
      });

    return { owned, member };
  }

  // ─── Single entity (public) ───────────────────────────────────────────────

  async findOne(id: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id },
      include: {
        providers: {
          where: { status: 'active', isActive: true },
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userType: true,
                profileImage: true,
              },
            },
          },
          orderBy: { isPrimary: 'desc' },
        },
      },
    });

    if (!entity) throw new NotFoundException('Healthcare entity not found');

    return {
      ...entity,
      providers: entity.providers.map((pw: any) => ({
        workplaceId: pw.id,
        role: pw.role,
        isPrimary: pw.isPrimary,
        startDate: pw.startDate,
        provider: pw.provider,
      })),
    };
  }

  // ─── Update entity fields (founder only) ─────────────────────────────────

  async update(
    id: string,
    founderUserId: string,
    dto: {
      name?: string;
      type?: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
      website?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    await this.assertFounder(id, founderUserId);

    const update: any = {};
    const allowed = [
      'name', 'type', 'description', 'address', 'city', 'country',
      'phone', 'email', 'website', 'latitude', 'longitude',
    ];
    for (const key of allowed) {
      if ((dto as any)[key] !== undefined) update[key] = (dto as any)[key];
    }

    return (this.prisma.healthcareEntity as any).update({
      where: { id },
      data: update,
    });
  }

  // ─── Upload / set logo (founder only) ────────────────────────────────────

  async uploadLogo(id: string, founderUserId: string, logoData: string) {
    await this.assertFounder(id, founderUserId);

    let logoUrl: string;

    if (logoData.startsWith('http://') || logoData.startsWith('https://') || logoData.startsWith('/')) {
      // Already a URL — store directly
      logoUrl = logoData;
    } else {
      // Treat as base64 data — could be data:image/png;base64,... or raw base64
      const matches = logoData.match(/^data:image\/(\w+);base64,(.+)$/);
      let ext = 'png';
      let base64Payload = logoData;

      if (matches) {
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        base64Payload = matches[2];
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'organizations', id);
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `logo.${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, Buffer.from(base64Payload, 'base64'));

      logoUrl = `/uploads/organizations/${id}/${filename}`;
      this.logger.log(`Logo saved for entity ${id}: ${filePath}`);
    }

    return (this.prisma.healthcareEntity as any).update({
      where: { id },
      data: { logoUrl },
    });
  }

  // ─── Get members (founder sees all statuses) ──────────────────────────────

  async getMembers(id: string, founderUserId?: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id },
      select: { id: true, founderUserId: true },
    });
    if (!entity) throw new NotFoundException('Healthcare entity not found');

    const isFounder = founderUserId && founderUserId === entity.founderUserId;

    const where: any = {
      healthcareEntityId: id,
      isActive: true,
    };
    // Non-founders only see active members
    if (!isFounder) {
      where.status = 'active';
    }

    const workplaces = await (this.prisma.providerWorkplace as any).findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userType: true,
            profileImage: true,
            email: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return workplaces.map((pw: any) => ({
      workplaceId: pw.id,
      role: pw.role,
      isPrimary: pw.isPrimary,
      status: pw.status,
      startDate: pw.startDate,
      createdAt: pw.createdAt,
      provider: pw.provider,
    }));
  }

  // ─── Invite a member (founder only) ──────────────────────────────────────

  async inviteMember(
    id: string,
    founderUserId: string,
    dto: { email: string; suggestedRole?: string },
  ) {
    await this.assertFounder(id, founderUserId);

    // Check for a pending invitation for the same email
    const existing = await (this.prisma.workplaceInvitation as any).findFirst({
      where: {
        healthcareEntityId: id,
        invitedEmail: dto.email,
        status: 'pending',
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'An active invitation already exists for this email address.',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await (this.prisma.workplaceInvitation as any).create({
      data: {
        healthcareEntityId: id,
        invitedByUserId: founderUserId,
        invitedEmail: dto.email,
        suggestedRole: dto.suggestedRole,
        expiresAt,
        status: 'pending',
      },
    });

    this.logger.log(`Invitation created for ${dto.email} to entity ${id}`);
    // In production this would send an email. For now, return the token.
    return {
      id: invitation.id,
      token: invitation.token,
      invitedEmail: invitation.invitedEmail,
      suggestedRole: invitation.suggestedRole,
      expiresAt: invitation.expiresAt,
      status: invitation.status,
    };
  }

  // ─── Approve a pending member (founder only) ──────────────────────────────

  async approveMember(id: string, founderUserId: string, workplaceId: string) {
    await this.assertFounder(id, founderUserId);

    const workplace = await (this.prisma.providerWorkplace as any).findFirst({
      where: { id: workplaceId, healthcareEntityId: id },
      select: { id: true, status: true },
    });
    if (!workplace) throw new NotFoundException('Membership not found');

    return (this.prisma.providerWorkplace as any).update({
      where: { id: workplaceId },
      data: { status: 'active', isActive: true },
    });
  }

  // ─── Reject a pending member (founder only) ───────────────────────────────

  async rejectMember(id: string, founderUserId: string, workplaceId: string) {
    await this.assertFounder(id, founderUserId);

    const workplace = await (this.prisma.providerWorkplace as any).findFirst({
      where: { id: workplaceId, healthcareEntityId: id },
      select: { id: true },
    });
    if (!workplace) throw new NotFoundException('Membership not found');

    return (this.prisma.providerWorkplace as any).update({
      where: { id: workplaceId },
      data: { status: 'rejected' },
    });
  }

  // ─── Remove / deactivate a member (founder only) ──────────────────────────

  async removeMember(id: string, founderUserId: string, workplaceId: string) {
    const entity = await this.assertFounder(id, founderUserId);

    const workplace = await (this.prisma.providerWorkplace as any).findFirst({
      where: { id: workplaceId, healthcareEntityId: id },
      select: { id: true, providerUserId: true, role: true },
    });
    if (!workplace) throw new NotFoundException('Membership not found');

    // Cannot remove the founder themselves
    if (workplace.providerUserId === entity.founderUserId) {
      throw new ForbiddenException('Cannot remove the founder from the entity.');
    }

    return (this.prisma.providerWorkplace as any).update({
      where: { id: workplaceId },
      data: { isActive: false, status: 'rejected', endDate: new Date() },
    });
  }

  // ─── Request to join (any authenticated provider) ─────────────────────────

  async requestToJoin(
    entityId: string,
    providerUserId: string,
    dto: { role?: string; isPrimary?: boolean },
  ) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id: entityId },
      select: { id: true, founderUserId: true, isActive: true },
    });
    if (!entity || !entity.isActive) throw new NotFoundException('Healthcare entity not found');

    // Check if already a member
    const existing = await (this.prisma.providerWorkplace as any).findUnique({
      where: { providerUserId_healthcareEntityId: { providerUserId, healthcareEntityId: entityId } },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new BadRequestException(
        `You already have a membership with status: ${existing.status}`,
      );
    }

    // Founder joining their own entity → auto-approve
    const isFounder = entity.founderUserId === providerUserId;

    return (this.prisma.providerWorkplace as any).create({
      data: {
        providerUserId,
        healthcareEntityId: entityId,
        role: dto.role,
        isPrimary: dto.isPrimary ?? false,
        isActive: true,
        status: isFounder ? 'active' : 'pending_approval',
      },
    });
  }

  // ─── List pending invitations for an entity (founder only) ──────────────────

  async getInvitations(entityId: string, founderUserId: string) {
    await this.assertFounder(entityId, founderUserId);

    const invitations = await (this.prisma.workplaceInvitation as any).findMany({
      where: { healthcareEntityId: entityId, status: 'pending' },
      select: {
        id: true,
        invitedEmail: true,
        suggestedRole: true,
        token: true,
        expiresAt: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv: any) => ({
      id: inv.id,
      email: inv.invitedEmail,
      suggestedRole: inv.suggestedRole,
      token: inv.token,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      status: inv.status,
    }));
  }

  // ─── Get invitation info by token (public) ────────────────────────────────

  async getInvitation(token: string) {
    const invitation = await (this.prisma.workplaceInvitation as any).findUnique({
      where: { token },
      include: {
        healthcareEntity: {
          select: { id: true, name: true, type: true, city: true, logoUrl: true },
        },
        invitedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    return {
      id: invitation.id,
      invitedEmail: invitation.invitedEmail,
      suggestedRole: invitation.suggestedRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      isExpired: new Date() > new Date(invitation.expiresAt),
      alreadyAccepted: invitation.status === 'accepted',
      entity: invitation.healthcareEntity,
      inviterName: invitation.invitedBy
        ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
        : null,
    };
  }

  // ─── Accept invitation (authenticated user) ───────────────────────────────

  async acceptInvitation(token: string, userId: string) {
    const invitation = await (this.prisma.workplaceInvitation as any).findUnique({
      where: { token },
      select: {
        id: true,
        healthcareEntityId: true,
        invitedEmail: true,
        suggestedRole: true,
        status: true,
        expiresAt: true,
        acceptedByUserId: true,
      },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'pending') {
      throw new BadRequestException(`Invitation has already been ${invitation.status}.`);
    }
    if (new Date() > new Date(invitation.expiresAt)) {
      // Mark as expired
      await (this.prisma.workplaceInvitation as any).update({
        where: { token },
        data: { status: 'expired' },
      });
      throw new BadRequestException('This invitation has expired.');
    }

    // Verify user email matches invited email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address.',
      );
    }

    // Upsert ProviderWorkplace — create if not exists, activate if pending
    const existingWorkplace = await (this.prisma.providerWorkplace as any).findUnique({
      where: {
        providerUserId_healthcareEntityId: {
          providerUserId: userId,
          healthcareEntityId: invitation.healthcareEntityId,
        },
      },
      select: { id: true },
    });

    if (existingWorkplace) {
      await (this.prisma.providerWorkplace as any).update({
        where: { id: existingWorkplace.id },
        data: {
          status: 'active',
          isActive: true,
          role: invitation.suggestedRole,
        },
      });
    } else {
      await (this.prisma.providerWorkplace as any).create({
        data: {
          providerUserId: userId,
          healthcareEntityId: invitation.healthcareEntityId,
          role: invitation.suggestedRole,
          isPrimary: false,
          isActive: true,
          status: 'active',
        },
      });
    }

    // Mark invitation as accepted
    await (this.prisma.workplaceInvitation as any).update({
      where: { token },
      data: { status: 'accepted', acceptedByUserId: userId },
    });

    this.logger.log(`User ${userId} accepted invitation to entity ${invitation.healthcareEntityId}`);
    return { success: true, entityId: invitation.healthcareEntityId };
  }

  // ─── Providers + services for booking flow (public) ───────────────────────

  async getProvidersServices(id: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        logoUrl: true,
        isActive: true,
      },
    });
    if (!entity || !entity.isActive) throw new NotFoundException('Healthcare entity not found');

    // Fetch all active workplaces at this entity
    const workplaces: any[] = await (this.prisma.providerWorkplace as any).findMany({
      where: { healthcareEntityId: id, status: 'active', isActive: true },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userType: true,
            profileImage: true,
          },
        },
      },
    });

    if (workplaces.length === 0) {
      return { entity, providers: [] };
    }

    const providerUserIds = workplaces.map((pw: any) => pw.providerUserId);

    // Fetch service configs for all providers in this entity
    const serviceConfigs: any[] = await (this.prisma.providerServiceConfig as any).findMany({
      where: { providerUserId: { in: providerUserIds }, isActive: true },
      select: {
        providerUserId: true,
        priceOverride: true,
        platformServiceId: true,
        workflowTemplates: {
          select: {
            workflowTemplate: {
              select: { id: true, name: true, serviceMode: true },
            },
          },
        },
      },
    });

    // Collect all platform service IDs
    const platformServiceIds = [...new Set(serviceConfigs.map((c: any) => c.platformServiceId))];

    // Fetch platform service details
    const platformServices: any[] = platformServiceIds.length > 0
      ? await this.prisma.platformService.findMany({
          where: { id: { in: platformServiceIds }, isActive: true },
          select: {
            id: true,
            serviceName: true,
            category: true,
            defaultPrice: true,
            duration: true,
            iconKey: true,
            emoji: true,
          },
        })
      : [];

    const platformServiceMap = new Map(platformServices.map((s: any) => [s.id, s]));

    // Group service configs by provider
    const configsByProvider = new Map<string, any[]>();
    for (const config of serviceConfigs) {
      const list = configsByProvider.get(config.providerUserId) ?? [];
      list.push(config);
      configsByProvider.set(config.providerUserId, list);
    }

    // Assemble provider + services structure
    const providers = workplaces.map((pw: any) => {
      const configs = configsByProvider.get(pw.providerUserId) ?? [];
      const services = configs
        .map((config: any) => {
          const svc = platformServiceMap.get(config.platformServiceId);
          if (!svc) return null;

          const workflows = (config.workflowTemplates ?? [])
            .map((link: any) => link.workflowTemplate)
            .filter(Boolean)
            .map((wt: any) => ({
              id: wt.id,
              name: wt.name,
              serviceMode: wt.serviceMode,
            }));

          return {
            id: svc.id,
            serviceName: svc.serviceName,
            category: svc.category,
            defaultPrice: config.priceOverride ?? svc.defaultPrice,
            duration: svc.duration,
            iconKey: svc.iconKey,
            emoji: svc.emoji,
            workflows,
          };
        })
        .filter(Boolean);

      return {
        id: pw.provider.id,
        name: `${pw.provider.firstName} ${pw.provider.lastName}`,
        userType: pw.provider.userType,
        profileImage: pw.provider.profileImage,
        role: pw.role,
        services,
      };
    });

    return { entity, providers };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Verify `userId` is the founder of the entity. Throws `ForbiddenException`
   * if not. Returns the entity row on success.
   */
  private async assertFounder(entityId: string, userId: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id: entityId },
      select: { id: true, founderUserId: true },
    });
    if (!entity) throw new NotFoundException('Healthcare entity not found');
    if (entity.founderUserId !== userId) {
      throw new ForbiddenException('Only the entity founder can perform this action.');
    }
    return entity;
  }
}
