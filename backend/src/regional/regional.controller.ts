import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionalService } from './regional.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('Regional Admin')
@Controller('regional')
@UseGuards(AdminGuard)
export class RegionalController {
  constructor(private regionalService: RegionalService) {}

  /** GET /api/regional/subscriptions — regional admin's plans */
  @Get('subscriptions')
  async listPlans(@CurrentUser() user: JwtPayload) {
    const countryCode = await this.regionalService.getCountryCode(user.sub);
    const plans = await this.regionalService.listPlans(countryCode);
    return { success: true, data: plans };
  }

  /** POST /api/regional/subscriptions — create plan */
  @Post('subscriptions')
  async createPlan(@Body() dto: CreatePlanDto, @CurrentUser() user: JwtPayload) {
    const countryCode = await this.regionalService.getCountryCode(user.sub);
    const plan = await this.regionalService.createPlan(dto, countryCode, user.sub);
    return { success: true, data: plan };
  }

  /** PATCH /api/regional/subscriptions/:id */
  @Patch('subscriptions/:id')
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const plan = await this.regionalService.updatePlan(id, dto);
    return { success: true, data: plan };
  }

  /** GET /api/regional/service-groups */
  @Get('service-groups')
  async listServiceGroups(@CurrentUser() user: JwtPayload) {
    const countryCode = await this.regionalService.getCountryCode(user.sub);
    const groups = await this.regionalService.listServiceGroups(countryCode);
    return { success: true, data: groups };
  }

  /** GET /api/regional/roles — provider roles for this region */
  @Get('roles')
  async listRoles(@CurrentUser() user: JwtPayload) {
    const countryCode = await this.regionalService.getCountryCode(user.sub);
    const roles = await this.regionalService.listRoles(countryCode);
    return { success: true, data: roles };
  }

  /** POST /api/regional/roles — create provider role */
  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: JwtPayload) {
    try {
      const countryCode = await this.regionalService.getCountryCode(user.sub);
      const role = await this.regionalService.createRole(dto, countryCode);
      return { success: true, data: role };
    } catch (e) { return { success: false, message: 'Failed to create role' }; }
  }

  /** PATCH /api/regional/roles/:id — update provider role */
  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    try {
      const role = await this.regionalService.updateRole(id, dto);
      return { success: true, data: role };
    } catch { return { success: false, message: 'Failed to update role' }; }
  }

  /** DELETE /api/regional/roles/:id — deactivate provider role */
  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    try {
      await this.regionalService.deactivateRole(id);
      return { success: true, message: 'Role deactivated' };
    } catch { return { success: false, message: 'Failed to deactivate role' }; }
  }

  // ── Organisation categories (pharmacy / clinic / hospital / lab / insurance …) ──

  /** GET /api/regional/org-categories */
  @Get('org-categories')
  async listOrgCategories() {
    const cats = await this.regionalService.listOrgCategories();
    return { success: true, data: cats };
  }

  /** POST /api/regional/org-categories */
  @Post('org-categories')
  async createOrgCategory(@Body() body: any) {
    try {
      const cat = await this.regionalService.createOrgCategory(body);
      return { success: true, data: cat };
    } catch { return { success: false, message: 'Failed to create category' }; }
  }

  /** PATCH /api/regional/org-categories/:id */
  @Patch('org-categories/:id')
  async updateOrgCategory(@Param('id') id: string, @Body() body: any) {
    try {
      const cat = await this.regionalService.updateOrgCategory(id, body);
      return { success: true, data: cat };
    } catch { return { success: false, message: 'Failed to update category' }; }
  }

  /** DELETE /api/regional/org-categories/:id — deactivate */
  @Delete('org-categories/:id')
  async deleteOrgCategory(@Param('id') id: string) {
    try {
      await this.regionalService.deactivateOrgCategory(id);
      return { success: true, message: 'Category deactivated' };
    } catch { return { success: false, message: 'Failed to deactivate category' }; }
  }
}
