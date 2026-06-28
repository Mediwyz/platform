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
  | 'FIND_PROVIDER' | 'FIND_ORGANISATION' | 'FIND_PRODUCT' | 'BUY_PRODUCT'
  | 'BOOK' | 'MY_BOOKINGS' | 'MY_ORDERS' | 'MY_PRESCRIPTIONS' | 'MY_WALLET' | 'MY_LAB_RESULTS'
  | 'WHY' | 'HEALTH_QA' | 'OUT_OF_SCOPE';

const INTENTS: AgentIntent[] = [
  'GREETING', 'SMALL_TALK', 'MEDIWYZ_INFO', 'FIND_PROVIDER', 'FIND_ORGANISATION',
  'FIND_PRODUCT', 'BUY_PRODUCT', 'BOOK', 'MY_BOOKINGS', 'MY_ORDERS', 'MY_PRESCRIPTIONS', 'MY_WALLET', 'MY_LAB_RESULTS',
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
  action?: 'book' | 'buy' | null;
  bookProviderId?: string;
  requiresLogin?: boolean;
  /** Generic list render (my bookings, my orders, …). Items may carry an
   *  inline action (e.g. cancel a booking) the client dispatches. */
  list?: { kind: string; title: string; items: Array<{ title: string; subtitle?: string; badge?: string; href?: string; action?: { kind: string; id: string; label: string; payload?: any } }> };
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
        case 'BUY_PRODUCT': return await this.handleBuyProduct(message, entities, language, input);
        case 'MY_BOOKINGS': return await this.handleMyBookings(entities, language, input);
        case 'MY_ORDERS': return await this.handleMyOrders(entities, language, input);
        case 'MY_PRESCRIPTIONS': return await this.handleMyPrescriptions(entities, language, input);
        case 'MY_WALLET': return await this.handleMyWallet(entities, language, input);
        case 'MY_LAB_RESULTS': return await this.handleMyLabResults(entities, language, input);
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
    if (/\b(mes|my)\b[^.?!]*\b(analyses?|laboratoire|lab\s*results?)\b/.test(m) || /\b(mes|my)\b[^.?!]*r[ée]sultats?[^.?!]*(analyse|labo|test)/.test(m)) return 'MY_LAB_RESULTS';
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
      select: { id: true, type: true, providerName: true, scheduledAt: true, status: true, serviceName: true },
    }) : [];
    const cancellable = (s: string) => !['cancelled', 'completed', 'delivered'].includes((s || '').toLowerCase());
    const items = bookings.map(b => ({
      title: b.serviceName || (fr ? 'Consultation' : 'Appointment'),
      subtitle: [b.providerName, b.scheduledAt ? new Date(b.scheduledAt).toLocaleString(fr ? 'fr-FR' : 'en-GB') : null].filter(Boolean).join(' · '),
      badge: (b.status || '').replace(/_/g, ' '),
      href: '/bookings',
      action: cancellable(b.status) ? { kind: 'cancel_booking', id: b.id, label: fr ? 'Annuler' : 'Cancel', payload: { bookingType: b.type || 'service' } } : undefined,
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

  private async handleMyWallet(entities: AgentEntities, language: string, input: AgentInput): Promise<AgentResult> {
    const fr = language === 'fr';
    if (!input.userId) return this.loginRequired('MY_WALLET', language);
    const wallet = await this.prisma.userWallet.findUnique({ where: { userId: input.userId }, select: { balance: true, currency: true } });
    const bal = `${wallet?.currency || 'Rs'} ${wallet?.balance ?? 0}`;
    const reply = wallet
      ? (fr ? `Votre solde est de ${bal}.` : `Your wallet balance is ${bal}.`)
      : (fr ? "Je ne trouve pas votre portefeuille — êtes-vous connecté ?" : "I couldn't find your wallet — are you signed in?");
    return {
      intent: 'MY_WALLET', entities, reply,
      followUps: fr ? ['Mes commandes', 'Mes rendez-vous'] : ['My orders', 'My appointments'],
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
