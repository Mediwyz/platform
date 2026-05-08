import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowAiAssistService } from './workflow-ai-assist.service';
import type { ActionRole, ContentType } from './types';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TransitionDto } from './dto/transition.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { WorkflowGeneratorService } from './workflow-generator.service';

const CONTENT_TYPES = ['prescription', 'lab_result', 'care_notes', 'report', 'dental_chart', 'eye_prescription', 'meal_plan', 'exercise_plan'] as const;

/**
 * Auto-derive paymentTiming from serviceMode when not explicitly provided.
 * video → ON_ACCEPTANCE (room opens at acceptance, charge then)
 * home  → ON_ACCEPTANCE (provider commits to travel, charge then)
 * office → ON_COMPLETION (patient shows up, charge after visit)
 * other / recurrent → PAY_LATER (handled per-session)
 */
function derivePaymentTiming(serviceMode?: string, explicitValue?: string): string {
  if (explicitValue) return explicitValue;
  switch (serviceMode) {
    case 'video': return 'ON_ACCEPTANCE';
    case 'home':  return 'ON_ACCEPTANCE';
    case 'office': return 'ON_COMPLETION';
    default: return 'ON_ACCEPTANCE';
  }
}

const transitionSchema = z.object({
  instanceId: z.string().min(1).optional(),
  bookingId: z.string().min(1).optional(),
  bookingType: z.string().min(1).optional(),
  action: z.string().min(1),
  notes: z.string().optional(),
  contentType: z.enum(CONTENT_TYPES).optional(),
  contentData: z.any().optional(),
  inventoryItems: z.array(z.object({ itemId: z.string().min(1), quantity: z.number().int().positive() })).optional(),
}).refine(d => d.instanceId || (d.bookingId && d.bookingType), { message: 'Either instanceId or both bookingId and bookingType are required' });

@ApiTags('Workflow')
@Controller()
export class WorkflowController {
  constructor(
    private engine: WorkflowEngineService,
    private instanceRepo: WorkflowInstanceRepository,
    private templateRepo: WorkflowTemplateRepository,
    private prisma: PrismaService,
    private aiAssist: WorkflowAiAssistService,
    private generatorService: WorkflowGeneratorService,
  ) {}

  // ─── POST /api/workflow/transition ─────────────────────────────────────

