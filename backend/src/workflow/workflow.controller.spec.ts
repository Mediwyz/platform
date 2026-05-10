import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowTemplateRepository } from './repositories/workflow-template.repository';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowAiAssistService } from './workflow-ai-assist.service';
import { WorkflowGeneratorService } from './workflow-generator.service';
import { WorkflowManagementService } from './workflow-management.service';

const mockEngine = { transition: jest.fn(), attachWorkflow: jest.fn() };
const mockInstanceRepo = { findMany: jest.fn(), findById: jest.fn(), getTimeline: jest.fn() };
const mockTemplateRepo = { findMany: jest.fn(), findById: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() };
const mockPrisma = {
  workflowInstance: { findMany: jest.fn(), groupBy: jest.fn().mockResolvedValue([]) },
  workflowTemplate: { findMany: jest.fn() },
};
const mockAiAssist = { draftSteps: jest.fn() };
const mockGenerator = { generate: jest.fn() };
const mockMgmt = { getAnalytics: jest.fn(), cloneTemplate: jest.fn(), getLibrary: jest.fn() };

describe('WorkflowController', () => {
  let controller: WorkflowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        { provide: WorkflowEngineService, useValue: mockEngine },
        { provide: WorkflowInstanceRepository, useValue: mockInstanceRepo },
        { provide: WorkflowTemplateRepository, useValue: mockTemplateRepo },
        { provide: WorkflowManagementService, useValue: mockMgmt },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WorkflowAiAssistService, useValue: mockAiAssist },
        { provide: WorkflowGeneratorService, useValue: mockGenerator },
      ],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
