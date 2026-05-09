import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

function derivePaymentTiming(serviceMode?: string, explicitValue?: string): string {
  if (explicitValue) return explicitValue;
  switch (serviceMode) {
    case 'video': return 'ON_ACCEPTANCE';
    case 'home':  return 'ON_ACCEPTANCE';
    case 'office': return 'ON_COMPLETION';
    default: return 'ON_ACCEPTANCE';
  }
}

@Injectable()
export class WorkflowManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templateRepo: WorkflowTemplateRepository,
  ) {}

  async getUserType(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { userType: true } });
    return user?.userType ?? null;
  }

  // ─── Template Stats ────────────────────────────────────────────────────

  async getTemplateStats() {
    const since7d = new Date(Date.now() - 7 * 86400e3);
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    const [byTemplateAll, byTemplate7d, byTemplateToday, cancelled, completed] = await Promise.all([
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { createdAt: { gte: since7d } } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { createdAt: { gte: startOfToday } } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { currentStatus: 'cancelled' } }),
      this.prisma.workflowInstance.groupBy({
        by: ['templateId'], _count: { _all: true }, _avg: {} as any,
        where: { currentStatus: 'completed' },
      }).catch(() => [] as any[]),
    ]);

    const stats: Record<string, { today: number; week: number; total: number; dropOffRate: number; completed: number }> = {};
    for (const row of byTemplateAll) stats[row.templateId] = { today: 0, week: 0, total: row._count._all, dropOffRate: 0, completed: 0 };
    for (const row of byTemplate7d) (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).week = row._count._all;
    for (const row of byTemplateToday) (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).today = row._count._all;
    for (const row of completed) (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).completed = row._count._all;
    for (const row of cancelled) {
      const s = stats[row.templateId];
      if (s && s.total > 0) s.dropOffRate = Math.round((row._count._all / s.total) * 100);
    }
    return stats;
  }

  // ─── Library ───────────────────────────────────────────────────────────

  async getLibraryTemplates() {
    return this.prisma.workflowTemplate.findMany({
      where: { isLibrary: true, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async browseLibrary(opts: {
    providerType?: string; serviceMode?: string; containsStatus?: string;
    search?: string; source?: 'system' | 'admin' | 'provider';
  }) {
    const where: any = { isActive: true };
    if (opts.providerType) where.providerType = opts.providerType.toUpperCase();
    if (opts.serviceMode) where.serviceMode = opts.serviceMode;
    if (opts.source === 'system') where.isDefault = true;
    if (opts.source === 'admin') where.createdByAdminId = { not: null };
    if (opts.source === 'provider') where.createdByProviderId = { not: null };
    if (opts.search?.trim()) {
      where.OR = [
        { name: { contains: opts.search, mode: 'insensitive' } },
        { slug: { contains: opts.search, mode: 'insensitive' } },
        { description: { contains: opts.search, mode: 'insensitive' } },
      ];
    }

    const templates = await this.prisma.workflowTemplate.findMany({
      where, orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    const filtered = opts.containsStatus
      ? templates.filter(t => ((t.steps as any[]) ?? []).some(s => s?.statusCode === opts.containsStatus))
      : templates;

    const userIds = Array.from(new Set(
      filtered.flatMap(t => [t.createdByProviderId, t.createdByAdminId].filter((v): v is string => !!v))
    ));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, firstName: true, lastName: true, userType: true } })
      : [];
    const userById = new Map(users.map(u => [u.id, u]));

    const serviceIds = Array.from(new Set(filtered.map(t => t.platformServiceId).filter((v): v is string => !!v)));
    const services = serviceIds.length > 0
      ? await this.prisma.platformService.findMany({ where: { id: { in: serviceIds } }, select: { id: true, serviceName: true, defaultPrice: true, currency: true } })
      : [];
    const serviceById = new Map(services.map(s => [s.id, s]));

    return filtered.map(t => ({
      ...t,
      creator: t.isDefault ? { kind: 'system' as const }
        : t.createdByAdminId ? { kind: 'admin' as const, user: userById.get(t.createdByAdminId) ?? null }
        : t.createdByProviderId ? { kind: 'provider' as const, user: userById.get(t.createdByProviderId) ?? null }
        : { kind: 'unknown' as const },
      linkedService: t.platformServiceId ? serviceById.get(t.platformServiceId) ?? null : null,
      statusCodes: ((t.steps as any[]) ?? []).map(s => s?.statusCode).filter(Boolean),
    }));
  }

  async sharedLibrary(opts: { providerType?: string; serviceMode?: string }) {
    const where: any = { isShared: true, isActive: true };
    if (opts.providerType) where.providerType = opts.providerType.toUpperCase();
    if (opts.serviceMode) where.serviceMode = opts.serviceMode;
    return this.prisma.workflowTemplate.findMany({
      where,
      orderBy: [{ providerType: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, slug: true, description: true, providerType: true,
        serviceMode: true, regionCode: true, isDefault: true, steps: true,
        transitions: true, expectedDurationHours: true, slaNote: true,
        createdByAdminId: true, updatedAt: true,
      },
    });
  }

  // ─── Template CRUD ─────────────────────────────────────────────────────

  async createTemplate(dto: CreateTemplateDto, userId: string, userType: string | null) {
    const isAdmin = userType === 'REGIONAL_ADMIN';
    return this.templateRepo.create({
      name: dto.name, slug: dto.slug, description: dto.description,
      providerType: dto.providerType || userType || '',
      serviceMode: dto.serviceMode, platformServiceId: dto.platformServiceId,
      paymentTiming: derivePaymentTiming(dto.serviceMode, (dto as any).paymentTiming),
      steps: dto.steps, transitions: dto.transitions,
      ...(dto.serviceConfig !== undefined && { serviceConfig: dto.serviceConfig }),
      ...(isAdmin ? { createdByAdminId: userId, regionCode: dto.regionCode } : { createdByProviderId: userId }),
    });
  }

  async createMyTemplate(dto: CreateTemplateDto, userId: string, userType: string | null) {
    return this.templateRepo.create({
      name: dto.name, slug: dto.slug, description: dto.description,
      providerType: userType || '', serviceMode: dto.serviceMode,
      platformServiceId: dto.platformServiceId, regionCode: dto.regionCode,
      steps: dto.steps, transitions: dto.transitions,
      isDefault: false, createdByProviderId: userId,
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto, userId: string, userType: string | null) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    const isAdmin = userType === 'REGIONAL_ADMIN';

    if (existing.isDefault) {
      if (dto.platformServiceId !== undefined) return this.templateRepo.update(id, { platformServiceId: dto.platformServiceId });
      throw new ForbiddenException('Cannot modify default templates');
    }

    if (existing.createdByProviderId !== userId && !isAdmin) throw new ForbiddenException('You can only edit your own templates');

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;
    if (dto.steps) data.steps = dto.steps;
    if (dto.transitions) data.transitions = dto.transitions;
    if (dto.platformServiceId !== undefined) data.platformServiceId = dto.platformServiceId || null;
    if (dto.serviceConfig !== undefined) data.serviceConfig = dto.serviceConfig;
    if (isAdmin) {
      if ((dto as any).expectedDurationHours !== undefined) data.expectedDurationHours = (dto as any).expectedDurationHours;
      if ((dto as any).slaNote !== undefined) data.slaNote = (dto as any).slaNote;
      if (typeof (dto as any).isShared === 'boolean') data.isShared = (dto as any).isShared;
    }
    if (dto.steps && existing.steps) {
      const prev = (existing as any).stepsHistory ?? [];
      const snapshot = { snapshotAt: new Date().toISOString(), changedBy: userId, steps: existing.steps, transitions: existing.transitions };
      data.stepsHistory = [...(Array.isArray(prev) ? prev : []), snapshot].slice(-20);
    }

    return this.templateRepo.update(id, data);
  }

  async publishTemplate(id: string, userId: string, userType: string | null) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    if (existing.isDefault) throw new ForbiddenException('Cannot modify default templates');
    const isAdmin = userType === 'REGIONAL_ADMIN';
    if (existing.createdByProviderId !== userId && !isAdmin) throw new ForbiddenException('You can only publish your own templates');
    const steps = (existing.steps as any[]) ?? [];
    if (steps.length < 2) throw new BadRequestException('A published template needs at least 2 steps');
    return this.templateRepo.publish(id);
  }

  async cloneTemplate(id: string, body: { name?: string; providerType?: string; serviceMode?: string }, userId: string, userType: string | null) {
    const source = await this.templateRepo.findById(id);
    if (!source) throw new NotFoundException('Template not found');
    const isAdmin = userType === 'REGIONAL_ADMIN';
    const newName = body.name?.trim() || `${source.name} (copy)`;
    const newSlug = `${(source.slug || 'template')}-copy-${Date.now().toString(36)}`;
    const cloneServiceMode = body.serviceMode || source.serviceMode;
    return this.prisma.workflowTemplate.create({
      data: {
        name: newName, slug: newSlug, description: source.description,
        providerType: body.providerType || source.providerType,
        serviceMode: cloneServiceMode, isDefault: false, isActive: true, isLibrary: false,
        category: source.category,
        paymentTiming: derivePaymentTiming(cloneServiceMode, (source as any).paymentTiming),
        createdByProviderId: isAdmin ? null : userId,
        createdByAdminId: isAdmin ? userId : null,
        regionCode: source.regionCode, platformServiceId: source.platformServiceId,
        steps: source.steps as any, transitions: source.transitions as any,
      },
    });
  }

  async templateHistory(id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
      select: { id: true, name: true, stepsHistory: true, updatedAt: true },
    });
    if (!template) throw new NotFoundException('Template not found');
    const history = (template.stepsHistory as any[]) ?? [];
    return history.sort((a: any, b: any) => new Date(b.snapshotAt).getTime() - new Date(a.snapshotAt).getTime());
  }

  async templateFunnel(id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) throw new NotFoundException('Template not found');

    const steps = (template.steps as any[]) ?? [];
    const stepCodes = steps.map((s: any) => s.statusCode as string).filter(Boolean);

    const logs = await this.prisma.workflowStepLog.groupBy({
      by: ['toStatus'], _count: { _all: true },
      where: { instance: { templateId: id } },
    });
    const countByStatus: Record<string, number> = {};
    for (const row of logs) countByStatus[row.toStatus] = row._count._all;

    const stepPairs = await Promise.all(
      stepCodes.slice(0, -1).map(async (code, i) => {
        const nextCode = stepCodes[i + 1];
        const rows = await (this.prisma.$queryRawUnsafe as any)(`
          SELECT AVG(EXTRACT(EPOCH FROM (b."createdAt" - a."createdAt")) * 1000) AS avg_ms
          FROM "WorkflowStepLog" a
          JOIN "WorkflowStepLog" b ON a."instanceId" = b."instanceId"
          JOIN "WorkflowInstance" wi ON a."instanceId" = wi."id"
          WHERE wi."templateId" = $1
            AND a."toStatus" = $2
            AND b."toStatus" = $3
            AND b."createdAt" > a."createdAt"
        `, id, code, nextCode);
        return { from: code, to: nextCode, avgMs: rows[0]?.avg_ms ?? null };
      })
    );

    const funnel = steps.map((s: any) => ({
      statusCode: s.statusCode, label: s.label,
      entryCount: countByStatus[s.statusCode] ?? 0,
    }));

    return { funnel, avgTimeBetweenSteps: stepPairs };
  }

  // ─── Step Types ────────────────────────────────────────────────────────

  async getStepTypes(category?: string) {
    const where: any = {};
    if (category) where.category = category;
    return this.prisma.workflowStepType.findMany({ where, orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }] });
  }

  async getStepTypeDefaults(code: string) {
    const type = await this.prisma.workflowStepType.findUnique({ where: { code: code.toUpperCase() } });
    if (!type) throw new NotFoundException(`Step type "${code}" not found`);
    return {
      code: type.code, label: type.label, description: type.description, category: type.category,
      defaultFlags: type.defaultFlags, defaultActionsProvider: type.defaultActionsProvider,
      defaultActionsPatient: type.defaultActionsPatient, isTerminal: type.isTerminal, isCancellation: type.isCancellation,
    };
  }

  // ─── Session Tracking ─────────────────────────────────────────────────

  async updateSessionTracking(id: string, body: { sessionNumber?: number; maxSessions?: number; programId?: string; sessionNotes?: string }, userId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id }, select: { id: true, patientUserId: true, providerUserId: true, metadata: true },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.patientUserId !== userId && instance.providerUserId !== userId) {
      throw new ForbiddenException('You are not a participant in this workflow');
    }
    const existingMeta = (instance.metadata as Record<string, unknown>) ?? {};
    return this.prisma.workflowInstance.update({
      where: { id },
      data: {
        metadata: {
          ...existingMeta,
          ...(body.sessionNumber !== undefined && { sessionNumber: body.sessionNumber }),
          ...(body.maxSessions !== undefined && { maxSessions: body.maxSessions }),
          ...(body.programId !== undefined && { programId: body.programId }),
          ...(body.sessionNotes !== undefined && { sessionNotes: body.sessionNotes }),
        },
      },
      select: { id: true, metadata: true, currentStatus: true },
    });
  }

  // ─── Suggestions ──────────────────────────────────────────────────────

  async suggestTemplate(dto: CreateTemplateDto, userId: string, userType: string | null) {
    return this.prisma.workflowTemplate.create({
      data: {
        name: dto.name, slug: dto.slug || `suggestion-${Date.now()}`, description: dto.description,
        providerType: userType || '', serviceMode: dto.serviceMode,
        steps: dto.steps || [], transitions: dto.transitions || [],
        isDefault: false, isActive: false,
        suggestedByProviderId: userId, suggestionStatus: 'PENDING' as any,
        suggestedAt: new Date(), createdByProviderId: userId,
      },
    });
  }

  async listSuggestions(userId: string, userType: string | null, status?: string) {
    const isAdmin = ['REGIONAL_ADMIN', 'ADMIN'].includes(userType || '');
    const where: any = { suggestionStatus: { not: null } };
    if (status) where.suggestionStatus = status;
    else if (!isAdmin) where.suggestionStatus = 'PENDING';
    if (!isAdmin) where.suggestedByProviderId = userId;
    return this.prisma.workflowTemplate.findMany({ where, orderBy: { suggestedAt: 'desc' } });
  }

  async reviewSuggestion(id: string, body: { action: 'approve' | 'reject'; note?: string }) {
    return this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        suggestionStatus: (body.action === 'approve' ? 'APPROVED' : 'REJECTED') as any,
        suggestionNote: body.note,
        isActive: body.action === 'approve',
      },
    });
  }

  // ─── Admin ─────────────────────────────────────────────────────────────

  async adminListInstances(opts: { status?: string; bookingType?: string; page?: number; limit?: number }) {
    const take = Math.min(opts.limit || 20, 100);
    const skip = (Math.max(opts.page || 1, 1) - 1) * take;
    const where: any = {};
    if (opts.status) where.currentStatus = opts.status;
    if (opts.bookingType) where.bookingType = opts.bookingType;

    const [items, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where, orderBy: { updatedAt: 'desc' }, skip, take,
        select: {
          id: true, bookingType: true, bookingId: true, currentStatus: true,
          patientUserId: true, providerUserId: true, createdAt: true, updatedAt: true,
          template: { select: { name: true, providerType: true } },
        },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);
    return { items, total, page: opts.page || 1, limit: take };
  }

  async adminAuditLog(page: number, limit: number) {
    const take = Math.min(limit, 200);
    const skip = (Math.max(page, 1) - 1) * take;
    return this.prisma.workflowStepLog.findMany({
      orderBy: { createdAt: 'desc' }, skip, take,
      select: {
        id: true, instanceId: true, fromStatus: true, toStatus: true,
        action: true, actionByUserId: true, actionByRole: true,
        label: true, message: true, contentType: true, createdAt: true,
      },
    });
  }

  async adminOverview() {
    const since7d = new Date(Date.now() - 7 * 86400e3);
    const [
      totalTemplates, activeTemplates, systemDefaults, totalInstances, activeInstances,
      completedThisWeek, cancelledThisWeek, pendingSuggestions, byRegion, topTemplates,
    ] = await Promise.all([
      this.prisma.workflowTemplate.count(),
      this.prisma.workflowTemplate.count({ where: { isActive: true } }),
      this.prisma.workflowTemplate.count({ where: { isDefault: true } }),
      this.prisma.workflowInstance.count(),
      this.prisma.workflowInstance.count({ where: { currentStatus: { notIn: ['completed', 'cancelled'] } } }),
      this.prisma.workflowInstance.count({ where: { currentStatus: 'completed', updatedAt: { gte: since7d } } }),
      this.prisma.workflowInstance.count({ where: { currentStatus: 'cancelled', updatedAt: { gte: since7d } } }),
      this.prisma.workflowTemplate.count({ where: { suggestionStatus: 'PENDING' } }).catch(() => 0),
      this.prisma.workflowTemplate.groupBy({ by: ['regionCode'], _count: { _all: true }, where: { isActive: true } }),
      this.prisma.workflowTemplate.findMany({
        where: { isActive: true }, orderBy: { updatedAt: 'desc' }, take: 5,
        select: { id: true, name: true, providerType: true, serviceMode: true, isDefault: true, updatedAt: true },
      }),
    ]);

    const completionRate = (completedThisWeek + cancelledThisWeek) > 0
      ? Math.round((completedThisWeek / (completedThisWeek + cancelledThisWeek)) * 100)
      : 0;

    return {
      templates: { total: totalTemplates, active: activeTemplates, systemDefaults, custom: totalTemplates - systemDefaults },
      instances: { total: totalInstances, active: activeInstances, completedThisWeek, cancelledThisWeek },
      completionRate, pendingSuggestions,
      byRegion: byRegion.map(r => ({ region: r.regionCode ?? 'global', count: r._count._all })),
      recentTemplates: topTemplates,
    };
  }

  async adminCompliance() {
    const templates = await this.prisma.workflowTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, providerType: true, serviceMode: true, regionCode: true, isDefault: true, steps: true },
    });

    const violations: Array<{
      templateId: string; templateName: string; providerType: string;
      serviceMode: string | null; regionCode: string | null; rule: string; severity: 'high' | 'medium' | 'low';
    }> = [];
    const passing: string[] = [];

    for (const t of templates) {
      const steps = (t.steps as any[]) ?? [];
      const templateViolations: typeof violations = [];

      if (steps.length < 2) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: 'Template has fewer than 2 steps — bookings cannot progress', severity: 'high' });
      }
      const hasTerminal = steps.some(s => s.isTerminal === true || ['completed', 'cancelled'].includes(s.statusCode));
      if (!hasTerminal) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: 'No terminal step (completed / cancelled) — bookings can never close', severity: 'high' });
      }
      const stepsWithNoActions = steps
        .filter(s => !s.isTerminal && !['completed', 'cancelled'].includes(s.statusCode))
        .filter(s => !(s.actionsForPatient?.length) && !(s.actionsForProvider?.length));
      if (stepsWithNoActions.length > 0) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: `${stepsWithNoActions.length} non-terminal step(s) have no actions — booking can get stuck`, severity: 'medium' });
      }
      const stepsWithNoLabel = steps.filter(s => !s.label || String(s.label).trim() === '');
      if (stepsWithNoLabel.length > 0) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: `${stepsWithNoLabel.length} step(s) have no human-readable label`, severity: 'low' });
      }

      if (templateViolations.length === 0) passing.push(t.id);
      else violations.push(...templateViolations);
    }

    return { violations, passingCount: passing.length, violatingCount: templates.length - passing.length, totalChecked: templates.length };
  }
}
