import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowStepLogRepository } from './repositories/workflow-step-log.repository';
import { WorkflowRegistry } from './workflow-registry';
import { WorkflowNotificationResolver } from './notification-resolver';
import { validateTransition, resolveTargetStatus, findStepByStatus, isTerminalStatus } from './workflow-validators';
import type {
  TransitionInput, TransitionResult, WorkflowStepDefinition,
  TransitionDefinition, WorkflowState, StepFlags, StepFlagHandler, TransitionContext,
  StepCategory, BOOKING_TYPE_MODEL_MAP, WorkflowServiceConfig,
} from './types';

/**
 * Derive a visual category for a step when the author didn't pick one
 * explicitly. This is the fallback that lets custom status codes still
 * render with the right colour — the name of the code is never consulted.
 *
 *   - First step in order → `pending`
 *   - No outgoing actions + terminal-success signal → `success`
 *   - No outgoing actions + terminal-failure signal → `danger`
 *   - Waiting on the other side (empty actionsForX for the viewer) → handled client-side
 *   - Everything else → `active`
 */
function deriveStepCategory(step: WorkflowStepDefinition, allSteps: WorkflowStepDefinition[]): StepCategory {
  if (step.category) return step.category;

  const ordered = [...allSteps].sort((a, b) => a.order - b.order);
  const isFirst = ordered[0]?.statusCode === step.statusCode;
  const hasNoActions = (step.actionsForPatient?.length ?? 0) === 0 && (step.actionsForProvider?.length ?? 0) === 0;

  if (isFirst) return 'pending';
  if (hasNoActions) {
    // Terminal step — authors should set step.category explicitly ('success' or 'danger').
    // Without that, fall back to position: last step by order = success, anything else = active.
    // (The builder shows a warning when a terminal step has no category set.)
    const last = ordered[ordered.length - 1]?.statusCode === step.statusCode;
    return last ? 'success' : 'active';
  }
  return 'active';
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  /**
   * Maps bookingType → Prisma model name.
   * New bookings all use 'service_booking' → 'serviceBooking'.
   * Legacy types kept for backward compatibility with historical data.
   */
  private readonly bookingModelMap: Record<string, string> = {
    service_booking: 'serviceBooking',
    // Legacy models (read-only for historical bookings)
    appointment: 'appointment',
    nurse_booking: 'nurseBooking',
    childcare_booking: 'childcareBooking',
    lab_test_booking: 'labTestBooking',
    emergency_booking: 'emergencyBooking',
  };

  /**
   * Maps booking route → bookingType.
   * ALL new bookings use 'service_booking'. No hardcoded role names.
   * Legacy types only for reading historical data.
   */
  private readonly bookingTypeMap: Record<string, string> = {
    service: 'service_booking',
    // Legacy types (for reading old bookings only — all new bookings use service_booking)
    appointment: 'appointment', nurse_booking: 'nurse_booking',
    childcare_booking: 'childcare_booking', lab_test_booking: 'lab_test_booking',
    emergency_booking: 'emergency_booking',
  };

  private readonly serviceModeMap: Record<string, 'office' | 'home' | 'video'> = {
    video: 'video', audio: 'video', in_person: 'office', home_visit: 'home', office: 'office', home: 'home',
  };

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private instanceRepo: WorkflowInstanceRepository,
    private stepLogRepo: WorkflowStepLogRepository,
    private registry: WorkflowRegistry,
    private notificationResolver: WorkflowNotificationResolver,
    @Inject('STEP_FLAG_HANDLERS') private flagHandlers: Map<string, StepFlagHandler>,
  ) {}

  // ─── Start Workflow ────────────────────────────────────────────────────

  async startWorkflow(params: {
    bookingId: string; bookingType: string; platformServiceId?: string | null;
    providerUserId: string; providerType: string; patientUserId: string;
    serviceMode: 'office' | 'home' | 'video'; regionCode?: string | null;
    workflowTemplateId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    // When the caller pins a specific template (patient selected a workflow),
    // bypass the registry cascade and use that template directly.
    let template = params.workflowTemplateId
      ? await this.prisma.workflowTemplate.findFirst({
          where: { id: params.workflowTemplateId, isActive: true },
        })
      : null;

    if (!template) {
      template = await this.registry.resolveTemplate({
        platformServiceId: params.platformServiceId,
        providerUserId: params.providerUserId,
        providerType: params.providerType,
        serviceMode: params.serviceMode,
        regionCode: params.regionCode,
      });
    }

    if (!template) return { success: false as const, error: 'No workflow template found for this service and mode' };

    const steps = template.steps as unknown as WorkflowStepDefinition[];
    const firstStep = steps.find(s => s.order === 1) ?? steps[0];
    if (!firstStep) return { success: false as const, error: 'Workflow template has no steps defined' };

    // Snapshot the template into the instance so future edits to the
    // template don't change the behaviour of this live booking. The
    // engine will prefer the snapshot over the live template when both
    // exist. See `prisma/schema.prisma → WorkflowInstance.templateSnapshot`.
    const instance = await this.instanceRepo.create({
      templateId: template.id, bookingId: params.bookingId, bookingType: params.bookingType,
      currentStatus: firstStep.statusCode, patientUserId: params.patientUserId,
      providerUserId: params.providerUserId, serviceMode: params.serviceMode,
      metadata: params.metadata as any,
      templateSnapshot: {
        id: template.id,
        name: template.name,
        slug: template.slug,
        steps: template.steps,
        transitions: template.transitions,
      } as any,
    });

    await this.stepLogRepo.create({
      instanceId: instance.id, fromStatus: null, toStatus: firstStep.statusCode,
      action: 'create', actionByUserId: params.patientUserId, actionByRole: 'patient',
      label: firstStep.label, message: 'Workflow started',
    });

    // ─── Initial-step notification — ALWAYS notify BOTH sides ──────────
    // Workflow contract: every status change (including the initial creation)
    // pings both the patient and the provider. Falls back to a generic
    // "Your booking moved to X" when the template didn't author custom
    // copy for that side. Admin diligence is no longer required.
    const variables = await this.notificationResolver.buildVariables({
      patientUserId: params.patientUserId, providerUserId: params.providerUserId,
      bookingId: params.bookingId, statusLabel: firstStep.label,
    });

    const firstDefaultPatient = { title: 'New booking', message: `Your booking is now: ${firstStep.label}` };
    const firstDefaultProvider = { title: 'New booking', message: `Booking status: ${firstStep.label}` };

    {
      const resolved = await this.notificationResolver.resolve({
        workflowTemplateId: template.id, statusCode: firstStep.statusCode,
        targetRole: 'provider',
        defaultNotification: firstStep.notifyProvider || firstDefaultProvider,
        createdByProviderId: template.createdByProviderId, variables,
      });
      if (resolved) {
        await this.notifications.createNotification({
          userId: params.providerUserId, type: 'workflow',
          title: resolved.title, message: resolved.message,
          referenceId: params.bookingId, referenceType: params.bookingType,
        });
      }
    }

    {
      const resolved = await this.notificationResolver.resolve({
        workflowTemplateId: template.id, statusCode: firstStep.statusCode,
        targetRole: 'patient',
        defaultNotification: firstStep.notifyPatient || firstDefaultPatient,
        createdByProviderId: template.createdByProviderId, variables,
      });
      if (resolved) {
        await this.notifications.createNotification({
          userId: params.patientUserId, type: 'workflow',
          title: resolved.title, message: resolved.message,
          referenceId: params.bookingId, referenceType: params.bookingType,
        });
      }
    }

    return { success: true as const, instanceId: instance.id, templateId: template.id, currentStatus: firstStep.statusCode, stepLabel: firstStep.label };
  }

  // ─── Transition ────────────────────────────────────────────────────────

  async transition(input: TransitionInput): Promise<TransitionResult> {
    let instance;
    if (input.instanceId) instance = await this.instanceRepo.findById(input.instanceId);
    else if (input.bookingId && input.bookingType) instance = await this.instanceRepo.findByBooking(input.bookingId, input.bookingType);

    if (!instance) throw new BadRequestException('Workflow instance not found');
    if (instance.completedAt || instance.cancelledAt) throw new BadRequestException('Workflow is already completed or cancelled');

    const template = instance.template;
    // Version-lock: use the snapshot captured at booking creation when
    // present so edits to the template mid-flight don't change the graph
    // this booking walks. Falls back to the live template for legacy
    // instances predating snapshots.
    const snap = (instance as any).templateSnapshot as { steps?: unknown; transitions?: unknown } | null | undefined;
    const steps = (snap?.steps ?? template.steps) as unknown as WorkflowStepDefinition[];
    const transitions = (snap?.transitions ?? template.transitions) as unknown as TransitionDefinition[];

    const validation = validateTransition(transitions, instance.currentStatus, input.action, input.actionByRole);
    if (!validation.valid) throw new BadRequestException(validation.error!);

    const targetStatus = resolveTargetStatus(transitions, instance.currentStatus, input.action);
    if (!targetStatus) throw new BadRequestException(`Cannot resolve target status for action "${input.action}"`);

    const targetStep = findStepByStatus(steps, targetStatus);
    if (!targetStep) throw new BadRequestException(`Step definition not found for status "${targetStatus}"`);

    // Merge WorkflowStepType.defaultFlags into the TARGET step's own flags so that
    // step-type behaviour (e.g. VIDEO_CALL_READY triggers_video_call) is SYSTEMATIC —
    // the admin picks a step type and the execution flags come with it automatically.
    // Explicit step flags always win over defaults.
    let resolvedFlags: StepFlags = { ...targetStep.flags };
    const stepTypeName: string | undefined = (targetStep as any).stepType;
    if (stepTypeName) {
      const stepTypeRow = await this.prisma.workflowStepType.findUnique({
        where: { code: stepTypeName }, select: { defaultFlags: true },
      });
      if (stepTypeRow?.defaultFlags) {
        const typeDefaults = stepTypeRow.defaultFlags as StepFlags;
        // Defaults apply only where the step has NOT set the flag explicitly
        resolvedFlags = { ...typeDefaults, ...resolvedFlags };
      }
    }

    // Also resolve CURRENT step flags for departure guards (requires_content,
    // requires_prescription). These flags say "you must supply X before leaving
    // this step" — so we check them against the step the booking is leaving,
    // not the step it's entering. Execution triggers (video room, payment, etc.)
    // continue to use resolvedFlags (target step) via Tier 2/3 below.
    const currentStepDef = findStepByStatus(steps, instance.currentStatus);
    let currentStepResolvedFlags: StepFlags = { ...currentStepDef?.flags };
    const currentStepTypeName: string | undefined = (currentStepDef as any)?.stepType;
    if (currentStepTypeName) {
      const currentStepTypeRow = await this.prisma.workflowStepType.findUnique({
        where: { code: currentStepTypeName }, select: { defaultFlags: true },
      });
      if (currentStepTypeRow?.defaultFlags) {
        const typeDefaults = currentStepTypeRow.defaultFlags as StepFlags;
        currentStepResolvedFlags = { ...typeDefaults, ...currentStepResolvedFlags };
      }
    }

    const ctx: TransitionContext = {
      instanceId: instance.id, templateId: template.id, bookingId: instance.bookingId,
      bookingType: instance.bookingType, patientUserId: instance.patientUserId,
      providerUserId: instance.providerUserId, fromStatus: instance.currentStatus,
      toStatus: targetStatus, action: input.action, flags: resolvedFlags, input,
    };

    // PRE-transition validation
    const isSelfTransition = instance.currentStatus === targetStatus;
    const isAcceptActionPre = ['accept', 'confirm', 'approve'].includes(input.action);
    if (!isSelfTransition) {
      const preErrors: string[] = [];

      // Step-type-driven departure guards (requires_content, requires_prescription).
      // Checks the CURRENT step's flags — these guard leaving the current step,
      // not entering the target step. The content handler receives a ctx with
      // current-step flags so it can verify the right content type was provided.
      for (const [flagKey, handler] of this.flagHandlers) {
        if (currentStepResolvedFlags[flagKey as keyof StepFlags] && handler.validate) {
          const ctxForValidation = { ...ctx, flags: currentStepResolvedFlags };
          const result = await handler.validate(ctxForValidation);
          if (!result.valid) preErrors.push(...result.errors);
        }
      }

      // ─── ACCEPTANCE PRE-FLIGHT ───────────────────────────────────────────
      // All upfront requirements run here — at the moment the provider accepts,
      // before any payment, slot-block, or service delivery begins.
      //
      // Sources (in order):
      //   1. Balance — always when service has a price
      //   2. serviceConfig.stock.checkOnAcceptance — Health Shop item availability
      //   3. serviceConfig.preflight.requires — prescription and content requirements
      //
      // Nothing in this section reads step flags. Step flags are for video/audio
      // room creation and mid-workflow clinical outcomes (requires_content via step types).
      // Stock management and prescription eligibility are SERVICE-LEVEL concerns
      // configured once on the template, not scattered across individual steps.
      if (isAcceptActionPre) {
        const serviceConfig: WorkflowServiceConfig = ((instance.template as any)?.serviceConfig as WorkflowServiceConfig) ?? {};

        // 1. Balance pre-flight — always fires when service has a price
        const servicePrice = (instance.metadata as any)?.servicePrice as number | undefined;
        if (servicePrice && servicePrice > 0) {
          const payHandler = this.flagHandlers.get('triggers_payment');
          if (payHandler?.validate) {
            const result = await payHandler.validate(ctx);
            if (!result.valid) preErrors.push(...result.errors);
          }
        }

        // 2. Health Shop stock availability — fires when template declares it
        // The platform only tracks ProviderInventoryItem (Health Shop products).
        // Clinical supplies used during service delivery are internal to the provider.
        if (serviceConfig.stock?.checkOnAcceptance) {
          const inventoryItems = input.inventoryItems ?? (instance.metadata as any)?.inventoryItems;
          if (inventoryItems && Array.isArray(inventoryItems) && inventoryItems.length > 0) {
            const stockHandler = this.flagHandlers.get('triggers_stock_check');
            if (stockHandler?.validate) {
              const ctxWithItems = { ...ctx, input: { ...ctx.input, inventoryItems } };
              const result = await stockHandler.validate(ctxWithItems);
              if (!result.valid) preErrors.push(...result.errors);
            }
          }
        }

        // 3. serviceConfig.preflight.requires — string-keyed upfront requirements
        // Adding a new type never requires a DB schema change:
        //   "db:prescription"     → patient must have an active prescription in DB
        //   "input:<ContentType>" → caller must attach that content in the transition
        for (const req of serviceConfig.preflight?.requires ?? []) {
          if (req === 'db:prescription' || req.startsWith('db:')) {
            const contentType = req.slice(3); // "prescription"
            if (contentType === 'prescription') {
              const rxHandler = this.flagHandlers.get('requires_prescription');
              if (rxHandler?.validate) {
                const ctxForRx = {
                  ...ctx,
                  flags: { ...ctx.flags, requires_prescription: true },
                  input: { ...ctx.input, inventoryItems: [] },
                };
                const result = await rxHandler.validate(ctxForRx);
                if (!result.valid) preErrors.push(...result.errors);
              }
            }
          } else if (req.startsWith('input:')) {
            const contentType = req.slice(6);
            const contentHandler = this.flagHandlers.get('requires_content');
            if (contentHandler?.validate) {
              const ctxForContent = {
                ...ctx,
                flags: { ...ctx.flags, requires_content: contentType as any },
              };
              const result = await contentHandler.validate(ctxForContent);
              if (!result.valid) preErrors.push(...result.errors);
            }
          }
        }
      }

      if (preErrors.length > 0) throw new BadRequestException(`Pre-transition validation failed: ${preErrors.join(', ')}`);
    }

    // Update instance status
    const triggeredActions: TransitionResult['triggeredActions'] = {};
    const notificationIds: TransitionResult['notification'] = {};
    const isCompleted = isTerminalStatus(transitions, targetStatus) && targetStatus !== 'cancelled';
    const isCancelled = targetStatus === 'cancelled';

    await this.instanceRepo.updateStatus(instance.id, {
      currentStatus: targetStatus, previousStatus: instance.currentStatus,
      ...(isCompleted ? { completedAt: new Date() } : {}),
      ...(isCancelled ? { cancelledAt: new Date() } : {}),
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 3-TIER TRIGGER ARCHITECTURE
    // ═══════════════════════════════════════════════════════════════════════

    if (!isSelfTransition) {
      // ─── TIER 2: Auto-triggers based on booking context ──────────────
      // These fire automatically based on the transition type — no manual
      // flag configuration needed by the regional admin.

      const isAcceptAction = isAcceptActionPre;
      const isCancelAction = ['cancel', 'deny', 'decline', 'reject'].includes(input.action);

      // Auto: Block provider's time slot on acceptance
      if (isAcceptAction) {
        try {
          const booking = await this.prisma.serviceBooking.findUnique({
            where: { id: instance.bookingId },
            select: { scheduledAt: true, duration: true, providerUserId: true },
          });
          if (booking?.scheduledAt) {
            const date = new Date(booking.scheduledAt);
            const startTime = date.toTimeString().slice(0, 5); // "10:00"
            const endMinutes = date.getMinutes() + (booking.duration || 30);
            const endDate = new Date(date); endDate.setMinutes(endMinutes);
            const endTime = endDate.toTimeString().slice(0, 5);
            await this.prisma.bookedSlot.upsert({
              where: { providerUserId_date_startTime: { providerUserId: booking.providerUserId, date: new Date(date.toDateString()), startTime } },
              create: { providerUserId: booking.providerUserId, bookingId: instance.bookingId, date: new Date(date.toDateString()), startTime, endTime, status: 'booked' },
              update: { bookingId: instance.bookingId, status: 'booked' },
            });
          }
        } catch { /* non-fatal */ }
      }

      // Auto: Create conversation on acceptance or when a CONFIRMED step is reached
      if ((isAcceptAction || (targetStep as any).stepType === 'CONFIRMED') && !triggeredActions.conversationId) {
        const convHandler = this.flagHandlers.get('triggers_conversation');
        if (convHandler?.execute) {
          try {
            const r = await convHandler.execute(ctx);
            if (r.conversationId) triggeredActions.conversationId = r.conversationId;
          } catch { /* non-fatal */ }
        }
      }

      // Auto: Process payment based on paymentTiming (template-level setting)
      if (!triggeredActions.paymentProcessed) {
        const servicePrice = (instance.metadata as any)?.servicePrice;
        if (servicePrice && servicePrice > 0) {
          const paymentTiming: string = (instance.template as any)?.paymentTiming || 'ON_ACCEPTANCE';
          const shouldCharge =
            (paymentTiming === 'IMMEDIATE' && isAcceptAction) ||
            (paymentTiming === 'ON_ACCEPTANCE' && isAcceptAction) ||
            (paymentTiming === 'ON_COMPLETION' && isCompleted);
          if (shouldCharge) {
            const payHandler = this.flagHandlers.get('triggers_payment');
            if (payHandler?.execute) {
              try {
                ctx.input.contentData = { ...(ctx.input.contentData || {}), amount: servicePrice };
                const r = await payHandler.execute(ctx);
                if (r.paymentProcessed) triggeredActions.paymentProcessed = r.paymentProcessed;
              } catch { /* non-fatal — insufficient balance already validated */ }
            }
          }
        }
      }

      // Auto: video room (serviceMode=video on acceptance, or VIDEO_CALL_READY/ACTIVE step type)
      //       audio room (serviceMode=video + consultationType=audio, or AUDIO_CALL_READY/ACTIVE step type)
      // Both are fully systematic. No per-step flag needed.
      if (!triggeredActions.videoCallId) {
        const serviceMode = instance.serviceMode;
        const consultationType = (instance.metadata as any)?.consultationType as string | undefined;
        const isAudioConsultation = consultationType === 'audio';
        const targetStepType: string | undefined = (targetStep as any).stepType;
        const isVideoStepType = ['VIDEO_CALL_READY', 'VIDEO_CALL_ACTIVE'].includes(targetStepType ?? '');
        const isAudioStepType = ['AUDIO_CALL_READY', 'AUDIO_CALL_ACTIVE'].includes(targetStepType ?? '');

        if (isAudioStepType || (isAcceptAction && serviceMode === 'video' && isAudioConsultation)) {
          const audioHandler = this.flagHandlers.get('triggers_audio_call');
          if (audioHandler?.execute) {
            try {
              const r = await audioHandler.execute(ctx);
              if (r.videoCallId) triggeredActions.videoCallId = r.videoCallId;
            } catch { /* non-fatal */ }
          }
        } else if (isVideoStepType || (isAcceptAction && serviceMode === 'video')) {
          const videoHandler = this.flagHandlers.get('triggers_video_call');
          if (videoHandler?.execute) {
            try {
              const r = await videoHandler.execute(ctx);
              if (r.videoCallId) triggeredActions.videoCallId = r.videoCallId;
            } catch { /* non-fatal */ }
          }
        }
      }

      // Auto: Release provider's time slot on cancellation
      if (isCancelAction) {
        try {
          await this.prisma.bookedSlot.updateMany({
            where: { bookingId: instance.bookingId },
            data: { status: 'cancelled' },
          });
        } catch { /* non-fatal */ }
      }

      // Auto: Process refund on cancellation (if payment was made)
      if (isCancelAction && !triggeredActions.refundProcessed) {
        const refundHandler = this.flagHandlers.get('triggers_refund');
        if (refundHandler?.execute) {
          try {
            const r = await refundHandler.execute(ctx);
            if (r.refundProcessed) triggeredActions.refundProcessed = r.refundProcessed;
          } catch { /* non-fatal — no payment to refund */ }
        }
      }

      // Auto: Check required content before completion (from ProviderRole.requiredContentType)
      if (isCompleted && input.contentType === undefined) {
        try {
          // Check if the provider's role requires content on completion
          const provider = await this.prisma.user.findUnique({ where: { id: instance.providerUserId }, select: { userType: true } });
          if (provider) {
            const role = await this.prisma.providerRole.findUnique({ where: { code: provider.userType }, select: { requiredContentType: true } });
            if (role?.requiredContentType) {
              // Also check PlatformService level
              const svc = instance.metadata && (instance.metadata as any).platformServiceId
                ? await this.prisma.platformService.findUnique({ where: { id: (instance.metadata as any).platformServiceId }, select: { requiredContentType: true } })
                : null;
              const required = svc?.requiredContentType || role.requiredContentType;
              if (required) {
                this.logger.warn(`Booking ${instance.bookingId} completed without required content type: ${required}`);
                // Note: we don't block completion — just log. The content can be attached later.
              }
            }
          }
        } catch { /* non-fatal */ }
      }

      // Auto: Request review on completion
      if (isCompleted && !triggeredActions.reviewRequestSent) {
        const reviewHandler = this.flagHandlers.get('triggers_review_request');
        if (reviewHandler?.execute) {
          try {
            const r = await reviewHandler.execute(ctx);
            if (r.reviewRequestSent) triggeredActions.reviewRequestSent = r.reviewRequestSent;
          } catch { /* non-fatal */ }
        }
      }

      // Auto: Health Shop stock deduction on terminal success
      // Fires when serviceConfig.stock.subtractOnCompletion = true and the booking
      // reaches a terminal success step (delivered, collected, completed).
      // Never fires on clinical service bookings — those don't use platform inventory.
      if (isCompleted) {
        const serviceConfig: WorkflowServiceConfig = ((instance.template as any)?.serviceConfig as WorkflowServiceConfig) ?? {};

        if (serviceConfig.stock?.subtractOnCompletion) {
          const subtractHandler = this.flagHandlers.get('triggers_stock_subtract');
          if (subtractHandler?.execute) {
            try {
              const inventoryItems = input.inventoryItems ?? (instance.metadata as any)?.inventoryItems;
              if (inventoryItems && Array.isArray(inventoryItems) && inventoryItems.length > 0) {
                const ctxWithItems = { ...ctx, input: { ...ctx.input, inventoryItems } };
                const r = await subtractHandler.execute(ctxWithItems);
                if (r.stockSubtracted) triggeredActions.stockSubtracted = r.stockSubtracted;
              }
            } catch { /* non-fatal */ }
          }
        }

        // Legacy/extensibility: named completion hooks registered as handler keys
        for (const actionKey of serviceConfig.onComplete?.actions ?? []) {
          if (actionKey === 'triggers_stock_subtract') continue; // handled above via stock.subtractOnCompletion
          const handler = this.flagHandlers.get(actionKey);
          if (!handler?.execute) continue;
          try {
            const r = await handler.execute(ctx);
            if (r.paymentProcessed && !triggeredActions.paymentProcessed) triggeredActions.paymentProcessed = r.paymentProcessed;
            if (r.reviewRequestSent && !triggeredActions.reviewRequestSent) triggeredActions.reviewRequestSent = r.reviewRequestSent;
          } catch { /* non-fatal */ }
        }
      }

      // ─── TIER 3: Step-type-driven execute flags ───────────────────────────
      // Runs any handler whose flag was injected by WorkflowStepType.defaultFlags.
      // Currently StepFlags only carries requires_content and requires_prescription
      // (validation-only — no execute); video/audio are also step-type-injected but
      // handled above in Tier 2. This loop is kept for future custom step types that
      // may carry execute-capable flags.
      //
      // All the common workflow behaviours (payment, refund, conversation, review,
      // video, audio, stock) are handled systematically by Tier 2 — never via
      // manually placed flags here.

      for (const [flagKey, handler] of this.flagHandlers) {
        if (!resolvedFlags[flagKey as keyof StepFlags]) continue;
        if (!handler.execute) continue;
        // Skip everything already handled systematically by Tier 2
        if ([
          'triggers_video_call', 'triggers_audio_call',
          'triggers_payment', 'triggers_refund',
          'triggers_conversation', 'triggers_review_request',
          'triggers_stock_check', 'triggers_stock_subtract',
        ].includes(flagKey)) continue;

        const result = await handler.execute(ctx);
        if (result.videoCallId && !triggeredActions.videoCallId) triggeredActions.videoCallId = result.videoCallId;
        if (result.paymentProcessed && !triggeredActions.paymentProcessed) triggeredActions.paymentProcessed = result.paymentProcessed;
        if (result.conversationId && !triggeredActions.conversationId) triggeredActions.conversationId = result.conversationId;
        if (result.reviewRequestSent && !triggeredActions.reviewRequestSent) triggeredActions.reviewRequestSent = result.reviewRequestSent;
        if (result.refundProcessed && !triggeredActions.refundProcessed) triggeredActions.refundProcessed = result.refundProcessed;
      }
    }

    // Create step log
    await this.stepLogRepo.create({
      instanceId: instance.id, fromStatus: instance.currentStatus, toStatus: targetStatus,
      action: input.action, actionByUserId: input.actionByUserId, actionByRole: input.actionByRole,
      label: targetStep.label, message: input.notes,
      contentType: input.contentType, contentData: input.contentData as any,
      triggeredVideoCallId: triggeredActions.videoCallId, triggeredStockActions: triggeredActions.stockSubtracted as any,
    });

    // ─── TIER 1: Systematic notifications — ALWAYS sent on every transition ─
    const variables = await this.notificationResolver.buildVariables({
      patientUserId: instance.patientUserId, providerUserId: instance.providerUserId,
      bookingId: instance.bookingId, statusLabel: targetStep.label,
    });

    // Default notification content when step doesn't define custom ones
    const defaultPatientNotify = { title: 'Booking Updated', message: `Your booking status changed to: ${targetStep.label}` };
    const defaultProviderNotify = { title: 'Booking Updated', message: `Booking status changed to: ${targetStep.label}` };

    // Notify patient — use custom template if available, otherwise default
    {
      const resolved = await this.notificationResolver.resolve({
        workflowTemplateId: template.id, statusCode: targetStatus, targetRole: 'patient',
        defaultNotification: targetStep.notifyPatient || defaultPatientNotify,
        createdByProviderId: template.createdByProviderId, variables,
      });
      if (resolved) {
        const notif = await this.notifications.createNotification({
          userId: instance.patientUserId, type: 'workflow', title: resolved.title, message: resolved.message,
          referenceId: instance.bookingId, referenceType: instance.bookingType,
        });
        notificationIds.patientNotificationId = notif?.id;
      }
    }

    // Notify provider — use custom template if available, otherwise default
    {
      const resolved = await this.notificationResolver.resolve({
        workflowTemplateId: template.id, statusCode: targetStatus, targetRole: 'provider',
        defaultNotification: targetStep.notifyProvider || defaultProviderNotify,
        createdByProviderId: template.createdByProviderId, variables,
      });
      if (resolved) {
        const notif = await this.notifications.createNotification({
          userId: instance.providerUserId, type: 'workflow', title: resolved.title, message: resolved.message,
          referenceId: instance.bookingId, referenceType: instance.bookingType,
        });
        notificationIds.providerNotificationId = notif?.id;
      }
    }

    // Sync booking model status
    await this.syncBookingStatus(instance.bookingId, instance.bookingType, targetStatus);

    const currentStep = findStepByStatus(steps, targetStatus);
    return {
      success: true, instanceId: instance.id, previousStatus: instance.currentStatus,
      currentStatus: targetStatus, stepLabel: targetStep.label,
      nextActionsForPatient: currentStep?.actionsForPatient ?? [],
      nextActionsForProvider: currentStep?.actionsForProvider ?? [],
      notification: notificationIds, triggeredActions,
    };
  }

  // ─── Attach Workflow (hook for booking creation) ───────────────────────

  async attachWorkflow(params: {
    bookingId: string; bookingRoute: string; patientUserId: string;
    providerUserId: string; providerType: string; consultationType?: string;
    servicePrice?: number; platformServiceId?: string | null; regionCode?: string | null;
    workflowTemplateId?: string | null;
  }): Promise<{ workflowInstanceId?: string; workflowError?: string }> {
    try {
      const bookingType = this.bookingTypeMap[params.bookingRoute] || params.bookingRoute;
      const serviceMode = this.serviceModeMap[params.consultationType || 'office'] || 'office';
      const result = await this.startWorkflow({
        bookingId: params.bookingId, bookingType, platformServiceId: params.platformServiceId,
        providerUserId: params.providerUserId, providerType: params.providerType,
        patientUserId: params.patientUserId, serviceMode,
        regionCode: params.regionCode,
        workflowTemplateId: params.workflowTemplateId,
        metadata: {
          ...(params.servicePrice ? { servicePrice: params.servicePrice } : {}),
          ...(params.consultationType ? { consultationType: params.consultationType } : {}),
        },
      });
      if (result.success) return { workflowInstanceId: result.instanceId };
      return { workflowError: result.error };
    } catch (error) {
      return { workflowError: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ─── Get State ─────────────────────────────────────────────────────────

  async getState(instanceId: string): Promise<WorkflowState | null> {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) return null;
    // Prefer the snapshot captured at booking time when it exists —
    // guarantees that template edits made mid-flight don't retroactively
    // alter steps, labels, or flags for in-progress bookings. Falls back
    // to the live template for instances created before snapshotting was
    // wired (legacy data).
    const snap = (instance as any).templateSnapshot as { steps?: unknown } | null | undefined;
    const steps = (snap?.steps ?? instance.template.steps) as unknown as WorkflowStepDefinition[];
    const currentStep = findStepByStatus(steps, instance.currentStatus);
    return {
      instanceId: instance.id, templateId: instance.template.id,
      templateName: instance.template.name, bookingId: instance.bookingId,
      bookingType: instance.bookingType, serviceMode: instance.serviceMode,
      currentStatus: instance.currentStatus,
      currentStepLabel: currentStep?.label ?? instance.currentStatus,
      currentStepFlags: currentStep?.flags ?? {},
      actionsForPatient: currentStep?.actionsForPatient ?? [],
      actionsForProvider: currentStep?.actionsForProvider ?? [],
      isCompleted: instance.completedAt !== null,
      isCancelled: instance.cancelledAt !== null,
      startedAt: instance.startedAt,
      completedAt: instance.completedAt,
      allSteps: steps.map(s => ({
        statusCode: s.statusCode,
        label: s.label,
        category: deriveStepCategory(s, steps),
      })),
      currentStepCategory: currentStep
        ? deriveStepCategory(currentStep, steps)
        : (instance.cancelledAt ? 'danger' : instance.completedAt ? 'success' : 'active'),
    };
  }

  async getTimeline(instanceId: string) {
    return this.stepLogRepo.findByInstance(instanceId);
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private async syncBookingStatus(bookingId: string, bookingType: string, status: string) {
    const modelName = this.bookingModelMap[bookingType];
    if (!modelName) return;
    try {
      const model = (this.prisma as any)[modelName];
      if (model?.update) await model.update({ where: { id: bookingId }, data: { status } });
    } catch {
      this.logger.warn(`Could not sync booking status: ${bookingType}/${bookingId} → ${status}`);
    }
  }
}
