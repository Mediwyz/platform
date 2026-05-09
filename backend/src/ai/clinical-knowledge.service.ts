import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface KnowledgeEntry {
  conditionKey: string;
  aliases: string[];
  dietaryGuidance: string;
  category: string;
}

/**
 * Admin-editable clinical knowledge reader + cache. The AI assistant calls
 * `resolveGuidance(conditions)` with the user's declared conditions and
 * gets back matching dietary/wellness lines to inject into the system
 * prompt. Previously this lived as hardcoded `if (lower.includes(...))`
 * branches inside `AiService`.
 *
 * Cache strategy: lazy-load on first call, refresh every 5 min or on
 * explicit `invalidate()` after an admin edit. In-memory, per-process —
 * good enough for single-container deploys; clustered deploys should
 * call `invalidate()` via an event bus after a CRUD.
 */
@Injectable()
export class ClinicalKnowledgeService {
  private readonly logger = new Logger(ClinicalKnowledgeService.name);
  private cache: KnowledgeEntry[] | null = null;
  private cacheExpiresAt = 0;
  private static readonly TTL_MS = 5 * 60 * 1000;

  constructor(private prisma: PrismaService) {}

  /** Drop the cache — call after an admin CRUD so next read picks up the change. */
  invalidate(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  private async getAll(): Promise<KnowledgeEntry[]> {
    if (this.cache && Date.now() < this.cacheExpiresAt) return this.cache;
    try {
      const rows = await this.prisma.clinicalKnowledge.findMany({
        where: { active: true },
        select: { conditionKey: true, aliases: true, dietaryGuidance: true, category: true },
      });
      this.cache = rows;
      this.cacheExpiresAt = Date.now() + ClinicalKnowledgeService.TTL_MS;
      return rows;
    } catch (e) {
      this.logger.warn(`ClinicalKnowledge cache refresh failed: ${(e as Error).message}`);
      return this.cache ?? [];
    }
  }

  /**
   * Given the user's declared conditions, return the dietary guidance lines
   * that match. A condition matches if any of its tokens (lowercase) appears
   * as a substring in either the entry's `conditionKey` or any of its
   * `aliases`. Multiple matches are allowed; dedupe at the entry level.
   */
  async resolveGuidance(userConditions: string[]): Promise<string[]> {
    if (userConditions.length === 0) return [];
    const entries = await this.getAll();
    const matched = new Set<string>();
    const out: string[] = [];

    for (const condition of userConditions) {
      const lower = condition.toLowerCase();
      for (const entry of entries) {
        if (matched.has(entry.conditionKey)) continue;
        const tokens = [entry.conditionKey, ...entry.aliases].map((t) => t.toLowerCase());
        if (tokens.some((t) => lower.includes(t))) {
          matched.add(entry.conditionKey);
          out.push(entry.dietaryGuidance);
        }
      }
    }
    return out;
  }

  async listAll() {
    return this.prisma.clinicalKnowledge.findMany({
      orderBy: [{ active: 'desc' }, { category: 'asc' }, { conditionKey: 'asc' }],
    });
  }

  async create(data: {
    conditionKey: string; aliases?: string[]; dietaryGuidance: string;
    category?: string; sources?: string[]; active?: boolean;
  }) {
    const row = await this.prisma.clinicalKnowledge.create({
      data: {
        conditionKey: data.conditionKey.trim().toLowerCase(),
        aliases: (data.aliases ?? []).map((a) => a.trim().toLowerCase()),
        dietaryGuidance: data.dietaryGuidance.trim(),
        category: data.category ?? 'nutrition',
        sources: data.sources ?? [],
        active: data.active ?? true,
      },
    });
    this.invalidate();
    return row;
  }

  async update(id: string, data: Partial<{
    conditionKey: string; aliases: string[]; dietaryGuidance: string;
    category: string; sources: string[]; active: boolean;
  }>) {
    const update: any = {};
    if (data.conditionKey !== undefined) update.conditionKey = data.conditionKey.trim().toLowerCase();
    if (data.aliases !== undefined) update.aliases = data.aliases.map((a) => a.trim().toLowerCase());
    if (data.dietaryGuidance !== undefined) update.dietaryGuidance = data.dietaryGuidance.trim();
    if (data.category !== undefined) update.category = data.category;
    if (data.sources !== undefined) update.sources = data.sources;
    if (data.active !== undefined) update.active = data.active;

    const row = await this.prisma.clinicalKnowledge.update({ where: { id }, data: update });
    this.invalidate();
    return row;
  }

  async remove(id: string) {
    await this.prisma.clinicalKnowledge.delete({ where: { id } });
    this.invalidate();
  }
}
