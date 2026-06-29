import { AgentService } from './agent.service';
import { ROUTING_CASES } from './eval/routing-fixtures';

/**
 * Routing eval harness. Replays the labeled dataset (eval/routing-fixtures.ts)
 * through the agent's deterministic router `strongHeuristic` — no network, no
 * LLM, fully reproducible — so a routing regression fails CI instead of
 * shipping. `strongHeuristic` is private; we reach it via the instance because
 * it depends only on the message string, not on any injected service.
 */
describe('Agent routing (strongHeuristic)', () => {
  // strongHeuristic touches none of the injected deps → empty stubs are fine.
  const agent = new AgentService(
    {} as any, {} as any, {} as any, {} as any, {} as any,
  );
  const route = (msg: string) => (agent as any).strongHeuristic(msg);

  it.each(ROUTING_CASES.map(c => [c.message, c.intent, c.note ?? ''] as const))(
    'routes %j → %s',
    (message, expected) => {
      expect(route(message)).toBe(expected);
    },
  );

  it('covers every routable intent at least once', () => {
    const covered = new Set(ROUTING_CASES.map(c => c.intent).filter(Boolean));
    for (const intent of [
      'LOG_HEALTH', 'MY_BOOKINGS', 'MY_ORDERS', 'MY_PRESCRIPTIONS', 'MY_WALLET',
      'MY_LAB_RESULTS', 'MY_INVOICES', 'MY_HEALTH', 'MY_FAVORITES',
      'PROVIDER_REVIEWS', 'BUY_PRODUCT', 'BOOK',
    ]) {
      expect(covered.has(intent as any)).toBe(true);
    }
  });

  it('reports an accuracy summary', () => {
    const labeled = ROUTING_CASES.filter(c => c.intent !== null);
    const hits = labeled.filter(c => route(c.message) === c.intent).length;
    // eslint-disable-next-line no-console
    console.log(`[routing-eval] ${hits}/${labeled.length} deterministic cases routed correctly`);
    expect(hits).toBe(labeled.length);
  });
});
