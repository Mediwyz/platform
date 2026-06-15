/**
 * Single source of truth for badge / dot colour by step category.
 *
 * Why this file exists: status codes are authored dynamically by regional
 * admins (`sample_collected`, `eye_test_done`, anything). Hardcoding badge
 * colours keyed by status code means every new template author paints the
 * workflow grey. Categories (`pending | active | success | danger | waiting`)
 * are a small, closed set - safe to hardcode.
 *
 * The engine derives a category per step; clients never pattern-match on
 * status code. If you find yourself writing `if (status === 'pending')`,
 * stop and use the category instead.
 */

export type StepCategory = 'pending' | 'active' | 'success' | 'danger' | 'waiting'

export const CATEGORY_BADGE: Record<StepCategory, { bg: string; text: string }> = {
  pending:  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  active:   { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  success:  { bg: 'bg-green-100',  text: 'text-green-800'  },
  danger:   { bg: 'bg-red-100',    text: 'text-red-800'    },
  waiting:  { bg: 'bg-gray-100',   text: 'text-gray-700'   },
}

export const CATEGORY_DOT: Record<StepCategory, string> = {
  pending: 'bg-yellow-500',
  active:  'bg-indigo-500',
  success: 'bg-green-500',
  danger:  'bg-red-500',
  waiting: 'bg-gray-400',
}

/**
 * Client-side fallback: when the engine didn't tag a category (old data,
 * mid-migration), derive one from signals available on the client. Never
 * pattern-matches on the literal status code - uses generic signals only.
 */
export function categoryFromLegacyStatus(
  status: string,
  opts?: { isCancelled?: boolean; isCompleted?: boolean; hasActions?: boolean }
): StepCategory {
  if (opts?.isCancelled) return 'danger'
  if (opts?.isCompleted) return 'success'
  const s = (status || '').toLowerCase()
  // Terminal signals by convention - the engine's derivation is the authority;
  // this is just the "we lost the category" lifeboat.
  if (s === 'cancelled' || s === 'denied' || s === 'refunded') return 'danger'
  if (s === 'completed' || s === 'resolved') return 'success'
  if (s === 'pending' || s.startsWith('pending_')) return 'pending'
  if (opts?.hasActions === false) return 'waiting'
  return 'active'
}
