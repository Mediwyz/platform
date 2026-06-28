---
name: intent-entity-extraction
description: Best practices for LLM intent classification and multi-entity extraction in Wyzo — closed-set intents, ontology mapping, validation, language detection, and conversation-aware extraction. Use when changing the classifier prompt, adding an intent/entity, or debugging mis-routing.
---

# Intent + entity extraction (Wyzo classifier)

The `classify` step (one Groq JSON call in `agent.service.ts`) decides everything downstream. Treat it as a safety-critical boundary.

## Closed-set intents, mapped to an ontology
- Intents are a **fixed enum**: `GREETING, SMALL_TALK, MEDIWYZ_INFO, FIND_PROVIDER, FIND_ORGANISATION, FIND_PRODUCT, BOOK, WHY, HEALTH_QA, OUT_OF_SCOPE`.
- **Always map the model's raw output to the enum in code.** Never branch on the raw string. Unknown → fall back to a heuristic, not a crash. (This is both a reliability and a prompt-injection control.)
- Same for entities: `providerType` must be one of the 11 `PROVIDER_TYPES`; `serviceMode` ∈ `{in_person,video,audio,home}`. Drop anything off-list.

## Multi-entity extraction in one pass
Extract all of these together (cheaper + more consistent than separate calls): `providerName, providerType, specialty, orgName, orgType, productName, location, serviceMode, serviceName, date, refersToPrevious`.
- **`refersToPrevious`** is the key to context: set it when the user says "him/her/the first one/book it". Downstream, resolve against the last results rather than re-searching.
- Capture **`date`/time** when present ("Mardi à 14h") and **honour it** in the booking flow (pre-select that day/slot) — extracting but ignoring it is a bug.

## Conversation-aware
- Pass the **last 4–6 turns** to the classifier so "in fact I'm looking for a nurse" re-scopes the previous search instead of starting cold.
- Detect `language` (fr/en/mfe) and compose the reply in it. Don't switch languages mid-thread.

## Prompt hygiene
- Temperature 0, `response_format: json_object`.
- Give the model the enum lists inline and 2–3 few-shot disambiguation examples for the tricky pairs (WHY vs HEALTH_QA, BOOK vs FIND_PROVIDER, FIND_ORG vs FIND_PROVIDER).
- Keep the system prompt versioned; a/b small wording changes against a transcript eval set.

## Validation checklist
- [ ] `intent` ∈ enum, else heuristic fallback.
- [ ] every entity ∈ its allowed set (drop, don't pass through).
- [ ] `refersToPrevious` honoured by routing.
- [ ] `date`/`serviceMode`/`location` actually used downstream (filter, don't decorate).
- [ ] language detected and replies match it.

## Metrics
Track per-intent precision/recall on a labelled transcript set; watch the confusion pairs above. Anthropic/IrisAgent both stress: map to a predefined label set and measure with precision/recall/F1.

## Sources
- Intent recognition + ontology mapping: https://irisagent.com/blog/building-chatbots-with-intent-detection-guide/
- Agentic RAG query classification: https://www.kore.ai/blog/what-is-agentic-rag
