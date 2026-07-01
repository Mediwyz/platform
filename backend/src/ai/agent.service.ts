import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { InventoryService } from '../inventory/inventory.service';
import { AiService } from './ai.service';
import { HealthTrackerService } from './health-tracker.service';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
// Env-configurable so we can swap models without a redeploy (e.g. if Groq
// deprecates one). Default stays on the current stable text model.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const PROVIDER_TYPES = [
  'DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
  'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST',
];

export type AgentIntent =
  | 'GREETING' | 'SMALL_TALK' | 'MEDIWYZ_INFO'
  | 'FIND_PROVIDER' | 'FIND_ORGANISATION' | 'FIND_PRODUCT' | 'BUY_PRODUCT'
  | 'BOOK' | 'MY_BOOKINGS' | 'MY_ORDERS' | 'MY_PRESCRIPTIONS' | 'MY_WALLET' | 'MY_LAB_RESULTS' | 'MY_INVOICES' | 'MY_HEALTH' | 'LOG_HEALTH' | 'MY_FAVORITES' | 'PROVIDER_REVIEWS'
  | 'WHY' | 'HEALTH_QA' | 'OUT_OF_SCOPE';

const INTENTS: AgentIntent[] = [
  'GREETING', 'SMALL_TALK', 'MEDIWYZ_INFO', 'FIND_PROVIDER', 'FIND_ORGANISATION',
  'FIND_PRODUCT', 'BUY_PRODUCT', 'BOOK', 'MY_BOOKINGS', 'MY_ORDERS', 'MY_PRESCRIPTIONS', 'MY_WALLET', 'MY_LAB_RESULTS', 'MY_INVOICES', 'MY_HEALTH', 'LOG_HEALTH', 'MY_FAVORITES', 'PROVIDER_REVIEWS',
  'WHY', 'HEALTH_QA', 'OUT_OF_SCOPE',
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
  /** Caller-supplied device/browser geolocation for "near me" searches. */
  lat?: number;
  lng?: number;
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
  action?: 'book' | 'buy' | 'topup' | null;
  /** For action:'topup' — amount the user asked to add, if they stated one. */
  topupAmount?: number | null;
  /** For action:'book' — the day/time the user requested, so the client can
   *  jump straight to it instead of showing the whole week. */
  bookDate?: string | null; // YYYY-MM-DD
  bookTime?: string | null; // HH:MM
  bookProviderId?: string;
  requiresLogin?: boolean;
  /** Generic list render (my bookings, my orders, …). Items may carry inline
   *  actions (e.g. cancel / reschedule a booking) the client dispatches. */
  list?: { kind: string; title: string; items: Array<{ title: string; subtitle?: string; badge?: string; href?: string; actions?: Array<{ kind: string; id: string; label: string; payload?: any }> }> };
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
    private healthTracker: HealthTrackerService,
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
        case 'BUY_PRODUCT': return await this.handleBuyProduct(message, entities, language, input);
        case 'MY_BOOKINGS': return await this.handleMyBookings(entities, language, input);
        case 'MY_ORDERS': return await this.handleMyOrders(entities, language, input);
        case 'MY_PRESCRIPTIONS': return await this.handleMyPrescriptions(entities, language, input);
        case 'MY_WALLET': return await this.handleMyWallet(message, entities, language, input);
        case 'MY_LAB_RESULTS': return await this.handleMyLabResults(entities, language, input);
        case 'MY_INVOICES': return await this.handleMyInvoices(entities, language, input);
        case 'MY_HEALTH': return await this.handleMyHealth(entities, language, input);
        case 'LOG_HEALTH': return await this.handleLogHealth(message, entities, language, input);
        case 'MY_FAVORITES': return await this.handleMyFavorites(entities, language, input);
        case 'PROVIDER_REVIEWS': return await this.handleProviderReviews(entities, language, input);
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
- FIND_PRODUCT: browsing/looking for a medicine / health-shop product (not yet buying). ALSO use this when the user describes a minor symptom or need that an over-the-counter product addresses (pain, fever, headache, cough, cold, sore throat, allergy, nausea, vitamins, first aid) and isn't explicitly asking only for advice — they likely want a product.
- BUY_PRODUCT: wants to BUY / order / purchase a product ("I want to buy paracetamol", "commander du paracétamol", "acheter des vitamines").
- (Reserve HEALTH_QA for genuine advice/explanation questions with no product or provider need — "why am I tired", "how much water should I drink".)
- BOOK: wants to book/appoint/reserve with someone (often refersToPrevious).
- MY_BOOKINGS: asks about THEIR OWN existing appointments/bookings ("my appointments", "mes rendez-vous", "do I have anything booked", "ma prochaine consultation").
- MY_ORDERS: asks about THEIR OWN Health Shop orders ("my orders", "where is my order", "mes commandes", "le statut de ma commande").
- MY_PRESCRIPTIONS: asks about THEIR OWN prescriptions ("my prescriptions", "mes ordonnances", "ma dernière ordonnance").
- MY_WALLET: asks about THEIR OWN wallet/balance ("my balance", "mon solde", "combien j'ai sur mon compte", "mon portefeuille").
- MY_LAB_RESULTS: asks about THEIR OWN lab tests/results ("my lab results", "mes analyses", "mes résultats d'analyse", "le résultat de mon test").
- MY_INVOICES: asks about THEIR OWN invoices/receipts ("my invoices", "mes factures", "mon reçu").
- MY_HEALTH: asks for THEIR OWN health snapshot/tracker dashboard ("my health dashboard", "mon bilan du jour", "combien de calories aujourd'hui", "ma journée santé").
- LOG_HEALTH: the user REPORTS an activity to track — water, exercise or sleep ("j'ai bu 500ml", "I drank a glass of water", "j'ai couru 30 min", "I slept 7 hours").
- MY_FAVORITES: asks for THEIR OWN saved/favourite providers ("my favourites", "mes favoris", "mes prestataires préférés").
- PROVIDER_REVIEWS: asks for reviews/ratings of a named provider ("reviews of Dr Rakoto", "avis sur le Dr X", "is she well rated").
- WHY: any question starting with or meaning "why / pourquoi / explain / how come".
- HEALTH_QA: a general health/medical/wellness question (symptoms, advice, nutrition).
- OUT_OF_SCOPE: clearly unrelated to health or MediWyz.
Map serviceMode synonyms: "office/in clinic"→in_person, "call/phone"→audio, "video/online/téléconsultation"→video, "at home/à domicile/home visit"→home.
KEY DISTINCTION — possessive/existing ("my", "mes", "ma", "où est/sont", "track", "statut de") about something the user ALREADY has → MY_BOOKINGS / MY_ORDERS, NOT a new request:
- "mes rendez-vous" / "show my appointments" / "do I have anything booked" → MY_BOOKINGS
- "réserver un médecin" / "book a doctor" / "je veux un rendez-vous" → BOOK
- "mes commandes" / "où sont mes commandes" / "track my order" / "my orders" → MY_ORDERS
- "acheter du paracétamol" / "commander des vitamines" / "I want to buy X" → BUY_PRODUCT`;
    const user = (hist ? `Conversation so far:\n${hist}\n\n` : '') + `New message: ${message}`;
    const raw = await this.groq([{ role: 'system', content: sys }, { role: 'user', content: user }], { json: true, max: 400, temp: 0 });

    if (!raw) return { ...this.heuristic(message), intent: this.strongHeuristic(message) ?? this.heuristic(message).intent, language: this.guessLang(message) };
    try {
      const p = JSON.parse(raw);
      // The small classifier model is unreliable on the 13-intent set; a
      // deterministic override guarantees the unambiguous cases route correctly.
      const intent: AgentIntent = this.strongHeuristic(message) ?? (INTENTS.includes(p?.intent) ? p.intent : this.heuristic(message).intent);
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
      return { ...this.heuristic(message), intent: this.strongHeuristic(message) ?? this.heuristic(message).intent, language: this.guessLang(message) };
    }
  }

  /** High-confidence deterministic routing for unambiguous phrasings. Returns
   *  null when the request is ambiguous (then we trust the LLM classifier). */
  private strongHeuristic(message: string): AgentIntent | null {
    // Strip accents (NFD → drop combining marks) so the [ée]-style patterns
    // match regardless of how é is encoded in the source vs the incoming text.
    const m = message.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    // Possessive / existing → "my …"
    if (/\b(mes|my|ma)\b[^.?!]*\b(rendez|appointment|consultation|booking|r[ée]servation)/.test(m)) return 'MY_BOOKINGS';
    if (/\b(do i have|ai[- ]?je)\b[^.?!]*\b(rendez|appointment|book)/.test(m)) return 'MY_BOOKINGS';
    if (/\b(mes|my|ma)\b[^.?!]*\b(commandes?|orders?)\b/.test(m)) return 'MY_ORDERS';
    if (/(o[uù][^.?!]*(commande|order)|track[^.?!]*(order|commande)|order status|statut[^.?!]*commande)/.test(m)) return 'MY_ORDERS';
    if (/\b(mes|my|ma)\b[^.?!]*\b(ordonnances?|prescriptions?)\b/.test(m)) return 'MY_PRESCRIPTIONS';
    if (/\b(mon|my|ma)\b[^.?!]*\b(solde|balance|portefeuille|wallet|cr[ée]dit)\b/.test(m) || /(combien[^.?!]*(solde|cr[ée]dit|compte)|how much[^.?!]*balance)/.test(m)) return 'MY_WALLET';
    if (/(recharg|top.?up|alimenter|approvisionner)[^.?!]*(wallet|portefeuille|solde|compte|account)?|add (money|funds|credit|cash)[^.?!]*(wallet|account|balance)?/.test(m)) return 'MY_WALLET';
    if (/\b(mes|my)\b[^.?!]*\b(analyses?|laboratoire|lab\s*results?)\b/.test(m) || /\b(mes|my)\b[^.?!]*r[ée]sultats?[^.?!]*(analyse|labo|test)/.test(m)) return 'MY_LAB_RESULTS';
    if (/\b(mes|my|ma|mon)\b[^.?!]*(facture|invoice|recu|receipt)/.test(m)) return 'MY_INVOICES';
    if (/\b(my|mon|ma)\b[^.?!]*(tableau de bord|dashboard|bilan|health (dashboard|summary|snapshot|stats)|journee sante)/.test(m) || /(combien[^.?!]*calories|how many calories|mes calories|today'?s? (health|calories|stats))/.test(m)) return 'MY_HEALTH';
    if (/(j'?ai (bu|mang|cour|march|dorm)|i (drank|ate|ran|walked|slept|had)|\d+\s*ml\b|dorm\s*\d|log (water|sleep|exercise|food))/.test(m)) return 'LOG_HEALTH';
    if (/\b(mes|my)\b[^.?!]*(favoris|favourite|favorite|preferes?|prefered)/.test(m)) return 'MY_FAVORITES';
    if (/(avis|reviews?|ratings?|note)[^.?!]*(sur|de|of|for|on|about|du|de la)\b/.test(m) || /\b(reviews?|avis) (of|for|on|sur|de)\b/.test(m)) return 'PROVIDER_REVIEWS';
    // Purchase vs booking (checked before the generic BOOK pattern)
    if (/\b(buy|acheter|commander|order)\b[^.?!]*\b(m[ée]dicament|parac[ée]tamol|paracetamol|doliprane|vitamine?s?|comprim|medicine|drug|tablet|produit)/.test(m)) return 'BUY_PRODUCT';
    if (/\b(book|r[ée]serv|prendre[^.?!]{0,8}rendez|appointment)/.test(m)) return 'BOOK';
    return null;
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
    // "near me" → distance-sorted, when the client supplied geolocation.
    if (!providers.length && this.wantsNearby(message) && _input.lat != null && _input.lng != null) {
      providers = await this.nearbyProviders(_input.lat, _input.lng, entities.providerType);
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
    // The small classifier often omits orgType — derive it deterministically
    // from the message so "a laboratory near me" actually filters to labs.
    const orgType = entities.orgType || this.deriveOrgType(message);
    if (entities.orgName) {
      const o = await this.resolveOrg(entities.orgName);
      if (o) { organisations = [this.orgCard(o)]; resolved.push({ kind: 'organisation', id: o.id, name: o.name }); }
    }
    // "near me" → distance-sorted, when the client supplied geolocation.
    if (!organisations.length && this.wantsNearby(message) && _input.lat != null && _input.lng != null) {
      organisations = await this.nearbyOrgs(_input.lat, _input.lng, orgType);
    }
    if (!organisations.length) {
      const q = entities.orgName || entities.location || message;
      const r = await this.search.searchOrganizations(q, orgType, entities.location, undefined, 1, 6);
      organisations = (r.data || []).map((e: any) => this.orgCard(e)).slice(0, 6);
    }
    const { reply, followUps } = await this.compose('FIND_ORGANISATION', this.summarizeOrgs(organisations), message, language);
    return { intent: 'FIND_ORGANISATION', entities, reply, organisations, resolved, followUps };
  }

  private async handleFindProduct(message: string, entities: AgentEntities, language: string, _input: AgentInput): Promise<AgentResult> {
    const r = await this.inventory.semanticProductSearch(entities.productName || message, { limit: 6 });
    const products = (r.items || []).map((i: any) => this.productCard(i)).slice(0, 6);
    const { reply, followUps } = await this.compose('FIND_PRODUCT', this.summarizeProducts(products), message, language);
    return { intent: 'FIND_PRODUCT', entities, reply, products, followUps };
  }

  private async handleBuyProduct(message: string, entities: AgentEntities, language: string, _input: AgentInput): Promise<AgentResult> {
    const r = await this.inventory.semanticProductSearch(entities.productName || message, { limit: 6 });
    const products = (r.items || []).map((i: any) => this.productCard(i)).slice(0, 6);
    const fr = language === 'fr';
    const reply = products.length
      ? (fr ? 'Voici ce que j’ai trouvé. Touchez « Acheter » pour choisir la quantité et la livraison.' : 'Here’s what I found. Tap “Buy” to choose quantity and delivery.')
      : (fr ? "Je n'ai pas trouvé ce produit. Essayez un autre nom." : "I couldn't find that product. Try another name.");
    const followUps = products.length
      ? (fr ? ['Acheter le premier', 'Voir les alternatives', 'Faut-il une ordonnance ?'] : ['Buy the first one', 'Show alternatives', 'Do I need a prescription?'])
      : this.capabilityFollowUps(language);
    // Buying requires an account (delivery/pickup + order history). The client
    // opens the purchase sub-flow and gates on login before placing the order.
    return { intent: 'BUY_PRODUCT', entities, reply, products, action: 'buy', requiresLogin: true, followUps };
  }

  private loginRequired(intent: AgentIntent, language: string): AgentResult {
    const fr = language === 'fr';
    return {
      intent, entities: {},
      reply: fr ? 'Connectez-vous pour voir vos informations personnelles (rendez-vous, commandes…).' : 'Sign in to see your personal info (appointments, orders…).',
      requiresLogin: true,
      followUps: this.capabilityFollowUps(language),
    };
  }

  private async handleMyBookings(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_BOOKINGS', language);
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId: input.userId }, select: { id: true } });
    const bookings = profile ? await this.prisma.serviceBooking.findMany({
      where: { patientId: profile.id },
      orderBy: { scheduledAt: 'desc' }, take: 8,
      select: { id: true, type: true, providerUserId: true, providerName: true, scheduledAt: true, status: true, serviceName: true },
    }) : [];
    const cancellable = (s: string) => !['cancelled', 'completed', 'delivered'].includes((s || '').toLowerCase());
    const items = bookings.map(b => ({
      title: b.serviceName || (fr ? 'Consultation' : 'Appointment'),
      subtitle: [b.providerName, b.scheduledAt ? new Date(b.scheduledAt).toLocaleString(fr ? 'fr-FR' : 'en-GB') : null].filter(Boolean).join(' · '),
      badge: (b.status || '').replace(/_/g, ' '),
      href: '/bookings',
      actions: cancellable(b.status) ? [
        { kind: 'reschedule_booking', id: b.id, label: fr ? 'Reporter' : 'Reschedule', payload: { bookingType: b.type || 'service', providerUserId: b.providerUserId, providerName: b.providerName } },
        { kind: 'cancel_booking', id: b.id, label: fr ? 'Annuler' : 'Cancel', payload: { bookingType: b.type || 'service' } },
      ] : undefined,
    }));
    const reply = items.length
      ? (fr ? `Voici vos rendez-vous (${items.length}).` : `Here are your appointments (${items.length}).`)
      : (fr ? "Vous n'avez aucun rendez-vous pour le moment. Voulez-vous en réserver un ?" : 'You have no appointments yet. Want to book one?');
    return {
      intent: 'MY_BOOKINGS', entities, reply,
      list: items.length ? { kind: 'bookings', title: fr ? 'Mes rendez-vous' : 'My appointments', items } : undefined,
      followUps: items.length ? (fr ? ['Réserver un rendez-vous', 'Trouver un médecin'] : ['Book an appointment', 'Find a doctor']) : this.capabilityFollowUps(language),
    };
  }

  private async handleMyOrders(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_ORDERS', language);
    const orders = await this.prisma.inventoryOrder.findMany({
      where: { patientUserId: input.userId },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { status: true, totalAmount: true, currency: true, deliveryType: true, createdAt: true, items: { select: { quantity: true, inventoryItem: { select: { name: true } } } } },
    });
    const items = orders.map(o => ({
      title: o.items.map(i => `${i.quantity}× ${i.inventoryItem?.name ?? 'article'}`).join(', ') || (fr ? 'Commande' : 'Order'),
      subtitle: `${o.currency || 'Rs'} ${o.totalAmount} · ${o.deliveryType === 'delivery' ? (fr ? 'Livraison' : 'Delivery') : (fr ? 'Retrait' : 'Pickup')} · ${new Date(o.createdAt).toLocaleDateString(fr ? 'fr-FR' : 'en-GB')}`,
      badge: (o.status || '').replace(/_/g, ' '),
      href: '/orders',
    }));
    const reply = items.length
      ? (fr ? `Voici vos commandes (${items.length}).` : `Here are your orders (${items.length}).`)
      : (fr ? "Vous n'avez aucune commande. Voulez-vous commander quelque chose ?" : 'You have no orders yet. Want to order something?');
    return {
      intent: 'MY_ORDERS', entities, reply,
      list: items.length ? { kind: 'orders', title: fr ? 'Mes commandes' : 'My orders', items } : undefined,
      followUps: items.length ? (fr ? ['Commander un médicament', 'Voir le Health Shop'] : ['Order a medicine', 'Browse the Health Shop']) : this.capabilityFollowUps(language),
    };
  }

  private async handleMyPrescriptions(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_PRESCRIPTIONS', language);
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId: input.userId }, select: { id: true } });
    const rx = profile ? await this.prisma.prescription.findMany({
      where: { patientId: profile.id },
      orderBy: { date: 'desc' }, take: 8,
      select: { date: true, diagnosis: true, isActive: true, medicines: { select: { medicine: { select: { name: true } } } } },
    }) : [];
    const items = rx.map(r => ({
      title: r.medicines.map(m => m.medicine?.name).filter(Boolean).join(', ') || r.diagnosis || (fr ? 'Ordonnance' : 'Prescription'),
      subtitle: [r.diagnosis, r.date ? new Date(r.date).toLocaleDateString(fr ? 'fr-FR' : 'en-GB') : null].filter(Boolean).join(' · '),
      badge: r.isActive ? 'active' : (fr ? 'expirée' : 'past'),
      href: '/prescriptions',
    }));
    const reply = items.length
      ? (fr ? `Voici vos ordonnances (${items.length}).` : `Here are your prescriptions (${items.length}).`)
      : (fr ? "Vous n'avez aucune ordonnance pour le moment." : 'You have no prescriptions yet.');
    return {
      intent: 'MY_PRESCRIPTIONS', entities, reply,
      list: items.length ? { kind: 'prescriptions', title: fr ? 'Mes ordonnances' : 'My prescriptions', items } : undefined,
      followUps: fr ? ['Commander un médicament', 'Trouver un médecin'] : ['Order a medicine', 'Find a doctor'],
    };
  }

  private async handleMyWallet(message: string, entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    const m = message.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const wantsTopUp = /(recharg|top.?up|add (money|funds|credit|cash)|ajouter[^.?!]*(argent|credit|fonds|sous)|alimenter|approvisionner)/.test(m);
    // Top-up mirrors the buy flow: offer the amount picker even to guests and
    // gate at submission (client opens signup, then tops up). So action:'topup'
    // is returned regardless of auth — only the balance line is auth-dependent.
    if (wantsTopUp) {
      const w = input.userId
        ? await this.prisma.userWallet.findUnique({ where: { userId: input.userId }, select: { balance: true, currency: true } })
        : null;
      const balLine = w ? `${w.currency || 'Rs'} ${w.balance ?? 0}` : null;
      const amt = m.match(/(\d[\d\s.,]*)\s*(rs|mur|rupees?|roupies?)?/);
      const topupAmount = amt ? Math.round(parseFloat(amt[1].replace(/[\s,]/g, ''))) : null;
      return {
        intent: 'MY_WALLET', entities, action: 'topup', topupAmount: topupAmount || null, requiresLogin: !input.userId,
        reply: fr
          ? `${balLine ? `Votre solde est de ${balLine}. ` : ''}Combien souhaitez-vous ajouter ?`
          : `${balLine ? `Your balance is ${balLine}. ` : ''}How much would you like to add?`,
        followUps: fr ? ['Rs 500', 'Rs 1000', 'Rs 2000'] : ['Rs 500', 'Rs 1000', 'Rs 2000'],
      };
    }
    if (!input.userId) return this.loginRequired('MY_WALLET', language);
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId: input.userId }, select: { balance: true, currency: true } });
    const cur = wallet?.currency || 'Rs';
    const bal = `${cur} ${wallet?.balance ?? 0}`;
    const reply = wallet
      ? (fr ? `Votre solde est de ${bal}.` : `Your wallet balance is ${bal}.`)
      : (fr ? "Je ne trouve pas votre portefeuille — êtes-vous connecté ?" : "I couldn't find your wallet — are you signed in?");
    return {
      intent: 'MY_WALLET', entities, reply,
      followUps: fr ? ['Recharger mon portefeuille', 'Mes commandes'] : ['Top up my wallet', 'My orders'],
    };
  }

  private async handleMyLabResults(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_LAB_RESULTS', language);
    const profile = await this.prisma.patientProfile.findUnique({ where: { userId: input.userId }, select: { id: true } });
    const tests = profile ? await this.prisma.labTest.findMany({
      where: { patientId: profile.id },
      orderBy: { orderedAt: 'desc' }, take: 8,
      select: { testName: true, category: true, status: true, facility: true, orderedAt: true },
    }) : [];
    const items = tests.map(t => ({
      title: t.testName || (fr ? 'Analyse' : 'Lab test'),
      subtitle: [t.category, t.facility, t.orderedAt ? new Date(t.orderedAt).toLocaleDateString(fr ? 'fr-FR' : 'en-GB') : null].filter(Boolean).join(' · '),
      badge: (t.status || '').replace(/_/g, ' '),
      href: '/lab-results',
    }));
    const reply = items.length
      ? (fr ? `Voici vos analyses (${items.length}).` : `Here are your lab tests (${items.length}).`)
      : (fr ? "Vous n'avez aucune analyse pour le moment." : 'You have no lab tests yet.');
    return {
      intent: 'MY_LAB_RESULTS', entities, reply,
      list: items.length ? { kind: 'lab_results', title: fr ? 'Mes analyses' : 'My lab tests', items } : undefined,
      followUps: fr ? ['Trouver un laboratoire', 'Réserver une analyse'] : ['Find a lab', 'Book a test'],
    };
  }

  private async handleMyInvoices(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_INVOICES', language);
    const invoices = await this.prisma.invoice.findMany({
      where: { patientUserId: input.userId },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { invoiceNumber: true, description: true, amount: true, currency: true, status: true, createdAt: true },
    });
    const items = invoices.map(i => ({
      title: i.description || (fr ? 'Facture' : 'Invoice'),
      subtitle: `${i.currency || 'Rs'} ${i.amount} · #${i.invoiceNumber} · ${new Date(i.createdAt).toLocaleDateString(fr ? 'fr-FR' : 'en-GB')}`,
      badge: (i.status || '').replace(/_/g, ' '),
      href: '/billing',
    }));
    const reply = items.length
      ? (fr ? `Voici vos factures (${items.length}).` : `Here are your invoices (${items.length}).`)
      : (fr ? "Vous n'avez aucune facture pour le moment." : 'You have no invoices yet.');
    return {
      intent: 'MY_INVOICES', entities, reply,
      list: items.length ? { kind: 'invoices', title: fr ? 'Mes factures' : 'My invoices', items } : undefined,
      followUps: fr ? ['Mon solde', 'Mes rendez-vous'] : ['My balance', 'My appointments'],
    };
  }

  private async handleMyHealth(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_HEALTH', language);
    let d: any = null;
    try { d = await this.healthTracker.getDashboard(input.userId); } catch { /* */ }
    if (!d) {
      return { intent: 'MY_HEALTH', entities, reply: fr ? "Je n'ai pas encore de données santé pour aujourd'hui." : 'No health data for today yet.', followUps: this.talkFollowUps('HEALTH_QA', language) };
    }
    const sleepH = d.sleepDurationMin ? (d.sleepDurationMin / 60).toFixed(1) : '0';
    const reply = fr
      ? `Aujourd'hui : ${d.caloriesConsumed ?? 0} kcal consommées (${d.caloriesRemaining ?? 0} restantes), ${d.waterConsumedMl ?? 0} ml d'eau, ${d.exerciseMinutes ?? 0} min d'exercice, ${sleepH} h de sommeil.`
      : `Today: ${d.caloriesConsumed ?? 0} kcal eaten (${d.caloriesRemaining ?? 0} left), ${d.waterConsumedMl ?? 0} ml water, ${d.exerciseMinutes ?? 0} min exercise, ${sleepH} h sleep.`;
    return {
      intent: 'MY_HEALTH', entities, reply,
      followUps: fr ? ['Suggère un plan de repas', 'Conseils pour mieux dormir'] : ['Suggest a meal plan', 'How to sleep better'],
    };
  }

  private async handleLogHealth(message: string, entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('LOG_HEALTH', language);
    const m = message.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const snap = fr ? ['Mon bilan du jour'] : ['My health snapshot'];
    try {
      // Water
      if (/(bu|drank|boire|water|eau|verre|glass)/.test(m)) {
        let ml = 0;
        const mlM = m.match(/(\d+)\s*ml/);
        const lM = m.match(/(\d+([.,]\d+)?)\s*(l|litre|liter)\b/);
        const gM = m.match(/(\d+)\s*(verre|glass)/);
        if (mlM) ml = parseInt(mlM[1], 10);
        else if (lM) ml = Math.round(parseFloat(lM[1].replace(',', '.')) * 1000);
        else if (gM) ml = parseInt(gM[1], 10) * 250;
        else ml = 250;
        await this.healthTracker.createWaterEntry(input.userId, { amountMl: ml });
        return { intent: 'LOG_HEALTH', entities, reply: fr ? `💧 Noté : ${ml} ml d'eau ajoutés.` : `💧 Logged ${ml} ml of water.`, followUps: snap };
      }
      // Exercise
      if (/(cour|march|sport|gym|exercice|workout|ran|walk|jog|exercise|nage|swim)/.test(m)) {
        const min = parseInt((m.match(/(\d+)\s*(min|minute|h|heure|hour)/) || [])[1] || '30', 10);
        const type = /cour|ran|jog|run/.test(m) ? (fr ? 'Course' : 'Running') : /march|walk/.test(m) ? (fr ? 'Marche' : 'Walking') : /nage|swim/.test(m) ? (fr ? 'Natation' : 'Swimming') : (fr ? 'Exercice' : 'Exercise');
        await this.healthTracker.createExerciseEntry(input.userId, { exerciseType: type, durationMin: min, caloriesBurned: Math.round(min * 6) });
        return { intent: 'LOG_HEALTH', entities, reply: fr ? `🏃 Noté : ${min} min de ${type.toLowerCase()}.` : `🏃 Logged ${min} min of ${type.toLowerCase()}.`, followUps: snap };
      }
      // Sleep
      if (/(dorm|sommeil|slept|sleep)/.test(m)) {
        const hM = m.match(/(\d+([.,]\d+)?)\s*(h|heure|hour)/);
        const hours = hM ? parseFloat(hM[1].replace(',', '.')) : 8;
        await this.healthTracker.upsertSleepEntry(input.userId, { durationMin: Math.round(hours * 60) });
        return { intent: 'LOG_HEALTH', entities, reply: fr ? `😴 Noté : ${hours} h de sommeil.` : `😴 Logged ${hours} h of sleep.`, followUps: fr ? ['Mon bilan du jour', 'Conseils pour mieux dormir'] : ['My health snapshot', 'How to sleep better'] };
      }
      // Food (LLM-estimated calories/macros for the described meal)
      if (/(mang|ate|eaten|eat|repas|petit.?dejeuner|dejeuner|diner|breakfast|lunch|dinner|snack)/.test(m)) {
        const food = message.replace(/.*\b(j'?ai mang[ée]?s?|mang[ée]+s?|i ate|eaten|i eat|i had)\b/i, '').trim() || message;
        const est = await this.estimateFood(food);
        const cal = Math.max(0, Math.round(est.calories || 0));
        await this.healthTracker.createFoodEntry(input.userId, {
          name: est.name || food.slice(0, 60), mealType: ['breakfast', 'lunch', 'dinner', 'snack'].includes(est.mealType) ? est.mealType : 'snack',
          calories: cal, protein: est.protein, carbs: est.carbs, fat: est.fat,
        });
        return { intent: 'LOG_HEALTH', entities, reply: fr ? `🍽️ Noté : ${est.name || food} (~${cal} kcal).` : `🍽️ Logged ${est.name || food} (~${cal} kcal).`, followUps: snap };
      }
    } catch { /* */ }
    return {
      intent: 'LOG_HEALTH', entities,
      reply: fr ? "Dites-moi quoi enregistrer, par ex. « j'ai bu 500 ml » ou « j'ai dormi 7h »." : 'Tell me what to log, e.g. "I drank 500 ml" or "I slept 7h".',
      followUps: fr ? ['J\'ai bu 500 ml', 'J\'ai dormi 7h'] : ['I drank 500 ml', 'I slept 7h'],
    };
  }

  private async estimateFood(food: string): Promise<any> {
    const raw = await this.groq([
      { role: 'system', content: 'Estimate nutrition for a described food/meal for a typical single serving. Reply ONLY JSON: {"name": short label, "mealType": one of breakfast|lunch|dinner|snack, "calories": number, "protein": number, "carbs": number, "fat": number}.' },
      { role: 'user', content: food },
    ], { json: true, max: 150, temp: 0 });
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  }

  private async handleMyFavorites(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_FAVORITES', language);
    const favs = await this.prisma.providerFavorite.findMany({
      where: { userId: input.userId },
      include: { provider: { select: { id: true, firstName: true, lastName: true, userType: true } } },
      orderBy: { createdAt: 'desc' }, take: 10,
    });
    const items = favs.filter(f => f.provider).map(f => ({
      title: `${f.provider!.firstName} ${f.provider!.lastName}`.trim(),
      subtitle: (f.provider!.userType || '').toLowerCase().replace(/_/g, ' '),
      href: `/profile/${f.providerId}`,
    }));
    const reply = items.length
      ? (fr ? `Voici vos prestataires favoris (${items.length}).` : `Here are your favourite providers (${items.length}).`)
      : (fr ? "Vous n'avez aucun favori. Touchez ❤ sur un prestataire pour l'ajouter." : 'You have no favourites yet. Tap ❤ on a provider to add one.');
    return {
      intent: 'MY_FAVORITES', entities, reply,
      list: items.length ? { kind: 'favorites', title: fr ? 'Mes favoris' : 'My favourites', items } : undefined,
      followUps: fr ? ['Trouver un médecin', 'Mes rendez-vous'] : ['Find a doctor', 'My appointments'],
    };
  }

  private async handleProviderReviews(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    let prov: ResolvedProvider | null = null;
    if (entities.providerName) prov = await this.resolveProvider(entities.providerName, entities.providerType);
    if (!prov && input.lastProviderIds?.length === 1) prov = await this.providerById(input.lastProviderIds[0]);
    if (!prov) {
      return { intent: 'PROVIDER_REVIEWS', entities, reply: fr ? 'De quel prestataire souhaitez-vous voir les avis ?' : 'Whose reviews would you like to see?', followUps: this.capabilityFollowUps(language) };
    }
    const reviews = await this.prisma.providerReview.findMany({
      where: { providerUserId: prov.id },
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { rating: true, comment: true, createdAt: true, reviewerUser: { select: { firstName: true } } },
    });
    const items = reviews.map(r => {
      const n = Math.max(1, Math.min(5, r.rating));
      return {
        title: `${'★'.repeat(n)}${'☆'.repeat(5 - n)} ${r.comment}`.slice(0, 120),
        subtitle: `${r.reviewerUser?.firstName ?? (fr ? 'Anonyme' : 'Anonymous')} · ${new Date(r.createdAt).toLocaleDateString(fr ? 'fr-FR' : 'en-GB')}`,
      };
    });
    const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
    const reply = items.length
      ? (fr ? `${prov.name} — note moyenne ${avg}/5 (${items.length} avis).` : `${prov.name} — average ${avg}/5 (${items.length} reviews).`)
      : (fr ? `${prov.name} n'a pas encore d'avis.` : `${prov.name} has no reviews yet.`);
    return {
      intent: 'PROVIDER_REVIEWS', entities, reply,
      providers: [this.providerCard(prov)],
      list: items.length ? { kind: 'reviews', title: fr ? `Avis — ${prov.name}` : `Reviews — ${prov.name}`, items } : undefined,
      resolved: [{ kind: 'provider', id: prov.id, name: prov.name }],
      followUps: fr ? [`Réserver avec ${prov.name.split(' ')[0]}`, 'Voir ses tarifs'] : [`Book ${prov.name.split(' ')[0]}`, 'See prices'],
    };
  }

  private async handleBook(message: string, entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    let prov: ResolvedProvider | null = null;
    if (entities.providerName) prov = await this.resolveProvider(entities.providerName, entities.providerType);
    if (!prov && input.lastProviderIds?.length === 1) prov = await this.providerById(input.lastProviderIds[0]);

    if (prov) {
      const { date, time } = this.parseRequestedDateTime(message, entities.date);
      return {
        intent: 'BOOK', entities,
        reply: this.t(language, 'bookStart', prov.name),
        providers: [this.providerCard(prov)],
        resolved: [{ kind: 'provider', id: prov.id, name: prov.name }],
        action: 'book', bookProviderId: prov.id, bookDate: date ?? null, bookTime: time ?? null,
        followUps: [],
      };
    }
    // Several providers were just shown and the user didn't name one → ask which,
    // re-using those exact results. Never blind-search the raw "book Tuesday at 2pm"
    // string (it has no provider keyword → unrelated matches).
    if (input.lastProviderIds && input.lastProviderIds.length > 1) {
      const cards = await this.providersByIds(input.lastProviderIds);
      if (cards.length > 1) {
        return {
          intent: 'BOOK', entities,
          reply: this.t(language, 'bookWhich'),
          providers: cards,
          followUps: cards.slice(0, 3).map(c => `${language === 'fr' ? 'Réserver avec' : 'Book'} ${c.name.split(' ')[0]}`),
        };
      }
    }
    // Nothing to disambiguate → run a proper provider search to help them pick.
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
         WHERE "accountStatus" = 'active' AND "userType"::text = ANY($2::text[])
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

  private wantsNearby(message: string): boolean {
    const m = message.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return /(near ?(me|by)|nearest|closest|around me|pres de (moi|chez)|le plus proche|a proximite|autour de moi)/.test(m);
  }

  /** Map free text to a HealthcareEntity.type key (pharmacy/clinic/hospital/
   *  laboratory/insurance). The classifier frequently omits this. */
  private deriveOrgType(message: string): string | undefined {
    const m = message.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (/\b(pharmac|chemist|drugstore)/.test(m)) return 'pharmacy';
    if (/\b(laborator|laboratoire|\blabo\b|\blab\b|analyses?)/.test(m)) return 'laboratory';
    if (/\b(hospital|hopital|hopita|chu\b)/.test(m)) return 'hospital';
    if (/\b(clinic|clinique)/.test(m)) return 'clinic';
    if (/\b(insuranc|assuranc|mutuelle)/.test(m)) return 'insurance';
    return undefined;
  }

  /** Parse a requested day + time from the message (and the classifier's date
   *  phrase) into {date: YYYY-MM-DD, time: HH:MM} so booking can jump to it.
   *  Handles today/tomorrow, weekday names (next occurrence), dd/mm, ISO, and
   *  times like "3pm", "15h", "15h30", "14:00" — EN + FR. */
  private parseRequestedDateTime(message: string, datePhrase?: string): { date?: string; time?: string } {
    const src = `${datePhrase || ''} ${message}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const today = new Date();
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let date: string | undefined;
    const isoM = src.match(/(\d{4}-\d{2}-\d{2})/);
    if (isoM) date = isoM[1];
    if (!date) {
      const dm = src.match(/\b(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?\b/);
      if (dm) {
        const dd = +dm[1], mm = +dm[2] - 1;
        const yy = dm[3] ? (dm[3].length === 2 ? 2000 + +dm[3] : +dm[3]) : today.getFullYear();
        const d = new Date(yy, mm, dd);
        if (!isNaN(d.getTime())) date = iso(d);
      }
    }
    if (!date && /\b(after ?tomorrow|apres ?demain|surlendemain)/.test(src)) { const d = new Date(today); d.setDate(d.getDate() + 2); date = iso(d); }
    if (!date && /\b(tomorrow|demain)/.test(src)) { const d = new Date(today); d.setDate(d.getDate() + 1); date = iso(d); }
    if (!date && /\b(today|aujourd|ce soir|tonight)/.test(src)) date = iso(today);
    if (!date) {
      const days = [['sunday', 'dimanche'], ['monday', 'lundi'], ['tuesday', 'mardi'], ['wednesday', 'mercredi'], ['thursday', 'jeudi'], ['friday', 'vendredi'], ['saturday', 'samedi']];
      for (let i = 0; i < 7; i++) {
        if (days[i].some(w => new RegExp(`\\b${w}`).test(src))) {
          const d = new Date(today);
          const delta = ((i - d.getDay() + 7) % 7) || 7; // next occurrence (not today)
          d.setDate(d.getDate() + delta);
          date = iso(d);
          break;
        }
      }
    }
    let time: string | undefined;
    const t = src.match(/\b(\d{1,2})\s*(?::|h)\s*(\d{2})\b/) || src.match(/\b(\d{1,2})\s*(h)\b/) || src.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (t) {
      let hh = +t[1];
      const tok = t[2];
      if (tok === 'pm' && hh < 12) hh += 12;
      if (tok === 'am' && hh === 12) hh = 0;
      const mm = /^\d{2}$/.test(tok) ? tok : '00';
      if (hh >= 0 && hh <= 23) time = `${String(hh).padStart(2, '0')}:${mm}`;
    }
    return { date, time };
  }

  /** Distance-sorted providers via the Haversine formula (km). Returns provider
   *  cards with an extra `distanceKm` field the client can show. */
  private async nearbyProviders(lat: number, lng: number, type?: string): Promise<any[]> {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, "firstName", "lastName", "userType", "profileImage", "address", "verified",
              (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians("latitude")) *
                cos(radians("longitude") - radians($2)) + sin(radians($1)) * sin(radians("latitude"))))) AS dist
       FROM "User"
       WHERE ("accountStatus" = 'active' OR "accountStatus" IS NULL)
         AND "userType"::text = ANY($3::text[])
         AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
       ORDER BY dist ASC LIMIT 5`,
      lat, lng, type ? [type] : PROVIDER_TYPES,
    );
    return rows.map(r => ({ ...this.providerCard(this.rowToProvider(r, 0)), distanceKm: r.dist != null ? Math.round(Number(r.dist) * 10) / 10 : null }));
  }

  /** Distance-sorted organisations (clinics/pharmacies/labs/…) via Haversine.
   *  `type` is the HealthcareEntity.type key (a plain string, no enum cast). */
  private async nearbyOrgs(lat: number, lng: number, type?: string): Promise<any[]> {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, type, city, "logoUrl", "isVerified",
              (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians("latitude")) *
                cos(radians("longitude") - radians($2)) + sin(radians($1)) * sin(radians("latitude"))))) AS dist
       FROM "HealthcareEntity"
       WHERE "isActive" = true
         AND ($3::text IS NULL OR "type" = $3)
         AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
       ORDER BY dist ASC LIMIT 6`,
      lat, lng, type ?? null,
    );
    return rows.map(e => ({ ...this.orgCard(e), distanceKm: e.dist != null ? Math.round(Number(e.dist) * 10) / 10 : null }));
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

  /** Build provider cards for a set of ids, preserving the given order. */
  private async providersByIds(ids: string[]): Promise<any[]> {
    const us = await this.prisma.user.findMany({
      where: { id: { in: ids.slice(0, 6) } },
      select: { id: true, firstName: true, lastName: true, userType: true, profileImage: true, address: true, verified: true },
    });
    const byId = new Map(us.map(u => [u.id, u]));
    return ids.map(id => byId.get(id)).filter(Boolean).map((u: any) => this.providerCard(this.rowToProvider(u, 1)));
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
    // For symptom-driven product/provider queries, lead with a short, safe piece
    // of general health guidance so the agent feels genuinely intelligent.
    const symptomAware = (intent === 'FIND_PRODUCT' || intent === 'BUY_PRODUCT' || intent === 'FIND_PROVIDER')
      ? `\nINTELLIGENT CONTEXT: If the user's message describes a symptom or health need, OPEN with ONE short, safe sentence of general guidance that links the need to the result type — e.g. for products "Pour la fièvre et la douleur, le paracétamol est couramment utilisé", for providers "Pour des douleurs articulaires, un rhumatologue est indiqué". This is general guidance only — never diagnose or prescribe a dose, and add a brief "consultez un professionnel si cela persiste ou s'aggrave" when symptoms could be serious. Then point to the results below. You may give this general health context, but you must STILL NOT invent specific prices, stock, availability or ratings.`
      : '';
    const sys =