  @Post('workflow/transition')
  @HttpCode(HttpStatus.OK)
  async transition(@Body() body: TransitionDto, @CurrentUser() user: JwtPayload) {
    const parsed = transitionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0].message);

    const role = await this.resolveUserRole(user.sub, parsed.data.instanceId, parsed.data.bookingId, parsed.data.bookingType);
    if (!role) throw new ForbiddenException('You are not a participant in this workflow');

    const result = await this.engine.transition({
      ...parsed.data, contentType: parsed.data.contentType as ContentType | undefined,
      actionByUserId: user.sub, actionByRole: role,
    });
    return { success: true, data: result };
  }

  // ─── GET /api/workflow/instances ───────────────────────────────────────

  @Get('workflow/instances')
  async listInstances(
    @CurrentUser() user: JwtPayload,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('bookingType') bookingType?: string,
  ) {
    const r = (role === 'provider' ? 'provider' : 'patient') as 'patient' | 'provider';
    const instances = await this.instanceRepo.findByUser(user.sub, r, {
      currentStatus: status, bookingType,
    });

    // Enrich each instance with the current step's available actions so the
    // frontend can render inline buttons without a per-instance detail fetch.
    const enriched = instances.map((inst: any) => {
      const snap = inst.templateSnapshot as { steps?: any[] } | null | undefined;
      const steps: any[] = snap?.steps ?? inst.template?.steps ?? [];
      const currentStep = steps.find((s: any) => s.statusCode === inst.currentStatus);
      const status: string = inst.currentStatus ?? '';
      const isCompleted = !!inst.completedAt || ['completed', 'done', 'finished', 'delivered', 'collected'].some(k => status.includes(k));
      const isCancelled = !!inst.cancelledAt || ['cancelled', 'rejected', 'denied', 'declined'].some(k => status.includes(k));
      const currentStepCategory: string = isCancelled ? 'danger'
        : isCompleted ? 'success'
        : ['pending', 'requested', 'submitted'].some(k => status.includes(k)) ? 'pending'
        : ['waiting', 'processing', 'lab_', 'collecting', 'review'].some(k => status.includes(k)) ? 'waiting'
        : 'active';
      return {
        ...inst,
        instanceId: inst.id,
        templateName: inst.template?.name ?? '',
        isCompleted,
        isCancelled,
        currentStepCategory,
        template: { id: inst.template?.id, name: inst.template?.name, providerType: inst.template?.providerType, serviceMode: inst.template?.serviceMode },
        currentStepLabel: currentStep?.label ?? inst.currentStatus,
        currentStepFlags: currentStep?.flags ?? {},
        actionsForPatient: currentStep?.actionsForPatient ?? [],
        actionsForProvider: currentStep?.actionsForProvider ?? [],
        allSteps: steps.map((s: any) => ({ statusCode: s.statusCode, label: s.label })),
      };
    });

    return { success: true, data: enriched };
  }

  // ─── GET /api/workflow/instances/:id ───────────────────────────────────

  @Get('workflow/instances/:id')
  async getInstance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const state = await this.engine.getState(id);
    if (!state) throw new NotFoundException('Workflow instance not found');
    return { success: true, data: state };
  }

  // ─── GET /api/workflow/instances/:id/timeline ──────────────────────────

  @Get('workflow/instances/:id/timeline')
  async getTimeline(@Param('id') id: string) {
    const timeline = await this.engine.getTimeline(id);
    return { success: true, data: timeline };
  }

  // ─── GET /api/workflow/templates ───────────────────────────────────────

  @Get('workflow/templates')
  async listTemplates(
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('isDefault') isDefault?: string,
    @Query('platformServiceId') platformServiceId?: string,
  ) {
    const templates = await this.templateRepo.findMany({
      // Normalize to uppercase — frontend sometimes passes the cookie-style
      // lowercase code ('doctor') instead of the canonical enum ('DOCTOR').
      providerType: providerType ? providerType.toUpperCase() : undefined,
      serviceMode, platformServiceId,
      isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
    });
    return { success: true, data: templates };
  }

  /**
   * GET /api/workflow/templates/stats — per-template usage metrics for the
   * admin list page. Returns an object keyed by templateId with instance
   * counts (today / 7 days / all-time), average completion time, and the
   * drop-off rate (cancelled instances ÷ all instances). Cheap enough to
   * run on page load — one `groupBy` + one `aggregate`.
   */
  @Get('workflow/templates/stats')
  @UseGuards(AdminGuard)
  async getTemplateStats() {
    const since7d = new Date(Date.now() - 7 * 86400e3);
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    const [byTemplateAll, byTemplate7d, byTemplateToday, cancelled, completed] = await Promise.all([
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { createdAt: { gte: since7d } } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { createdAt: { gte: startOfToday } } }),
      this.prisma.workflowInstance.groupBy({ by: ['templateId'], _count: { _all: true }, where: { currentStatus: 'cancelled' } }),
      this.prisma.workflowInstance.groupBy({
        by: ['templateId'],
        _count: { _all: true },
        _avg: {} as any,
        where: { currentStatus: 'completed' },
      }).catch(() => [] as any[]),
    ]);

    const stats: Record<string, { today: number; week: number; total: number; dropOffRate: number; completed: number }> = {};
    for (const row of byTemplateAll) {
      stats[row.templateId] = {
        today: 0, week: 0, total: row._count._all, dropOffRate: 0, completed: 0,
      };
    }
    for (const row of byTemplate7d) {
      (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).week = row._count._all;
    }
    for (const row of byTemplateToday) {
      (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).today = row._count._all;
    }
    for (const row of completed) {
      (stats[row.templateId] ??= { today: 0, week: 0, total: 0, dropOffRate: 0, completed: 0 }).completed = row._count._all;
    }
    for (const row of cancelled) {
      const s = stats[row.templateId];
      if (s && s.total > 0) {
        s.dropOffRate = Math.round((row._count._all / s.total) * 100);
      }
    }
    return { success: true, data: stats };
  }

  /**
   * POST /api/workflow/ai-draft — turn a plain-English description into a
   * draft step list the admin can review before saving. Uses Groq; returns
   * JSON matching the builder's `WorkflowStep[]` shape so the frontend can
   * merge the draft directly into its state.
   */
  @Post('workflow/ai-draft')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async aiDraft(@Body() body: { prompt: string; providerType?: string; serviceMode?: string }) {
    const steps = await this.aiAssist.draftSteps(body?.prompt, body?.providerType, body?.serviceMode);
    return { success: true, data: { steps } };
  }

  // ─── GET /api/workflow/templates/library — starter templates ──────────
  @Get('workflow/templates/library')
  async getLibraryTemplates() {
    const templates = await this.prisma.workflowTemplate.findMany({
      where: { isLibrary: true, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return { success: true, data: templates };
  }

  /**
   * GET /api/workflow/library/browse — the shared library that BOTH
   * regional admins AND providers can browse. Returns every active template
   * (system defaults + regional-admin authored + provider-authored) with
   * creator names + linked service denormalised so the UI can render cards
   * without N+1 fetches.
   *
   * Filters (all optional, all combinable):
   *   - providerType=DOCTOR    — role-scoped
   *   - serviceMode=video      — mode-scoped
   *   - containsStatus=results_ready — templates that include that status
   *   - search=sample          — matches name/slug/description substring
   *   - source=system|admin|provider — one of three origin buckets
   */
  @Get('workflow/library/browse')
  async browseLibrary(
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('containsStatus') containsStatus?: string,
    @Query('search') search?: string,
    @Query('source') source?: 'system' | 'admin' | 'provider',
  ) {
    const where: any = { isActive: true };
    if (providerType) where.providerType = providerType.toUpperCase();
    if (serviceMode) where.serviceMode = serviceMode;
    if (source === 'system') where.isDefault = true;
    if (source === 'admin') where.createdByAdminId = { not: null };
    if (source === 'provider') where.createdByProviderId = { not: null };
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    // Post-filter on containsStatus since `steps` is a JSON column.
    const filtered = containsStatus
      ? templates.filter(t => {
          const steps = (t.steps as any[]) ?? [];
          return steps.some(s => s?.statusCode === containsStatus);
        })
      : templates;

    // Batch-fetch creator user names so cards render "by Dr. Sarah".
    const userIds = Array.from(new Set(
      filtered.flatMap(t => [t.createdByProviderId, t.createdByAdminId].filter((v): v is string => !!v))
    ));
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, userType: true },
        })
      : [];
    const userById = new Map(users.map(u => [u.id, u]));

    // Batch-fetch linked services so cards show "Applies to: Video Consultation"
    const serviceIds = Array.from(new Set(
      filtered.map(t => t.platformServiceId).filter((v): v is string => !!v)
    ));
    const services = serviceIds.length > 0
      ? await this.prisma.platformService.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, serviceName: true, defaultPrice: true, currency: true },
        })
      : [];
    const serviceById = new Map(services.map(s => [s.id, s]));

    const data = filtered.map(t => ({
      ...t,
      creator: t.isDefault
        ? { kind: 'system' as const }
        : t.createdByAdminId
        ? { kind: 'admin' as const, user: userById.get(t.createdByAdminId) ?? null }
        : t.createdByProviderId
        ? { kind: 'provider' as const, user: userById.get(t.createdByProviderId) ?? null }
        : { kind: 'unknown' as const },
      linkedService: t.platformServiceId ? serviceById.get(t.platformServiceId) ?? null : null,
      statusCodes: ((t.steps as any[]) ?? []).map(s => s?.statusCode).filter(Boolean),
    }));

    return { success: true, data };
  }

  // ─── POST /api/workflow/templates/:id/clone — clone a library template
  @Post('workflow/templates/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  async cloneTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; providerType?: string; serviceMode?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const source = await this.templateRepo.findById(id);
    if (!source) throw new NotFoundException('Template not found');
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub }, select: { userType: true },
    });
    const isAdmin = dbUser?.userType === 'REGIONAL_ADMIN';
    const newName = body.name?.trim() || `${source.name} (copy)`;
    const newSlug = `${(source.slug || 'template')}-copy-${Date.now().toString(36)}`;
    const cloneServiceMode = body.serviceMode || source.serviceMode;
    const clone = await this.prisma.workflowTemplate.create({
      data: {
        name: newName,
        slug: newSlug,
        description: source.description,
        providerType: body.providerType || source.providerType,
        serviceMode: cloneServiceMode,
        isDefault: false,
        isActive: true,
        isLibrary: false,
        category: source.category,
        paymentTiming: derivePaymentTiming(cloneServiceMode, (source as any).paymentTiming),
        createdByProviderId: isAdmin ? null : user.sub,
        createdByAdminId: isAdmin ? user.sub : null,
        regionCode: source.regionCode,
        platformServiceId: source.platformServiceId,
        steps: source.steps as any,
        transitions: source.transitions as any,
      },
    });
    return { success: true, data: clone };
  }

  // ─── GET /api/workflow/templates/:id ───────────────────────────────────

  @Get('workflow/templates/:id')
  async getTemplate(@Param('id') id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return { success: true, data: template };
  }

  // ─── POST /api/workflow/templates/generate ─────────────────────────────

  /**
   * Generate a workflow template from 5 axes (location, sample, careModel,
   * urgency, recurrenceType) without persisting to the DB. The caller can
   * inspect the result and then POST to /api/workflow/templates to save it.
   *
   * Marked @Public() so the workflow builder wizard can call it before the
   * user is logged in (preview mode).
   */
  @Post('workflow/templates/generate')
  @HttpCode(HttpStatus.OK)
  async generateTemplate(@Body() dto: GenerateTemplateDto) {
    const result = this.generatorService.generate(dto);
    return { success: true, data: result };
  }

  // ─── POST /api/workflow/templates ──────────────────────────────────────

  @Post('workflow/templates')
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const isAdmin = dbUser?.userType === 'REGIONAL_ADMIN';

    const template = await this.templateRepo.create({
      name: dto.name, slug: dto.slug, description: dto.description,
      providerType: dto.providerType || dbUser?.userType || '',
      serviceMode: dto.serviceMode, platformServiceId: dto.platformServiceId,
      paymentTiming: derivePaymentTiming(dto.serviceMode, (dto as any).paymentTiming),
      steps: dto.steps, transitions: dto.transitions,
      ...(dto.serviceConfig !== undefined && { serviceConfig: dto.serviceConfig }),
      ...(isAdmin ? { createdByAdminId: user.sub, regionCode: dto.regionCode } : { createdByProviderId: user.sub }),
    });
    return { success: true, data: template };
  }

  // ─── PATCH /api/workflow/templates/:id ─────────────────────────────────

  @Patch('workflow/templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: JwtPayload) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const isAdmin = dbUser?.userType === 'REGIONAL_ADMIN';

    if (existing.isDefault) {
      // Default templates: only allow linking platformServiceId
      if (dto.platformServiceId !== undefined) {
        const updated = await this.templateRepo.update(id, { platformServiceId: dto.platformServiceId });
        return { success: true, data: updated };
      }
      throw new ForbiddenException('Cannot modify default templates');
    }

    if (existing.createdByProviderId !== user.sub && !isAdmin) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;
    if (dto.steps) data.steps = dto.steps;
    if (dto.transitions) data.transitions = dto.transitions;
    if (dto.platformServiceId !== undefined) {
      data.platformServiceId = dto.platformServiceId || null;
    }
    if (dto.serviceConfig !== undefined) data.serviceConfig = dto.serviceConfig;
    // SLA & sharing fields (admin-only)
    if (isAdmin) {
      if ((dto as any).expectedDurationHours !== undefined) data.expectedDurationHours = (dto as any).expectedDurationHours;
      if ((dto as any).slaNote !== undefined) data.slaNote = (dto as any).slaNote;
      if (typeof (dto as any).isShared === 'boolean') data.isShared = (dto as any).isShared;
    }

    // Snapshot previous steps into stepsHistory before overwriting
    if (dto.steps && existing.steps) {
      const prev = (existing as any).stepsHistory ?? [];
      const snapshot = {
        snapshotAt: new Date().toISOString(),
        changedBy: user.sub,
        steps: existing.steps,
        transitions: existing.transitions,
      };
      data.stepsHistory = [...(Array.isArray(prev) ? prev : []), snapshot].slice(-20); // keep last 20 snapshots
    }

    const updated = await this.templateRepo.update(id, data);
    return { success: true, data: updated };
  }

  // ─── POST /api/workflow/templates/:id/publish ──────────────────────────

  @Post('workflow/templates/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishTemplate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    if (existing.isDefault) throw new ForbiddenException('Cannot modify default templates');

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const isAdmin = dbUser?.userType === 'REGIONAL_ADMIN';
    if (existing.createdByProviderId !== user.sub && !isAdmin) {
      throw new ForbiddenException('You can only publish your own templates');
    }
    const steps = (existing.steps as any[]) ?? [];
    if (steps.length < 2) throw new BadRequestException('A published template needs at least 2 steps');

    const published = await this.templateRepo.publish(id);
    return { success: true, data: published };
  }

  // ─── GET /api/workflow/templates/:id/in-flight-count ──────────────────

  @Get('workflow/templates/:id/in-flight-count')
  async getInFlightCount(@Param('id') id: string) {
    const count = await this.templateRepo.countActiveInstances(id);
    return { success: true, data: { count } };
  }

  // ─── DELETE /api/workflow/templates/:id ─────────────────────────────────

  @Delete('workflow/templates/:id')
  async deleteTemplate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    if (existing.isDefault) throw new ForbiddenException('Cannot delete default templates');
    if (existing.createdByProviderId !== user.sub) throw new ForbiddenException('You can only delete your own templates');

    await this.templateRepo.deactivate(id);
    return { success: true, message: 'Template deactivated' };
  }

  // ─── GET /api/workflow/my-templates ────────────────────────────────────

  @Get('workflow/my-templates')
  async myTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('platformServiceId') platformServiceId?: string,
  ) {
    const templates = await this.templateRepo.findMany({
      createdByProviderId: user.sub,
      providerType: providerType ? providerType.toUpperCase() : undefined,
      serviceMode, platformServiceId,
    });
    return { success: true, data: templates };
  }

  // ─── POST /api/workflow/my-templates ───────────────────────────────────

  @Post('workflow/my-templates')
  @HttpCode(HttpStatus.CREATED)
  async createMyTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const template = await this.templateRepo.create({
      name: dto.name, slug: dto.slug, description: dto.description,
      providerType: dbUser?.userType || '', serviceMode: dto.serviceMode,
      platformServiceId: dto.platformServiceId, regionCode: dto.regionCode,
      steps: dto.steps, transitions: dto.transitions,
      isDefault: false, createdByProviderId: user.sub,
    });
    return { success: true, data: template };
  }

  // ─── Step Type Library ──────────────────────────────────────────────────

  @Get('workflow/step-types')
  async getStepTypes(@Query('category') category?: string) {
    const where: any = {};
    if (category) where.category = category;
    const types = await this.prisma.workflowStepType.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
    return { success: true, data: types };
  }

  /**
   * GET /api/workflow/step-types/:code/defaults
   * Returns the default flags + actions for a step type code so the builder
   * can auto-fill fields when a user picks a step type from the library.
   */
  @Get('workflow/step-types/:code/defaults')
  async getStepTypeDefaults(@Param('code') code: string) {
    const type = await this.prisma.workflowStepType.findUnique({ where: { code: code.toUpperCase() } });
    if (!type) throw new NotFoundException(`Step type "${code}" not found`);
    return {
      success: true,
      data: {
        code: type.code,
        label: type.label,
        description: type.description,
        category: type.category,
        defaultFlags: type.defaultFlags,
        defaultActionsProvider: type.defaultActionsProvider,
        defaultActionsPatient: type.defaultActionsPatient,
        isTerminal: type.isTerminal,
        isCancellation: type.isCancellation,
      },
    };
  }

  /**
   * GET /api/workflow/recommend-flags
   * Given a step code (or label), returns recommended Tier 3 flags based on
   * domain knowledge so admins don't have to remember which flags apply.
   * ?stepCode=RESULTS_READY&providerType=LAB_TECHNICIAN
   */
  @Get('workflow/recommend-flags')
  async recommendFlags(
    @Query('stepCode') stepCode?: string,
    @Query('label') label?: string,
    @Query('providerType') providerType?: string,
  ) {
    const code = (stepCode || '').toUpperCase();
    const lbl = (label || '').toLowerCase();
    const pType = (providerType || '').toUpperCase();

    const recommendations: Array<{ flag: string; reason: string; suggestedValue?: string | boolean }> = [];

    // Content flags
    if (code.includes('RESULT') || lbl.includes('result')) {
      const contentType = pType.includes('LAB') ? 'lab_result' : pType.includes('DENT') ? 'dental_chart' : pType.includes('OPTOMET') ? 'eye_prescription' : 'report';
      recommendations.push({ flag: 'requires_content', reason: 'Results steps should attach a document', suggestedValue: contentType });
    }
    if (code.includes('NOTES') || code.includes('REPORT') || lbl.includes('note') || lbl.includes('report')) {
      recommendations.push({ flag: 'requires_content', reason: 'Documentation steps need a content attachment', suggestedValue: 'care_notes' });
    }
    if (code.includes('MEAL_PLAN') || lbl.includes('meal plan') || pType.includes('NUTRIT')) {
      recommendations.push({ flag: 'requires_content', reason: 'Nutrition steps should include a meal plan', suggestedValue: 'meal_plan' });
    }
    if (code.includes('EXERCISE') || code.includes('REHAB') || lbl.includes('exercise') || pType.includes('PHYSIO')) {
      recommendations.push({ flag: 'requires_content', reason: 'Rehabilitation steps should include an exercise plan', suggestedValue: 'exercise_plan' });
    }
    if (code.includes('PRESCRIPTION') || lbl.includes('prescription')) {
      recommendations.push({ flag: 'requires_prescription', reason: 'This step requires a valid prescription', suggestedValue: true });
    }

    // Video flags
    if (code.includes('VIDEO') || code.includes('CALL') || lbl.includes('video') || lbl.includes('call')) {
      recommendations.push({ flag: 'triggers_video_call', reason: 'Video consultation steps should trigger a video room', suggestedValue: true });
    }

    // Review flag
    if (code.includes('COMPLETED') || code.includes('DISCHARGED') || lbl.includes('complet')) {
      recommendations.push({ flag: 'triggers_review_request', reason: 'Completion steps should prompt for a patient review', suggestedValue: true });
    }

    return { success: true, data: recommendations };
  }

  /**
   * PATCH /api/workflow/instances/:id/session
   * Update session-tracking metadata on a workflow instance (used by
   * recurrent services like physiotherapy, mental health, nutrition).
   * Body: { sessionNumber, maxSessions, programId?, sessionNotes? }
   */
  @Patch('workflow/instances/:id/session')
  async updateSessionTracking(
    @Param('id') id: string,
    @Body() body: { sessionNumber?: number; maxSessions?: number; programId?: string; sessionNotes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const instance = await this.prisma.workflowInstance.findUnique({ where: { id }, select: { id: true, patientUserId: true, providerUserId: true, metadata: true } });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.patientUserId !== user.sub && instance.providerUserId !== user.sub) {
      throw new ForbiddenException('You are not a participant in this workflow');
    }
    const existingMeta = (instance.metadata as Record<string, unknown>) ?? {};
    const updated = await this.prisma.workflowInstance.update({
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
    return { success: true, data: updated };
  }

  // ─── Provider Workflow Suggestions ─────────────────────────────────────

  @Post('workflow/suggestions')
  @HttpCode(HttpStatus.CREATED)
  async suggestTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const template = await this.prisma.workflowTemplate.create({
      data: {
        name: dto.name,
        slug: dto.slug || `suggestion-${Date.now()}`,
        description: dto.description,
        providerType: dbUser?.userType || '',
        serviceMode: dto.serviceMode,
        steps: dto.steps || [],
        transitions: dto.transitions || [],
        isDefault: false,
        isActive: false,
        suggestedByProviderId: user.sub,
        suggestionStatus: 'PENDING' as any,
        suggestedAt: new Date(),
        createdByProviderId: user.sub,
      },
    });
    return { success: true, data: template };
  }

  @Get('workflow/suggestions')
  async listSuggestions(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { userType: true } });
    const isAdmin = ['REGIONAL_ADMIN', 'ADMIN'].includes(dbUser?.userType || '');
    const where: any = { suggestionStatus: { not: null } };
    if (status) where.suggestionStatus = status;
    else if (!isAdmin) where.suggestionStatus = 'PENDING';
    if (!isAdmin) where.suggestedByProviderId = user.sub;
    const suggestions = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: { suggestedAt: 'desc' },
    });
    return { success: true, data: suggestions };
  }

  @Post('workflow/suggestions/:id/review')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async reviewSuggestion(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; note?: string },
    @CurrentUser() user: JwtPayload,
  ) {

    const updated = await this.prisma.workflowTemplate.update({
      where: { id },
      data: {
        suggestionStatus: (body.action === 'approve' ? 'APPROVED' : 'REJECTED') as any,
        suggestionNote: body.note,
        isActive: body.action === 'approve',
      },
    });
    return { success: true, data: updated };
  }

  // ─── GET /api/workflow/shared-library — cross-region shared templates ──

  @Get('workflow/shared-library')
  @UseGuards(AdminGuard)
  async sharedLibrary(
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
  ) {
    const where: any = { isShared: true, isActive: true };
    if (providerType) where.providerType = providerType.toUpperCase();
    if (serviceMode) where.serviceMode = serviceMode;
    const templates = await this.prisma.workflowTemplate.findMany({
      where,
      orderBy: [{ providerType: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, slug: true, description: true, providerType: true,
        serviceMode: true, regionCode: true, isDefault: true, steps: true,
        transitions: true, expectedDurationHours: true, slaNote: true,
        createdByAdminId: true, updatedAt: true,
      },
    });
    return { success: true, data: templates };
  }

  // ─── GET /api/workflow/templates/:id/funnel — step-level drop-off ──────

  @Get('workflow/templates/:id/funnel')
  @UseGuards(AdminGuard)
  async templateFunnel(@Param('id') id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) throw new NotFoundException('Template not found');

    const steps = (template.steps as any[]) ?? [];
    const stepCodes = steps.map((s: any) => s.statusCode as string).filter(Boolean);

    const logs = await this.prisma.workflowStepLog.groupBy({
      by: ['toStatus'],
      _count: { _all: true },
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
      statusCode: s.statusCode,
      label: s.label,
      entryCount: countByStatus[s.statusCode] ?? 0,
    }));

    return { success: true, data: { funnel, avgTimeBetweenSteps: stepPairs } };
  }

  // ─── GET /api/workflow/templates/:id/history — version snapshots ────────

  @Get('workflow/templates/:id/history')
  @UseGuards(AdminGuard)
  async templateHistory(@Param('id') id: string) {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id },
      select: { id: true, name: true, stepsHistory: true, updatedAt: true },
    });
    if (!template) throw new NotFoundException('Template not found');
    const history = (template.stepsHistory as any[]) ?? [];
    return {
      success: true,
      data: history.sort((a: any, b: any) => new Date(b.snapshotAt).getTime() - new Date(a.snapshotAt).getTime()),
    };
  }

  // ─── Central Admin — All instances (admin audit view) ─────────────────

  @Get('workflow/admin/instances')
  @UseGuards(AdminGuard)
  async adminListInstances(
    @Query('status') status?: string,
    @Query('bookingType') bookingType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(parseInt(limit ?? '20', 10) || 20, 100);
    const skip = (Math.max(parseInt(page ?? '1', 10) || 1, 1) - 1) * take;

    const where: any = {};
    if (status) where.currentStatus = status;
    if (bookingType) where.bookingType = bookingType;

    const [items, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        select: {
          id: true, bookingType: true, bookingId: true, currentStatus: true,
          patientUserId: true, providerUserId: true, createdAt: true, updatedAt: true,
          template: { select: { name: true, providerType: true } },
        },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return { success: true, data: { items, total, page: parseInt(page ?? '1', 10), limit: take } };
  }

  @Get('workflow/admin/audit')
  @UseGuards(AdminGuard)
  async adminAuditLog(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(parseInt(limit ?? '50', 10) || 50, 200);
    const skip = (Math.max(parseInt(page ?? '1', 10) || 1, 1) - 1) * take;
    const logs = await this.prisma.workflowStepLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true, instanceId: true, fromStatus: true, toStatus: true,
        action: true, actionByUserId: true, actionByRole: true,
        label: true, message: true, contentType: true, createdAt: true,
      },
    });
    return { success: true, data: logs };
  }

  // ─── Central Admin — Platform-level overview ───────────────────────────

  /**
   * GET /api/workflow/admin/overview — platform-level workflow health
   * (central admin and regional admin both use this; regional scope is not
   * applied here, admin sees all regions).
   */
  @Get('workflow/admin/overview')
  @UseGuards(AdminGuard)
  async adminOverview() {
    const since7d = new Date(Date.now() - 7 * 86400e3);

    const [
      totalTemplates,
      activeTemplates,
      systemDefaults,
      totalInstances,
      activeInstances,
      completedThisWeek,
      cancelledThisWeek,
      pendingSuggestions,
      byRegion,
      topTemplates,
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
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, providerType: true, serviceMode: true, isDefault: true, updatedAt: true },
      }),
    ]);

    const completionRate = (completedThisWeek + cancelledThisWeek) > 0
      ? Math.round((completedThisWeek / (completedThisWeek + cancelledThisWeek)) * 100)
      : 0;

    return {
      success: true,
      data: {
        templates: { total: totalTemplates, active: activeTemplates, systemDefaults, custom: totalTemplates - systemDefaults },
        instances: { total: totalInstances, active: activeInstances, completedThisWeek, cancelledThisWeek },
        completionRate,
        pendingSuggestions,
        byRegion: byRegion.map(r => ({ region: r.regionCode ?? 'global', count: r._count._all })),
        recentTemplates: topTemplates,
      },
    };
  }

  /**
   * GET /api/workflow/admin/compliance — templates that violate best-practice
   * rules (no notifications, no actions on non-terminal steps, single-step
   * templates, missing labels, etc.). Central admin uses this to spot gaps
   * regional admins may have introduced.
   */
  @Get('workflow/admin/compliance')
  @UseGuards(AdminGuard)
  async adminCompliance() {
    const templates = await this.prisma.workflowTemplate.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, providerType: true, serviceMode: true, regionCode: true, isDefault: true, steps: true },
    });

    const violations: Array<{
      templateId: string;
      templateName: string;
      providerType: string;
      serviceMode: string | null;
      regionCode: string | null;
      rule: string;
      severity: 'high' | 'medium' | 'low';
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

      const nonTerminalSteps = steps.filter(s => !s.isTerminal && !['completed', 'cancelled'].includes(s.statusCode));
      const stepsWithNoActions = nonTerminalSteps.filter(s => {
        const patientActions = s.actionsForPatient ?? [];
        const providerActions = s.actionsForProvider ?? [];
        return patientActions.length === 0 && providerActions.length === 0;
      });
      if (stepsWithNoActions.length > 0) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: `${stepsWithNoActions.length} non-terminal step(s) have no actions — booking can get stuck`, severity: 'medium' });
      }

      const stepsWithNoLabel = steps.filter(s => !s.label || String(s.label).trim() === '');
      if (stepsWithNoLabel.length > 0) {
        templateViolations.push({ templateId: t.id, templateName: t.name, providerType: t.providerType, serviceMode: t.serviceMode, regionCode: t.regionCode, rule: `${stepsWithNoLabel.length} step(s) have no human-readable label`, severity: 'low' });
      }

      if (templateViolations.length === 0) {
        passing.push(t.id);
      } else {
        violations.push(...templateViolations);
      }
    }

    return {
      success: true,
      data: {
        violations,
        passingCount: passing.length,
        violatingCount: templates.length - passing.length,
        totalChecked: templates.length,
      },
    };
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private async resolveUserRole(userId: string, instanceId?: string, bookingId?: string, bookingType?: string): Promise<ActionRole | null> {
    let instance;
    if (instanceId) instance = await this.instanceRepo.findById(instanceId);
    else if (bookingId && bookingType) instance = await this.instanceRepo.findByBooking(bookingId, bookingType);
    if (!instance) return null;
    if (instance.patientUserId === userId) return 'patient';
    if (instance.providerUserId === userId) return 'provider';
    return null;
  }
}
