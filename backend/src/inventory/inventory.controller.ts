import { Controller, Get, Post, Patch, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Inventory')
@Controller()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // ─── Provider's inventory ──────────────────────────────────────────────

  @Get('inventory')
  async getItems(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.getItems(user.sub) };
  }

  @Post('inventory')
  @HttpCode(HttpStatus.CREATED)
  async createItem(@Body() body: CreateInventoryItemDto, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.createItem(user.sub, user.userType.toUpperCase(), body) };
  }

  @Patch('inventory/:id')
  async updateItem(@Param('id') id: string, @Body() body: UpdateInventoryItemDto, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.updateItem(id, user.sub, body) };
  }

  @Delete('inventory/:id')
  async deactivateItem(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.inventoryService.deactivateItem(id, user.sub);
    return { success: true, message: 'Item deactivated' };
  }

  // ─── Entity-scoped inventory (org founder manages a pharmacy's stock) ────

  @Get('organizations/:entityId/inventory')
  async getEntityItems(@Param('entityId') entityId: string, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.getEntityItems(entityId, user.sub) };
  }

  @Post('organizations/:entityId/inventory')
  @HttpCode(HttpStatus.CREATED)
  async createEntityItem(@Param('entityId') entityId: string, @Body() body: CreateInventoryItemDto, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.createEntityItem(entityId, user.sub, user.userType.toUpperCase(), body) };
  }

  @Patch('organizations/:entityId/inventory/:id')
  async updateEntityItem(@Param('entityId') entityId: string, @Param('id') id: string, @Body() body: UpdateInventoryItemDto, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.updateEntityItem(entityId, id, user.sub, body) };
  }

  @Delete('organizations/:entityId/inventory/:id')
  async deleteEntityItem(@Param('entityId') entityId: string, @Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.inventoryService.deleteEntityItem(entityId, id, user.sub);
    return { success: true, message: 'Item removed' };
  }

  // ─── Orders ────────────────────────────────────────────────────────────

  @Get('inventory/orders')
  async getOrders(@CurrentUser() user: JwtPayload, @Query('role') role?: string) {
    const r = (role === 'provider' ? 'provider' : 'patient') as 'patient' | 'provider';
    return { success: true, data: await this.inventoryService.getOrders(user.sub, r) };
  }

  @Post('inventory/orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() body: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.createOrder(user.sub, body) };
  }

  @Patch('inventory/orders/:id')
  async updateOrderStatus(@Param('id') id: string, @Body() body: { status: string }, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.inventoryService.updateOrderStatus(id, user.sub, body.status) };
  }

  // ─── Health Shop (public search) ───────────────────────────────────────

  @Public()
  @Get('search/health-shop')
  async searchShop(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('providerType') providerType?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('userId') userId?: string,
  ) {
    const result = await this.inventoryService.searchShop({
      query: q, category, providerType,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      userId,
    });
    return { success: true, data: result.items, total: result.total };
  }
}
