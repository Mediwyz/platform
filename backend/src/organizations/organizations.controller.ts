import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  // ─── Public search / browse ─────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search and browse healthcare entities (public)' })
  async findAll(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.organizationsService.findAll({
      q,
      type,
      city,
      country,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { success: true, data: result };
  }

  // ─── My organisations (owned + member-of) ──────────────────────────────
  // MUST be declared before `@Get(':id')` or the literal path is captured by
  // the `:id` param route.

  @Get('mine')
  @ApiOperation({ summary: "List the current user's organisations (owned + member-of)" })
  async myOrganisations(@CurrentUser() user: JwtPayload) {
    const data = await this.organizationsService.getMyOrganisations(user.sub);
    return { success: true, data };
  }

  // Whether the user owns a pharmacy / health-shop org (gates the inventory UI).
  @Get('inventory-capability')
  async inventoryCapability(@CurrentUser() user: JwtPayload) {
    const hasPharmacy = await this.organizationsService.ownsInventoryOrg(user.sub);
    return { success: true, data: { hasPharmacy } };
  }

  // ─── Create a new healthcare entity ────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new healthcare entity (organization, hospital, etc.)' })
  async create(
    @Body()
    body: {
      name: string;
      type: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
      website?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.create(user.sub, body);
    return { success: true, data };
  }

  // ─── Get invitation info (public — needed to show entity name before login) ─

  @Public()
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Get invitation details by token (public)' })
  async getInvitation(@Param('token') token: string) {
    const data = await this.organizationsService.getInvitation(token);
    return { success: true, data };
  }

  // ─── Accept an invitation ──────────────────────────────────────────────

  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a workplace invitation' })
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.acceptInvitation(token, user.sub);
    return { success: true, data };
  }

  // ─── Get single entity (public) ────────────────────────────────────────

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single healthcare entity with active members' })
  async findOne(@Param('id') id: string) {
    const data = await this.organizationsService.findOne(id);
    return { success: true, data };
  }

  // ─── Update entity (founder only) ─────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a healthcare entity (founder only)' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      type?: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
      website?: string;
      latitude?: number;
      longitude?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.update(id, user.sub, body);
    return { success: true, data };
  }

  // ─── Upload logo (founder only) ────────────────────────────────────────

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload or set entity logo (founder only). Pass base64 or URL in logoData.' })
  async uploadLogo(
    @Param('id') id: string,
    @Body() body: { logoData: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!body.logoData) {
      return { success: false, message: 'logoData is required' };
    }
    const data = await this.organizationsService.uploadLogo(id, user.sub, body.logoData);
    return { success: true, data };
  }

  // ─── Get members ───────────────────────────────────────────────────────
  // Public call → only active members visible.
  // Authenticated founder → all statuses visible.

  @Public()
  @Get(':id/members')
  @ApiOperation({ summary: 'Get entity members. Founders see all statuses; public sees active only.' })
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    const data = await this.organizationsService.getMembers(id, user?.sub);
    return { success: true, data };
  }

  // ─── List pending invitations (founder only) ──────────────────────────

  @Get(':id/invitations')
  @ApiOperation({ summary: 'List pending invitations for this entity (founder only)' })
  async getInvitations(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.getInvitations(id, user.sub);
    return { success: true, data };
  }

  // ─── Invite a member (founder only) ───────────────────────────────────

  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a provider to join this entity by email (founder only)' })
  async inviteMember(
    @Param('id') id: string,
    @Body() body: { email: string; suggestedRole?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    if (!body.email) {
      return { success: false, message: 'email is required' };
    }
    const data = await this.organizationsService.inviteMember(id, user.sub, body);
    return { success: true, data };
  }

  // ─── Approve a pending member (founder only) ───────────────────────────

  @Post(':id/members/:workplaceId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending membership request (founder only)' })
  async approveMember(
    @Param('id') id: string,
    @Param('workplaceId') workplaceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.approveMember(id, user.sub, workplaceId);
    return { success: true, data };
  }

  // ─── Reject a pending member (founder only) ────────────────────────────

  @Post(':id/members/:workplaceId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending membership request (founder only)' })
  async rejectMember(
    @Param('id') id: string,
    @Param('workplaceId') workplaceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.rejectMember(id, user.sub, workplaceId);
    return { success: true, data };
  }

  // ─── Remove / deactivate a member (founder only) ───────────────────────

  @Delete(':id/members/:workplaceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the entity (founder only). Cannot remove founder.' })
  async removeMember(
    @Param('id') id: string,
    @Param('workplaceId') workplaceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.removeMember(id, user.sub, workplaceId);
    return { success: true, data };
  }

  // ─── Request to join (authenticated provider) ──────────────────────────

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request to join a healthcare entity as a provider' })
  async requestToJoin(
    @Param('id') id: string,
    @Body() body: { role?: string; isPrimary?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.organizationsService.requestToJoin(id, user.sub, body);
    return { success: true, data };
  }

  // ─── Providers + services for booking flow (public) ───────────────────

  @Public()
  @Get(':id/providers-services')
  @ApiOperation({ summary: 'Get all active providers and their bookable services for this entity (public)' })
  async getProvidersServices(@Param('id') id: string) {
    const data = await this.organizationsService.getProvidersServices(id);
    return { success: true, data };
  }
}
