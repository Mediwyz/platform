---
name: conversation-state
description: Managing multi-turn state in Wyzo — deterministic booking sub-flows, slot-filling, honouring requested constraints, and interpreting free-text within the active step instead of re-classifying. Use when changing the booking flow, the chat client state, or fixing "flow restarts / loses context" bugs.
---

# Conversation state & slot-filling

The agent is stateless per call; the **client holds the flow state**. Get this boundary right and the loops/restarts disappear.

## Two modes
1. **Agent turn** — free intent. Goes to `/api/ai/agent` (classify → route → compose).
2. **Deterministic sub-flow** — booking: `slot → service → confirm`. A fixed workflow, NOT an agent decision.

While a sub-flow step is active (`stageRef` ∈ `slot|service|confirm`), **interpret typed text in-step first**:
- slot stage: parse a time (+ optional weekday) → match a shown slot → select it; if the time isn't open, say so (don't re-search).
- service stage: match by name or ordinal ("the first one").
- confirm stage: yes/oui → submit; no/non → cancel.
- If the text clearly isn't a step answer ("actually find a doctor"), **exit the sub-flow** and hand to the agent.

This is the fix for *"I want 13:00" restarting the whole booking*.

## Honour requested constraints (slot-filling)
If the user already gave a constraint, **don't ask for it again**:
- "Book Tuesday at 14h" → pre-select Tuesday + 14:00 if available; only ask for what's missing.
- Extracted `date`/`serviceMode`/`location` must flow into the tool call, not be dropped.
Treat the booking as a slot-filling form: provider → date → time → service → confirm. Skip any slot already filled from context.

## Context carry between turns
- Persist `lastProviderIds` (and ideally last orgs/products) on the client; send with each agent call.
- The classifier's `refersToPrevious` resolves "book her / the first one" against that set.
- **Multiple candidates + no name → disambiguate**, never blind-search (see [[entity-resolution]]).

## Auth & resume
- Guest hits confirm → offer Sign in OR in-chat Create account; **save the pending booking** and resume after auth.
- Use pay-at-appointment so a fresh account isn't blocked by an empty wallet.

## State checklist
- [ ] Active step intercepts free-text before the agent.
- [ ] Already-known constraints are not re-asked.
- [ ] Requested date/time pre-selected when available.
- [ ] Non-answer text cleanly exits the sub-flow.
- [ ] last-results context sent every turn; `refersToPrevious` honoured.
- [ ] Pending action saved + resumed across sign-in/sign-up.

## Sources
- Anthropic — Building Effective Agents (workflow vs agent, prompt chaining): https://www.anthropic.com/research/building-effective-agents
- Effective context engineering for agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
