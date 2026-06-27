import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { userTypeToProfileRelation } from '../auth/auth.service';

/**
 * LEGACY profile include map — for backward compatibility with roles that have
 * dedicated profile tables. New dynamic roles (created by regional admins)
 * don't have profile tables and use User fields + ProviderRole config only.
 *
 * This map will shrink over time as legacy profiles are deprecated.
 * `specialtyField` is the array field on the profile that holds specialties —
 * stored here so specialty-filter logic never needs to branch on role codes.
 */
const LEGACY_PROFILE_INCLUDE: Record<string, { include: Record<string, any>; specialtyField: string }> = {
  DOCTOR:           { specialtyField: 'specialty',        include: { doctorProfile: { select: { id: true, specialty: true, subSpecialties: true, rating: true, reviewCount: true, experience: true, consultationFee: true, videoConsultationFee: true, consultationTypes: true, bio: true, location: true, languages: true, emergencyAvailable: true, homeVisitAvailable: true, telemedicineAvailable: true } } } },
  NURSE:            { specialtyField: 'specializations',  include: { nurseProfile: { select: { id: true, specializations: true, experience: true, licenseNumber: true } } } },
  NANNY:            { specialtyField: 'certifications',   include: { nannyProfile: { select: { id: true, experience: true, certifications: true } } } },
  PHARMACIST:       { specialtyField: 'specializations',  include: { pharmacistProfile: { select: { id: true, pharmacyName: true, specializations: true } } } },
  LAB_TECHNICIAN:   { specialtyField: 'specializations',  include: { labTechProfile: { select: { id: true, labName: true, specializations: true } } } },
  EMERGENCY_WORKER: { specialtyField: 'certifications',   include: { emergencyWorkerProfile: { select: { id: true, certifications: true, vehicleType: true, responseZone: true, emtLevel: true } } } },
  CAREGIVER:        { specialtyField: 'specializations',  include: { caregiverProfile: { select: { id: true, experience: true, specializations: true, certifications: true } } } },
  PHYSIOTHERAPIST:  { specialtyField: 'specializations',  include: { physiotherapistProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  DENTIST:          { specialtyField: 'specializations',  include: { dentistProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  OPTOMETRIST:      { specialtyField: 'specializations',  include: { optometristProfile: { select: { id: true, experience: true, specializations: true, clinicName: true } } } },
  NUTRITIONIST:     { specialtyField: 'specializations',  include: { nutritionistProfile: { select: { id: true, experience: true, specializations: true, certifications: true } } } },
  INSURANCE_REP:    { specialtyField: 'coverageTypes',    include: { insuranceRepProfile: { select: { id: true, companyName: true, coverageTypes: true } } } },
};

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search providers by type — works for ANY ProviderRole (legacy or dynamic).
   *
   * For legacy roles with dedicated profile tables: includes profile data.
   * For new dynamic roles: uses User fields only + ProviderSpecialty for filtering.
   */
  // ─── GET /search/available-slots — real slot availability across a role ──────
  // Reads ProviderAvailability (weekly schedule) + BookedSlot (taken slots) to
  // return per-time-slot availability counts for the hero booking widget.
  // Public endpoint — no auth required.
  async getAvailableSlots(dateStr: string, roleCode: string) {
    const uType = roleCode.toUpperCase();

    // Parse date parts from YYYY-MM-DD (avoid timezone shift from new Date(str))
    const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!parts) return { slots: [], providerCount: 0 };
    const [, yStr, mStr, dStr] = parts;
    const year = parseInt(yStr), month = parseInt(mStr) - 1, day = parseInt(dStr);
    const dayOfWeek = new Date(year, month, day).getDay(); // 0=Sun, 6=Sat

    const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    // All active providers of this role
    const providers = await this.prisma.user.findMany({
      where: { userType: uType as any, accountStatus: 'active' },
      select: { id: true },
    });
    if (providers.length === 0) return { slots: [], providerCount: 0 };

    const providerIds = providers.map(p => p.id);

    // Weekly availability windows for this day of week
    const availabilities = await this.prisma.providerAvailability.findMany({
      where: { userId: { in: providerIds }, dayOfWeek, isActive: true },
    });
    if (availabilities.length === 0) return { slots: [], providerCount: providers.length };

    // Already-taken slots on this date
    const bookedSlots = await this.prisma.bookedSlot.findMany({
      where: {
        providerUserId: { in: providerIds },
        date: { gte: dayStart, lte: dayEnd },
        status: 'booked',
      },
      select: { providerUserId: true, startTime: true },
    });
    const bookedSet = new Set(bookedSlots.map(b => `${b.providerUserId}:${b.startTime}`));

    const toMin = (t: string) => {
      const [h, m = 0] = t.split(':').map(Number);
      return h * 60 + m;
    };

    // Aggregate: for each time string, count how many providers have it free vs taken
    const slotMap = new Map<string, { available: number; total: number }>();

    for (const avail of availabilities) {
      const startMin = toMin(avail.startTime);
      const endMin   = toMin(avail.endTime);
      const duration = avail.slotDuration ?? 60;

      for (let m = startMin; m < endMin; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const entry = slotMap.get(timeStr) ?? { available: 0, total: 0 };
        entry.total++;
        if (!bookedSet.has(`${avail.userId}:${timeStr}`)) entry.available++;
        slotMap.set(timeStr, entry);
      }
    }

    const slots = Array.from(slotMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, c]) => ({ time, available: c.available, total: c.total, taken: c.available === 0 }));

    return { slots, providerCount: providers.length };
  }

  async searchProviders(type: string, query?: string, page?: number, limit?: number, specialty?: string, serviceId?: string, entityId?: string) {
    if (!type) throw new BadRequestException('type parameter is required');
    const uType = type.toUpperCase();
    const take = Math.min(limit || 50, 100);
    const pageNum = Math.max(page || 1, 1);
    const skip = (pageNum - 1) * take;

    const where: any = { userType: uType, accountStatus: 'active' };

    // When entityId is supplied, restrict to providers who work at that healthcare entity
    let entityUserIds: string[] | null = null;
    if (entityId) {
      const workplaces = await (this.prisma.providerWorkplace as any).findMany({
        where: { healthcareEntityId: entityId, isActive: true, status: 'active' },
        select: { providerUserId: true },
      });
      if (workplaces.length === 0) return { data: [], total: 0, page: 1, limit: take, totalPages: 0 };
      entityUserIds = workplaces.map((w: any) => w.providerUserId as string);
    }

    // When serviceId is supplied, only return providers who have that service
    // in their ProviderServiceConfig (they explicitly offer it).
    // If nobody offers it yet → return empty list; the booking drawer shows
    // "No providers available" rather than a misleading unfiltered list.
    let serviceUserIds: string[] | null = null;
    if (serviceId) {
      const configs = await this.prisma.providerServiceConfig.findMany({
        where: {
          platformServiceId: serviceId, isActive: true,
          // Pre-filter by entity providers if both filters are active, avoiding overwrite
          ...(entityUserIds ? { providerUserId: { in: entityUserIds } } : {}),
        },
        select: { providerUserId: true },
      });
      if (configs.length === 0) return { data: [], total: 0, page: 1, limit: take, totalPages: 0 };
      serviceUserIds = configs.map(c => c.providerUserId);
    }

    // Merge filters: intersection when both are present, otherwise whichever is set
    if (serviceUserIds !== null) {
      where.id = { in: serviceUserIds };
    } else if (entityUserIds !== null) {
      where.id = { in: entityUserIds };
    }

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Specialty filtering — uses the specialtyField declared in LEGACY_PROFILE_INCLUDE
    // (no hardcoded role-code branches). New dynamic roles are filtered post-query
    // via ProviderSpecialty since they have no dedicated profile relation.
    if (specialty) {
      const legacyEntry = LEGACY_PROFILE_INCLUDE[uType];
      if (legacyEntry) {
        const profileRelation = userTypeToProfileRelation[uType];
        if (profileRelation) {
          where[profileRelation] = { [legacyEntry.specialtyField]: { has: specialty } };
        }
      }
    }

    // Include legacy profile data if available, otherwise just user fields
    const profileInclude = LEGACY_PROFILE_INCLUDE[uType]?.include ?? {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, profileImage: true,
          address: true, phone: true, verified: true, userType: true, gender: true,
          ...profileInclude,
        },
        take, skip,
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Fetch specialties for this provider type from the dynamic ProviderSpecialty model
    const providerSpecialties = await this.prisma.providerSpecialty.findMany({
      where: { providerType: uType as any, isActive: true },
      select: { name: true, icon: true },
    });

    // Available service modes (office / home / video / …) per provider, derived
    // from the serviceMode of the workflow templates linked to their active
    // services. This is the single source of truth for "how can I see this
    // provider?" — the booking modal and the provider card read the same data.
    // One batched query for all returned providers (no N+1).
    const providerIds = users.map((u: any) => u.id);
    const modesByProvider = new Map<string, Set<string>>();
    if (providerIds.length) {
      const cfgs = await this.prisma.providerServiceConfig.findMany({
        where: { providerUserId: { in: providerIds }, isActive: true },
        select: {
          providerUserId: true,
          workflowTemplates: {
            select: { workflowTemplate: { select: { serviceMode: true, isActive: true } } },
          },
        },
      });
      for (const c of cfgs as any[]) {
        const set = modesByProvider.get(c.providerUserId) ?? new Set<string>();
        for (const link of c.workflowTemplates ?? []) {
          const wt = link.workflowTemplate;
          if (wt?.isActive && wt.serviceMode) set.add(wt.serviceMode as string);
        }
        modesByProvider.set(c.providerUserId, set);
      }
    }

    // Flatten profile data into top-level for frontend compatibility
    const data = users.map((u: any) => {
      const profileRelation = userTypeToProfileRelation[uType];
      const profile = profileRelation ? u[profileRelation] : null;
      const rest = profileRelation ? (() => { const { [profileRelation]: _unused, ...r } = u; return r; })() : u;

      return {
        ...(profile || {}),
        ...rest,
        name: `${u.firstName} ${u.lastName}`,
        id: u.id,
        userId: u.id,
        profileId: profile?.id,
        specializations: profile?.specializations || profile?.specialty || profile?.certifications || providerSpecialties.map(s => s.name),
        experience: profile?.experience || null,
        rating: profile?.rating || 0,
        consultationFee: profile?.consultationFee || 0,
        bio: profile?.bio || '',
        // Modes this provider actually offers (derived from linked workflows).
        serviceModes: Array.from(modesByProvider.get(u.id) ?? []),
      };
    });

    return { data, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) };
  }

  // ─── Semantic (RAG) provider search ───────────────────────────────────────
  // Gemini embeds providers + the query; we rank by cosine similarity in-app.
  // Groq parses the natural-language query into a coarse type/specialty filter.

  private readonly PROVIDER_USERTYPES = [
    'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
    'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
  ];

  private async embedGemini(text: string): Promise<number[] | null> {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'models/text-embedding-004', content: { parts: [{ text: text.slice(0, 8000) }] } }) },
      );
      if (!res.ok) return null;
      const json: any = await res.json();
      const vals = json?.embedding?.values;
      return Array.isArray(vals) ? vals : null;
    } catch { return null; }
  }

  private cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  }

  /** Build a searchable text blob per provider: name, type, specialties, services, bio, location. */
  private async buildCorpora(ids: string[]): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    if (ids.length === 0) return out;
    const p = this.prisma as any;
    const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, firstName: true, lastName: true, userType: true, address: true } });
    const [docs, nurses, dentists, physios, nutris, caregivers, optos, pharmas, labs] = await Promise.all([
      p.doctorProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specialty: true, bio: true } }),
      p.nurseProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.dentistProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.physiotherapistProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.nutritionistProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.caregiverProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.optometristProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.pharmacistProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
      p.labTechProfile.findMany({ where: { userId: { in: ids } }, select: { userId: true, specializations: true } }),
    ]);
    const specBy = new Map<string, string[]>(); const bioBy = new Map<string, string>();
    for (const d of docs) { specBy.set(d.userId, d.specialty ?? []); if (d.bio) bioBy.set(d.userId, d.bio); }
    for (const arr of [nurses, dentists, physios, nutris, caregivers, optos, pharmas, labs]) for (const r of arr) specBy.set(r.userId, r.specializations ?? []);

    const cfgs = await this.prisma.providerServiceConfig.findMany({ where: { providerUserId: { in: ids }, isActive: true }, select: { providerUserId: true, platformServiceId: true } });
    const svcIds = [...new Set(cfgs.map(c => c.platformServiceId))];
    const svcs = svcIds.length ? await this.prisma.platformService.findMany({ where: { id: { in: svcIds } }, select: { id: true, serviceName: true } }) : [];
    const svcName = new Map<string, string>(svcs.map(s => [s.id, s.serviceName] as [string, string]));
    const svcBy = new Map<string, string[]>();
    for (const c of cfgs) { const nm = svcName.get(c.platformServiceId); if (!nm) continue; const a = svcBy.get(c.providerUserId) ?? []; a.push(nm); svcBy.set(c.providerUserId, a); }

    for (const u of users) {
      const specs = specBy.get(u.id) ?? []; const services = svcBy.get(u.id) ?? []; const bio = bioBy.get(u.id) ?? '';
      out.set(u.id, [
        `${u.firstName} ${u.lastName}`,
        (u.userType || '').replace(/_/g, ' ').toLowerCase(),
        specs.length ? `Specialties: ${specs.join(', ')}` : '',
        services.length ? `Services: ${services.join(', ')}` : '',
        bio,
        u.address ? `Location: ${u.address}` : '',
      ].filter(Boolean).join('. '));
    }
    return out;
  }

  /** (Re)embed every active provider. Admin-triggered; idempotent (upsert). */
  async rebuildEmbeddings(): Promise<{ embedded: number; total: number; keyConfigured: boolean }> {
    const keyConfigured = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const providers = await this.prisma.user.findMany({
      where: { accountStatus: 'active', userType: { in: this.PROVIDER_USERTYPES as any } },
      select: { id: true },
    });
    const ids = providers.map(u => u.id);
    if (!keyConfigured) return { embedded: 0, total: ids.length, keyConfigured };
    const corpora = await this.buildCorpora(ids);

    let embedded = 0;
    // Embed in small parallel batches to stay well under request timeouts.
    const batch = 8;
    for (let i = 0; i < ids.length; i += batch) {
      const slice = ids.slice(i, i + batch);
      await Promise.all(slice.map(async id => {
        const text = corpora.get(id);
        if (!text) return;
        const vec = await this.embedGemini(text);
        if (!vec) return;
        await (this.prisma as any).providerEmbedding.upsert({
          where: { providerUserId: id },
          create: { providerUserId: id, textCorpus: text, embedding: vec, dim: vec.length },
          update: { textCorpus: text, embedding: vec, dim: vec.length },
        });
        // Mirror into the native pgvector column for fast similarity search.
        try {
          await this.prisma.$executeRawUnsafe(
            `UPDATE "ProviderEmbedding" SET "embeddingVec" = $1::vector WHERE "providerUserId" = $2`,
            `[${vec.join(',')}]`, id,
          );
        } catch { /* pgvector not ready — the Float[] copy still powers search */ }
        embedded++;
      }));
    }
    return { embedded, total: ids.length, keyConfigured };
  }

  private async extractIntent(query: string): Promise<{ type?: string; specialty?: string }> {
    const key = process.env.GROQ_API_KEY;
    if (!key) return {};
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', temperature: 0, response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: `Extract what kind of health provider the user wants. Reply ONLY JSON: {"type": one of ${this.PROVIDER_USERTYPES.join('|')} or null, "specialty": short phrase or null}.` },
            { role: 'user', content: query },
          ],
        }),
      });
      if (!res.ok) return {};
      const json: any = await res.json();
      const content = json?.choices?.[0]?.message?.content;
      const parsed = content ? JSON.parse(content) : {};
      const type = this.PROVIDER_USERTYPES.includes(parsed?.type) ? parsed.type : undefined;
      return { type, specialty: parsed?.specialty || undefined };
    } catch { return {}; }
  }

  /** Natural-language provider search: parse intent → embed query → rank providers
   *  by cosine similarity. Falls back to keyword search when embeddings/keys are absent. */
  async semanticSearch(query: string) {
    if (!query || query.trim().length < 2) return { intent: {}, usedVector: false, providers: [] };
    const intent = await this.extractIntent(query);
    const qVec = await this.embedGemini(query);

    let ranked: { id: string; score: number }[] = [];
    if (qVec) {
      const qLit = `[${qVec.join(',')}]`;
      try {
        // Native pgvector cosine similarity (1 - cosine distance).
        const rows: any[] = await this.prisma.$queryRawUnsafe(
          `SELECT "providerUserId", 1 - ("embeddingVec" <=> $1::vector) AS score
           FROM "ProviderEmbedding"
           WHERE "embeddingVec" IS NOT NULL
           ORDER BY "embeddingVec" <=> $1::vector
           LIMIT 12`, qLit,
        );
        ranked = rows.map(r => ({ id: r.providerUserId, score: Number(r.score) })).filter(r => r.score > 0.55);
      } catch {
        // pgvector not available yet → in-app cosine over the Float[] copy.
        const rows = await (this.prisma as any).providerEmbedding.findMany({ select: { providerUserId: true, embedding: true } });
        ranked = rows
          .map((r: any) => ({ id: r.providerUserId, score: this.cosine(qVec, r.embedding) }))
          .filter((r: any) => r.score > 0.55)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 12);
      }
    }

    // Fallback when no embeddings yet (or no Gemini key): keyword search by intent.
    // Try the specialty filter first, then all providers of that type so the user
    // still sees relevant people instead of an empty panel.
    if (ranked.length === 0) {
      if (intent.type) {
        let fb = intent.specialty
          ? await this.searchProviders(intent.type, undefined, 1, 8, intent.specialty)
          : { data: [] as any[] };
        if (!fb.data.length) fb = await this.searchProviders(intent.type, undefined, 1, 8);
        return { intent, usedVector: false, providers: fb.data };
      }
      return { intent, usedVector: false, providers: [] };
    }

    const ids = ranked.map(r => r.id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids }, accountStatus: 'active', ...(intent.type ? { userType: intent.type as any } : {}) },
      select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, address: true, verified: true },
    });
    const scoreById = new Map<string, number>(ranked.map(r => [r.id, r.score] as [string, number]));
    const byId = new Map<string, (typeof users)[number]>(users.map(u => [u.id, u] as [string, (typeof users)[number]]));
    const providers = ids
      .map(id => byId.get(id))
      .filter(Boolean)
      .map((u: any) => ({
        id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), userType: u.userType,
        profileImage: u.profileImage, address: u.address, verified: u.verified,
        score: Math.round((scoreById.get(u.id) ?? 0) * 100),
      }));
    return { intent, usedVector: true, providers };
  }

  /** Organisations that have at least one active provider matching the same
   *  filters as searchProviders — shown alongside provider search results. */
  async searchOrganisations(type?: string, query?: string, specialty?: string, serviceId?: string) {
    const uType = type ? type.toUpperCase() : undefined;
    const where: any = { accountStatus: 'active' };
    if (uType) where.userType = uType;

    if (serviceId) {
      const configs = await this.prisma.providerServiceConfig.findMany({
        where: { platformServiceId: serviceId, isActive: true },
        select: { providerUserId: true },
      });
      if (configs.length === 0) return { data: [] };
      where.id = { in: configs.map(c => c.providerUserId) };
    }
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (specialty && uType) {
      const legacyEntry = LEGACY_PROFILE_INCLUDE[uType];
      const profileRelation = userTypeToProfileRelation[uType];
      if (legacyEntry && profileRelation) where[profileRelation] = { [legacyEntry.specialtyField]: { has: specialty } };
    }

    const matching = await this.prisma.user.findMany({ where, select: { id: true } });
    const ids = matching.map(u => u.id);
    if (ids.length === 0) return { data: [] };

    const workplaces = await (this.prisma.providerWorkplace as any).findMany({
      where: { providerUserId: { in: ids }, isActive: true, status: 'active' },
      select: { healthcareEntityId: true, providerUserId: true },
    });
    const byEntity = new Map<string, Set<string>>();
    for (const w of workplaces) {
      if (!w.healthcareEntityId) continue;
      if (!byEntity.has(w.healthcareEntityId)) byEntity.set(w.healthcareEntityId, new Set());
      byEntity.get(w.healthcareEntityId)!.add(w.providerUserId);
    }
    const entityIds = [...byEntity.keys()];
    if (entityIds.length === 0) return { data: [] };

    const entities = await (this.prisma.healthcareEntity as any).findMany({
      where: { id: { in: entityIds }, isActive: true },
      select: { id: true, name: true, type: true, city: true, logoUrl: true, isVerified: true },
    });
    const data = entities
      .map((e: any) => ({ ...e, providerCount: byEntity.get(e.id)?.size ?? 0 }))
      .sort((a: any, b: any) => b.providerCount - a.providerCount);
    return { data };
  }

  async searchLabTests(q?: string, page?: number, limit?: number) {
    const pageNum = Math.max(page || 1, 1);
    const limitNum = Math.min(limit || 20, 50);
    const where: any = {};
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }];
    const [tests, total] = await Promise.all([
      this.prisma.labTestCatalog.findMany({ where, include: { labTech: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } } }, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { name: 'asc' } }),
      this.prisma.labTestCatalog.count({ where }),
    ]);
    return { data: tests, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async searchInsurance(q?: string, page?: number, limit?: number) {
    const pageNum = Math.max(page || 1, 1);
    const limitNum = Math.min(limit || 20, 50);
    const where: any = {};
    if (q) where.OR = [{ planName: { contains: q, mode: 'insensitive' } }];
    const [plans, total] = await Promise.all([
      this.prisma.insurancePlanListing.findMany({ where, include: { insuranceRep: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } } }, skip: (pageNum - 1) * limitNum, take: limitNum }),
      this.prisma.insurancePlanListing.count({ where }),
    ]);
    return { data: plans, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async searchEmergency(q?: string, page?: number, limit?: number) {
    const pageNum = Math.max(page || 1, 1);
    const limitNum = Math.min(limit || 20, 50);
    const where: any = {};
    if (q) where.OR = [{ serviceName: { contains: q, mode: 'insensitive' } }];
    const [services, total] = await Promise.all([
      this.prisma.emergencyServiceListing.findMany({ where, include: { worker: { include: { user: { select: { id: true, firstName: true, lastName: true, profileImage: true } } } } }, skip: (pageNum - 1) * limitNum, take: limitNum }),
      this.prisma.emergencyServiceListing.count({ where }),
    ]);
    return { data: services, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async autocomplete(q: string, category?: string, limit?: number) {
    const take = Math.min(limit || 8, 20);
    const results: any[] = [];

    if (!category || category === 'providers') {
      const providers = await this.prisma.user.findMany({
        where: { accountStatus: 'active', userType: { notIn: ['MEMBER' as any, 'CORPORATE_ADMIN' as any] }, OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true },
        take,
      });
      providers.forEach(p => results.push({ id: p.id, label: `${p.firstName} ${p.lastName}`, type: 'provider', category: p.userType, image: p.profileImage }));
    }

    if (!category || category === 'products') {
      const items = await this.prisma.providerInventoryItem.findMany({
        where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, category: true, price: true },
        take,
      });
      items.forEach(i => results.push({ id: i.id, label: i.name, type: 'product', category: i.category, price: i.price }));
    }

    return results.slice(0, take);
  }

  async searchServices(q?: string, providerType?: string, category?: string, limit?: number) {
    // The catalogue holds 250+ services; the Services page loads them all and
    // filters client-side, so the cap must comfortably exceed the total or
    // category filters silently miss services beyond the first page.
    const take = Math.min(limit || 30, 1000);
    const where: any = { isActive: true };
    if (q) {
      where.OR = [
        { serviceName: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (providerType) where.providerType = providerType.toUpperCase();
    if (category) where.category = { contains: category, mode: 'insensitive' };

    const services = await this.prisma.platformService.findMany({ where, take, orderBy: { serviceName: 'asc' } });

    const providerCounts = await this.prisma.providerServiceConfig.groupBy({
      by: ['platformServiceId'],
      where: { platformServiceId: { in: services.map(s => s.id) }, isActive: true },
      _count: { id: true },
    });
    const countMap: Record<string, number> = {};
    for (const pc of providerCounts) countMap[pc.platformServiceId] = pc._count.id;

    return services.map(svc => ({
      id: svc.id,
      serviceName: svc.serviceName,
      category: svc.category,
      description: svc.description,
      providerType: svc.providerType,
      defaultPrice: svc.defaultPrice,
      currency: svc.currency,
      duration: svc.duration,
      iconKey: (svc as any).iconKey ?? null,
      emoji: (svc as any).emoji ?? null,
      imageUrl: (svc as any).imageUrl ?? null,
      providerCount: countMap[svc.id] ?? 0,
      sampleProviders: [],
    }));
  }

  async searchOrganizations(q?: string, type?: string, city?: string, country?: string, page?: number, limit?: number) {
    const pageNum = Math.max(page || 1, 1);
    const take = Math.min(limit || 20, 100);
    const skip = (pageNum - 1) * take;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country.toUpperCase();
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [entities, total] = await Promise.all([
      (this.prisma.healthcareEntity as any).findMany({
        where,
        include: {
          providers: {
            where: { isActive: true },
            include: { provider: { select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true } } },
            take: 5,
          },
        },
        skip,
        take,
        orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      }),
      (this.prisma.healthcareEntity as any).count({ where }),
    ]);

    const data = entities.map((e: any) => ({
      ...e,
      providerCount: e.providers.length,
      sampleProviders: e.providers.slice(0, 3).map((wp: any) => ({
        id: wp.provider.id,
        name: `${wp.provider.firstName} ${wp.provider.lastName}`,
        userType: wp.provider.userType,
        profileImage: wp.provider.profileImage,
        role: wp.role,
      })),
    }));

    return { data, total, page: pageNum, limit: take, totalPages: Math.ceil(total / take) };
  }

  async searchMedicines(q?: string, page?: number, limit?: number) {
    const pageNum = Math.max(page || 1, 1);
    const limitNum = Math.min(limit || 20, 50);
    const where: any = { isActive: true, category: { in: ['medication', 'vitamins', 'supplements'] } };
    if (q) where.name = { contains: q, mode: 'insensitive' };
    const [items, total] = await Promise.all([
      this.prisma.providerInventoryItem.findMany({ where, skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { name: 'asc' } }),
      this.prisma.providerInventoryItem.count({ where }),
    ]);
    return { data: items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }
}
