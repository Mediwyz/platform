import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WorkflowTemplateRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.workflowTemplate.findUnique({ where: { id } });
  }

  async findMany(filters: {
    providerType?: string; serviceMode?: string; isDefault?: boolean;
    isActive?: boolean; platformServiceId?: string;
    createdByProviderId?: string; createdByAdminId?: string; regionCode?: string;
  }) {
    return this.prisma.workflowTemplate.findMany({
      where: {
        providerType: filters.providerType,
        serviceMode: filters.serviceMode,
        isDefault: filters.isDefault,
        isActive: filters.isActive ?? true,
        platformServiceId: filters.platformServiceId,
        createdByProviderId: filters.createdByProviderId,
        createdByAdminId: filters.createdByAdminId,
        regionCode: filters.regionCode,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    name: string; slug: string; description?: string; providerType: string;
    serviceMode: string; isDefault?: boolean; isDraft?: boolean; createdByProviderId?: string;
    createdByAdminId?: string; regionCode?: string; platformServiceId?: string;
    paymentTiming?: string; steps: any; transitions: any;
  }) {
    return this.prisma.workflowTemplate.create({ data: { isDraft: true, ...data } });
  }

  async update(id: string, data: Partial<{
    name: string; description: string; isActive: boolean; isDraft: boolean;
    steps: any; transitions: any; platformServiceId: string | null;
    [key: string]: any;
  }>) {
    return this.prisma.workflowTemplate.update({ where: { id }, data });
  }

  async publish(id: string) {
    return this.prisma.workflowTemplate.update({ where: { id }, data: { isDraft: false, isActive: true } });
  }

  async countActiveInstances(templateId: string) {
    return this.prisma.workflowInstance.count({
      where: { templateId, completedAt: null, cancelledAt: null },
    });
  }

  async deactivate(id: string) {
    return this.prisma.workflowTemplate.update({ where: { id }, data: { isActive: false } });
  }
}