`You are Wyzo, MediWyz's warm, concise health agent. Reply in language "${language}". Write a SHORT reply (1-3 sentences) about what was found, then 3 follow-up actions phrased AS IF THE USER is saying them (short, tappable, e.g. "Réserver avec lui", "A-t-il des créneaux cette semaine ?", "Montre-moi ses tarifs").
GROUNDING RULES (critical):
- State ONLY facts present in "Found" (names, type, city). NEVER claim or imply availability, free slots, prices, ratings, or specialties — that data is NOT provided here and asserting it is a hallucination.
- If "Found" is non-empty, be confident and positive; do NOT contradict yourself (never "I found some… however there are none").
- If "Found" is "(nothing)", clearly say nothing matched and suggest broadening the search.
- For availability/pricing the user must tap "Book"/a follow-up; do not state times or amounts yourself.${symptomAware}
Reply ONLY JSON: {"reply": string, "followUps": [string, string, string]}.`;
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
  private t(lang: string, key: 'error' | 'bookStart' | 'bookPick' | 'bookWhich', arg?: string): string {
    const fr = lang === 'fr';
    switch (key) {
      case 'error': return fr ? "Désolé, une erreur s'est produite. Réessayez." : 'Sorry, something went wrong. Please try again.';
      case 'bookStart': return fr ? `Parfait, réservons avec ${arg}. Choisissez un créneau ci-dessous.` : `Great, let's book with ${arg}. Pick a slot below.`;
      case 'bookPick': return fr ? "Avec qui souhaitez-vous réserver ? Voici quelques options." : 'Who would you like to book with? Here are some options.';
      case 'bookWhich': return fr ? 'Avec lequel de ces prestataires souhaitez-vous réserver ?' : 'Which of these providers would you like to book with?';
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
