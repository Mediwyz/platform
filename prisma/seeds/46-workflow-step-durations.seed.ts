import { PrismaClient } from '@prisma/client'

/**
 * Back-fills `expectedDurationMinutes` on existing WorkflowTemplate steps.
 * The field drives "Usually ready within X" UX copy on booking detail screens.
 *
 * Keyed by `statusCode` so the same durations apply across every template
 * using that status - a regional admin can still override per-template by
 * editing the step JSON directly.
 */
const DEFAULT_DURATIONS: Record<string, number> = {
  pending: 30,
  accepted: 0,
  confirmed: 0,
  in_progress: 30,
  in_consultation: 45,
  in_call: 30,
  examination: 30,
  sample_collection: 20,
  sample_collected: 10,
  sample_in_transit: 120,
  processing: 1440, // 24h
  results_ready: 0,
  results_delivered: 0,
  preparing: 60,
  ready_for_pickup: 0,
  out_for_delivery: 90,
  delivered: 0,
  completed: 0,
  cancelled: 0,
  denied: 0,
}

export async function seedWorkflowStepDurations(prisma: PrismaClient) {
  const templates = await prisma.workflowTemplate.findMany({
    select: { id: true, steps: true },
  })

  let patched = 0
  for (const t of templates) {
    const steps = (t.steps as unknown) as any[]
    if (!Array.isArray(steps)) continue

    let modified = false
    for (const step of steps) {
      if (step.expectedDurationMinutes != null) continue // respect existing overrides
      const dur = DEFAULT_DURATIONS[step.statusCode]
      if (dur != null) {
        step.expectedDurationMinutes = dur
        modified = true
      }
    }
    if (modified) {
      await prisma.workflowTemplate.update({
        where: { id: t.id },
        data: { steps: steps as any },
      })
      patched++
    }
  }
  console.log(`  Patched ${patched} templates with expectedDurationMinutes`)
}
