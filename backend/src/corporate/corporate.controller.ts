import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CorporateService } from './corporate.service';
import { PreAuthorizationService } from './pre-authorization.service';
import { ReceiptOcrService } from './receipt-ocr.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { CreateCompanyDto } from './dto/create-company.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { ManageMemberDto } from './dto/manage-member.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@ApiTags('Corporate')
@Controller('corporate')
export class CorporateController {
  constructor(
    private corporateService: CorporateService,
    private preAuth: PreAuthorizationService,
    private ocr: ReceiptOcrService,
  ) {}

  /** GET /api/corporate/capability — does the current user have corporate-admin capability? */
  @Get('capability')
  async capability(@CurrentUser() user: JwtPayload) {
    const has = await this.corporateService.userHasCorporateCapability(user.sub);
    return { success: true, data: { hasCapability: has } };
  }

  /** GET /api/corporate/insurance-capability — owns an insurance company? */
  @Get('insurance-capability')
  async insuranceCapability(@CurrentUser() user: JwtPayload) {
    const has = await this.corporateService.userHasInsuranceCapability(user.sub);
    return { success: true, data: { hasCapability: has } };
  }

  // ─── Insurance company flows ────────────────────────────────────────────

  /** GET /api/corporate/insurance-companies?q= — legacy alias, insurance only. */
  @Public()
  @Get('insurance-companies')
  async searchInsurance(@Query('q') q?: string) {
    const data = await this.corporateService.searchInsuranceCompanies(q);
    return { success: true, data };
  }

  /** GET /api/corporate/companies?q=&type=all|insurance|corporate — all company partners. */
  @Public()
  @Get('companies')
  async searchCompanies(@Query('q') q?: string, @Query('type') type?: string) {
    const data = await this.corporateService.searchAllCompanies(q, type);
    return { success: true, data };
  }

