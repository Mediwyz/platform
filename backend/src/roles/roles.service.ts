import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function codeify(value: string): string {
  return slugify(value).toUpperCase().replace(/-/g, '_');
}

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Request a new ProviderRole from the signup page. Creates the row with
   * `isActive: false` so it lands in the regional admin's review queue
   * before appearing in public role pickers. Anyone can submit; rate
   * limiting is handled at the controller level.
   *
   * This is the seam that keeps MediWyz truly open for new provider
   * categories — if an audiologist, osteopath, or homeopath wants to sign
   * up and no matching role exists, they propose one instead of being
   * blocked.
   */
  async requestRole(input: {
    label: string;
    singularLabel?: string;
    description?: string;
    regionCode?: string;
  }) {
    const rawLabel = input.label?.trim();
    if (!rawLabel || rawLabel.length < 3) {
      throw new BadRequestException('Role name must be at least 3 characters.');
    }

    const code = codeify(rawLabel);
    const slug = slugify(rawLabel);
    if (!code) throw new BadRequestException('Role name must contain letters.');

    const existing = await this.prisma.providerRole.findFirst({
      where: { OR: [{ code }, { slug }] },
    });
    if (existing) {
      throw new ConflictException(
        existing.isActive
          ? `A role with a similar name already exists: ${existing.label}`
          : `A role with this name is already pending review.`
      );
    }

    const role = await this.prisma.providerRole.create({
      data: {
        code,
        label: rawLabel.endsWith('s') ? rawLabel : `${rawLabel}s`,
        singularLabel: input.singularLabel?.trim() || rawLabel,
        slug,
        description: input.description?.trim() || null,
        regionCode: input.regionCode || null,
        urlPrefix: `/${slug.replace(/s$/, '')}`,
        cookieValue: slug.replace(/s$/, ''),
        // Pending — needs regional-admin activation before it's public.
        isActive: false,
        isProvider: true,
      },
    });
    return role;
  }

  /** Regional admin approves a pending role request. */
  async activateRole(id: string, adminUserId: string) {
    const role = await this.prisma.providerRole.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isActive) return role;
    return this.prisma.providerRole.update({
      where: { id },
      data: { isActive: true, createdByAdminId: adminUserId },
    });
  }

  // ─── GET /api/roles ────────────────────────────────────────────────────

  async findAll(opts: { searchOnly?: boolean; providerOnly?: boolean; includeAll?: boolean; includeLegacy?: boolean; regionCode?: string }) {
    // CORPORATE_ADMIN, INSURANCE_REP, and REFERRAL_PARTNER are capabilities,
    // not signup roles. Hide them from role pickers unless the caller
    // explicitly opts in (e.g. admin tools that need the full list).
    const legacyCapabilityCodes = ['CORPORATE_ADMIN', 'INSURANCE_REP', 'REFERRAL_PARTNER'];
    // When a regionCode is supplied, include BOTH roles scoped to that
    // region AND global roles (regionCode: null). This keeps the user's
    // sidebar "Find X" list synced with what their regional admin manages
    // in the Provider Roles CRUD page (the CRUD is region-scoped too).
    const regionFilter = opts.regionCode
      ? { OR: [{ regionCode: opts.regionCode }, { regionCode: null }] }
      : {};
    const rolesRaw = await this.prisma.providerRole.findMany({
      where: {
        ...(!opts.includeAll ? { isActive: true } : {}),
        ...(opts.searchOnly ? { searchEnabled: true } : {}),
        ...(opts.providerOnly ? { isProvider: true } : {}),
        ...(!opts.includeLegacy ? { code: { notIn: legacyCapabilityCodes } } : {}),
        ...regionFilter,
      },
      include: {
        verificationDocs: { orderBy: { displayOrder: 'asc' } },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Drop runtime-created test roles. Roles made via the admin "create role" tool
    // during testing carry a trailing millisecond timestamp in their code
    // (e.g. REFLEXOLOGIST_1777756939877, PLATEFORMTEST_1777758975585, TEST_ROLE_...).
    // Real roles use clean codes (DOCTOR, NURSE, ...). includeAll bypasses the filter
    // so admin CRUD can still see/clean them.
    const JUNK_CODE = /_\d{10,}$/;
    const roles = opts.includeAll
      ? rolesRaw
      : rolesRaw.filter(r => !JUNK_CODE.test(r.code) && !/^TEST_ROLE/i.test(r.code));

    // Provider counts per type
    const providerCounts = await this.prisma.user.groupBy({
      by: ['userType'],
      where: { accountStatus: 'active' },
      _count: true,
    });
    const countMap = new Map(providerCounts.map(c => [c.userType as string, c._count]));

    // Specialties per type
    const specialties = await this.prisma.providerSpecialty.findMany({
      where: { isActive: true },
      orderBy: [{ providerType: 'asc' }, { name: 'asc' }],
      // `icon` added — frontend ProviderMarketplace.tsx uses spec.icon for
      // custom DB-authored icons; without it, every specialty silently fell
      // back to the hardcoded emoji map, ignoring admin-configured icons.
      select: { providerType: true, name: true, description: true, icon: true },
    });
    const specMap = new Map<string, { name: string; description: string | null; icon: string | null }[]>();
    for (const s of specialties) {
      if (!specMap.has(s.providerType)) specMap.set(s.providerType, []);
      specMap.get(s.providerType)!.push({ name: s.name, description: s.description, icon: s.icon ?? null });
    }

    return roles.map(role => ({
      id: role.id,
      code: role.code,
      label: role.label,
      singularLabel: role.singularLabel,
      slug: role.slug,
      icon: role.icon,
      iconKey: (role as any).iconKey ?? null,
      color: role.color,
      cardImage: role.cardImage,
      description: role.description,
      searchEnabled: role.searchEnabled,
      bookingEnabled: role.bookingEnabled,
      inventoryEnabled: role.inventoryEnabled,
      isProvider: role.isProvider,
      isActive: role.isActive,
      displayOrder: role.displayOrder,
      urlPrefix: role.urlPrefix,
      cookieValue: role.cookieValue,
      searchPath: `/search/${role.slug}`,
      providerCount: countMap.get(role.code) ?? 0,
      specialties: specMap.get(role.code) ?? [],
      verificationDocs: role.verificationDocs,
      profileFields: (role as any).profileFields ?? null,
    }));
  }

  // ─── GET /api/role-config/:userType ────────────────────────────────────

  async getFeatureConfig(userType: string) {
    const configs = await this.prisma.roleFeatureConfig.findMany({
      where: { userType: userType.toUpperCase() },
      select: { featureKey: true, enabled: true },
    });

    if (configs.length === 0) {
      return { allEnabled: true, features: {} };
    }

    const features: Record<string, boolean> = {};
    for (const config of configs) {
      features[config.featureKey] = config.enabled;
    }

    return { allEnabled: false, features };
  }

  // ─── GET /api/admin/role-config (all configs grouped) ──────────────────

  async getAllFeatureConfigs() {
    const configs = await this.prisma.roleFeatureConfig.findMany({
      orderBy: [{ userType: 'asc' }, { featureKey: 'asc' }],
    });

    const grouped: Record<string, Record<string, boolean>> = {};
    for (const config of configs) {
      if (!grouped[config.userType]) grouped[config.userType] = {};
      grouped[config.userType][config.featureKey] = config.enabled;
    }

    return { grouped, raw: configs };
  }

  // ─── PUT /api/admin/role-config (bulk upsert) ──────────────────────────

  async upsertFeatureConfigs(configs: Array<{ userType: string; featureKey: string; enabled: boolean }>) {
    if (!Array.isArray(configs)) {
      throw new BadRequestException('configs must be an array');
    }

    return this.prisma.$transaction(
      configs.map(c =>
        this.prisma.roleFeatureConfig.upsert({
          where: { userType_featureKey: { userType: c.userType, featureKey: c.featureKey } },
          update: { enabled: c.enabled },
          create: { userType: c.userType, featureKey: c.featureKey, enabled: c.enabled },
        }),
      ),
    );
  }

  // ─── Specialties ───────────────────────────────────────────────────────

  /**
   * Find specialties — fully dynamic, queries ProviderSpecialty table only.
   * No hardcoded role-specific profile queries.
   *
   * Filters to specialties where at least one active provider of that type exists,
   * so the frontend doesn't show empty filter chips.
   */
  async findSpecialties(providerType?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (providerType) where.providerType = providerType.toUpperCase();

    const allSpecialties = await this.prisma.providerSpecialty.findMany({
      where,
      select: { id: true, providerType: true, name: true, description: true, isActive: true },
      orderBy: [{ providerType: 'asc' }, { name: 'asc' }],
    });

    // Check which provider types have active providers
    const activeCounts = await this.prisma.user.groupBy({
      by: ['userType'],
      where: { accountStatus: 'active' },
      _count: true,
    });
    const activeTypes = new Set(activeCounts.filter(c => c._count > 0).map(c => c.userType));

    // Only return specialties for provider types that have active providers
    return allSpecialties.filter(s => activeTypes.has(s.providerType));
  }

  async createSpecialty(data: { providerType: string; name: string; description?: string; icon?: string }) {
    const pt = data.providerType.toUpperCase();
    if (!data.name?.trim() || data.name.trim().length < 2) {
      throw new BadRequestException('name is required (min 2 characters)');
    }

    const existing = await this.prisma.providerSpecialty.findFirst({
      where: { providerType: pt as any, name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Specialty already exists for this provider type');
    }

    return this.prisma.providerSpecialty.create({
      data: {
        providerType: pt as any,
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
      select: { id: true, providerType: true, name: true, description: true, isActive: true },
    });
  }

  async updateSpecialty(id: string, data: { name?: string; description?: string; isActive?: boolean; icon?: string }) {
    const existing = await this.prisma.providerSpecialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Specialty not found');

    const updateData: Record<string, unknown> = {};
    if (data.name?.trim() && data.name.trim().length >= 2) updateData.name = data.name.trim();
    if (typeof data.description === 'string') updateData.description = data.description.trim() || null;
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;

    return this.prisma.providerSpecialty.update({
      where: { id },
      data: updateData,
      select: { id: true, providerType: true, name: true, description: true, isActive: true },
    });
  }

  async deactivateSpecialty(id: string) {
    const existing = await this.prisma.providerSpecialty.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Specialty not found');

    await this.prisma.providerSpecialty.update({ where: { id }, data: { isActive: false } });
  }

  /** Active organisation categories (pharmacy, clinic, hospital, lab, insurance, …). */
  async getOrgCategories() {
    return (this.prisma as any).organisationCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
