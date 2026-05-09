import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateCustomServiceDto } from './dto/create-custom-service.dto';
import { UpdateServiceConfigDto } from './dto/update-service-config.dto';
import { CreatePlatformServiceDto } from './dto/create-platform-service.dto';
import { UpdatePlatformServiceDto } from './dto/update-platform-service.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public() @Get('catalog')
  async catalog(@Query('providerType') providerType?: string, @Query('countryCode') countryCode?: string) {
    const data = await this.servicesService.getCatalog(providerType, countryCode);
    return { success: true, data };
  }

  @Public() @Get('provider/:userId')
  async providerServices(@Param('userId') userId: string) {
    const data = await this.servicesService.getProviderPublicServices(userId);
    return { success: true, data };
  }

  @Get('my-services')
  async myServices(@CurrentUser() user: JwtPayload) {
    const data = await this.servicesService.getMyServices(user.sub);
    return { success: true, data };
  }

  @Post('my-services/add')
  async addMyService(
    @Body() body: { platformServiceId: string; priceOverride?: number; workflowTemplateIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.servicesService.addMyService(user.sub, body);
    return { success: true, data };
  }

  @Delete('my-services/:platformServiceId')
  async removeMyService(
    @Param('platformServiceId') platformServiceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.servicesService.removeMyService(user.sub, platformServiceId);
    return { success: true, message: 'Service removed from your offerings' };
  }

  @Patch('my-services/:platformServiceId/workflows')
  async updateServiceWorkflows(
    @Param('platformServiceId') platformServiceId: string,
    @Body() body: { workflowTemplateIds: string[] },
    @CurrentUser() user: JwtPayload,
  ) {
    await this.servicesService.updateServiceWorkflows(user.sub, platformServiceId, body.workflowTemplateIds);
    return { success: true, message: 'Workflow templates updated' };
  }

  @Patch('my-services')
  async updateMyService(@Body() body: UpdateServiceConfigDto, @CurrentUser() user: JwtPayload) {
    const data = await this.servicesService.updateMyService(user.sub, body);
    return { success: true, data };
  }

  @Post('custom')
  async createCustom(@Body() body: CreateCustomServiceDto, @CurrentUser() user: JwtPayload) {
    const data = await this.servicesService.createCustomService(user.sub, body);
    return { success: true, data };
  }

  @Patch('custom/:id')
  async updateCustom(@Param('id') id: string, @Body() body: CreateCustomServiceDto, @CurrentUser() user: JwtPayload) {
    const data = await this.servicesService.updateCustomService(user.sub, id, body);
    return { success: true, data };
  }

  @Delete('custom/:id')
  async deleteCustom(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.servicesService.deleteCustomService(user.sub, id);
    return { success: true, message: 'Service removed' };
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  @UseGuards(AdminGuard) @Get('admin')
  async adminList(@Query('providerType') providerType?: string, @Query('countryCode') countryCode?: string) {
    const data = await this.servicesService.adminList(providerType, countryCode);
    return { success: true, data };
  }

  @UseGuards(AdminGuard) @Post('admin')
  async adminCreate(@Body() dto: CreatePlatformServiceDto) {
    const data = await this.servicesService.adminCreate(dto);
    return { success: true, data };
  }

  @UseGuards(AdminGuard) @Get('admin/:id')
  async adminGet(@Param('id') id: string) {
    const data = await this.servicesService.adminGet(id);
    return { success: true, data };
  }

  @UseGuards(AdminGuard) @Patch('admin/:id')
  async adminUpdate(@Param('id') id: string, @Body() dto: UpdatePlatformServiceDto) {
    const data = await this.servicesService.adminUpdate(id, dto);
    return { success: true, data };
  }

  @UseGuards(AdminGuard) @Delete('admin/:id')
  async adminDelete(@Param('id') id: string) {
    await this.servicesService.adminDelete(id);
    return { success: true, message: 'Service deactivated' };
  }
}
