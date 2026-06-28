---
name: rag-grounding
description: Grounding rules for Wyzo's RAG + reply composition so the agent never invents facts (availability, prices, specialties). Covers semantic search hygiene, passing tool results as authoritative, and anti-hallucination guardrails. Use when changing the compose step, semantic search, or any user-facing generated text.
---

# RAG & grounding (no hallucinations)

Multi-agent/LLM systems hallucinate when generated text isn't bound to retrieved facts, and **errors compound** when a downstream step trusts an upstream invention. Our `compose` and Q&A steps must be strictly grounded.

## The golden rule
> The composed reply may only state facts present in the tool result for this turn. If the data isn't there, say you don't have it — never fabricate.

Concretely, this is the fix for the **"Aanya a des disponibilités disponibles"** bug: the provider had **zero** slots, but the compose LLM invented availability. Availability/prices/specialties are **structured data**, not things the LLM may assert.

## Rules
1. **Structured facts come from tools, never the LLM.** Slots → `/available-slots`. Prices → `ProviderServiceConfig`. Specialties → profile. The reply *describes* these; it never originates them.
2. **Empty result → say so.** "Aanya has no open slots this week" + offer alternatives. Don't paper over emptiness with a cheerful generic line.
3. **Pass results into compose as authoritative context** and instruct: *"Answer ONLY from the Results below. If empty, state nothing was found."* Reject/regenerate replies that add facts absent from the data (evaluator-optimizer pattern is a good fit here).
4. **Don't answer availability/pricing in free-text Q&A.** Route those to the booking/services tools, not the chat LLM (which guesses "50–150 €").
5. **Cite the source row.** Prefer linking the provider/org/product card next to any claim about it.

## Semantic search hygiene
- Embed query with the `query:` prefix; passages with `passage:` (e5 asymmetric).
- Keep a similarity floor (we use cosine > 0.55) so weak matches don't surface as confident results.
- Re-rank by hard filters the user gave (location, serviceMode) — extracted constraints must **filter**, not just decorate the reply.
- Embed-on-write + boot backfill keep the index fresh; never serve stale corpora.

## Anti-hallucination checklist
- [ ] Every factual claim in the reply traces to a field in this turn's tool result.
- [ ] Empty/զero results produce an honest "none found", not a generic positive.
- [ ] Availability & pricing never come from the chat LLM.
- [ ] Extracted filters (location/mode/specialty) actually constrain retrieval.
- [ ] A verifier (optional) can reject replies that introduce un-grounded facts.

## Sources
- Mitigating hallucinations with multi-agent validation: https://www.mdpi.com/2078-2489/16/7/517
- Stop agent hallucinations in production: https://dev.to/aws/5-techniques-to-stop-ai-agent-hallucinations-in-production-oik
- Agentic RAG (grounded, validated retrieval): https://www.kore.ai/blog/what-is-agentic-rag
