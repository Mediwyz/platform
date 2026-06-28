# Agentic skills (Wyzo)

Curated, source-backed best-practice skills for evolving the MediWyz "Wyzo" agent. Quality over quantity — per Anthropic, a few thoughtful skills beat many overlapping ones.

| Skill | Use when |
| --- | --- |
| [agentic-system-design](./agentic-system-design/SKILL.md) | changing orchestration, adding a tool, reviewing behaviour |
| [tool-design](./tool-design/SKILL.md) | adding/refactoring an endpoint the agent calls |
| [intent-entity-extraction](./intent-entity-extraction/SKILL.md) | classifier prompt, new intent/entity, mis-routing |
| [entity-resolution](./entity-resolution/SKILL.md) | name→ID logic, "wrong entity picked" bugs |
| [rag-grounding](./rag-grounding/SKILL.md) | compose step, semantic search, any generated text |
| [conversation-state](./conversation-state/SKILL.md) | booking flow, multi-turn state, "flow restarts" bugs |

See [`AGENTIC-AUDIT.md`](./AGENTIC-AUDIT.md) for the current-state review and prioritised improvements.

Primary sources: Anthropic [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents), [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [Agent Skills](https://github.com/anthropics/skills).
