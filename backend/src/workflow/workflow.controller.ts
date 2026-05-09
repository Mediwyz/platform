import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { WorkflowManagementService } from './workflow-management.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { WorkflowAiAssistService } from './workflow-ai-assist.service';
import type { ActionRole, ContentType } from './types';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TransitionDto } from './dto/transition.dto';
import { GenerateTemplateDto } from './dto/generate-template.dto';
import { WorkflowGeneratorService } from './workflow-generator.service';

const CONTENT_TYPES = ['prescription', 'lab_result', 'care_notes', 'report', 'dental_chart', 'eye_prescription', 'meal_plan', 'exercise_plan'] as const;

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
    private readonly engine: WorkflowEngineService,
    private readonly instanceRepo: WorkflowInstanceRepository,
    private readonly templateRepo: WorkflowTemplateRepository,
    private readonly mgmt: WorkflowManagementService,
    private readonly aiAssist: WorkflowAiAssistService,
    private readonly generatorService: WorkflowGeneratorService,
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
    const instances = await this.instanceRepo.findByUser(user.sub, r, { currentStatus: status, bookingType });

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
        ...inst, instanceId: inst.id, templateName: inst.template?.name ?? '',
        isCompleted, isCancelled, currentStepCategory,
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

  @Get('workflow/instances/:id')
  async getInstance(@Param('id') id: string) {
    const state = await this.engine.getState(id);
    if (!state) throw new NotFoundException('Workflow instance not found');
    return { success: true, data: state };
  }

  @Get('workflow/instances/:id/timeline')
  async getTimeline(@Param('id') id: string) {
    return { success: true, data: await this.engine.getTimeline(id) };
  }

  @Patch('workflow/instances/:id/session')
  async updateSessionTracking(
    @Param('id') id: string,
    @Body() body: { sessionNumber?: number; maxSessions?: number; programId?: string; sessionNotes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return { success: true, data: await this.mgmt.updateSessionTracking(id, body, user.sub) };
  }

  // ─── Templates ─────────────────────────────────────────────────────────

  @Get('workflow/templates')
  async listTemplates(
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('isDefault') isDefault?: string,
    @Query('platformServiceId') platformServiceId?: string,
  ) {
    const templates = await this.templateRepo.findMany({
      providerType: providerType ? providerType.toUpperCase() : undefined,
      serviceMode, platformServiceId,
      isDefault: isDefault === 'true' ? true : isDefault === 'false' ? false : undefined,
    });
    return { success: true, data: templates };
  }

  @Get('workflow/templates/stats')
  @UseGuards(AdminGuard)
  async getTemplateStats() {
    return { success: true, data: await this.mgmt.getTemplateStats() };
  }

  @Post('workflow/ai-draft')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async aiDraft(@Body() body: { prompt: string; providerType?: string; serviceMode?: string }) {
    const steps = await this.aiAssist.draftSteps(body?.prompt, body?.providerType, body?.serviceMode);
    return { success: true, data: { steps } };
  }

  @Get('workflow/templates/library')
  async getLibraryTemplates() {
    return { success: true, data: await this.mgmt.getLibraryTemplates() };
  }

  @Get('workflow/library/browse')
  async browseLibrary(
    @Query('providerType') providerType?: string,
    @Query('serviceMode') serviceMode?: string,
    @Query('containsStatus') containsStatus?: string,
    @Query('search') search?: string,
    @Query('source') source?: 'system' | 'admin' | 'provider',
  ) {
    return { success: true, data: await this.mgmt.browseLibrary({ providerType, serviceMode, containsStatus, search, source }) };
  }

  @Post('workflow/templates/:id/clone')
  @HttpCode(HttpStatus.CREATED)
  async cloneTemplate(
    @Param('id') id: string,
    @Body() body: { name?: string; providerType?: string; serviceMode?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.cloneTemplate(id, body, user.sub, userType) };
  }

  @Get('workflow/templates/:id')
  async getTemplate(@Param('id') id: string) {
    const template = await this.templateRepo.findById(id);
    if (!template) throw new NotFoundException('Template not found');
    return { success: true, data: template };
  }

  @Post('workflow/templates/generate')
  @HttpCode(HttpStatus.OK)
  async generateTemplate(@Body() dto: GenerateTemplateDto) {
    return { success: true, data: this.generatorService.generate(dto) };
  }

  @Post('workflow/templates')
  @HttpCode(HttpStatus.CREATED)
  async createTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.createTemplate(dto, user.sub, userType) };
  }

  @Patch('workflow/templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: JwtPayload) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.updateTemplate(id, dto, user.sub, userType) };
  }

  @Post('workflow/templates/:id/publish')
  @HttpCode(HttpStatus.OK)
  async publishTemplate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.publishTemplate(id, user.sub, userType) };
  }

  @Get('workflow/templates/:id/in-flight-count')
  async getInFlightCount(@Param('id') id: string) {
    return { success: true, data: { count: await this.templateRepo.countActiveInstances(id) } };
  }

  @Delete('workflow/templates/:id')
  async deleteTemplate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const existing = await this.templateRepo.findById(id);
    if (!existing) throw new NotFoundException('Template not found');
    if (existing.isDefault) throw new ForbiddenException('Cannot delete default templates');
    if (existing.createdByProviderId !== user.sub) throw new ForbiddenException('You can only delete your own templates');
    await this.templateRepo.deactivate(id);
    return { success: true, message: 'Template deactivated' };
  }

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

  @Post('workflow/my-templates')
  @HttpCode(HttpStatus.CREATED)
  async createMyTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.createMyTemplate(dto, user.sub, userType) };
  }

  // ─── Step Types ─────────────────────────────────────────────────────────

  @Get('workflow/step-types')
  async getStepTypes(@Query('category') category?: string) {
    return { success: true, data: await this.mgmt.getStepTypes(category) };
  }

  @Get('workflow/step-types/:code/defaults')
  async getStepTypeDefaults(@Param('code') code: string) {
    return { success: true, data: await this.mgmt.getStepTypeDefaults(code) };
  }

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
    if (code.includes('VIDEO') || code.includes('CALL') || lbl.includes('video') || lbl.includes('call')) {
      recommendations.push({ flag: 'triggers_video_call', reason: 'Video consultation steps should trigger a video room', suggestedValue: true });
    }
    if (code.includes('COMPLETED') || code.includes('DISCHARGED') || lbl.includes('complet')) {
      recommendations.push({ flag: 'triggers_review_request', reason: 'Completion steps should prompt for a patient review', suggestedValue: true });
    }
    return { success: true, data: recommendations };
  }

  // ─── Suggestions ──────────────────────────────────────────────────────

  @Post('workflow/suggestions')
  @HttpCode(HttpStatus.CREATED)
  async suggestTemplate(@Body() dto: CreateTemplateDto, @CurrentUser() user: JwtPayload) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.suggestTemplate(dto, user.sub, userType) };
  }

  @Get('workflow/suggestions')
  async listSuggestions(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const userType = await this.mgmt.getUserType(user.sub);
    return { success: true, data: await this.mgmt.listSuggestions(user.sub, userType, status) };
  }

  @Post('workflow/suggestions/:id/review')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async reviewSuggestion(@Param('id') id: string, @Body() body: { action: 'approve' | 'reject'; note?: string }) {
    return { success: true, data: await this.mgmt.reviewSuggestion(id, body) };
  }

  // ─── Shared Library ────────────────────────────────────────────────────

  @Get('workflow/shared-library')
  @UseGuards(AdminGuard)
  async sharedLibrary(@Query('providerType') providerType?: string, @Query('serviceMode') serviceMode?: string) {
    return { success: true, data: await this.mgmt.sharedLibrary({ providerType, serviceMode }) };
  }

  // ─── Template Analytics ────────────────────────────────────────────────

  @Get('workflow/templates/:id/funnel')
  @UseGuards(AdminGuard)
  async templateFunnel(@Param('id') id: string) {
    return { success: true, data: await this.mgmt.templateFunnel(id) };
  }

  @Get('workflow/templates/:id/history')
  @UseGuards(AdminGuard)
  async templateHistory(@Param('id') id: string) {
    return { success: true, data: await this.mgmt.templateHistory(id) };
  }

  // ─── Admin ─────────────────────────────────────────────────────────────

  @Get('workflow/admin/instances')
  @UseGuards(AdminGuard)
  async adminListInstances(
    @Query('status') status?: string,
    @Query('bookingType') bookingType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.mgmt.adminListInstances({
      status, bookingType,
      page: parseInt(page ?? '1', 10) || 1,
      limit: parseInt(limit ?? '20', 10) || 20,
    });
    return { success: true, data: result };
  }

  @Get('workflow/admin/audit')
  @UseGuards(AdminGuard)
  async adminAuditLog(@Query('page') page?: string, @Query('limit') limit?: string) {
    const logs = await this.mgmt.adminAuditLog(
      parseInt(page ?? '1', 10) || 1,
      parseInt(limit ?? '50', 10) || 50,
    );
    return { success: true, data: logs };
  }

  @Get('workflow/admin/overview')
  @UseGuards(AdminGuard)
  async adminOverview() {
    return { success: true, data: await this.mgmt.adminOverview() };
  }

  @Get('workflow/admin/compliance')
  @UseGuards(AdminGuard)
  async adminCompliance() {
    return { success: true, data: await this.mgmt.adminCompliance() };
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
