import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowRegistry } from './workflow-registry';
import { WorkflowNotificationResolver } from './notification-resolver';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowStepLogRepository } from './repositories/workflow-step-log.repository';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { WorkflowAiAssistService } from './workflow-ai-assist.service';
import { WorkflowGeneratorService } from './workflow-generator.service';
import { WorkflowManagementService } from './workflow-management.service';

// Step Flag Strategies (10)
import { VideoCallStrategy, AudioCallStrategy } from './strategies/video-call.strategy';
import { StockCheckStrategy } from './strategies/stock-check.strategy';
import { StockSubtractStrategy } from './strategies/stock-subtract.strategy';
import { PaymentStrategy } from './strategies/payment.strategy';
import { RefundStrategy } from './strategies/refund.strategy';
import { ConversationStrategy } from './strategies/conversation.strategy';
import { ReviewRequestStrategy } from './strategies/review-request.strategy';
import { PrescriptionCheckStrategy } from './strategies/prescription-check.strategy';
import { ContentAttachmentStrategy } from './strategies/content-attachment.strategy';

import type { StepFlagHandler } from './types';

const ALL_STRATEGIES = [
  VideoCallStrategy, AudioCallStrategy,
  StockCheckStrategy, StockSubtractStrategy,
  PaymentStrategy, RefundStrategy, ConversationStrategy,
  ReviewRequestStrategy, PrescriptionCheckStrategy, ContentAttachmentStrategy,
];

@Module({
  controllers: [WorkflowController],
  providers: [
    // Core services
    WorkflowEngineService,
    WorkflowRegistry,
    WorkflowNotificationResolver,

    // Repositories
    WorkflowInstanceRepository,
    WorkflowStepLogRepository,
    WorkflowTemplateRepository,
    WorkflowAiAssistService,
    WorkflowGeneratorService,
    WorkflowManagementService,

    // All 10 strategies
    ...ALL_STRATEGIES,

    // Strategy registry — collects all strategies into a Map<flag, handler>
    {
      provide: 'STEP_FLAG_HANDLERS',
      useFactory: (...strategies: StepFlagHandler[]) => {
        const map = new Map<string, StepFlagHandler>();
        strategies.forEach(s => map.set(s.flag, s));
        return map;
      },
      inject: ALL_STRATEGIES,
    },
  ],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}
