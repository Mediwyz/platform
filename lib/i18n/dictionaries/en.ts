/**
 * English message dictionary - the source of truth for user-facing strings
 * in the workflow UI. Every new string starts here; translations in fr/mfe
 * reference the same keys. Missing keys fall back to English automatically.
 *
 * Keys use dot notation grouped by feature:
 *   workflow.status.<statusCode>
 *   workflow.action.<actionCode>
 *   workflow.category.<category>
 *   library.<label>
 *   role.request.<label>
 */
export const en = {
  // Generic workflow actions
  'workflow.action.accept': 'Accept',
  'workflow.action.decline': 'Decline',
  'workflow.action.cancel': 'Cancel',
  'workflow.action.start': 'Start',
  'workflow.action.complete': 'Complete',
  'workflow.action.reschedule': 'Reschedule',
  'workflow.action.confirm': 'Confirm',
  'workflow.action.leaveReview': 'Leave a review',

  // Category labels (used by WorkflowStepper + CATEGORY_BADGE)
  'workflow.category.pending': 'Pending',
  'workflow.category.active': 'In progress',
  'workflow.category.success': 'Completed',
  'workflow.category.danger': 'Cancelled',
  'workflow.category.waiting': 'Waiting',

  // Library page
  'library.title': 'Workflow Library',
  'library.subtitle': 'Browse every workflow on the platform - system defaults, regional admin templates, and provider customisations. Clone any to use as your own starting point.',
  'library.search.placeholder': 'Search name, slug, description...',
  'library.filter.allRoles': 'All provider roles',
  'library.filter.allModes': 'All service modes',
  'library.filter.allSources': 'All sources',
  'library.filter.source.system': 'System defaults',
  'library.filter.source.admin': 'By regional admins',
  'library.filter.source.provider': 'By providers',
  'library.scope.everyone': 'Everyone',
  'library.scope.mine': 'Mine',
  'library.action.clone': 'Clone & use',
  'library.action.edit': 'Edit',
  'library.empty.title': 'No workflows match your filters',
  'library.empty.subtitle': 'Try widening the search or resetting the filters.',

  // Role request (signup)
  'role.request.trigger': 'I don\'t see my role - propose a new one',
  'role.request.modal.title': 'Propose a new provider role',
  'role.request.modal.subtitle': 'Your request goes to a regional admin for approval. While you wait, you can complete signup as a patient and switch later.',
  'role.request.field.label': 'Role name',
  'role.request.field.description': 'What does this role do?',
  'role.request.submit': 'Submit request',
  'role.request.cancel': 'Cancel',
  'role.request.success': 'Role request submitted. Awaiting regional admin review.',

  // Referral pillar (member dashboard)
  'referral.title': 'Refer friends, earn credit',
  'referral.subtitle': 'Every signup with your code = wallet credit for you',
  'referral.stat.referrals': 'Referrals',
  'referral.stat.earned': 'Earned',
  'referral.code.label': 'Your code',
  'referral.share': 'Share your link',
  'referral.copied': 'Link copied - share it anywhere',

  // Booking status change toast
  'booking.toast.statusUpdated': 'Status updated: {{status}}',

  // Admin analytics
  'analytics.title': 'Workflow Analytics',
  'analytics.subtitle': 'Every template\'s usage across your region. Sort by total volume; watch drop-off rates for templates that need UX rework.',
  'analytics.stat.today': 'Today',
  'analytics.stat.week7d': 'Last 7 days',
  'analytics.stat.completed': 'Completed',
  'analytics.stat.dropOffRate': 'Drop-off rate',

  // Audio call
  'audio.title': 'Audio Calls',
  'audio.subtitle': 'Voice-only calls - faster to connect on weak networks and less distracting in emergencies.',
  'audio.empty.title': 'No audio calls yet',
  'audio.empty.subtitle': 'A call appears here automatically when a workflow step opens an audio room.',
  'audio.action.join': 'Join',
} as const

export type MessageKey = keyof typeof en
