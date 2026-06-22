import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Public } from '../auth/decorators/public.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtPayload } from '../auth/jwt.strategy';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles & Specialties')
@Controller()
export class RolesController {
  constructor(private rolesService: RolesService) {}

  // ─── Public: GET /api/roles ────────────────────────────────────────────

  @Public()
  @Get('roles')
  async findAll(
    @Query('searchEnabled') searchEnabled?: string,
    @Query('isProvider') isProvider?: string,
    @Query('all') all?: string,
    @Query('includeLegacy') includeLegacy?: string,
    // `regionCode` scopes to a specific region + global (null-region) roles.
    // The sidebar dynamic search hook passes the logged-in user's region so
    // the "Find X" list stays in sync with the regional admin's CRUD view.
    @Query('regionCode') regionCode?: string,
  ) {
    const data = await this.rolesService.findAll({
      searchOnly: searchEnabled === 'true',
      providerOnly: isProvider === 'true',
      includeAll: all === 'true',
      includeLegacy: includeLegacy === 'true',
      regionCode: regionCode || undefined,
    });
    return { success: true, data };
  }

  /** Public: GET /api/org-categories — active organisation categories (for org forms/filters). */
  @Public()
  @Get('org-categories')
  async orgCategories() {
    const data = await this.rolesService.getOrgCategories();
    return { success: true, data };
  }

  /**
   * POST /api/roles/request — open to unauthenticated signup requests.
   * Creates a ProviderRole in `isActive: false` state (pending admin review)
   * so legit use-cases don't wait, and spam doesn't pollute public pickers.
   * Returns the created row so the signup form can continue with the
   * pending role id attached to the new user.
   */
  @Public()
  @Post('roles/request')
  @HttpCode(HttpStatus.CREATED)
  async requestRole(@Body() body: {
    label: string; singularLabel?: string; description?: string; regionCode?: string;
  }) {
    const role = await this.rolesService.requestRole(body);
    return { success: true, data: role, message: 'Role request submitted. Awaiting regional admin review.' };
  }

  /**
   * POST /api/roles/:id/activate — regional admins approve pending role
   * requests. After activation the role is visible in public pickers and
   * patients can book against its providers.
   */
  @Post('roles/:id/activate')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async activateRole(@Param('id') id: string, @CurrentUser() admin: JwtPayload) {
    const role = await this.rolesService.activateRole(id, admin.sub);
    return { success: true, data: role };
  }

  // ─── Public: GET /api/role-config/:userType ────────────────────────────

  @Public()
  @Get('role-config/:userType')
  async getFeatureConfig(@Param('userType') userType: string) {
    const data = await this.rolesService.getFeatureConfig(userType);
    return { success: true, data };
  }

  // ─── Admin: GET /api/admin/role-config ─────────────────────────────────

  @Get('admin/role-config')
  @UseGuards(AdminGuard)
  async getAllFeatureConfigs() {
    const { grouped, raw } = await this.rolesService.getAllFeatureConfigs();
    return { success: true, data: grouped, raw };
  }

  // ─── Admin: PUT /api/admin/role-config ─────────────────────────────────

  @Put('admin/role-config')
  @UseGuards(AdminGuard)
  async upsertFeatureConfigs(@Body() body: { configs: Array<{ userType: string; featureKey: string; enabled: boolean }> }) {
    const data = await this.rolesService.upsertFeatureConfigs(body.configs);
    return { success: true, data };
  }

  // ─── Public: GET /api/specialties ──────────────────────────────────────

  @Public()
  @Get('specialties')
  async findSpecialties(@Query('providerType') providerType?: string) {
    const data = await this.rolesService.findSpecialties(providerType);
    return { success: true, data };
  }

  // ─── Admin: POST /api/specialties ──────────────────────────────────────

  @Post('specialties')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSpecialty(@Body() body: { providerType: string; name: string; description?: string; icon?: string }) {
    const data = await this.rolesService.createSpecialty(body);
    return { success: true, data };
  }

  // ─── Admin: PATCH /api/specialties/:id ─────────────────────────────────

  @Patch('specialties/:id')
  @UseGuards(AdminGuard)
  async updateSpecialty(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isActive?: boolean; icon?: string },
  ) {
    const data = await this.rolesService.updateSpecialty(id, body);
    return { success: true, data };
  }

  // ─── Admin: DELETE /api/specialties/:id ────────────────────────────────

  @Delete('specialties/:id')
  @UseGuards(AdminGuard)
  async deactivateSpecialty(@Param('id') id: string) {
    await this.rolesService.deactivateSpecialty(id);
    return { success: true, message: 'Specialty deactivated' };
  }
}
