import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from '../bookings/bookings.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private prisma: PrismaService,
    private bookings: BookingsService,
  ) {}

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

  /**
   * Every organisation/company the user owns OR works at, normalised for the
   * sidebar: one named entry per entity, with where its management page lives
   * and whether the user is the founder (members get a read-only view).
   */
  async getMyWorkspaces(userId: string) {
    const [heOwned, heMemberships, coOwned, coEmp] = await Promise.all([
      (this.prisma.healthcareEntity as any).findMany({
        where: { founderUserId: userId, isActive: true },
        select: { id: true, name: true, type: true }, orderBy: { name: 'asc' },
      }),
      (this.prisma.providerWorkplace as any).findMany({
        where: { providerUserId: userId, isActive: true, status: 'active' },
        select: { entity: { select: { id: true, name: true, type: true, founderUserId: true, isActive: true } } },
      }),
      this.prisma.corporateAdminProfile.findMany({
        where: { userId }, select: { id: true, companyName: true, isInsuranceCompany: true },
      }),
      this.prisma.corporateEmployee.findMany({
        where: { userId, status: 'active' }, select: { companyId: true },
      }),
    ]);

    type WS = { id: string; name: string; kind: 'healthcare' | 'insurance' | 'company'; type: string | null; isFounder: boolean; manageHref: string };
    const byId = new Map<string, WS>();

    for (const e of heOwned) {
      byId.set(e.id, { id: e.id, name: e.name, kind: 'healthcare', type: e.type, isFounder: true, manageHref: `/organization/${e.id}/manage` });
    }
    for (const m of heMemberships) {
      const e = m.entity;
      if (!e || !e.isActive || byId.has(e.id)) continue;
      byId.set(e.id, { id: e.id, name: e.name, kind: 'healthcare', type: e.type, isFounder: e.founderUserId === userId, manageHref: `/organization/${e.id}/manage` });
    }
    for (const c of coOwned) {
      const insurance = c.isInsuranceCompany;
      // Insurance companies are managed on the SAME unified /company/[id]/manage
      // page as every other org — the insurance-specific tabs (Contributions /
      // Claims / Pre-auths) are what differ, not the whole page.
      byId.set(c.id, { id: c.id, name: c.companyName, kind: insurance ? 'insurance' : 'company', type: null, isFounder: true, manageHref: `/company/${c.id}/manage` });
    }
    const memberCompanyIds = [...new Set((coEmp as any[]).map((e) => e.companyId).filter(Boolean))].filter((id) => !byId.has(id as string)) as string[];
    if (memberCompanyIds.length) {
      const comps = await this.prisma.corporateAdminProfile.findMany({
        where: { id: { in: memberCompanyIds } },
        select: { id: true, companyName: true, isInsuranceCompany: true },
      });
      for (const c of comps) {
        byId.set(c.id, { id: c.id, name: c.companyName, kind: c.isInsuranceCompany ? 'insurance' : 'company', type: null, isFounder: false, manageHref: `/company/${c.id}/manage` });
      }
    }

    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
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

  // ─── Emergency dispatch board (founder only) ──────────────────────────────
  // Live picture of an ambulance/emergency org: which responders are free,
  // dispatched or en route — derived from active EmergencyBookings (no new
  // model needed). Responder status comes from their current booking, if any.

  async getDispatch(id: string, founderUserId?: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id },
      select: { id: true, name: true, type: true, founderUserId: true },
    });
    if (!entity) throw new NotFoundException('Healthcare entity not found');
    if (!founderUserId || founderUserId !== entity.founderUserId) {
      throw new ForbiddenException('Only the founder can view the dispatch board');
    }

    const workplaces = await (this.prisma.providerWorkplace as any).findMany({
      where: { healthcareEntityId: id, isActive: true, status: 'active' },
      include: {
        provider: { select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, email: true } },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    const userIds: string[] = workplaces.map((w: any) => w.provider.id);
    const profiles = userIds.length
      ? await (this.prisma.emergencyWorkerProfile as any).findMany({
          where: { userId: { in: userIds } },
          select: { id: true, userId: true, vehicleType: true, emtLevel: true },
        })
      : [];
    const profByUser = new Map<string, any>(profiles.map((p: any) => [p.userId, p]));
    const profileIds: string[] = profiles.map((p: any) => p.id);

    const ACTIVE = ['pending', 'dispatched', 'en_route'];
    const bookings = profileIds.length
      ? await (this.prisma.emergencyBooking as any).findMany({
          where: { responderId: { in: profileIds }, status: { in: ACTIVE } },
          select: { id: true, responderId: true, emergencyType: true, location: true, priority: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    // Each responder's current (most recent active) booking.
    const bookingByResponder = new Map<string, any>();
    for (const b of bookings) if (!bookingByResponder.has(b.responderId)) bookingByResponder.set(b.responderId, b);

    const responders = workplaces.map((w: any) => {
      const prof = profByUser.get(w.provider.id);
      const active = prof ? bookingByResponder.get(prof.id) : undefined;
      const status = active
        ? (active.status === 'en_route' ? 'en_route' : 'dispatched')
        : (prof ? 'available' : 'member');
      return {
        userId: w.provider.id,
        name: `${w.provider.firstName} ${w.provider.lastName}`.trim(),
        email: w.provider.email,
        profileImage: w.provider.profileImage,
        isResponder: !!prof,
        vehicleType: prof?.vehicleType ?? null,
        emtLevel: prof?.emtLevel ?? null,
        status,
        activeRequest: active
          ? { id: active.id, emergencyType: active.emergencyType, location: active.location, priority: active.priority, status: active.status }
          : null,
      };
    });

    const nameByProfile = new Map<string, string>();
    for (const w of workplaces) {
      const prof = profByUser.get(w.provider.id);
      if (prof) nameByProfile.set(prof.id, `${w.provider.firstName} ${w.provider.lastName}`.trim());
    }
    const requests = bookings.map((b: any) => ({
      id: b.id,
      emergencyType: b.emergencyType,
      location: b.location,
      priority: b.priority,
      status: b.status,
      responderName: nameByProfile.get(b.responderId) ?? null,
      createdAt: b.createdAt,
    }));

    return {
      entity: { id: entity.id, name: entity.name, type: entity.type },
      summary: {
        total: responders.filter((r: any) => r.isResponder).length,
        available: responders.filter((r: any) => r.status === 'available').length,
        dispatched: responders.filter((r: any) => r.status === 'dispatched').length,
        enRoute: responders.filter((r: any) => r.status === 'en_route').length,
        activeRequests: requests.length,
      },
      responders,
      requests,
    };
  }

  // ─── Org-level booking ─────────────────────────────────────────────────────

  /** A member's per-org weekly availability grid (founder view). */
  async getMemberAvailability(id: string, memberUserId: string, founderUserId: string) {
    await this.assertFounder(id, founderUserId);
    const rows = await (this.prisma as any).orgProviderAvailability.findMany({
      where: { healthcareEntityId: id, userId: memberUserId },
      select: { id: true, dayOfWeek: true, startTime: true, endTime: true, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return rows;
  }

  /** Replace a member's per-org availability with the supplied weekly grid. */
  async setMemberAvailability(
    id: string, memberUserId: string, founderUserId: string,
    slots: { dayOfWeek: number; startTime: string; endTime: string }[],
  ) {
    await this.assertFounder(id, founderUserId);
    const member = await (this.prisma.providerWorkplace as any).findFirst({
      where: { healthcareEntityId: id, providerUserId: memberUserId, isActive: true },
      select: { id: true },
    });
    if (!member) throw new BadRequestException('That user is not a member of this organisation');

    const clean = (slots || [])
      .filter(s => Number.isInteger(s.dayOfWeek) && s.dayOfWeek >= 0 && s.dayOfWeek <= 6 && /^\d{2}:\d{2}$/.test(s.startTime) && /^\d{2}:\d{2}$/.test(s.endTime) && s.startTime < s.endTime)
      // de-dupe on (day,start) — the unique constraint key
      .filter((s, i, arr) => arr.findIndex(o => o.dayOfWeek === s.dayOfWeek && o.startTime === s.startTime) === i);

    await this.prisma.$transaction([
      (this.prisma as any).orgProviderAvailability.deleteMany({ where: { healthcareEntityId: id, userId: memberUserId } }),
      ...clean.map(s => (this.prisma as any).orgProviderAvailability.create({
        data: { userId: memberUserId, healthcareEntityId: id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: true },
      })),
    ]);
    return { count: clean.length };
  }

  /** Providers in this org offering the service, each with their free slots for a date. */
  async getBookingOptions(id: string, serviceId: string | undefined, date: string) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id }, select: { id: true, name: true, type: true, isActive: true },
    });
    if (!entity || !entity.isActive) throw new NotFoundException('Healthcare entity not found');

    const workplaces: any[] = await (this.prisma.providerWorkplace as any).findMany({
      where: { healthcareEntityId: id, status: 'active', isActive: true },
      include: { provider: { select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, verified: true } } },
    });
    let providers = workplaces.map(w => w.provider).filter((p: any) => p.verified);

    // Filter to providers who actually offer the requested service.
    if (serviceId) {
      const configs = await (this.prisma.providerServiceConfig as any).findMany({
        where: { platformServiceId: serviceId, isActive: true, providerUserId: { in: providers.map((p: any) => p.id) } },
        select: { providerUserId: true },
      });
      const offering = new Set(configs.map((c: any) => c.providerUserId));
      providers = providers.filter((p: any) => offering.has(p.id));
    }

    const duration = serviceId
      ? (await this.prisma.platformService.findUnique({ where: { id: serviceId }, select: { duration: true } }))?.duration ?? 30
      : 30;

    const withSlots = await Promise.all(providers.map(async (p: any) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      userType: p.userType,
      profileImage: p.profileImage,
      slots: await this.bookings.getAvailableSlots(p.id, date, duration, id),
    })));

    return { entity, duration, providers: withSlots.filter(p => p.slots.length > 0) };
  }

  /** Patient books a service at the org. Provider is chosen, or auto-assigned to
   *  the first member free at that time. Reuses the core booking pipeline. */
  async createOrgBooking(id: string, patientUserId: string, data: {
    serviceId?: string; providerUserId?: string; scheduledDate: string; scheduledTime: string;
    type?: string; reason?: string; notes?: string; contactNumber?: string;
  }) {
    const entity = await (this.prisma.healthcareEntity as any).findUnique({
      where: { id }, select: { id: true, name: true, isActive: true },
    });
    if (!entity || !entity.isActive) throw new NotFoundException('Healthcare entity not found');

    const options = await this.getBookingOptions(id, data.serviceId, data.scheduledDate);
    const free = options.providers.filter(p => p.slots.includes(data.scheduledTime));
    if (free.length === 0) throw new BadRequestException('No provider is available for that time slot');

    const chosen = data.providerUserId
      ? free.find(p => p.id === data.providerUserId)
      : free[0];
    if (!chosen) throw new BadRequestException('The selected provider is not available for that slot');

    const result = await this.bookings.createBooking(patientUserId, {
      providerUserId: chosen.id,
      providerType: chosen.userType,
      platformServiceId: data.serviceId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      type: data.type,
      reason: data.reason,
      notes: data.notes,
      contactNumber: data.contactNumber,
      duration: options.duration,
      organizationId: id,
    });
    return { ...result, assignedProvider: { id: chosen.id, name: chosen.name } };
  }

  /** All bookings made through this org (founder view, for the Booking tab). */
  async getOrgBookings(id: string, founderUserId: string) {
    await this.assertFounder(id, founderUserId);
    const bookings = await (this.prisma.serviceBooking as any).findMany({
      where: { organizationId: id, deletedAt: null },
      select: {
        id: true, providerUserId: true, providerName: true, serviceName: true,
        scheduledAt: true, duration: true, type: true, status: true, priority: true, patientId: true,
      },
      orderBy: { scheduledAt: 'desc' },
      take: 200,
    });
    // Resolve patient display names.
    const patientIds = [...new Set(bookings.map((b: any) => b.patientId))];
    const patients = patientIds.length
      ? await (this.prisma.patientProfile as any).findMany({
          where: { id: { in: patientIds } },
          select: { id: true, user: { select: { firstName: true, lastName: true } } },
        })
      : [];
    const nameById = new Map<string, string>(patients.map((p: any) => [p.id, `${p.user.firstName} ${p.user.lastName}`.trim()]));
    return bookings.map((b: any) => ({ ...b, patientName: nameById.get(b.patientId) ?? null }));
  }

  /** Reassign a booking to a different member of the org (founder only). */
  async reassignBooking(id: string, bookingId: string, newProviderUserId: string, founderUserId: string) {
    await this.assertFounder(id, founderUserId);
    const booking = await (this.prisma.serviceBooking as any).findFirst({
      where: { id: bookingId, organizationId: id }, select: { id: true },
    });
    if (!booking) throw new NotFoundException('Booking not found for this organisation');
    const member = await (this.prisma.providerWorkplace as any).findFirst({
      where: { healthcareEntityId: id, providerUserId: newProviderUserId, isActive: true, status: 'active' },
      select: { id: true },
    });
    if (!member) throw new BadRequestException('Target provider is not an active member of this organisation');
    const provider = await this.prisma.user.findUnique({
      where: { id: newProviderUserId }, select: { firstName: true, lastName: true, userType: true },
    });
    if (!provider) throw new NotFoundException('Provider not found');

    await this.prisma.$transaction([
      (this.prisma.serviceBooking as any).update({
        where: { id: bookingId },
        data: { providerUserId: newProviderUserId, providerName: `${provider.firstName} ${provider.lastName}`.trim(), providerType: provider.userType },
      }),
      // Move any held slots to the new provider so availability stays consistent.
      (this.prisma.bookedSlot as any).updateMany({ where: { bookingId }, data: { providerUserId: newProviderUserId } }),
    ]);
    return { success: true };
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
