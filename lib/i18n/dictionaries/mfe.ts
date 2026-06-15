import type { MessageKey } from './en'

/**
 * Mauritian Creole (Kreol Morisien) translations - seed set.
 * Covers only the highest-visibility workflow strings for now; other keys
 * fall back to English. Grow this file as strings are translated.
 */
export const mfe: Partial<Record<MessageKey, string>> = {
  'workflow.action.accept': 'Aksepte',
  'workflow.action.decline': 'Refize',
  'workflow.action.cancel': 'Anile',
  'workflow.action.start': 'Koumans',
  'workflow.action.complete': 'Fini',
  'workflow.action.leaveReview': 'Kit enn komanter',

  'workflow.category.pending': 'Pe atann',
  'workflow.category.active': 'Pe fer',
  'workflow.category.success': 'Fini',
  'workflow.category.danger': 'Anile',
  'workflow.category.waiting': 'Pe atann',

  'role.request.trigger': 'Mo pa trouv mo rol - propoz enn nouvo',
  'role.request.modal.title': 'Propoz enn nouvo rol',
  'role.request.submit': 'Avoye demann',
  'role.request.cancel': 'Anile',

  'referral.title': 'Envit bann kamarad, gagne kredi',
  'referral.share': 'Partaz ou link',
  'referral.stat.referrals': 'Referal',
  'referral.stat.earned': 'Gagné',

  'audio.action.join': 'Antre',
}
