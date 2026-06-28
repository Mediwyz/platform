---
name: agentic-system-design
description: Best practices for designing and evolving the MediWyz "Wyzo" agentic system — when to use deterministic workflows vs LLM routing, simplicity, the agent-computer interface (ACI), two-level hierarchies, and grounding. Use when changing agent orchestration, adding a tool/endpoint, or reviewing agent behaviour.
---

# Agentic system design (Wyzo)

Distilled from Anthropic's *Building Effective Agents* and *Writing Tools for Agents*, applied to our stack (Next.js + NestJS + Groq llama-3.1-8b + local e5 embeddings + pgvector + pg_trgm).

## Our agent shape (the contract)
Wyzo is a **two-level router**, not an autonomous agent. Every message runs a fixed pipeline:
```
classify (intent + entities)  →  resolve (names→IDs)  →  route to a tool  →  compose (grounded reply + follow-ups)
```
Keep this deterministic. Two-level hierarchies (router + specialist tools) outperform flat *and* deep (3+ level) designs in consistency and task completion. Do not add agent autonomy unless a task is genuinely open-ended.

## Principles (apply on every change)
1. **Simplicity first.** Start from one LLM call + retrieval + in-context examples. Add a step only when a simpler version *demonstrably* fails. Agentic complexity trades latency/cost for accuracy — justify the trade.
2. **Transparency.** Show the agent's steps to the user (we render result cards, the booking sub-flow, follow-up chips). Never hide what the agent decided.
3. **Map model output to an ontology.** The classifier's raw text is never trusted directly — validate `intent` against the enum and `entities.*` against allowed values (see [[intent-entity-extraction]]). This is a security + reliability control.
4. **Ground everything.** A composed reply must only state facts present in the tool result. Never let the LLM invent slots/prices/availability (see [[rag-grounding]]).
5. **Deterministic sub-flows stay client-side.** Booking (slots → service → confirm) is a fixed workflow, not an agent decision. Interpret free-text *within* the active step (see [[conversation-state]]).

## Pattern selection
| Pattern | Use when | In Wyzo |
| --- | --- | --- |
| **Routing** | inputs need different handling | `classify` → intent → handler |
| **Prompt chaining** | fixed sequential steps | classify → resolve → compose |
| **Orchestrator-workers** | subtasks unknown up front | *not used yet* — candidate for multi-source research (providers + orgs + products in one query) |
| **Evaluator-optimizer** | clear eval criteria + iteration helps | *candidate* — a verifier pass that rejects ungrounded replies |
| **Autonomous agent** | open-ended, unknown step count | avoid for booking/search; too much compounding-error risk |

## Agent-Computer Interface (ACI)
Invest in the tool/endpoint contract as much as the prompt. Endpoints the agent calls are tools — give them clear names, strict schemas, high-signal responses, and actionable errors (see [[tool-design]]). Small wording changes to a tool/classifier prompt can yield large behaviour changes — version and eval them.

## Guardrails
- **Disambiguate, don't guess.** If resolution yields >1 plausible candidate, ask the user which one. Guessing is the root cause of the "booked the wrong/random provider" bug.
- **No silent fallback to a bad search.** If a BOOK intent has no resolvable provider, ask "who?" using the last results — never re-run semantic search on a raw "I want to book Tuesday at 2pm" string (it has no provider keyword → garbage results).
- **Bound iterations.** Any retry/loop needs a hard cap.

## Review checklist (run before shipping an agent change)
- [ ] Intent + every entity validated against an allowed set?
- [ ] Reply grounded only in tool data (no invented facts)?
- [ ] Multiple candidates → disambiguation, not a guess?
- [ ] Requested constraints (date/time/location/mode) actually used downstream?
- [ ] Deterministic sub-flow free-text handled in-step (not re-classified)?
- [ ] Tool response high-signal (no UUIDs/noise), paginated, with actionable errors?
- [ ] Behaviour evaluated on real transcripts, not just happy path?

## Sources
- Anthropic — Building Effective Agents: https://www.anthropic.com/research/building-effective-agents
- Anthropic — Writing tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic — Effective context engineering: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Multi-agent orchestration (router/supervisor, two-level hierarchies): https://lushbinary.com/blog/multi-agent-orchestration-patterns-supervisor-swarm-pipeline-router-guide/
