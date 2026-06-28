import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { InventoryService } from '../inventory/inventory.service';
import { AiService } from './ai.service';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const PROVIDER_TYPES = [
  'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
];

export type AgentIntent =
  | 'GREETING' | 'SMALL_TALK' | 'MEDIWYZ_INFO'
  | 'FIND_PROVIDER' | 'FIND_ORGANISATION' | 'FIND_PRODUCT'
  | 'BOOK' | 'WHY' | 'HEALTH_QA' | 'OUT_OF_SCOPE';

const INTENTS: AgentIntent[] = [
  'GREETING', 'SMALL_TALK', 'MEDIWYZ_INFO', 'FIND_PROVIDER', 'FIND_ORGANISATION',
  'FIND_PRODUCT', 'BOOK', 'WHY', 'HEALTH_QA', 'OUT_OF_SCOPE',
];

export interface AgentEntities {
  providerName?: string;
  providerType?: string;
  specialty?: string;
  orgName?: string;
  orgType?: string;
  productName?: string;
  location?: string;
  serviceMode?: string;
  serviceName?: string;
  date?: string;
  refersToPrevious?: boolean;
}

interface HistoryTurn { role: 'user' | 'bot'; text: string }

export interface AgentInput {
  message: string;
  history?: HistoryTurn[];
  userId?: string;
  sessionId?: string;
  lastProviderIds?: string[];
}

export interface AgentResult {
  intent: AgentIntent;
  entities: AgentEntities;
  reply: string;
  providers?: any[];
  organisations?: any[];
  products?: any[];
  resolved?: { kind: string; id: string; name: string }[];
  followUps?: string[];
  action?: 'book' | null;
  bookProviderId?: string;
  sessionId?: string;
}

