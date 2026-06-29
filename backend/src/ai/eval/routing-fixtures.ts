import { AgentIntent } from '../agent.service';

/**
 * Labeled routing dataset for the Wyzo agent's deterministic router
 * (`strongHeuristic`). Each case is a real user phrasing → the intent the
 * heuristic MUST resolve it to (deterministically, before the LLM classifier).
 *
 * This is the regression guard: every routing bug we have fixed leaves a case
 * here so it can never silently come back. When you teach the heuristic a new
 * phrasing, add the example here. `null` means "the heuristic intentionally
 * defers to the LLM" — assert that too, so we notice if a stem starts
 * over-matching and stealing ambiguous messages.
 *
 * Accents matter: the heuristic strips diacritics (NFD) AND prefers ASCII stems
 * that sit before the accent (mang/cour/dorm). Both accented and plain forms are
 * included on purpose — see the `j'ai mangé` food-logging bug.
 */
export interface RoutingCase {
  message: string;
  intent: AgentIntent | null;
  /** Optional note on why this case exists (e.g. the bug it guards). */
  note?: string;
}

export const ROUTING_CASES: RoutingCase[] = [
  // ── LOG_HEALTH — accent-proof stems (the food-logging regression) ─────────
  { message: "j'ai mangé une pomme", intent: 'LOG_HEALTH', note: 'accented food log — must not fall to HEALTH_QA' },
  { message: "j'ai mange une pomme", intent: 'LOG_HEALTH', note: 'plain (no-accent) food log' },
  { message: 'I ate a banana', intent: 'LOG_HEALTH' },
  { message: 'I had a sandwich for lunch', intent: 'LOG_HEALTH' },
  { message: "j'ai bu 500 ml d'eau", intent: 'LOG_HEALTH' },
  { message: 'I drank a glass of water', intent: 'LOG_HEALTH' },
  { message: "j'ai couru 30 minutes", intent: 'LOG_HEALTH', note: 'cour stem matches couru/courir' },
  { message: "j'ai marché 5 km", intent: 'LOG_HEALTH' },
  { message: "j'ai dormi 7h", intent: 'LOG_HEALTH', note: 'dorm stem' },
  { message: 'I slept 8 hours', intent: 'LOG_HEALTH' },
  { message: 'log water', intent: 'LOG_HEALTH' },

  // ── MY_BOOKINGS ───────────────────────────────────────────────────────────
  { message: 'mes rendez-vous', intent: 'MY_BOOKINGS' },
  { message: 'do I have any appointments this week', intent: 'MY_BOOKINGS' },
  { message: 'ai-je un rendez-vous demain', intent: 'MY_BOOKINGS' },

  // ── MY_ORDERS ─────────────────────────────────────────────────────────────
  { message: 'mes commandes', intent: 'MY_ORDERS' },
  { message: 'where is my order', intent: 'MY_ORDERS' },
  { message: 'track my order', intent: 'MY_ORDERS' },

  // ── MY_PRESCRIPTIONS ──────────────────────────────────────────────────────
  { message: 'mes ordonnances', intent: 'MY_PRESCRIPTIONS' },
  { message: 'show my prescriptions', intent: 'MY_PRESCRIPTIONS' },

  // ── MY_WALLET (balance + top-up both route here; handler splits) ───────────
  { message: 'what is my wallet balance', intent: 'MY_WALLET' },
  { message: 'mon solde', intent: 'MY_WALLET' },
  { message: 'how much balance do I have', intent: 'MY_WALLET' },
  { message: 'recharge my wallet', intent: 'MY_WALLET', note: 'top-up phrasing still routes to wallet' },
  { message: 'top up my wallet', intent: 'MY_WALLET' },
  { message: 'recharger mon portefeuille', intent: 'MY_WALLET' },
  { message: 'recharger 1000', intent: 'MY_WALLET', note: 'top-up stem with no explicit wallet noun' },

  // ── MY_LAB_RESULTS ────────────────────────────────────────────────────────
  { message: 'mes analyses', intent: 'MY_LAB_RESULTS' },
  { message: 'my lab results', intent: 'MY_LAB_RESULTS' },

  // ── MY_INVOICES ───────────────────────────────────────────────────────────
  { message: 'mes factures', intent: 'MY_INVOICES' },
  { message: 'show my invoice', intent: 'MY_INVOICES' },

  // ── MY_HEALTH (dashboard / snapshot) ──────────────────────────────────────
  { message: 'my health dashboard', intent: 'MY_HEALTH' },
  { message: 'how many calories today', intent: 'MY_HEALTH' },

  // ── MY_FAVORITES ──────────────────────────────────────────────────────────
  { message: 'mes favoris', intent: 'MY_FAVORITES' },
  { message: 'my favourite doctors', intent: 'MY_FAVORITES' },
  { message: 'mes préférés', intent: 'MY_FAVORITES', note: 'accented — proves NFD normalization is live' },

  // ── PROVIDER_REVIEWS ──────────────────────────────────────────────────────
  { message: 'avis sur le docteur Mungroo', intent: 'PROVIDER_REVIEWS' },
  { message: 'reviews of Dr Rakoto', intent: 'PROVIDER_REVIEWS' },

  // ── BUY_PRODUCT (purchase, distinct from booking) ─────────────────────────
  { message: 'buy paracetamol', intent: 'BUY_PRODUCT' },
  { message: 'acheter du doliprane', intent: 'BUY_PRODUCT' },
  { message: 'je veux commander des vitamines', intent: 'BUY_PRODUCT' },

  // ── BOOK ──────────────────────────────────────────────────────────────────
  { message: 'book a doctor', intent: 'BOOK' },
  { message: 'réserver un médecin', intent: 'BOOK', note: 'accented réserver → reserv stem' },
  { message: 'je veux prendre rendez-vous', intent: 'BOOK' },

  // ── Deliberately ambiguous → defer to the LLM (heuristic returns null) ─────
  { message: 'hello there', intent: null, note: 'greeting — not the heuristic’s job' },
  { message: 'what is MediWyz', intent: null },
  { message: 'I have a headache, what should I do', intent: null, note: 'advice Q — must NOT be stolen by a LOG_HEALTH stem' },
  { message: 'how much water should I drink per day', intent: null, note: 'advice Q, not a log' },
];
