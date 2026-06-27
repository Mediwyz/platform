import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

const PROVIDER_USERTYPES = [
  'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
];

/**
 * Keeps the ProviderEmbedding index in sync: builds each provider's searchable
 * text, embeds it (local e5 model), and stores it in both the Float[] column and
 * the native pgvector column. Used for the one-time backfill and for embed-on-write.
 */
@Injectable()
export class ProviderIndexService {
  private readonly logger = new Logger(ProviderIndexService.name);

  constructor(
    private prisma: PrismaService,
    private embeddings: EmbeddingService,
  ) {}

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

  private async store(userId: string, text: string, vec: number[]) {
    await (this.prisma as any).providerEmbedding.upsert({
      where: { providerUserId: userId },
      create: { providerUserId: userId, textCorpus: text, embedding: vec, dim: vec.length },
      update: { textCorpus: text, embedding: vec, dim: vec.length },
    });
    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "ProviderEmbedding" SET "embeddingVec" = $1::vector WHERE "providerUserId" = $2`,
        `[${vec.join(',')}]`, userId,
      );
    } catch { /* pgvector not ready — the Float[] copy still powers search */ }
  }

  /** Re-embed a single provider (embed-on-write). Self-skips non-providers, so
   *  callers can fire it unconditionally. Fire-and-forget safe. */
  async reembedProvider(userId: string): Promise<boolean> {
    try {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { userType: true } });
      if (!u || !PROVIDER_USERTYPES.includes(u.userType as any)) return false;
      const corpora = await this.buildCorpora([userId]);
      const text = corpora.get(userId);
      if (!text) return false;
      const vec = await this.embeddings.embed(text, 'passage');
      if (!vec) return false;
      await this.store(userId, text, vec);
      return true;
    } catch (e: any) {
      this.logger.warn(`reembedProvider(${userId}) failed: ${e?.message}`);
      return false;
    }
  }

  /** (Re)embed every active provider. Admin-triggered; idempotent. */
  async rebuildAll(): Promise<{ embedded: number; total: number; modelAvailable: boolean }> {
    const providers = await this.prisma.user.findMany({
      where: { accountStatus: 'active', userType: { in: PROVIDER_USERTYPES as any } },
      select: { id: true },
    });
    const ids = providers.map(u => u.id);
    if (!this.embeddings.available) return { embedded: 0, total: ids.length, modelAvailable: false };
    const corpora = await this.buildCorpora(ids);

    let embedded = 0;
    const batch = 8;
    for (let i = 0; i < ids.length; i += batch) {
      await Promise.all(ids.slice(i, i + batch).map(async id => {
        const text = corpora.get(id);
        if (!text) return;
        const vec = await this.embeddings.embed(text, 'passage');
        if (!vec) return;
        await this.store(id, text, vec);
        embedded++;
      }));
    }
    return { embedded, total: ids.length, modelAvailable: true };
  }
}