  /** POST /api/corporate/insurance/:id/join — join + pay first month. */
  @Post('insurance/:id/join')
  async joinInsurance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.joinInsuranceCompany(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to join' };
    }
  }

  /** POST /api/corporate/insurance/:id/contribute — pay this month's amount. */
  @Post('insurance/:id/contribute')
  async contribute(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.contributeToInsurance(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to contribute' };
    }
  }

  /** GET /api/corporate/insurance/members — owner view: per-member payment status. */
  @Get('insurance/members')
  async insuranceMembersStatus(@CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getInsuranceMembersStatus(user.sub);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** GET /api/corporate/analytics — owner view: usage + spend + consumption */
  @Get('analytics')
  async analytics(@CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getCompanyAnalytics(user.sub);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/companies/:id/transfer — owner hands the company to another user */
  @Post('companies/:id/transfer')
  async transferCompany(
    @Param('id') id: string,
    @Body() body: { newOwnerEmail: string },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.corporateService.transferCompany(user.sub, id, body.newOwnerEmail);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Transfer failed' };
    }
  }

  /** DELETE /api/corporate/companies/:id — owner deletes company (members soft-removed) */
  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.deleteCompany(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  // ─── Insurance claim submissions ─────────────────────────────────────

  /** POST /api/corporate/insurance/claims — member files a claim */
  @Post('insurance/claims')
  async submitClaim(
    @Body() body: { companyProfileId: string; description: string; amount: number; receiptUrl?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.corporateService.submitInsuranceClaim(user.sub, body);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to submit claim' };
    }
  }

  /** GET /api/corporate/insurance/claims — dual view:
   *  owner returns claims for their company; member returns their own claims. */
  @Get('insurance/claims')
  async listClaims(@CurrentUser() user: JwtPayload, @Query('as') as?: string) {
    try {
      if (as === 'owner') {
        const data = await this.corporateService.listClaimsForCompany(user.sub);
        return { success: true, data };
      }
      const data = await this.corporateService.listClaimsForMember(user.sub);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/insurance/claims/:id/approve — owner approves + pays out */
  @Post('insurance/claims/:id/approve')
  async approveClaim(
    @Param('id') id: string,
    @Body() body: { reviewerNote?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.corporateService.approveClaim(user.sub, id, body.reviewerNote);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to approve' };
    }
  }

  /** POST /api/corporate/insurance/claims/ocr — extract fields from a receipt image */
  @Post('insurance/claims/ocr')
  async ocrReceipt(@Body() body: { imageUrl: string }) {
    try {
      const data = await this.ocr.extractFromUrl(body?.imageUrl);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'OCR failed' };
    }
  }

  /** GET /api/corporate/insurance/claims/:id/fraud-signals — owner reviews risk */
  @Get('insurance/claims/:id/fraud-signals')
  async claimFraudSignals(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getClaimFraudSignals(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** GET /api/corporate/insurance/dashboard — KPIs for insurance owner */
  @Get('insurance/dashboard')
  async insuranceDashboard(@CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getInsuranceDashboard(user.sub);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/insurance/claims/:id/deny — owner declines */
  @Post('insurance/claims/:id/deny')
  async denyClaim(
    @Param('id') id: string,
    @Body() body: { reviewerNote?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.corporateService.denyClaim(user.sub, id, body.reviewerNote);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed to deny' };
    }
  }

  // ─── Pre-authorization (tiers payant) ──────────────────────────────────

  /** POST /api/corporate/insurance/pre-auth — provider requests pre-authorization */
  @Post('insurance/pre-auth')
  async requestPreAuth(
    @Body() body: {
      memberId?: string;
      memberEmail?: string;
      companyProfileId: string;
      serviceCode?: string;
      category?: string;
      description: string;
      requestedAmount: number;
      expiresInDays?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.preAuth.requestPreAuth(user.sub, body);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** GET /api/corporate/insurance/pre-auth?as=owner|provider|member */
  @Get('insurance/pre-auth')
  async listPreAuths(@Query('as') as: string, @CurrentUser() user: JwtPayload) {
    try {
      const view = as === 'owner' || as === 'provider' ? as : 'member';
      const data = await this.preAuth.list(user.sub, view);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/insurance/pre-auth/:id/approve — owner approves */
  @Post('insurance/pre-auth/:id/approve')
  async approvePreAuth(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.preAuth.approvePreAuth(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/insurance/pre-auth/:id/deny — owner denies */
  @Post('insurance/pre-auth/:id/deny')
  async denyPreAuth(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const data = await this.preAuth.denyPreAuth(user.sub, id, body?.reason);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** POST /api/corporate/insurance/pre-auth/:id/use — provider marks as delivered (triggers direct billing) */
  @Post('insurance/pre-auth/:id/use')
  async usePreAuth(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.preAuth.usePreAuth(user.sub, id);
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Failed' };
    }
  }

  /** GET /api/corporate/companies — list companies for signup enrollment */
  @Public()
  @Get('companies')
  async companies() {
    const data = await this.corporateService.getCompanies();
    return { success: true, data };
  }

  /** POST /api/corporate/companies — create or update a company */
  @Post('companies')
  async createCompany(@Body() dto: CreateCompanyDto, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.createCompany(user.sub, dto);
      return { success: true, data };
    } catch (error) {
      console.error('POST /corporate/companies error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal server error' };
    }
  }

  /** POST /api/corporate/accept — employee accepts pending invitation */
  @Post('accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.acceptInvitation(user.sub, dto.invitationId);
      return { success: true, data };
    } catch (error) {
      console.error('POST /corporate/accept error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal server error' };
    }
  }

  /** GET /api/corporate/my-companies — companies the current user belongs to as employee */
  @Get('my-companies')
  async myCompanies(@CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getMyCompanies(user.sub);
      return { success: true, data };
    } catch (error) {
      console.error('GET /corporate/my-companies error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  /** GET /api/corporate/owned — companies the current user OWNS (insurance + generic). */
  @Get('owned')
  async owned(@CurrentUser() user: JwtPayload) {
    try {
      return { success: true, data: await this.corporateService.getOwnedCompanies(user.sub) };
    } catch (error) {
      console.error('GET /corporate/owned error:', error);
      return { success: false, data: [] };
    }
  }

  /** GET /api/corporate/enroll — preview enrollment */
  @Get('enroll')
  async preview(@CurrentUser() user: JwtPayload, @Query('planId') planId: string) {
    const data = await this.corporateService.getEnrollmentPreview(user.sub, planId);
    return { success: true, data };
  }

  /** POST /api/corporate/enroll — enroll employees in plan */
  // Employee-side enrollment action from notification — accept or decline.
  @Post('enrollment/:action')
  async enrollmentAction(
    @Param('action') action: string,
    @Body() body: { notificationId?: string; companyId?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const handled = ['accept', 'decline'].includes(action);
    return {
      success: handled,
      action,
      message: handled ? `Enrollment ${action}ed` : 'Unknown action',
      data: { notificationId: body?.notificationId, companyId: body?.companyId, userId: user?.sub },
    };
  }

  @Post('enroll')
  async enroll(@Body() body: { planId: string }, @CurrentUser() user: JwtPayload) {
    try {
      const result = await this.corporateService.enrollEmployees(user.sub, body.planId);
      if (!result) return { success: false, message: 'Plan not found' };
      return { success: true, data: result };
    } catch (error) {
      console.error('POST /corporate/enroll error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal server error' };
    }
  }

  // ── GET /corporate/:id/dashboard — corporate admin dashboard ──────────────
  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    try {
      const data = await this.corporateService.getDashboard(id);
      return { success: true, data };
    } catch (error) {
      console.error('GET /corporate/:id/dashboard error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  // ── GET /corporate/:id/employees — list active employees ──────────────────
  @Get(':id/employees')
  async getEmployees(@Param('id') id: string) {
    try {
      const data = await this.corporateService.getEmployees(id);
      return { success: true, data, total: data.length };
    } catch (error) {
      console.error('GET /corporate/:id/employees error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  // ── GET /corporate/:id/members — all enrollments (any status) ─────────────
  @Get(':id/members')
  async getMembers(@Param('id') id: string) {
    try {
      const data = await this.corporateService.getMembers(id);
      return { success: true, data };
    } catch (error) {
      console.error('GET /corporate/:id/members error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  // ── POST /corporate/:adminId/members — invite employee by email ───────────
  @Post(':adminId/members')
  async inviteMember(@Param('adminId') adminId: string, @Body() dto: InviteMemberDto, @CurrentUser() user: JwtPayload) {
    try {
      // Ensure the current user is the admin for this route
      if (user.sub !== adminId) {
        return { success: false, message: 'Unauthorized' };
      }
      const data = await this.corporateService.inviteMember(adminId, dto.email);
      return { success: true, data };
    } catch (error) {
      console.error('POST /corporate/:adminId/members error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal server error' };
    }
  }

  // ── PATCH /corporate/:adminId/members — approve/reject/remove member ──────
  @Patch(':adminId/members')
  async manageMember(@Param('adminId') adminId: string, @Body() dto: ManageMemberDto, @CurrentUser() user: JwtPayload) {
    try {
      if (user.sub !== adminId) {
        return { success: false, message: 'Unauthorized' };
      }
      const data = await this.corporateService.manageMember(adminId, dto);
      return { success: true, data };
    } catch (error) {
      console.error('PATCH /corporate/:adminId/members error:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Internal server error' };
    }
  }

  /** GET /api/corporate/:id/claims — corporate insurance claims */
  @Get(':id/claims')
  async getClaims(@Param('id') id: string) {
    try {
      const data = await this.corporateService.getClaims(id);
      return { success: true, data };
    } catch (error) {
      console.error('GET /corporate/:id/claims error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }
}
