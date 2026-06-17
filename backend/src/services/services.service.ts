import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { UpdateServiceConfigDto } from './dto/update-service-config.dto';
import { CreatePlatformServiceDto } from './dto/create-platform-service.dto';
import { UpdatePlatformServiceDto } from './dto/update-platform-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getCatalog(providerType?: string, countryCode?: string) {
    const where: any = { isActive: true };
    if (providerType) where.providerType = providerType.toUpperCase();
    if (countryCode) where.OR = [{ countryCode }, { countryCode: null }];

    const services = await this.prisma.platformService.findMany({
      where,
      orderBy: [{ providerType: 'asc' }, { category: 'asc' }, { serviceName: 'asc' }],
      select: {
        id: true, providerType: true, serviceName: true, category: true,
        description: true, defaultPrice: true, currency: true, duration: true,
        isDefault: true, countryCode: true, iconKey: true, emoji: true,
      },
    });

    const grouped: Record<string, any[]> = {};
    for (const svc of services) {
      const key = `${svc.providerType} — ${svc.category}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: svc.id, serviceName: svc.serviceName, defaultPrice: svc.defaultPrice,
        description: svc.description, duration: svc.duration, isDefault: svc.isDefault,
        iconKey: svc.iconKey, emoji: svc.emoji,
      });
    }

    return Object.entries(grouped).map(([category, items]) => ({ category, services: items }));
  }

  async getProviderPublicServices(userId: string) {
    const configs: any[] = await (this.prisma.providerServiceConfig as any).findMany({
      where: { providerUserId: userId, isActive: true },
      include: {
        platformService: {
          select: {
            id: true, serviceName: true, category: true,
            description: true, defaultPrice: true, duration: true, providerType: true,
          },
        },
        workflowTemplates: {
          select: { workflowTemplate: { select: { serviceMode: true, isActive: true } } },
        },
      },
      orderBy: [{ platformService: { category: 'asc' } }],
    });
    // Surface the modes each service supports (office / home / video / …),
    // derived from the linked workflows — so the profile shows how a member
    // can book each service.
    return configs.map((c: any) => {
      const { workflowTemplates, ...rest } = c;
      const serviceModes = Array.from(
        new Set(
          (workflowTemplates ?? [])
            .map((l: any) => l.workflowTemplate)
            .filter((wt: any) => wt?.isActive && wt.serviceMode)
            .map((wt: any) => wt.serviceMode as string),
        ),
      );
      return { ...rest, serviceModes };
    });
  }

  async getMyServices(userId: string) {
    const configs: any[] = await (this.prisma.providerServiceConfig as any).findMany({
      where: { providerUserId: userId },
      include: {
        platformService: true,
        workflowTemplates: {
          include: {
            workflowTemplate: {
              select: { id: true, name: true, serviceMode: true, steps: true, isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return configs.map((c: any) => ({
      ...c,
      workflows: (c.workflowTemplates ?? [])
        .map((link: any) => link.workflowTemplate)
        .filter((wt: any) => wt?.isActive),
    }));
  }

  async addMyService(userId: string, body: { platformServiceId: string; priceOverride?: number; workflowTemplateIds: string[] }) {
    if (!body.platformServiceId) throw new BadRequestException('platformServiceId is required');
    if (!body.workflowTemplateIds?.length) throw new BadRequestException('At least one workflow template is required');

    const config: any = await (this.prisma.providerServiceConfig as any).upsert({
      where: {
        platformServiceId_providerUserId: {
          platformServiceId: body.platformServiceId,
          providerUserId: userId,
        },
      },
      update: { isActive: true, priceOverride: body.priceOverride ?? null },
      create: {
        platformServiceId: body.platformServiceId,
        providerUserId: userId,
        priceOverride: body.priceOverride ?? null,
        isActive: true,
      },
    });

    await (this.prisma.providerServiceWorkflow as any).deleteMany({
      where: { providerServiceConfigId: config.id },
    });
    for (const tplId of body.workflowTemplateIds) {
      await (this.prisma.providerServiceWorkflow as any).create({
        data: { providerServiceConfigId: config.id, workflowTemplateId: tplId },
      });
    }
    return config;
  }

  async removeMyService(userId: string, platformServiceId: string) {
    const config: any = await (this.prisma.providerServiceConfig as any).findUnique({
      where: {
        platformServiceId_providerUserId: { platformServiceId, providerUserId: userId },
      },
    });
    if (!config) throw new NotFoundException('Service config not found');
    await this.prisma.providerServiceConfig.update({
      where: { id: config.id },
      data: { isActive: false },
    });
  }

  async updateServiceWorkflows(userId: string, platformServiceId: string, workflowTemplateIds: string[]) {
    if (!workflowTemplateIds?.length) throw new BadRequestException('At least one workflow template is required');

    const config: any = await (this.prisma.providerServiceConfig as any).findUnique({
      where: {
        platformServiceId_providerUserId: { platformServiceId, providerUserId: userId },
      },
    });
    if (!config) throw new NotFoundException('Service config not found');

    await (this.prisma.providerServiceWorkflow as any).deleteMany({
      where: { providerServiceConfigId: config.id },
    });
    for (const tplId of workflowTemplateIds) {
      await (this.prisma.providerServiceWorkflow as any).upsert({
        where: {
          providerServiceConfigId_workflowTemplateId: {
            providerServiceConfigId: config.id,
            workflowTemplateId: tplId,
          },
        },
        update: {},
        create: { providerServiceConfigId: config.id, workflowTemplateId: tplId },
      });
    }
  }

  async updateMyService(userId: string, dto: UpdateServiceConfigDto) {
    const config = await this.prisma.providerServiceConfig.findUnique({ where: { id: dto.configId } });
    if (!config || config.providerUserId !== userId) throw new NotFoundException('Not found');
    const data: any = {};
    if (dto.priceOverride !== undefined) data.priceOverride = dto.priceOverride;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.providerServiceConfig.update({ where: { id: dto.configId }, data });
  }

  async createCustomService(userId: string, dto: CreateCustomServiceDto) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, regionId: true },
    });
    if (!dbUser) throw new NotFoundException('User not found');
    if (dbUser.userType === 'MEMBER') {
      throw new ForbiddenException('Members cannot create services. Providers and admins can.');
    }

    // Self-serve wizard supplies its own workflow, OR the provider picked
    // existing templates — either way the service is bookable immediately. Only
    // require a pre-existing template on the bare legacy path (neither given).
    if (!dto.workflow && !dto.workflowTemplateIds?.length) {
      const templateExists = await this.prisma.workflowTemplate.findFirst({
        where: { providerType: dbUser.userType, isActive: true },
        select: { id: true },
      });
      if (!templateExists) {
        throw new ForbiddenException(
          `No workflow template exists for provider type "${dbUser.userType}". ` +
          `Configure an appointment type with the wizard, or ask a regional admin to add one.`,
        );
      }
    }

    const serviceData = {
      serviceName: dto.name,
      // description is required by the schema but optional in the form — default
      // to an empty string so an omitted description doesn't break the create.
      description: dto.description ?? '',
      providerType: dbUser.userType as any,
      category: dto.category || 'custom',
      defaultPrice: dto.price || 0,
      duration: dto.duration || 30,
      isDefault: false,
      isActive: true,
      createdByProviderId: userId,
      iconKey: dto.iconKey || null,
      emoji: dto.emoji || null,
      imageUrl: dto.imageUrl || null,
    };

    // Create service + config (+ wizard workflow) atomically.
    return this.prisma.$transaction(async (tx) => {
      const service = await tx.platformService.create({ data: serviceData });
      const config = await tx.providerServiceConfig.create({
        data: { platformServiceId: service.id, providerUserId: userId, isActive: true },
      });

      if (dto.workflow) {
        const wf = dto.workflow;
        const paymentTiming = wf.paymentTiming === 'ON_COMPLETION' ? 'ON_COMPLETION' : 'ON_ACCEPTANCE';
        // Slug must be unique — scope it to this provider + service + mode.
        const slug = `provider-${userId.slice(0, 8)}-${service.id.slice(0, 8)}-${wf.serviceMode}`.toLowerCase();
        const template = await tx.workflowTemplate.create({
          data: {
            name: wf.name || dto.name,
            slug,
            description: wf.description ?? '',
            providerType: dbUser.userType as any,
            serviceMode: wf.serviceMode,
            steps: (wf.steps ?? []) as any,
            transitions: (wf.transitions ?? []) as any,
            serviceConfig: (wf.serviceConfig ?? {}) as any,
            paymentTiming: paymentTiming as any,
            isDefault: false,
            isDraft: false, // published — the engine resolves it for bookings
            isActive: true,
            createdByProviderId: userId,
            platformServiceId: service.id,
          },
        });
        await tx.providerServiceWorkflow.create({
          data: { providerServiceConfigId: config.id, workflowTemplateId: template.id },
        });
      } else if (dto.workflowTemplateIds?.length) {
        // Provider picked existing workflow templates (appointment types) — link
        // each to this service's config. De-duped against accidental repeats.
        for (const tplId of [...new Set(dto.workflowTemplateIds)]) {
          await tx.providerServiceWorkflow.create({
            data: { providerServiceConfigId: config.id, workflowTemplateId: tplId },
          });
        }
      }

      return service;
    });
  }

  async updateCustomService(userId: string, id: string, dto: CreateCustomServiceDto) {
    const service = await this.prisma.platformService.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.createdByProviderId !== userId) throw new ForbiddenException('You can only edit services you created');

    const data: any = {};
    if (dto.name !== undefined) data.serviceName = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.price !== undefined) data.defaultPrice = dto.price;
    if (dto.duration !== undefined) data.duration = dto.duration;
    if (dto.iconKey !== undefined) data.iconKey = dto.iconKey || null;
    if (dto.emoji !== undefined) data.emoji = dto.emoji || null;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl || null;

    return this.prisma.platformService.update({ where: { id }, data });
  }

  async deleteCustomService(userId: string, id: string) {
    const service = await this.prisma.platformService.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.createdByProviderId !== userId) throw new ForbiddenException('You can only delete services you created');
    await this.prisma.platformService.update({ where: { id }, data: { isActive: false } });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminList(providerType?: string, countryCode?: string) {
    const where: any = {};
    if (providerType) where.providerType = providerType.toUpperCase();
    if (countryCode) where.countryCode = countryCode;
    return this.prisma.platformService.findMany({
      where,
      orderBy: [{ providerType: 'asc' }, { category: 'asc' }, { serviceName: 'asc' }],
    });
  }

  async adminCreate(dto: CreatePlatformServiceDto) {
    return this.prisma.platformService.create({
      data: {
        providerType: dto.providerType.toUpperCase() as any,
        serviceName: dto.serviceName,
        category: dto.category,
        description: dto.description,
        defaultPrice: dto.defaultPrice ?? 0,
        currency: dto.currency ?? 'MUR',
        duration: dto.duration,
        isDefault: dto.isDefault ?? true,
        countryCode: dto.countryCode,
        iconKey: dto.iconKey,
        emoji: dto.emoji,
        requiredContentType: dto.requiredContentType,
        isActive: true,
      },
    });
  }

  async adminGet(id: string) {
    const service = await this.prisma.platformService.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async adminUpdate(id: string, dto: UpdatePlatformServiceDto) {
    const existing = await this.prisma.platformService.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Service not found');
    const data: any = {};
    for (const k of ['serviceName', 'category', 'description', 'defaultPrice', 'currency', 'duration',
      'isDefault', 'isActive', 'countryCode', 'iconKey', 'emoji', 'requiredContentType']) {
      if ((dto as any)[k] !== undefined) data[k] = (dto as any)[k];
    }
    return this.prisma.platformService.update({ where: { id }, data });
  }

  async adminDelete(id: string) {
    const existing = await this.prisma.platformService.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Service not found');
    await this.prisma.platformService.update({ where: { id }, data: { isActive: false } });
  }
}
