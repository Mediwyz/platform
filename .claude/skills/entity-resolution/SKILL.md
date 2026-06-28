---
name: entity-resolution
description: Resolving named entities (provider/org/product) to database IDs in Wyzo using pg_trgm similarity plus an in-app fuzzy fallback, with confidence thresholds and disambiguation when multiple candidates match. Use when changing resolution logic or fixing "wrong/random entity selected" bugs.
---

# Entity resolution (name → ID)

When the user names something ("Dr Rakoto", "Clinique Moka", "paracétamol"), resolve to a real DB id before acting. Implemented in `agent.service.ts` (`resolveProvider/resolveOrg`).

## Strategy: similarity first, fuzzy fallback
1. **pg_trgm** `similarity(lower(name), lower($q))` over an indexed column (GIN trigram), take top-1; accept if `sim ≥ 0.30`.
2. If pg_trgm is unavailable, **in-app Sørensen–Dice bigram** over `contains`-filtered candidates; accept if `score ≥ 0.45`.
3. Scope the query (active accounts; provider types; `isActive` orgs) before scoring.

## Disambiguation > guessing (critical)
- If the **top candidate is weak** OR **two candidates are within a small margin**, DO NOT auto-pick. Return the shortlist and ask "Which one — A, B, or C?".
- For BOOK with no name: if the last results had **exactly one** provider, use it; if **several**, ask which (don't re-run a blind search). This is the fix for the "asked to book a nurse → got random nannies" bug.
- Always echo what was matched (`resolved: {kind,id,name}`) so the user can correct a wrong fuzzy hit.

## Context carry
- Keep `lastProviderIds` / last result set on the client and pass it to the agent.
- `refersToPrevious` (from the classifier) → resolve against that set, not the whole DB.

## Thresholds & tuning
| Source | Accept | Ask-to-confirm band | Reject |
| --- | --- | --- | --- |
| pg_trgm | ≥ 0.45 | 0.30–0.45 | < 0.30 |
| in-app dice | ≥ 0.55 | 0.45–0.55 | < 0.45 |
(Tune on real misspellings; log near-miss resolutions to refine.)

## Indexing
- `pg_trgm` extension + GIN indexes on `User(firstName||' '||lastName)`, `HealthcareEntity(name)`, `ProviderInventoryItem(name)` (see `prisma/sql/add-pg-trgm.sql`). Use `word_similarity` + `set_limit` if scaling to large tables.

## Checklist
- [ ] Candidates scoped (status/type/active) before scoring.
- [ ] Confidence band → accept / confirm / reject (no silent low-confidence pick).
- [ ] >1 close candidate → disambiguate.
- [ ] Resolved `{id,name}` surfaced to the UI.
- [ ] Falls back gracefully when pg_trgm is absent.

## Sources
- Postgres pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html
- Entity extraction/resolution in agent memory (Zep): https://www.lyzr.ai/blog/agentic-rag/
