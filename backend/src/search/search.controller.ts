import { Controller, Get, Post, Query, Body, ForbiddenException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public() @Get('available-slots')
  async getAvailableSlots(@Query('date') date?: string, @Query('roleCode') roleCode?: string) {
    if (!date || !roleCode) return { success: false, message: 'date and roleCode are required' };
    try {
      const data = await this.searchService.getAvailableSlots(date, roleCode);
      return { success: true, data };
    } catch {
      return { success: true, data: { slots: [], providerCount: 0 } };
    }
  }

  @Public() @Get('providers')
  async searchProviders(
    @Query('type') type: string, @Query('q') q?: string,
    @Query('page') page?: string, @Query('limit') limit?: string,
    @Query('specialty') specialty?: string,
    @Query('serviceId') serviceId?: string,
    @Query('entityId') entityId?: string,
  ) {
    const result = await this.searchService.searchProviders(
      type, q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined, specialty, serviceId, entityId,
    );
    return { success: true, ...result };
  }

  @Public() @Get('organisations')
  async searchOrganisations(
    @Query('type') type?: string, @Query('q') q?: string,
    @Query('specialty') specialty?: string, @Query('serviceId') serviceId?: string,
  ) {
    const result = await this.searchService.searchOrganisations(type, q, specialty, serviceId);
    return { success: true, ...result };
  }

  // ── Natural-language (RAG) provider search ──────────────────────────────
  @Public() @Post('semantic')
  async semantic(@Body() body: { query?: string }) {
    const data = await this.searchService.semanticSearch((body?.query || '').trim());
    return { success: true, ...data };
  }

  // Admin-only: (re)embed every provider with Gemini. Run after providers change.
  @Post('embeddings/rebuild')
  async rebuildEmbeddings(@CurrentUser() user: JwtPayload) {
    if (!['admin', 'regional-admin'].includes(user.userType)) {
      throw new ForbiddenException('Admins only');
    }
    const data = await this.searchService.rebuildEmbeddings();
    return { success: true, ...data };
  }

  // ── Backward-compat aliases — delegate to generic searchProviders ──────────

  @Public() @Get('doctors')
  async searchDoctors(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('specialty') specialty?: string) {
    const query = specialty ? `${q || ''} ${specialty}`.trim() || undefined : q;
    const result = await this.searchService.searchProviders('DOCTOR', query, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
    return { success: true, ...result };
  }

  @Public() @Get('nurses')
  async searchNurses(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.searchService.searchProviders('NURSE', q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
    return { success: true, ...result };
  }

  @Public() @Get('nannies')
  async searchNannies(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.searchService.searchProviders('NANNY', q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
    return { success: true, ...result };
  }

  @Public() @Get('lab-tests')
  async searchLabTests(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.searchService.searchLabTests(q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
      return { success: true, ...result };
    } catch { return { success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 }; }
  }

  @Public() @Get('insurance')
  async searchInsurance(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.searchService.searchInsurance(q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
      return { success: true, ...result };
    } catch { return { success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 }; }
  }

  @Public() @Get('emergency')
  async searchEmergency(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.searchService.searchEmergency(q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
      return { success: true, ...result };
    } catch { return { success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 }; }
  }

  @Public() @Get('autocomplete')
  async autocomplete(@Query('q') q?: string, @Query('category') category?: string, @Query('limit') limit?: string) {
    try {
      if (!q || q.length < 2) return { success: true, data: [] };
      const data = await this.searchService.autocomplete(q, category, limit ? parseInt(limit) : undefined);
      return { success: true, data };
    } catch { return { success: true, data: [] }; }
  }

  @Public() @Get('services')
  async searchServices(
    @Query('q') q?: string,
    @Query('providerType') providerType?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const data = await this.searchService.searchServices(q, providerType, category, limit ? parseInt(limit) : undefined);
      return { success: true, data, total: data.length };
    } catch (error) {
      console.error('GET /search/services error:', error);
      return { success: false, data: [], message: 'Search failed' };
    }
  }

  @Public() @Get('organizations')
  async searchOrganizations(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.searchService.searchOrganizations(q, type, city, country, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
      return { success: true, ...result };
    } catch (error) {
      console.error('GET /search/organizations error:', error);
      return { success: false, data: [], message: 'Search failed' };
    }
  }

  @Public() @Get('medicines')
  async searchMedicines(@Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    try {
      const result = await this.searchService.searchMedicines(q, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
      return { success: true, ...result };
    } catch { return { success: true, data: [], total: 0, page: 1, limit: 20, totalPages: 0 }; }
  }
}