/**
 * Wyzo agent orchestrator. Every user message flows through `run`:
 *   1. classify  → intent + multi-entity extraction (one Groq call)
 *   2. resolve   → names → IDs via pg_trgm similarity (+ in-app fuzzy fallback)
 *   3. route     → the right tool (provider/org/product search, booking, Q&A)
 *   4. compose   → natural reply + 3 continuation follow-ups
 * Reuses the existing SearchService / InventoryService / AiService as tools.
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private prisma: PrismaService,
    private search: SearchService,
    private inventory: InventoryService,
    private ai: AiService,
  ) {}

  async run(input: AgentInput): Promise<AgentResult> {
    const message = (input.message || '').trim();
    if (!message) {
      return { intent: 'SMALL_TALK', entities: {}, reply: 'Comment puis-je vous aider ?', followUps: this.capabilityFollowUps('fr') };
    }

    const { intent, entities, language } = await this.classify(message, input.history);

    try {
      switch (intent) {
        case 'FIND_PROVIDER': return await this.handleFindProvider(message, entities, language, input);
        case 'FIND_ORGANISATION': return await this.handleFindOrg(message, entities, language, input);
        case 'FIND_PRODUCT': return await this.handleFindProduct(message, entities, language, input);
        case 'BOOK': return await this.handleBook(message, entities, language, input);
        default: return await this.handleTalk(intent, message, entities, language, input);
      }
    } catch (e: any) {
      this.logger.error(`agent.run(${intent}) failed: ${e?.message}`);
      return { intent, entities, reply: this.t(language, 'error'), followUps: this.capabilityFollowUps(language) };
    }
  }

  // ── 1. Classify ──────────────────────────────────────────────────────────
  private async classify(message: string, history?: HistoryTurn[]): Promise<{ intent: AgentIntent; entities: AgentEntities; language: string }> {
    const hist = (history || []).slice(-6).map(h => `${h.role === 'user' ? 'User' : 'Wyzo'}: ${h.text}`).join('\n');
    const sys =
`You are the intent + entity parser for "Wyzo", the AI agent of the MediWyz health platform (Mauritius, Africa, India). Read the conversation and the new message (any language) and reply ONLY with JSON:
{"intent": one of ${INTENTS.join('|')},
 "language": "fr" | "en" | "mfe",
 "entities": {
   "providerName": full or partial person name if the user names a specific provider, else null,
   "providerType": one of ${PROVIDER_TYPES.join('|')} or null,
   "specialty": short specialty/sub-field phrase or null,
   "orgName": a clinic/hospital/pharmacy/laboratory/insurer name if named, else null,
   "orgType": one of clinic|hospital|pharmacy|laboratory|insurance|emergency or null,
   "productName": a medicine / health-shop product name if mentioned, else null,
   "location": a city / area / town name or null,
   "serviceMode": one of in_person|video|audio|home or null,
   "serviceName": a specific service/treatment/test name or null,
   "date": a day or date phrase the user wants (e.g. "this week", "tuesday") or null,
   "refersToPrevious": true if the message refers back to a result/provider already shown (e.g. "book him", "why her", "the first one")
 }}
Intent guide:
- GREETING: hi/bonjour/salut with no request.
- SMALL_TALK: chit-chat, thanks, how are you.
- MEDIWYZ_INFO: questions about MediWyz itself (how it works, pricing, plans, the Health Shop, coverage, app).
- FIND_PROVIDER: looking for a doctor/nurse/dentist/specialist etc.
- FIND_ORGANISATION: looking for a clinic/hospital/pharmacy/laboratory/insurer.
- FIND_PRODUCT: looking for a medicine / health-shop product.
- BOOK: wants to book/appoint/reserve with someone (often refersToPrevious).
- WHY: any question starting with or meaning "why / pourquoi / explain / how come".
- HEALTH_QA: a general health/medical/wellness question (symptoms, advice, nutrition).
- OUT_OF_SCOPE: clearly unrelated to health or MediWyz.
Map serviceMode synonyms: "office/in clinic"→in_person, "call/phone"→audio, "video/online/téléconsultation"→video, "at home/à domicile/home visit"→home.`;
    const user = (hist ? `Conversation so far:\n${hist}\n\n` : '') + `New message: ${message}`;
    const raw = await this.groq([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, max: 400, temp: 0 });

    if (!raw) return { ...this.heuristic(message), language: this.guessLang(message) };
    try {
      const p = JSON.parse(raw);
      const intent: AgentIntent = INTENTS.includes(p?.intent) ? p.intent : this.heuristic(message).intent;
      const e = p?.entities || {};
      const entities: AgentEntities = {
        providerName: e.providerName || undefined,
        providerType: PROVIDER_TYPES.includes(e.providerType) ? e.providerType : undefined,
        specialty: e.specialty || undefined,
        orgName: e.orgName || undefined,
        orgType: e.orgType || undefined,
        productName: e.productName || undefined,
        location: e.location || undefined,
        serviceMode: ['in_person', 'video', 'audio', 'home'].includes(e.serviceMode) ? e.serviceMode : undefined,
        serviceName: e.serviceName || undefined,
        date: e.date || undefined,
        refersToPrevious: !!e.refersToPrevious,
      };
      const language = ['fr', 'en', 'mfe'].includes(p?.language) ? p.language : this.guessLang(message);
      return { intent, entities, language };
    } catch {
      return { ...this.heuristic(message), language: this.guessLang(message) };
    }
  }

  private heuristic(message: string): { intent: AgentIntent; entities: AgentEntities } {
    const m = message.toLowerCase();
    if (/^(why|pourquoi|comment ça|how come)\b/.test(m)) return { intent: 'WHY', entities: { refersToPrevious: true } };
    if (/^(hi|hey|hello|bonjour|salut|bonsoir)\b/.test(m)) return { intent: 'GREETING', entities: {} };
    if (/\b(book|r[ée]serv|appointment|rendez)/.test(m)) return { intent: 'BOOK', entities: { refersToPrevious: true } };
    if (/\b(pharmac|m[ée]dicament|medicine|vitamin|drug)/.test(m)) return { intent: 'FIND_PRODUCT', entities: {} };
    if (/\b(clinic|clinique|hospital|h[ôo]pital|laborator|laboratoire|insur|assur)/.test(m)) return { intent: 'FIND_ORGANISATION', entities: {} };
    if (/\b(doctor|m[ée]decin|nurse|infirmi|dentist|dentiste|sp[ée]cialist|cardio|p[ée]diat)/.test(m)) return { intent: 'FIND_PROVIDER', entities: {} };
    return { intent: 'HEALTH_QA', entities: {} };
  }

  private guessLang(message: string): string {
    return /[éèàùûôîç]|bonjour|merci|médecin|pourquoi|réserv|santé/i.test(message) ? 'fr' : 'en';
  }

  // ── 2. Route handlers ────────────────────────────────────────────────────
  private async handleFindProvider(message: string, entities: AgentEntities, language: string, _input: AgentInput): Promise<AgentResult> {
    let providers: any[] = [];
    const resolved: AgentResult['resolved'] = [];

    if (entities.providerName) {
      const p = await this.resolveProvider(entities.providerName, entities.providerType);
      if (p) { providers = [this.providerCard(p)]; resolved.push({ kind: 'provider', id: p.id, name: p.name }); }
    }
    if (!providers.length) {
      const r = await this.search.semanticSearch(message);
      providers = (r.providers || []).slice(0, 5);
    }
    const { reply, followUps } = await this.compose('FIND_PROVIDER', this.summarizeProviders(providers), message, language);
    return { intent: 'FIND_PROVIDER', entities, reply, providers, resolved, followUps };
  }

  private async handleFindOrg(message: string, entities: AgentEntities, language: string, _input: AgentInput): Promise<AgentResult> {
    const resolved: AgentResult['resolved'] = [];
    let organisations: any[] = [];
    if (entities.orgName) {
      const o = await this.resolveOrg(entities.orgName);
      if (o) { organisations = [this.orgCard(o)]; resolved.push({ kind: 'organisation', id: o.id, name: o.name }); }
    }
    if (!organisations.length) {
      const q = entities.orgName || entities.location || message;
      const r = await this.search.searchOrganizations(q, entities.orgType, entities.location, undefined, 1, 6);
      organisations = (r.data || []).map((e: any) => this.orgCard(e)).slice(0, 6);
    }
    const { reply, followUps } = await this.compose('FIND_ORGANISATION', this.summarizeOrgs(organisations), message, language);
    return { intent: 'FIND_ORGANISATION', entities, reply, organisations, resolved, followUps };
  }

  private async handleFindProduct(message: string, entities: AgentEntities, language: string, _input: AgentInput): Promise<AgentResult> {
    const r = await this.inventory.searchShop({ query: entities.productName || message, limit: 6 });
    const products = (r.items || []).map((i: any) => this.productCard(i)).slice(0, 6);
    const { reply, followUps } = await this.compose('FIND_PRODUCT', this.summarizeProducts(products), message, language);
    return { intent: 'FIND_PRODUCT', entities, reply, products, followUps };
  }

  private async handleBook(message: string, entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    let prov: ResolvedProvider | null = null;
    if (entities.providerName) prov = await this.resolveProvider(entities.providerName, entities.providerType);
    if (!prov && input.lastProviderIds?.length === 1) prov = await this.providerById(input.lastProviderIds[0]);

    if (prov) {
      return {
        intent: 'BOOK', entities,
        reply: this.t(language, 'bookStart', prov.name),
        providers: [this.providerCard(prov)],
        resolved: [{ kind: 'provider', id: prov.id, name: prov.name }],
        action: 'book', bookProviderId: prov.id,
        followUps: [],
      };
    }
    // No provider pinned yet → help them pick first.
    const found = await this.handleFindProvider(message, entities, language, input);
    return { ...found, intent: 'BOOK', reply: this.t(language, 'bookPick') };
  }

  private async handleTalk(intent: AgentIntent, message: string, entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    // For "why / the first one" questions, inject the providers the user just saw.
    let qMessage = message;
    if ((intent === 'WHY' || entities.refersToPrevious) && input.lastProviderIds?.length) {
      const names = await this.namesFor(input.lastProviderIds);
      if (names.length) qMessage = `The user is referring to providers they just saw on MediWyz: ${names.join(', ')}. Their message: "${message}". Answer helpfully and concisely.`;
    }

    let reply: string;
    let sessionId: string | undefined;
    if (input.userId) {
      const r = await this.ai.chatWithAssistant(input.userId, qMessage, input.sessionId);
      reply = r.response; sessionId = r.sessionId;
    } else {
      reply = await this.ai.publicWidgetChat(qMessage);
    }
    return { intent, entities, reply, sessionId, followUps: this.talkFollowUps(intent, language) };
  }

  // ── 3. Entity resolution (pg_trgm + in-app fuzzy fallback) ───────────────
  private async resolveProvider(name: string, type?: string): Promise<ResolvedProvider | null> {
    const n = name.trim();
    if (n.length < 2) return null;
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, "firstName", "lastName", "userType", "profileImage", "address", "verified",
                similarity(lower("firstName" || ' ' || "lastName"), lower($1)) AS sim
         FROM "User"
         WHERE "accountStatus" = 'active' AND "userType" = ANY($2::text[])
         ORDER BY sim DESC LIMIT 1`,
        n, type ? [type] : PROVIDER_TYPES,
      );
      if (rows[0] && Number(rows[0].sim) >= 0.3) return this.rowToProvider(rows[0], Number(rows[0].sim));
      if (rows[0]) return null; // pg_trgm worked but nothing confident
    } catch { /* pg_trgm absent → fall through */ }
    return this.fuzzyResolveProvider(n, type);
  }

  private async fuzzyResolveProvider(n: string, type?: string): Promise<ResolvedProvider | null> {
    const tokens = n.split(/\s+/).filter(t => t.length >= 2);
    if (!tokens.length) return null;
    const candidates = await this.prisma.user.findMany({
      where: {
        accountStatus: 'active',
        userType: { in: (type ? [type] : PROVIDER_TYPES) as any },
        OR: tokens.flatMap(t => [
          { firstName: { contains: t, mode: 'insensitive' as const } },
          { lastName: { contains: t, mode: 'insensitive' as const } },
        ]),
      },
      select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, address: true, verified: true },
      take: 25,
    });
    let best: any = null, bestScore = 0;
    for (const c of candidates) {
      const s = this.fuzzy(n.toLowerCase(), `${c.firstName} ${c.lastName}`.trim().toLowerCase());
      if (s > bestScore) { bestScore = s; best = c; }
    }
    return best && bestScore >= 0.45 ? this.rowToProvider(best, bestScore) : null;
  }

  private async resolveOrg(name: string): Promise<any | null> {
    const n = name.trim();
    if (n.length < 2) return null;
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(
        `SELECT id, name, type, city, "logoUrl", "isVerified",
                similarity(lower(name), lower($1)) AS sim
         FROM "HealthcareEntity"
         WHERE "isActive" = true ORDER BY sim DESC LIMIT 1`, n,
      );
      if (rows[0] && Number(rows[0].sim) >= 0.3) return rows[0];
      if (rows[0]) return null;
    } catch { /* fall through */ }
    const ents = await (this.prisma.healthcareEntity as any).findMany({
      where: { isActive: true, name: { contains: n.split(/\s+/)[0], mode: 'insensitive' } },
      select: { id: true, name: true, type: true, city: true, logoUrl: true, isVerified: true }, take: 25,
    });
    let best: any = null, bestScore = 0;
    for (const e of ents) { const s = this.fuzzy(n.toLowerCase(), (e.name || '').toLowerCase()); if (s > bestScore) { bestScore = s; best = e; } }
    return best && bestScore >= 0.45 ? best : null;
  }

  private async providerById(id: string): Promise<ResolvedProvider | null> {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, address: true, verified: true },
    });
    return u ? this.rowToProvider(u, 1) : null;
  }

  private async namesFor(ids: string[]): Promise<string[]> {
    const us = await this.prisma.user.findMany({ where: { id: { in: ids.slice(0, 5) } }, select: { firstName: true, lastName: true } });
    return us.map(u => `${u.firstName} ${u.lastName}`.trim());
  }

  /** Sørensen–Dice bigram coefficient — cheap fuzzy score in [0,1]. */
  private fuzzy(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    const bigrams = (s: string) => {
      const m = new Map<string, number>();
      for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); m.set(g, (m.get(g) || 0) + 1); }
      return m;
    };
    const A = bigrams(a), B = bigrams(b);
    let inter = 0;
    for (const [g, c] of A) { const d = B.get(g); if (d) inter += Math.min(c, d); }
    return (2 * inter) / ((a.length - 1) + (b.length - 1));
  }

  // ── 4. Compose reply + follow-ups for result-bearing intents ─────────────
  private async compose(intent: AgentIntent, summary: string, message: string, language: string): Promise<{ reply: string; followUps: string[] }> {
    const sys =
`You are Wyzo, MediWyz's warm, concise health agent. Reply in language "${language}". Given the user's message and a summary of what was found, write a SHORT reply (1-2 sentences) that acknowledges the result and gently moves the conversation forward. Then propose exactly 3 follow-up actions phrased AS IF THE USER is saying them (short, tappable, e.g. "Réserver avec lui", "A-t-il des créneaux cette semaine ?", "Montre-moi ses tarifs"). If the summary is empty, say nothing was found and suggest a broader search. Reply ONLY JSON: {"reply": string, "followUps": [string, string, string]}.`;
    const raw = await this.groq(
      [{ role: 'system', content: sys }, { role: 'user', content: `Intent: ${intent}\nUser message: ${message}\nFound: ${summary || '(nothing)'}` }],
      { json: true, max: 300, temp: 0.5 },
    );
    if (raw) {
      try {
        const p = JSON.parse(raw);
        const reply = typeof p?.reply === 'string' && p.reply.trim() ? p.reply.trim() : this.fallbackReply(intent, summary, language);
        const followUps = Array.isArray(p?.followUps) ? p.followUps.filter((x: any) => typeof x === 'string' && x.trim()).slice(0, 3) : this.resultFollowUps(intent, language);
        return { reply, followUps: followUps.length ? followUps : this.resultFollowUps(intent, language) };
      } catch { /* fall through */ }
    }
    return { reply: this.fallbackReply(intent, summary, language), followUps: this.resultFollowUps(intent, language) };
  }

  // ── Cards & summaries ────────────────────────────────────────────────────
  private rowToProvider(r: any, sim: number): ResolvedProvider {
    return {
      id: r.id, name: `${r.firstName} ${r.lastName}`.trim(), userType: r.userType,
      profileImage: r.profileImage ?? null, address: r.address ?? null, verified: !!r.verified,
      score: Math.round(sim * 100),
    };
  }
  private providerCard(p: ResolvedProvider) {
    return { id: p.id, name: p.name, userType: p.userType, profileImage: p.profileImage, address: p.address, verified: p.verified, score: p.score };
  }
  private orgCard(e: any) {
    return { id: e.id, name: e.name, type: e.type, city: e.city ?? null, logoUrl: e.logoUrl ?? null, isVerified: !!e.isVerified, providerCount: e.providerCount ?? undefined };
  }
  private productCard(i: any) {
    return { id: i.id, name: i.name, category: i.category ?? null, price: i.price ?? null, currency: i.currency ?? 'Rs', inStock: i.inStock !== false, providerUserId: i.providerUserId ?? null, requiresPrescription: !!i.requiresPrescription };
  }
  private summarizeProviders(ps: any[]): string {
    if (!ps.length) return '';
    return ps.map(p => `${p.name} (${(p.userType || '').toLowerCase().replace(/_/g, ' ')}${p.address ? ', ' + p.address : ''})`).join('; ');
  }
  private summarizeOrgs(os: any[]): string {
    if (!os.length) return '';
    return os.map(o => `${o.name} (${o.type || 'organisation'}${o.city ? ', ' + o.city : ''})`).join('; ');
  }
  private summarizeProducts(ps: any[]): string {
    if (!ps.length) return '';
    return ps.map(p => `${p.name}${p.price != null ? ` (${p.currency} ${p.price})` : ''}`).join('; ');
  }

  // ── Follow-up & reply templates ──────────────────────────────────────────
  private capabilityFollowUps(lang: string): string[] {
    return lang === 'fr'
      ? ['Trouver un médecin', 'Réserver une consultation vidéo', 'Une infirmière à domicile', 'Commander un médicament']
      : ['Find a doctor', 'Book a video consultation', 'A nurse at home', 'Order a medicine'];
  }
  private talkFollowUps(intent: AgentIntent, lang: string): string[] {
    if (intent === 'WHY' || intent === 'HEALTH_QA') {
      return lang === 'fr'
        ? ['Trouver un spécialiste', 'Réserver une consultation', 'En savoir plus']
        : ['Find a specialist', 'Book a consultation', 'Tell me more'];
    }
    return this.capabilityFollowUps(lang);
  }
  private resultFollowUps(intent: AgentIntent, lang: string): string[] {
    if (intent === 'FIND_PROVIDER') return lang === 'fr' ? ['Réserver avec le premier', 'Qui fait des consultations vidéo ?', 'Voir leurs tarifs'] : ['Book the first one', 'Who does video calls?', 'Show their prices'];
    if (intent === 'FIND_ORGANISATION') return lang === 'fr' ? ['Voir leurs médecins', 'Le plus proche de moi', 'Prendre rendez-vous'] : ['Show their doctors', 'Closest to me', 'Book an appointment'];
    if (intent === 'FIND_PRODUCT') return lang === 'fr' ? ['Où l’acheter ?', 'Faut-il une ordonnance ?', 'Voir des alternatives'] : ['Where to buy it?', 'Do I need a prescription?', 'Show alternatives'];
    return this.capabilityFollowUps(lang);
  }
  private fallbackReply(intent: AgentIntent, summary: string, lang: string): string {
    if (!summary) {
      return lang === 'fr' ? "Je n'ai rien trouvé qui corresponde. Voulez-vous élargir la recherche ?" : "I couldn't find a match. Want me to broaden the search?";
    }
    if (intent === 'FIND_PROVIDER') return lang === 'fr' ? 'Voici ce que j’ai trouvé. Souhaitez-vous réserver ?' : 'Here is what I found. Would you like to book?';
    if (intent === 'FIND_ORGANISATION') return lang === 'fr' ? 'Voici des organisations correspondantes.' : 'Here are some matching organisations.';
    if (intent === 'FIND_PRODUCT') return lang === 'fr' ? 'Voici des produits correspondants.' : 'Here are some matching products.';
    return lang === 'fr' ? 'Voici ce que j’ai trouvé.' : 'Here is what I found.';
  }
  private t(lang: string, key: 'error' | 'bookStart' | 'bookPick', arg?: string): string {
    const fr = lang === 'fr';
    switch (key) {
      case 'error': return fr ? "Désolé, une erreur s'est produite. Réessayez." : 'Sorry, something went wrong. Please try again.';
      case 'bookStart': return fr ? `Parfait, réservons avec ${arg}. Choisissez un créneau ci-dessous.` : `Great, let's book with ${arg}. Pick a slot below.`;
      case 'bookPick': return fr ? "Avec qui souhaitez-vous réserver ? Voici quelques options." : 'Who would you like to book with? Here are some options.';
      default: return '';
    }
  }

  // ── Groq helper ──────────────────────────────────────────────────────────
  private async groq(messages: { role: string; content: string }[], opts: { json?: boolean; max?: number; temp?: number } = {}): Promise<string | null> {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: GROQ_MODEL, temperature: opts.temp ?? 0, max_tokens: opts.max ?? 400,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
          messages,
        }),
      });
      if (!res.ok) { this.logger.warn(`Groq returned ${res.status}`); return null; }
      const j: any = await res.json();
      return j?.choices?.[0]?.message?.content?.trim() ?? null;
    } catch (e: any) {
      this.logger.warn(`Groq call failed: ${e?.message}`);
      return null;
    }
  }
}

interface ResolvedProvider {
  id: string; name: string; userType: string;
  profileImage: string | null; address: string | null; verified: boolean; score: number;
}
