# Wyzo agentic system — audit & improvement backlog

Reviewed against the skills in this folder. Status as of the current `main`.

## What's already solid
- Two-level router shape (classify → resolve → route → compose) — matches the recommended architecture.
- Closed-set intents + entities mapped to an ontology and validated in code.
- Multi-entity extraction in one Groq call; conversation history passed in.
- Name→ID resolution via pg_trgm + in-app Dice fallback, scoped queries.
- Semantic search with a cosine floor; embed-on-write + boot backfill.
- Deterministic booking sub-flow with in-step free-text interception (slot/service/confirm).
- In-chat account creation + pay-at-appointment so guests can complete a booking.

## Findings & backlog (priority order)

### P0 — correctness / trust
1. **Ungrounded availability (hallucination).** [[rag-grounding]]
   - Symptom: a provider with **no slots** gets "Aanya a des disponibilités disponibles".
   - Fix: the compose/Q&A step must never assert availability/pricing. Route those to the slot/services tools; when slots are empty, say so. Add an instruction "answer ONLY from Results; if empty, state none found" and (optionally) a verifier that rejects replies introducing un-grounded facts.
   - Files: `backend/src/ai/agent.service.ts` (`compose`, `handleTalk`), `ai.service.ts` (widget/chat prompts).

2. **BOOK with multiple prior results picks randomly.** [[entity-resolution]] [[conversation-state]]
   - Symptom: 5 nurses shown → "réserver mardi 14h" → blind semantic search → random nannies/doctors.
   - Fix: in `handleBook`, when no `providerName` resolves and `lastProviderIds.length > 1`, **ask which** (render the shortlist) instead of `handleFindProvider(rawMessage)`. Only auto-pick when exactly one prior result.
   - Files: `agent.service.ts` (`handleBook`).

3. **Requested date/time ignored.** [[conversation-state]] [[intent-entity-extraction]]
   - Symptom: "Mardi à 14h" extracted but the flow dumps the whole week.
   - Fix: pass extracted `date`/time into `startBooking`; pre-select the matching day/slot, and if available jump straight to service selection ("Mardi 14:00 is free — which service?").
   - Files: `agent.service.ts` (BOOK), `components/shared/WyzoAssistant.tsx` (`startBooking`).

### P1 — quality
4. **Compose contradicts the data** ("j'ai trouvé… cependant il n'y en a pas"). [[rag-grounding]]
   - Tighten the compose prompt: state results confidently; only caveat when the list is genuinely empty.
5. **Free-text Q&A invents prices** ("50–150 €"). [[rag-grounding]]
   - Detect price/availability questions about a known provider and route to the services/slots tools instead of the chat LLM.
6. **Disambiguation echo.** [[entity-resolution]]
   - Always surface `resolved:{kind,id,name}` and let the user correct a wrong fuzzy match (e.g. "A aanya" → did you mean Aanya Appadoo?).
7. **Confidence bands for resolution.** [[entity-resolution]]
   - Add an "ask to confirm" band (0.30–0.45 pg_trgm) instead of accept/reject only.

### P2 — scale / evaluation
8. **Transcript eval harness.** [[tool-design]] [[intent-entity-extraction]]
   - Label a set of real transcripts; track per-intent precision/recall and the confusion pairs (WHY/HEALTH_QA, BOOK/FIND_PROVIDER, FIND_ORG/FIND_PROVIDER). Re-measure on every classifier change.
9. **Tool-response hygiene pass.** [[tool-design]]
   - Audit agent-facing endpoints for noise fields, pagination defaults, and actionable error messages.
10. **Orchestrator-workers for mixed queries.** [[agentic-system-design]]
   - "a clinic in Moka and a paracetamol" currently picks one intent. Consider fanning out provider+org+product retrieval and merging.

## How to use this backlog
Pick an item, open the linked skill, make the change in the listed file, then re-check against that skill's checklist. Keep changes small and grounded; measure on real transcripts before/after.
