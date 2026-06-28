---
name: tool-design
description: Checklist for designing API endpoints and tool calls that an LLM agent consumes well — naming, schemas, high-signal responses, token efficiency, actionable errors, and evaluation. Use when adding or refactoring an endpoint the Wyzo agent calls, or structuring tool definitions.
---

# Tool / endpoint design for agents

From Anthropic's *Writing tools for agents*. In Wyzo, our backend endpoints (`/api/search/semantic`, `/api/ai/agent`, `/api/bookings`, `/api/organizations`, `/search/health-shop`, …) ARE the agent's tools. Design them for the agent, not just the UI.

## Selection & architecture
- [ ] Build tools for **high-impact workflows**, not 1:1 wrappers of every endpoint.
- [ ] **Consolidate** frequently-chained calls (e.g. a single `book` that resolves provider + slot + service beats three round-trips for the model).
- [ ] Prefer `search_x` over `list_all_x` — let the agent skip irrelevant context.
- [ ] **No overlapping tools.** Each has one clear, distinct purpose. Overlap distracts the model.

## Naming & namespacing
- [ ] Prefix-namespace by resource (`bookings.create`, `search.semantic`).
- [ ] Unambiguous params (`providerUserId`, not `user`).
- [ ] Return **semantically meaningful identifiers + labels** (name, type, city) — not bare UUIDs.

## Response design (high signal only)
- [ ] Return only fields the agent will use downstream (name, type, address, price, score, id).
- [ ] **Drop noise**: internal UUIDs the user never sees, mime types, pixel URLs, audit fields.
- [ ] Offer a `response_format`/verbosity option when the agent sometimes needs concise vs detailed.
- [ ] Keep results **paginated / capped** with sensible defaults; never dump unbounded lists.

## Token efficiency
- [ ] Default limits + filters so the agent fetches only what it needs.
- [ ] Truncate large payloads with a clear "narrow your query" hint.

## Error handling (this prevents hallucinations)
- [ ] Replace opaque codes/stack traces with **actionable** messages.
  - Bad: `400 Bad Request`.
  - Good: `Insufficient wallet balance. Required 300, available 0. Retry with paymentMethod:'pay_at_appointment' or top up.`
- [ ] Validate inputs strictly; a precise validation error steers the agent to self-correct.

## Documentation
- [ ] Write the tool/endpoint description as if onboarding a new engineer — include formats, terminology, and resource relationships.
- [ ] Use strict typed schemas (DTOs / JSON Schema) for inputs and outputs.

## Evaluation
- [ ] Build eval tasks from **real workflows + real data**, multi-step (often dozens of calls).
- [ ] Measure runtime, call count, token usage, error rate — not just accuracy.
- [ ] Read the agent's reasoning + raw transcripts; note what it *omits*, not just what it gets wrong.
- [ ] Hold out a test set; re-measure after each tool change.

## Wyzo-specific notes
- `/api/ai/agent` returns a structured envelope (`intent, entities, reply, providers, organisations, products, followUps, action, bookProviderId`). Keep it strict — the frontend renders off these exact keys.
- When the agent resolves an entity by name, **return the resolved `{kind,id,name}`** so the UI can show what it matched (transparency + lets the user correct a wrong fuzzy match).

## Sources
- Anthropic — Writing tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
