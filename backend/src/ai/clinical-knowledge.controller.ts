import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClinicalKnowledgeService } from './clinical-knowledge.service';

@ApiTags('Admin — Clinical Knowledge')
@UseGuards(AdminGuard)
@Controller('admin/clinical-knowledge')
export class ClinicalKnowledgeController {
  constructor(private readonly ckService: ClinicalKnowledgeService) {}

  @Get()
  async list() {
    return { success: true, data: await this.ckService.listAll() };
  }

  @Post()
  async create(@Body() body: {
    conditionKey: string; aliases?: string[]; dietaryGuidance: string;
    category?: string; sources?: string[]; active?: boolean;
  }) {
    try {
      return { success: true, data: await this.ckService.create(body) };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to create entry' };
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Partial<{
    conditionKey: string; aliases: string[]; dietaryGuidance: string;
    category: string; sources: string[]; active: boolean;
  }>) {
    return { success: true, data: await this.ckService.update(id, body) };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ckService.remove(id);
    return { success: true, data: { id } };
  }
}
