/* eslint-disable */
const { PrismaClient } = require('../node_modules/.prisma/client' in require.resolve ? '' : '../../node_modules/.prisma/client');
const prisma = new PrismaClient();

async function stats() {
  const templates = await prisma.workflowTemplate.findMany({
    select: {
      id: true, name: true, slug: true, providerType: true,
      serviceMode: true, isActive: true, isDraft: true, isDefault: true,
      steps: true, transitions: true, platformServiceId: true,
      createdByAdminId: true, createdByProviderId: true,
    },
  });

  const providersByType = await prisma.user.groupBy({
    by: ['userType'],
    _count: { id: true },
    where: {
      userType: { notIn: ['MEMBER','REGIONAL_ADMIN','CORPORATE_ADMIN','REFERRAL_PARTNER','INSURANCE_REP'] },
    },
  });
  const providerMap = Object.fromEntries(providersByType.map(r => [r.userType, r._count.id]));

  const servicesByType = await prisma.platformService.groupBy({
    by: ['providerType'],
    _count: { id: true },
  });
  const serviceMap = Object.fromEntries(servicesByType.map(r => [r.providerType, r._count.id]));

  const byType = {};
  for (const tpl of templates) {
    if (!byType[tpl.providerType]) byType[tpl.providerType] = [];
    byType[tpl.providerType].push(tpl);
  }

  console.log('');
  console.log('═'.repeat(90));
  console.log('  TEST CASE MATRIX — Services x Providers x Workflows x Steps x Transitions');
  console.log('═'.repeat(90));

  let grandCombinations = 0;
  let grandSteps = 0;
  let grandTransitions = 0;
  let grandActive = 0;
  let grandDraft = 0;

  const allSteps = [];
  const allTransitions = [];

  for (const pt of Object.keys(byType).sort()) {
    const ptTemplates = byType[pt];
    const active = ptTemplates.filter(t => t.isActive && !t.isDraft);
    const draft  = ptTemplates.filter(t => t.isDraft);
    const providers = providerMap[pt] || 0;
    const services  = serviceMap[pt] || 0;
    grandActive += active.length;
    grandDraft  += draft.length;

    console.log('\n' + '─'.repeat(90));
    console.log('  ' + pt);
    console.log('  Providers: ' + providers + '   Services: ' + services + '   Templates: ' + ptTemplates.length +
      ' (' + active.length + ' active / ' + draft.length + ' draft)');
    console.log('  ' + '─'.repeat(85));

    let typeSteps = 0, typeTransitions = 0;

    for (const tpl of ptTemplates) {
      const steps = Array.isArray(tpl.steps) ? tpl.steps : [];
      const transitions = Array.isArray(tpl.transitions) ? tpl.transitions : [];
      allSteps.push(...steps);
      allTransitions.push(...transitions);

      const cancelTrans = transitions.filter(tr =>
        tr.action && ['cancel','deny','decline','reject'].some(k => tr.action.includes(k))
      ).length;
      const acceptTrans = transitions.filter(tr =>
        tr.action && ['accept','confirm','approve'].some(k => tr.action.includes(k))
      ).length;

      const stateLabel = (tpl.isDraft ? 'DRAFT' : tpl.isActive ? 'ACTIVE' : 'INACT').padEnd(6);
      const ownerLabel = (tpl.createdByAdminId ? '[admin]' : tpl.createdByProviderId ? '[prov]' : '[sys]').padEnd(7);
      const slugLabel  = tpl.slug.slice(0, 42).padEnd(43);

      console.log('  ' + stateLabel + ownerLabel + slugLabel +
        ' steps:' + String(steps.length).padStart(2) +
        '  trans:' + String(transitions.length).padStart(2) +
        '  cancel:' + String(cancelTrans).padStart(2) +
        '  accept:' + String(acceptTrans).padStart(2));

      typeSteps       += steps.length;
      typeTransitions += transitions.length;
    }

    const typeCombinations = providers * services * ptTemplates.length;
    grandCombinations += typeCombinations;
    grandSteps        += typeSteps;
    grandTransitions  += typeTransitions;

    // Test cases = happy path (steps) + all transitions + boundary (completed/cancelled/invalid)
    const typeTestCases = typeSteps + typeTransitions + (typeSteps * 2);
    console.log('  Subtotal  steps: ' + String(typeSteps).padStart(3) +
      '  transitions: ' + String(typeTransitions).padStart(3) +
      '  test cases: ' + String(typeTestCases).padStart(4));
    console.log('  Combos: ' + providers + ' providers × ' + services + ' services × ' + ptTemplates.length +
      ' templates = ' + typeCombinations + ' full lifecycle runs needed');
  }

  // Action frequency
  const actionFreq = {};
  for (const tr of allTransitions) {
    if (tr.action) actionFreq[tr.action] = (actionFreq[tr.action] || 0) + 1;
  }

  // Flag frequency
  const flagFreq = {};
  for (const s of allSteps) {
    if (s.flags && typeof s.flags === 'object') {
      for (const [k, v] of Object.entries(s.flags)) {
        if (v) flagFreq[k] = (flagFreq[k] || 0) + 1;
      }
    }
  }

  // Unique statuses (nodes in the state machine)
  const uniqueStatuses = new Set(allSteps.map(s => s.statusCode));
  const uniqueActions  = new Set(allTransitions.map(t => t.action).filter(Boolean));

  console.log('\n' + '═'.repeat(90));
  console.log('  GRAND TOTALS');
  console.log('═'.repeat(90));
  console.log('  Templates total:                    ' + templates.length +
    '  (' + grandActive + ' active / ' + grandDraft + ' draft)');
  console.log('  Steps across all templates:         ' + grandSteps);
  console.log('  Transitions across all templates:   ' + grandTransitions);
  console.log('  Unique status codes:                ' + uniqueStatuses.size);
  console.log('  Unique action names:                ' + uniqueActions.size);
  console.log('');
  console.log('  ┌─ MINIMAL TEST COVERAGE (per-template, not per-provider-service) ─');
  console.log('  │  Happy-path steps:    ' + grandSteps);
  console.log('  │  Transition tests:    ' + grandTransitions + '  (each (from,action,to) triple once)');
  console.log('  │  Boundary tests:      ' + (grandSteps * 2) + '  (already-completed + already-cancelled per step)');
  console.log('  │  TOTAL MINIMAL:       ' + (grandSteps + grandTransitions + grandSteps * 2));
  console.log('  └─────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('  ┌─ FULL COMBINATORIAL (provider × service × workflow) ─────────────');
  console.log('  │  Provider×Service×Template combos: ' + grandCombinations);
  console.log('  │  × avg transitions per combo:      × ' + Math.round(grandTransitions / templates.length));
  console.log('  │  TOTAL FULL MATRIX:                ' + (grandCombinations * Math.round(grandTransitions / templates.length)));
  console.log('  └─────────────────────────────────────────────────────────────────');

  console.log('\n  ┌─ TOP ACTION NAMES (' + uniqueActions.size + ' unique) ─────────────────────────────────');
  Object.entries(actionFreq).sort((a,b) => b[1]-a[1]).slice(0, 25)
    .forEach(([action, count]) => console.log('  │  ' + action.padEnd(30) + count + ' occurrences'));
  console.log('  └─────────────────────────────────────────────────────────────────');

  console.log('\n  ┌─ STEP FLAGS IN USE ─────────────────────────────────────────────');
  Object.entries(flagFreq).sort((a,b) => b[1]-a[1])
    .forEach(([flag, count]) => console.log('  │  ' + flag.padEnd(30) + count + ' steps'));
  console.log('  └─────────────────────────────────────────────────────────────────');
  console.log('');

  await prisma.$disconnect();
}

stats().catch(async e => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
