import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { HealthTrackerController } from './health-tracker.controller';
import { HealthTrackerService } from './health-tracker.service';
import { ClinicalKnowledgeService } from './clinical-knowledge.service';
import { ClinicalKnowledgeController } from './clinical-knowledge.controller';
import { AiDriftDetectionService } from './drift-detection.service';
import { SearchModule } from '../search/search.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [SearchModule, InventoryModule],
  controllers: [AiController, AgentController, HealthTrackerController, ClinicalKnowledgeController],
  providers: [AiService, AgentService, HealthTrackerService, ClinicalKnowledgeService, AiDriftDetectionService],
  exports: [AiService, HealthTrackerService, ClinicalKnowledgeService, AiDriftDetectionService],
})
export class AiModule {}
