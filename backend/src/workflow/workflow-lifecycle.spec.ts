/**
 * Comprehensive Workflow Lifecycle Tests
 *
 * Covers every seeded template from booking creation to final completion.
 * Structure:
 *   1. Data-driven lifecycle tests — every template's happy path + cancellation path
 *   2. Pre-flight validation — balance, stock, prescription, content
 *   3. Payment timing — ON_ACCEPTANCE / ON_COMPLETION / PAY_LATER
 *   4. Notification invariant — both sides always notified
 *   5. Video / audio call triggers
 *   6. Content requirement enforcement (requires_content flag)
 *   7. Stock operations (checkOnAcceptance / subtractOnCompletion)
 *   8. Template resolution cascade
 *   9. Edge cases — terminal, duplicate transitions, invalid roles
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WorkflowEngineService } from './workflow-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowInstanceRepository } from './repositories/workflow-instance.repository';
import { WorkflowStepLogRepository } from './repositories/workflow-step-log.repository';
import { WorkflowRegistry } from './workflow-registry';
import { WorkflowNotificationResolver } from './notification-resolver';

// ─── Shared helper ────────────────────────────────────────────────────────────

const a = (action: string, label: string, targetStatus: string, style = 'primary') =>
  ({ action, label, targetStatus, style });
const t = (from: string, to: string, action: string, allowedRoles: string[]) =>
  ({ from, to, action, allowedRoles });

// ─── Canonical template definitions (mirror of seeds) ─────────────────────────

const OFFICE_STEPS = [
  { order: 1, statusCode: 'pending', label: 'Pending', flags: {},
    actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')],
    actionsForProvider: [a('accept', 'Accept', 'confirmed', 'primary'), a('deny', 'Deny', 'cancelled', 'danger')] },
  { order: 2, statusCode: 'confirmed', label: 'Confirmed', flags: {},
    actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')],
    actionsForProvider: [a('check_in', 'Check In', 'waiting_room', 'primary'), a('cancel', 'Cancel', 'cancelled', 'danger')] },
  { order: 3, statusCode: 'waiting_room', label: 'Waiting Room', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('start', 'Start', 'in_progress', 'primary')] },
  { order: 4, statusCode: 'in_progress', label: 'In Progress', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('write_notes', 'Write Notes', 'writing_notes', 'primary'), a('complete', 'Complete', 'completed', 'secondary')] },
  { order: 5, statusCode: 'writing_notes', label: 'Writing Notes', flags: { requires_content: 'care_notes' },
    actionsForPatient: [],
    actionsForProvider: [a('send_notes', 'Send Notes', 'completed', 'primary')] },
  { order: 6, statusCode: 'completed', label: 'Completed', flags: {},
    actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')],
    actionsForProvider: [] },
  { order: 7, statusCode: 'cancelled', label: 'Cancelled', flags: {},
    actionsForPatient: [], actionsForProvider: [] },
];
const OFFICE_TRANSITIONS = [
  t('pending', 'confirmed', 'accept', ['provider']),
  t('pending', 'cancelled', 'deny', ['provider']),
  t('pending', 'cancelled', 'cancel', ['patient']),
  t('confirmed', 'waiting_room', 'check_in', ['provider']),
  t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
  t('waiting_room', 'in_progress', 'start', ['provider']),
  t('in_progress', 'writing_notes', 'write_notes', ['provider']),
  t('in_progress', 'completed', 'complete', ['provider']),
  t('writing_notes', 'completed', 'send_notes', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

const HOME_STEPS = [
  { order: 1, statusCode: 'pending', label: 'Pending', flags: {},
    actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')],
    actionsForProvider: [a('accept', 'Accept', 'confirmed', 'primary'), a('deny', 'Deny', 'cancelled', 'danger')] },
  { order: 2, statusCode: 'confirmed', label: 'Confirmed', flags: {},
    actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')],
    actionsForProvider: [a('depart', 'Depart', 'provider_travelling', 'primary'), a('cancel', 'Cancel', 'cancelled', 'danger')] },
  { order: 3, statusCode: 'provider_travelling', label: 'Travelling', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('arrived', 'Arrived', 'provider_arrived', 'primary')] },
  { order: 4, statusCode: 'provider_arrived', label: 'Arrived', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('start', 'Start', 'in_progress', 'primary')] },
  { order: 5, statusCode: 'in_progress', label: 'In Progress', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('complete', 'Complete', 'completed', 'primary')] },
  { order: 6, statusCode: 'completed', label: 'Completed', flags: {},
    actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')],
    actionsForProvider: [] },
  { order: 7, statusCode: 'cancelled', label: 'Cancelled', flags: {},
    actionsForPatient: [], actionsForProvider: [] },
];
const HOME_TRANSITIONS = [
  t('pending', 'confirmed', 'accept', ['provider']),
  t('pending', 'cancelled', 'deny', ['provider']),
  t('pending', 'cancelled', 'cancel', ['patient']),
  t('confirmed', 'provider_travelling', 'depart', ['provider']),
  t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
  t('provider_travelling', 'provider_arrived', 'arrived', ['provider']),
  t('provider_arrived', 'in_progress', 'start', ['provider']),
  t('in_progress', 'completed', 'complete', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

const VIDEO_STEPS = [
  { order: 1, statusCode: 'pending', label: 'Pending', flags: {},
    actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')],
    actionsForProvider: [a('accept', 'Accept', 'call_ready', 'primary'), a('deny', 'Deny', 'cancelled', 'danger')] },
  { order: 2, statusCode: 'call_ready', label: 'Call Ready', flags: { triggers_video_call: true },
    actionsForPatient: [a('join_call', 'Join Call', 'in_call', 'primary')],
    actionsForProvider: [a('join_call', 'Join Call', 'in_call', 'primary')] },
  { order: 3, statusCode: 'in_call', label: 'In Call', flags: {},
    actionsForPatient: [],
    actionsForProvider: [a('end_call', 'End Call', 'completed', 'primary')] },
  { order: 4, statusCode: 'completed', label: 'Completed', flags: {},
    actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')],
    actionsForProvider: [] },
  { order: 5, statusCode: 'cancelled', label: 'Cancelled', flags: {},
    actionsForPatient: [], actionsForProvider: [] },
];
const VIDEO_TRANSITIONS = [
  t('pending', 'call_ready', 'accept', ['provider']),
  t('pending', 'cancelled', 'deny', ['provider']),
  t('pending', 'cancelled', 'cancel', ['patient']),
  t('call_ready', 'in_call', 'join_call', ['patient', 'provider']),
  t('call_ready', 'cancelled', 'cancel', ['patient', 'provider']),
  t('in_call', 'completed', 'end_call', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

const SURGERY_STEPS = [
  { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('accept', 'Accept', 'confirmed', 'primary'), a('deny', 'Deny', 'cancelled', 'danger')] },
  { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('start_preop', 'Start Pre-Op', 'pre_op_assessment', 'primary')] },
  { order: 3, statusCode: 'pre_op_assessment', flags: {}, label: 'Pre-Op', actionsForPatient: [], actionsForProvider: [a('patient_ready', 'Patient Ready', 'ready_for_procedure', 'primary')] },
  { order: 4, statusCode: 'ready_for_procedure', flags: {}, label: 'Ready', actionsForPatient: [], actionsForProvider: [a('start_procedure', 'Start Procedure', 'in_procedure', 'primary')] },
  { order: 5, statusCode: 'in_procedure', flags: {}, label: 'In Procedure', actionsForPatient: [], actionsForProvider: [a('end_procedure', 'End Procedure', 'post_op_observation', 'primary')] },
  { order: 6, statusCode: 'post_op_observation', flags: {}, label: 'Post-Op', actionsForPatient: [], actionsForProvider: [a('discharge', 'Discharge', 'recovery_instructions', 'primary')] },
  { order: 7, statusCode: 'recovery_instructions', flags: { requires_content: 'care_notes' }, label: 'Recovery', actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed', 'primary')] },
  { order: 8, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')], actionsForProvider: [] },
  { order: 9, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [], actionsForProvider: [] },
];
const SURGERY_TRANSITIONS = [
  t('pending', 'confirmed', 'accept', ['provider']), t('pending', 'cancelled', 'deny', ['provider']), t('pending', 'cancelled', 'cancel', ['patient']),
  t('confirmed', 'pre_op_assessment', 'start_preop', ['provider']), t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
  t('pre_op_assessment', 'ready_for_procedure', 'patient_ready', ['provider']),
  t('ready_for_procedure', 'in_procedure', 'start_procedure', ['provider']),
  t('in_procedure', 'post_op_observation', 'end_procedure', ['provider']),
  t('post_op_observation', 'recovery_instructions', 'discharge', ['provider']),
  t('recovery_instructions', 'completed', 'complete', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

const DIAGNOSTIC_STEPS = [
  { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('accept', 'Accept', 'confirmed', 'primary')] },
  { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('start_exam', 'Start Exam', 'examination', 'primary')] },
  { order: 3, statusCode: 'examination', flags: {}, label: 'Examination', actionsForPatient: [], actionsForProvider: [a('enter_results', 'Enter Results', 'results_ready', 'primary')] },
  { order: 4, statusCode: 'results_ready', flags: { requires_content: 'report' }, label: 'Results Ready', actionsForPatient: [a('view_results', 'View Results', 'results_ready', 'secondary')], actionsForProvider: [a('complete', 'Complete', 'completed', 'primary')] },
  { order: 5, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')], actionsForProvider: [] },
  { order: 6, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [], actionsForProvider: [] },
];
const DIAGNOSTIC_TRANSITIONS = [
  t('pending', 'confirmed', 'accept', ['provider']), t('pending', 'cancelled', 'cancel', ['patient']),
  t('confirmed', 'examination', 'start_exam', ['provider']), t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
  t('examination', 'results_ready', 'enter_results', ['provider']),
  t('results_ready', 'results_ready', 'view_results', ['patient']),
  t('results_ready', 'completed', 'complete', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

const NURSE_SAMPLE_STEPS = [
  { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('accept', 'Accept', 'confirmed', 'primary'), a('deny', 'Deny', 'cancelled', 'danger')] },
  { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('depart', 'Depart', 'nurse_travelling', 'primary')] },
  { order: 3, statusCode: 'nurse_travelling', flags: {}, label: 'Travelling', actionsForPatient: [], actionsForProvider: [a('arrived', 'Arrived', 'nurse_arrived', 'primary')] },
  { order: 4, statusCode: 'nurse_arrived', flags: {}, label: 'Arrived', actionsForPatient: [], actionsForProvider: [a('start_collection', 'Start Collection', 'sample_collection', 'primary')] },
  { order: 5, statusCode: 'sample_collection', flags: {}, label: 'Collecting', actionsForPatient: [], actionsForProvider: [a('collected', 'Collected', 'sample_collected', 'primary')] },
  { order: 6, statusCode: 'sample_collected', flags: {}, label: 'Sample Collected', actionsForPatient: [], actionsForProvider: [a('depart_lab', 'Depart Lab', 'sample_in_transit', 'primary')] },
  { order: 7, statusCode: 'sample_in_transit', flags: {}, label: 'In Transit', actionsForPatient: [], actionsForProvider: [a('delivered_lab', 'Delivered', 'sample_delivered', 'primary')] },
  { order: 8, statusCode: 'sample_delivered', flags: {}, label: 'Delivered', actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed', 'primary')] },
  { order: 9, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [a('leave_review', 'Review', 'completed', 'secondary')], actionsForProvider: [] },
  { order: 10, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [], actionsForProvider: [] },
];
const NURSE_SAMPLE_TRANSITIONS = [
  t('pending', 'confirmed', 'accept', ['provider']), t('pending', 'cancelled', 'deny', ['provider']), t('pending', 'cancelled', 'cancel', ['patient']),
  t('confirmed', 'nurse_travelling', 'depart', ['provider']), t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
  t('nurse_travelling', 'nurse_arrived', 'arrived', ['provider']),
  t('nurse_arrived', 'sample_collection', 'start_collection', ['provider']),
  t('sample_collection', 'sample_collected', 'collected', ['provider']),
  t('sample_collected', 'sample_in_transit', 'depart_lab', ['provider']),
  t('sample_in_transit', 'sample_delivered', 'delivered_lab', ['provider']),
  t('sample_delivered', 'completed', 'complete', ['provider']),
  t('completed', 'completed', 'leave_review', ['patient']),
];

// ─── Lifecycle test cases (template slug → path) ──────────────────────────────

interface LifecycleCase {
  name: string;
  slug: string;
  providerType: string;
  serviceMode: string;
  steps: any[];
  transitions: any[];
  serviceConfig?: any;
  paymentTiming?: string;
  /** Ordered sequence: [action, role, fromStatus, toStatus] */
  happyPath: [string, string, string, string][];
  cancelPath: [string, string, string, string][];
}

const LIFECYCLE_CASES: LifecycleCase[] = [
  // ─── DOCTOR ──────────────────────────────────────────────────────────────
  {
    name: 'Doctor Standard Office',
    slug: 'doctor-standard-office',
    providerType: 'DOCTOR', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',       'provider', 'pending',       'confirmed'],
      ['check_in',     'provider', 'confirmed',     'waiting_room'],
      ['start',        'provider', 'waiting_room',  'in_progress'],
      ['complete',     'provider', 'in_progress',   'completed'],
    ],
    cancelPath: [
      ['cancel', 'patient', 'pending', 'cancelled'],
    ],
  },
  {
    name: 'Doctor Standard Home',
    slug: 'doctor-standard-home',
    providerType: 'DOCTOR', serviceMode: 'home',
    steps: HOME_STEPS, transitions: HOME_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',             'confirmed'],
      ['depart',   'provider', 'confirmed',           'provider_travelling'],
      ['arrived',  'provider', 'provider_travelling', 'provider_arrived'],
      ['start',    'provider', 'provider_arrived',    'in_progress'],
      ['complete', 'provider', 'in_progress',         'completed'],
    ],
    cancelPath: [
      ['deny', 'provider', 'pending', 'cancelled'],
    ],
  },
  {
    name: 'Doctor Standard Video',
    slug: 'doctor-standard-video',
    providerType: 'DOCTOR', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',     'call_ready'],
      ['join_call', 'patient',  'call_ready',  'in_call'],
      ['end_call',  'provider', 'in_call',     'completed'],
    ],
    cancelPath: [
      ['cancel', 'patient', 'pending', 'cancelled'],
    ],
  },
  {
    name: 'Doctor Surgery Office',
    slug: 'doctor-surgery-office',
    providerType: 'DOCTOR', serviceMode: 'office',
    steps: SURGERY_STEPS, transitions: SURGERY_TRANSITIONS,
    happyPath: [
      ['accept',          'provider', 'pending',             'confirmed'],
      ['start_preop',     'provider', 'confirmed',           'pre_op_assessment'],
      ['patient_ready',   'provider', 'pre_op_assessment',   'ready_for_procedure'],
      ['start_procedure', 'provider', 'ready_for_procedure', 'in_procedure'],
      ['end_procedure',   'provider', 'in_procedure',        'post_op_observation'],
      ['discharge',       'provider', 'post_op_observation', 'recovery_instructions'],
      ['complete',        'provider', 'recovery_instructions', 'completed'],
    ],
    cancelPath: [
      ['cancel', 'patient', 'pending', 'cancelled'],
    ],
  },
  {
    name: 'Doctor Diagnostic Office',
    slug: 'doctor-diagnostic-office',
    providerType: 'DOCTOR', serviceMode: 'office',
    steps: DIAGNOSTIC_STEPS, transitions: DIAGNOSTIC_TRANSITIONS,
    happyPath: [
      ['accept',        'provider', 'pending',       'confirmed'],
      ['start_exam',    'provider', 'confirmed',     'examination'],
      ['enter_results', 'provider', 'examination',   'results_ready'],
      ['complete',      'provider', 'results_ready', 'completed'],
    ],
    cancelPath: [
      ['cancel', 'patient', 'pending', 'cancelled'],
    ],
  },
  // ─── NURSE ────────────────────────────────────────────────────────────────
  {
    name: 'Nurse Standard Office',
    slug: 'nurse-standard-office',
    providerType: 'NURSE', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Nurse Standard Home',
    slug: 'nurse-standard-home',
    providerType: 'NURSE', serviceMode: 'home',
    steps: HOME_STEPS, transitions: HOME_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',             'confirmed'],
      ['depart',   'provider', 'confirmed',           'provider_travelling'],
      ['arrived',  'provider', 'provider_travelling', 'provider_arrived'],
      ['start',    'provider', 'provider_arrived',    'in_progress'],
      ['complete', 'provider', 'in_progress',         'completed'],
    ],
    cancelPath: [['deny', 'provider', 'pending', 'cancelled']],
  },
  {
    name: 'Nurse Standard Video',
    slug: 'nurse-standard-video',
    providerType: 'NURSE', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Nurse Sample Collection Home (10 steps)',
    slug: 'nurse-sample-collection-home',
    providerType: 'NURSE', serviceMode: 'home',
    steps: NURSE_SAMPLE_STEPS, transitions: NURSE_SAMPLE_TRANSITIONS,
    happyPath: [
      ['accept',          'provider', 'pending',          'confirmed'],
      ['depart',          'provider', 'confirmed',        'nurse_travelling'],
      ['arrived',         'provider', 'nurse_travelling', 'nurse_arrived'],
      ['start_collection','provider', 'nurse_arrived',    'sample_collection'],
      ['collected',       'provider', 'sample_collection','sample_collected'],
      ['depart_lab',      'provider', 'sample_collected', 'sample_in_transit'],
      ['delivered_lab',   'provider', 'sample_in_transit','sample_delivered'],
      ['complete',        'provider', 'sample_delivered', 'completed'],
    ],
    cancelPath: [
      ['accept',  'provider', 'pending',   'confirmed'],
      ['cancel',  'provider', 'confirmed', 'cancelled'],
    ],
  },
  // ─── NANNY ────────────────────────────────────────────────────────────────
  {
    name: 'Nanny Standard Office',
    slug: 'nanny-standard-office',
    providerType: 'NANNY', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Nanny Standard Home',
    slug: 'nanny-standard-home',
    providerType: 'NANNY', serviceMode: 'home',
    steps: HOME_STEPS, transitions: HOME_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',             'confirmed'],
      ['depart',   'provider', 'confirmed',           'provider_travelling'],
      ['arrived',  'provider', 'provider_travelling', 'provider_arrived'],
      ['start',    'provider', 'provider_arrived',    'in_progress'],
      ['complete', 'provider', 'in_progress',         'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Nanny Standard Video',
    slug: 'nanny-standard-video',
    providerType: 'NANNY', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── LAB TECHNICIAN ───────────────────────────────────────────────────────
  {
    name: 'Lab Technician Standard Office',
    slug: 'lab_technician-standard-office',
    providerType: 'LAB_TECHNICIAN', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['deny', 'provider', 'pending', 'cancelled']],
  },
  {
    name: 'Lab Technician Standard Home',
    slug: 'lab_technician-standard-home',
    providerType: 'LAB_TECHNICIAN', serviceMode: 'home',
    steps: HOME_STEPS, transitions: HOME_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',             'confirmed'],
      ['depart',   'provider', 'confirmed',           'provider_travelling'],
      ['arrived',  'provider', 'provider_travelling', 'provider_arrived'],
      ['start',    'provider', 'provider_arrived',    'in_progress'],
      ['complete', 'provider', 'in_progress',         'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── CAREGIVER ────────────────────────────────────────────────────────────
  {
    name: 'Caregiver Standard Office',
    slug: 'caregiver-standard-office',
    providerType: 'CAREGIVER', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Caregiver Standard Home',
    slug: 'caregiver-standard-home',
    providerType: 'CAREGIVER', serviceMode: 'home',
    steps: HOME_STEPS, transitions: HOME_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',             'confirmed'],
      ['depart',   'provider', 'confirmed',           'provider_travelling'],
      ['arrived',  'provider', 'provider_travelling', 'provider_arrived'],
      ['start',    'provider', 'provider_arrived',    'in_progress'],
      ['complete', 'provider', 'in_progress',         'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Caregiver Standard Video',
    slug: 'caregiver-standard-video',
    providerType: 'CAREGIVER', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── PHYSIOTHERAPIST ──────────────────────────────────────────────────────
  {
    name: 'Physiotherapist Standard Office',
    slug: 'physiotherapist-standard-office',
    providerType: 'PHYSIOTHERAPIST', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Physiotherapist Standard Video',
    slug: 'physiotherapist-standard-video',
    providerType: 'PHYSIOTHERAPIST', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── DENTIST ──────────────────────────────────────────────────────────────
  {
    name: 'Dentist Standard Office',
    slug: 'dentist-standard-office',
    providerType: 'DENTIST', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Dentist Standard Video',
    slug: 'dentist-standard-video',
    providerType: 'DENTIST', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── OPTOMETRIST ──────────────────────────────────────────────────────────
  {
    name: 'Optometrist Standard Office',
    slug: 'optometrist-standard-office',
    providerType: 'OPTOMETRIST', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  // ─── NUTRITIONIST ─────────────────────────────────────────────────────────
  {
    name: 'Nutritionist Standard Office',
    slug: 'nutritionist-standard-office',
    providerType: 'NUTRITIONIST', serviceMode: 'office',
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
    happyPath: [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['check_in', 'provider', 'confirmed',    'waiting_room'],
      ['start',    'provider', 'waiting_room', 'in_progress'],
      ['complete', 'provider', 'in_progress',  'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
  {
    name: 'Nutritionist Standard Video',
    slug: 'nutritionist-standard-video',
    providerType: 'NUTRITIONIST', serviceMode: 'video',
    steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS,
    happyPath: [
      ['accept',    'provider', 'pending',    'call_ready'],
      ['join_call', 'patient',  'call_ready', 'in_call'],
      ['end_call',  'provider', 'in_call',    'completed'],
    ],
    cancelPath: [['cancel', 'patient', 'pending', 'cancelled']],
  },
];

// ─── Shared mock infrastructure ───────────────────────────────────────────────

function makeInstance(template: any, currentStatus: string, overrides: any = {}) {
  return {
    id: 'INST001', bookingId: 'BOOK001', bookingType: 'service_booking',
    providerUserId: 'PROV001', patientUserId: 'PAT001',
    currentStatus,
    templateId: template.id ?? 'TPL001',
    serviceMode: template.serviceMode ?? 'office',
    metadata: { servicePrice: 500 },
    startedAt: new Date(),
    completedAt: null, cancelledAt: null,
    templateSnapshot: { steps: template.steps, transitions: template.transitions },
    template,
    ...overrides,
  };
}

function buildMocks() {
  const mockPrisma = {
    workflowInstance: { findUnique: jest.fn(), update: jest.fn() },
    serviceBooking: { findUnique: jest.fn().mockResolvedValue({ id: 'BOOK001', scheduledAt: new Date(), duration: 30, providerUserId: 'PROV001' }), update: jest.fn().mockResolvedValue({}) },
    appointment: { update: jest.fn().mockResolvedValue({}) },
    nurseBooking: { update: jest.fn().mockResolvedValue({}) },
    childcareBooking: { update: jest.fn().mockResolvedValue({}) },
    labTestBooking: { update: jest.fn().mockResolvedValue({}) },
    emergencyBooking: { update: jest.fn().mockResolvedValue({}) },
    bookedSlot: { upsert: jest.fn().mockResolvedValue({}), updateMany: jest.fn().mockResolvedValue({}) },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'PROV001' }) },
    providerRole: { findUnique: jest.fn().mockResolvedValue({ code: 'DOCTOR' }) },
    platformService: { findUnique: jest.fn().mockResolvedValue(null) },
    workflowStepType: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };
  const mockNotifications = { createNotification: jest.fn().mockResolvedValue({ id: 'NOTIF001' }) };
  const mockInstanceRepo = {
    findById: jest.fn(),
    findByBooking: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
  };
  const mockStepLogRepo = { create: jest.fn().mockResolvedValue({}) };
  const mockRegistry = { resolveTemplate: jest.fn() };
  const mockNotificationResolver = {
    buildVariables: jest.fn().mockResolvedValue({ patientName: 'John', providerName: 'Dr Smith', serviceName: 'Consultation', scheduledAt: 'Tomorrow', amount: '500', status: 'confirmed', bookingId: 'BOOK001', actionBy: 'provider', eta: '' }),
    resolve: jest.fn().mockReturnValue({ title: 'Update', message: 'Status changed', type: 'booking_update' }),
  };
  const mockFlagHandlers = new Map();
  return { mockPrisma, mockNotifications, mockInstanceRepo, mockStepLogRepo, mockRegistry, mockNotificationResolver, mockFlagHandlers };
}

async function createService(mocks: ReturnType<typeof buildMocks>): Promise<WorkflowEngineService> {
  const { mockPrisma, mockNotifications, mockInstanceRepo, mockStepLogRepo, mockRegistry, mockNotificationResolver, mockFlagHandlers } = mocks;
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      WorkflowEngineService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: NotificationsService, useValue: mockNotifications },
      { provide: WorkflowInstanceRepository, useValue: mockInstanceRepo },
      { provide: WorkflowStepLogRepository, useValue: mockStepLogRepo },
      { provide: WorkflowRegistry, useValue: mockRegistry },
      { provide: WorkflowNotificationResolver, useValue: mockNotificationResolver },
      { provide: 'STEP_FLAG_HANDLERS', useValue: mockFlagHandlers },
    ],
  }).compile();
  return module.get<WorkflowEngineService>(WorkflowEngineService);
}

// ─── 1. DATA-DRIVEN LIFECYCLE TESTS ──────────────────────────────────────────

describe('Workflow Lifecycle — all templates', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  describe.each(LIFECYCLE_CASES)('$name', (tc) => {
    const template = { id: `TPL-${tc.slug}`, ...tc };

    it('completes the full happy path without error', async () => {
      let currentStatus = 'pending';

      for (const [action, role, fromStatus, toStatus] of tc.happyPath) {
        const inst = makeInstance(template, currentStatus);
        mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
        mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus });

        const result = await service.transition({
          instanceId: 'INST001', action, actionByRole: role as any, actionByUserId: role === 'patient' ? 'PAT001' : 'PROV001',
        });

        expect(result.success).toBe(true);
        expect(result.currentStatus).toBe(toStatus);
        expect(mocks.mockStepLogRepo.create).toHaveBeenCalled();
        expect(mocks.mockNotifications.createNotification).toHaveBeenCalled();

        currentStatus = toStatus;
        jest.clearAllMocks();
        mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus });
        mocks.mockStepLogRepo.create.mockResolvedValue({});
        mocks.mockNotifications.createNotification.mockResolvedValue({ id: 'NOTIF001' });
        mocks.mockNotificationResolver.resolve.mockReturnValue({ title: 'Update', message: 'Status changed', type: 'booking_update' });
        mocks.mockNotificationResolver.buildVariables.mockResolvedValue({ patientName: 'John', providerName: 'Dr Smith', serviceName: 'Consultation', scheduledAt: 'Tomorrow', amount: '500', status: toStatus, bookingId: 'BOOK001', actionBy: role, eta: '' });
        mocks.mockPrisma.serviceBooking.findUnique.mockResolvedValue({ id: 'BOOK001', scheduledAt: new Date(), duration: 30, providerUserId: 'PROV001' });
        mocks.mockPrisma.serviceBooking.update.mockResolvedValue({});
        mocks.mockPrisma.bookedSlot.upsert.mockResolvedValue({});
        mocks.mockPrisma.bookedSlot.updateMany.mockResolvedValue({});
        mocks.mockPrisma.workflowStepType.findUnique.mockResolvedValue(null);
      }
    });

    it('handles the cancellation path correctly', async () => {
      let currentStatus = 'pending';

      for (const [action, role, fromStatus, toStatus] of tc.cancelPath) {
        const inst = makeInstance(template, currentStatus);
        mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
        mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus, cancelledAt: toStatus === 'cancelled' ? new Date() : null });

        const result = await service.transition({
          instanceId: 'INST001', action, actionByRole: role as any, actionByUserId: role === 'patient' ? 'PAT001' : 'PROV001',
        });

        expect(result.success).toBe(true);
        expect(result.currentStatus).toBe(toStatus);

        currentStatus = toStatus;
        if (currentStatus === 'cancelled') break;

        jest.clearAllMocks();
        mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus });
        mocks.mockStepLogRepo.create.mockResolvedValue({});
        mocks.mockNotifications.createNotification.mockResolvedValue({ id: 'NOTIF001' });
        mocks.mockNotificationResolver.resolve.mockReturnValue({ title: 'Update', message: 'Status changed', type: 'booking_update' });
        mocks.mockNotificationResolver.buildVariables.mockResolvedValue({ patientName: 'John', providerName: 'Dr Smith', serviceName: 'Consultation', scheduledAt: 'Tomorrow', amount: '500', status: toStatus, bookingId: 'BOOK001', actionBy: role, eta: '' });
        mocks.mockPrisma.serviceBooking.findUnique.mockResolvedValue({ id: 'BOOK001', scheduledAt: new Date(), duration: 30, providerUserId: 'PROV001' });
        mocks.mockPrisma.serviceBooking.update.mockResolvedValue({});
        mocks.mockPrisma.bookedSlot.upsert.mockResolvedValue({});
        mocks.mockPrisma.bookedSlot.updateMany.mockResolvedValue({});
        mocks.mockPrisma.workflowStepType.findUnique.mockResolvedValue(null);
      }
    });

    it('rejects invalid actions from current status', async () => {
      const inst = makeInstance(template, 'pending');
      mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

      // A patient cannot 'accept' (that's a provider action)
      await expect(service.transition({
        instanceId: 'INST001', action: 'accept', actionByRole: 'patient', actionByUserId: 'PAT001',
      })).rejects.toThrow(BadRequestException);
    });

    it('rejects transitions on already-completed instances', async () => {
      const inst = makeInstance(template, 'completed', { completedAt: new Date() });
      mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

      await expect(service.transition({
        instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001',
      })).rejects.toThrow(BadRequestException);
    });

    it('rejects transitions on already-cancelled instances', async () => {
      const inst = makeInstance(template, 'cancelled', { cancelledAt: new Date() });
      mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

      await expect(service.transition({
        instanceId: 'INST001', action: 'cancel', actionByRole: 'patient', actionByUserId: 'PAT001',
      })).rejects.toThrow(BadRequestException);
    });

    it('returns instance not found error for unknown instanceId', async () => {
      mocks.mockInstanceRepo.findById.mockResolvedValue(null);

      await expect(service.transition({
        instanceId: 'GHOST_INST', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
      })).rejects.toThrow(BadRequestException);
    });
  });
});

// ─── 2. PRE-FLIGHT VALIDATION ─────────────────────────────────────────────────

describe('Pre-flight validation', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const SIMPLE_TEMPLATE = {
    id: 'TPL-SIMPLE', name: 'Simple', slug: 'simple', providerType: 'DOCTOR', serviceMode: 'office',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [], actionsForProvider: [a('accept', 'Accept', 'confirmed')] },
      { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed')] },
      { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
      { order: 4, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [] },
    ],
    transitions: [
      t('pending', 'confirmed', 'accept', ['provider']),
      t('pending', 'cancelled', 'cancel', ['patient']),
      t('confirmed', 'completed', 'complete', ['provider']),
    ],
    serviceConfig: {},
  };

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('blocks acceptance when payment handler rejects (insufficient balance)', async () => {
    const payValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Insufficient wallet balance'] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate });

    const inst = makeInstance(SIMPLE_TEMPLATE, 'pending', { metadata: { servicePrice: 500 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);

    expect(payValidate).toHaveBeenCalled();
  });

  it('allows acceptance when balance is sufficient', async () => {
    const payValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    const payExecute = jest.fn().mockResolvedValue({ paymentProcessed: true });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate, execute: payExecute });

    const inst = makeInstance(SIMPLE_TEMPLATE, 'pending', { metadata: { servicePrice: 500 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
    expect(payValidate).toHaveBeenCalled();
  });

  it('blocks acceptance when serviceConfig requires "db:prescription" and prescription missing', async () => {
    const rxValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['No active prescription found'] });
    mocks.mockFlagHandlers.set('requires_prescription', { flag: 'requires_prescription', validate: rxValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['db:prescription'] } } };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
    expect(rxValidate).toHaveBeenCalled();
  });

  it('allows acceptance when serviceConfig requires "db:prescription" and prescription exists', async () => {
    const rxValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('requires_prescription', { flag: 'requires_prescription', validate: rxValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['db:prescription'] } } };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
  });

  it('blocks acceptance when serviceConfig requires "input:lab_result" and content missing', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Content of type "lab_result" is required'] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['input:lab_result'] } } };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
    expect(contentValidate).toHaveBeenCalled();
    const ctxArg = contentValidate.mock.calls[0][0];
    expect(ctxArg.flags.requires_content).toBe('lab_result');
  });

  it('allows acceptance when "input:dental_chart" content is provided', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['input:dental_chart'] } } };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
      contentData: { type: 'dental_chart', url: '/uploads/chart.pdf' },
    });
    expect(result.success).toBe(true);
  });

  it('does NOT run pre-flight on non-accept actions (cancel skips prescription check)', async () => {
    const rxValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['No prescription'] });
    mocks.mockFlagHandlers.set('requires_prescription', { flag: 'requires_prescription', validate: rxValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['db:prescription'] } } };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'cancelled', cancelledAt: new Date() });

    const result = await service.transition({
      instanceId: 'INST001', action: 'cancel', actionByRole: 'patient', actionByUserId: 'PAT001',
    });
    expect(result.success).toBe(true);
    expect(rxValidate).not.toHaveBeenCalled();
  });

  it('accumulates multiple pre-flight errors and throws them together', async () => {
    const payValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Insufficient balance'] });
    const rxValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['No prescription'] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate });
    mocks.mockFlagHandlers.set('requires_prescription', { flag: 'requires_prescription', validate: rxValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { preflight: { requires: ['db:prescription'] } } };
    const inst = makeInstance(tpl, 'pending', { metadata: { servicePrice: 500 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    let caughtMessage = '';
    try {
      await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });
    } catch (e: any) {
      caughtMessage = e.message;
    }
    expect(caughtMessage).toContain('Insufficient balance');
    expect(caughtMessage).toContain('No prescription');
  });

  it('blocks acceptance when stock check fails (Health Shop template)', async () => {
    const stockValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Item "Ibuprofen 400mg" is out of stock (need 2, have 0)'] });
    mocks.mockFlagHandlers.set('triggers_stock_check', { flag: 'triggers_stock_check', validate: stockValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { stock: { checkOnAcceptance: true } } };
    const inst = makeInstance(tpl, 'pending', {
      metadata: { servicePrice: 300, inventoryItems: [{ itemId: 'MED001', quantity: 2 }] },
    });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
    expect(stockValidate).toHaveBeenCalled();
  });

  it('skips stock check when no inventoryItems in metadata', async () => {
    const stockValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Out of stock'] });
    mocks.mockFlagHandlers.set('triggers_stock_check', { flag: 'triggers_stock_check', validate: stockValidate });

    const tpl = { ...SIMPLE_TEMPLATE, serviceConfig: { stock: { checkOnAcceptance: true } } };
    const inst = makeInstance(tpl, 'pending', { metadata: { servicePrice: 0 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
    expect(stockValidate).not.toHaveBeenCalled();
  });
});

// ─── 3. PAYMENT TIMING ────────────────────────────────────────────────────────

describe('Payment timing', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const makePaymentTemplate = (paymentTiming: string) => ({
    id: `TPL-PAY-${paymentTiming}`, name: 'Payment Test', slug: `payment-${paymentTiming}`,
    providerType: 'DOCTOR', serviceMode: 'office', paymentTiming,
    serviceConfig: {},
    steps: [
      { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [], actionsForProvider: [a('accept', 'Accept', 'confirmed')] },
      { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed')] },
      { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
    ],
    transitions: [t('pending', 'confirmed', 'accept', ['provider']), t('confirmed', 'completed', 'complete', ['provider'])],
  });

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('charges on acceptance when paymentTiming is ON_ACCEPTANCE', async () => {
    const payExecute = jest.fn().mockResolvedValue({ paymentProcessed: true });
    const payValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate, execute: payExecute });

    const tpl = makePaymentTemplate('ON_ACCEPTANCE');
    const inst = makeInstance(tpl, 'pending', { metadata: { servicePrice: 800 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
    expect(payExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.paymentProcessed).toBe(true);
  });

  it('charges on completion when paymentTiming is ON_COMPLETION', async () => {
    const payExecute = jest.fn().mockResolvedValue({ paymentProcessed: true });
    const payValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate, execute: payExecute });

    const tpl = makePaymentTemplate('ON_COMPLETION');
    const confirmedInst = makeInstance(tpl, 'confirmed', { metadata: { servicePrice: 800 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(confirmedInst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...confirmedInst, currentStatus: 'completed', completedAt: new Date() });

    const result = await service.transition({
      instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
    expect(payExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.paymentProcessed).toBe(true);
  });

  it('does NOT charge on acceptance when paymentTiming is ON_COMPLETION', async () => {
    const payExecute = jest.fn().mockResolvedValue({ paymentProcessed: true });
    const payValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate, execute: payExecute });

    const tpl = makePaymentTemplate('ON_COMPLETION');
    const inst = makeInstance(tpl, 'pending', { metadata: { servicePrice: 800 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    await service.transition({
      instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(payExecute).not.toHaveBeenCalled();
  });

  it('does NOT charge when paymentTiming is PAY_LATER', async () => {
    const payExecute = jest.fn().mockResolvedValue({ paymentProcessed: true });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: jest.fn().mockResolvedValue({ valid: true, errors: [] }), execute: payExecute });

    const tpl = makePaymentTemplate('PAY_LATER');
    const confirmedInst = makeInstance(tpl, 'confirmed', { metadata: { servicePrice: 3500 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(confirmedInst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...confirmedInst, currentStatus: 'completed', completedAt: new Date() });

    await service.transition({
      instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(payExecute).not.toHaveBeenCalled();
  });

  it('triggers refund on cancellation when refund handler is registered', async () => {
    const refundExecute = jest.fn().mockResolvedValue({ refundProcessed: true });
    mocks.mockFlagHandlers.set('triggers_refund', { flag: 'triggers_refund', execute: refundExecute });

    const tpl = {
      ...makePaymentTemplate('ON_ACCEPTANCE'),
      transitions: [
        t('pending', 'confirmed', 'accept', ['provider']),
        t('confirmed', 'cancelled', 'cancel', ['patient', 'provider']),
        t('confirmed', 'completed', 'complete', ['provider']),
      ],
      steps: [
        { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [], actionsForProvider: [a('accept', 'Accept', 'confirmed')] },
        { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [a('complete', 'Complete', 'completed'), a('cancel', 'Cancel', 'cancelled', 'danger')] },
        { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
        { order: 4, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [], actionsForProvider: [] },
      ],
    };
    const confirmedInst = makeInstance(tpl, 'confirmed', { metadata: { servicePrice: 500 } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(confirmedInst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...confirmedInst, currentStatus: 'cancelled', cancelledAt: new Date() });

    const result = await service.transition({
      instanceId: 'INST001', action: 'cancel', actionByRole: 'patient', actionByUserId: 'PAT001',
    });
    expect(result.success).toBe(true);
    expect(refundExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.refundProcessed).toBe(true);
  });
});

// ─── 4. NOTIFICATION INVARIANT ────────────────────────────────────────────────

describe('Notification invariant — both sides always notified', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const NOTIF_TEMPLATE = {
    id: 'TPL-NOTIF', name: 'Notification Test', slug: 'notif-test',
    providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {},
    steps: [
      { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', notifyProvider: { title: 'New booking', message: 'Patient {{patientName}} booked' }, notifyPatient: null, actionsForPatient: [], actionsForProvider: [a('accept', 'Accept', 'confirmed')] },
      { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', notifyPatient: { title: 'Confirmed', message: 'Your booking is confirmed' }, notifyProvider: null, actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed')] },
      { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
    ],
    transitions: [t('pending', 'confirmed', 'accept', ['provider']), t('confirmed', 'completed', 'complete', ['provider'])],
  };

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('emits at least one notification to patient and one to provider on accept', async () => {
    const inst = makeInstance(NOTIF_TEMPLATE, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });

    const calls = mocks.mockNotifications.createNotification.mock.calls;
    const recipientIds = calls.map((c: any) => c[0].userId);
    expect(recipientIds).toContain('PAT001');
    expect(recipientIds).toContain('PROV001');
  });

  it('uses fallback notification copy when template step has no custom text', async () => {
    // Step with null notifyPatient and null notifyProvider — engine should still fire
    const tpl = {
      ...NOTIF_TEMPLATE,
      steps: NOTIF_TEMPLATE.steps.map(s => ({ ...s, notifyPatient: null, notifyProvider: null })),
    };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });

    expect(mocks.mockNotifications.createNotification).toHaveBeenCalled();
  });

  it('notifies on every single step of a multi-step flow', async () => {
    const steps: [string, string, string, string][] = [
      ['accept',   'provider', 'pending',      'confirmed'],
      ['complete', 'provider', 'confirmed',    'completed'],
    ];

    for (const [action, role, , toStatus] of steps) {
      const inst = makeInstance(NOTIF_TEMPLATE, action === 'accept' ? 'pending' : 'confirmed');
      mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
      mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus });

      await service.transition({ instanceId: 'INST001', action, actionByRole: role as any, actionByUserId: 'PROV001' });

      const callCount = mocks.mockNotifications.createNotification.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(1);

      jest.clearAllMocks();
      mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: toStatus });
      mocks.mockStepLogRepo.create.mockResolvedValue({});
      mocks.mockNotifications.createNotification.mockResolvedValue({ id: 'NOTIF001' });
      mocks.mockNotificationResolver.resolve.mockReturnValue({ title: 'Update', message: 'Status changed', type: 'booking_update' });
      mocks.mockNotificationResolver.buildVariables.mockResolvedValue({ patientName: 'John', providerName: 'Dr Smith', serviceName: 'Consult', scheduledAt: 'Tmrw', amount: '500', status: toStatus, bookingId: 'BOOK001', actionBy: role, eta: '' });
      mocks.mockPrisma.serviceBooking.findUnique.mockResolvedValue({ id: 'BOOK001', scheduledAt: new Date(), duration: 30, providerUserId: 'PROV001' });
      mocks.mockPrisma.serviceBooking.update.mockResolvedValue({});
      mocks.mockPrisma.bookedSlot.upsert.mockResolvedValue({});
      mocks.mockPrisma.workflowStepType.findUnique.mockResolvedValue(null);
    }
  });
});

// ─── 5. VIDEO / AUDIO CALL TRIGGERS ──────────────────────────────────────────

describe('Video and audio call triggers', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('creates a video room on accept when serviceMode is "video"', async () => {
    const videoExecute = jest.fn().mockResolvedValue({ videoCallId: 'ROOM001' });
    mocks.mockFlagHandlers.set('triggers_video_call', { flag: 'triggers_video_call', execute: videoExecute });

    const tpl = { id: 'TPL-VID', name: 'Video', slug: 'vid', providerType: 'DOCTOR', serviceMode: 'video', serviceConfig: {}, steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'call_ready' });

    const result = await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(result.success).toBe(true);
    expect(videoExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.videoCallId).toBe('ROOM001');
  });

  it('does NOT create a video room for office service mode', async () => {
    const videoExecute = jest.fn().mockResolvedValue({ videoCallId: 'ROOM001' });
    mocks.mockFlagHandlers.set('triggers_video_call', { flag: 'triggers_video_call', execute: videoExecute });

    const tpl = { id: 'TPL-OFF', name: 'Office', slug: 'off', providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {}, steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS };
    const inst = makeInstance(tpl, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(videoExecute).not.toHaveBeenCalled();
  });

  it('creates an audio room when consultationType is "audio" on a video template', async () => {
    const audioExecute = jest.fn().mockResolvedValue({ videoCallId: 'AUDIO001' });
    mocks.mockFlagHandlers.set('triggers_audio_call', { flag: 'triggers_audio_call', execute: audioExecute });

    const tpl = { id: 'TPL-AUD', name: 'Audio', slug: 'aud', providerType: 'DOCTOR', serviceMode: 'video', serviceConfig: {}, steps: VIDEO_STEPS, transitions: VIDEO_TRANSITIONS };
    const inst = makeInstance(tpl, 'pending', { serviceMode: 'video', metadata: { consultationType: 'audio' } });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'call_ready' });

    const result = await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(result.success).toBe(true);
    expect(audioExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.videoCallId).toBe('AUDIO001');
  });
});

// ─── 6. CONTENT REQUIREMENT ENFORCEMENT ──────────────────────────────────────

describe('Content requirement enforcement', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  const CONTENT_STEPS = [
    { order: 1, statusCode: 'in_progress', flags: {}, label: 'In Progress', actionsForPatient: [], actionsForProvider: [a('write_notes', 'Write Notes', 'writing_notes')] },
    { order: 2, statusCode: 'writing_notes', flags: { requires_content: 'care_notes' }, label: 'Writing Notes', actionsForPatient: [], actionsForProvider: [a('send_notes', 'Send', 'completed')] },
    { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
  ];
  const CONTENT_TRANSITIONS = [
    t('in_progress', 'writing_notes', 'write_notes', ['provider']),
    t('writing_notes', 'completed', 'send_notes', ['provider']),
  ];
  const CONTENT_TPL = { id: 'TPL-CNT', name: 'Content', slug: 'cnt', providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {}, steps: CONTENT_STEPS, transitions: CONTENT_TRANSITIONS };

  it('blocks send_notes when requires_content flag set and handler rejects', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Care notes content is required to proceed'] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const inst = makeInstance(CONTENT_TPL, 'writing_notes');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'send_notes', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
    expect(contentValidate).toHaveBeenCalled();
  });

  it('allows send_notes when care_notes content is provided', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const inst = makeInstance(CONTENT_TPL, 'writing_notes');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'completed', completedAt: new Date() });

    const result = await service.transition({
      instanceId: 'INST001', action: 'send_notes', actionByRole: 'provider', actionByUserId: 'PROV001',
      contentData: { type: 'care_notes', text: 'Patient is stable. Follow-up in 2 weeks.' },
    });
    expect(result.success).toBe(true);
    expect(contentValidate).toHaveBeenCalled();
  });

  it('blocks doctor diagnostic "complete" when report content missing (doctor-diagnostic-office)', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Report content required'] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const inst = makeInstance(
      { id: 'TPL-DIA', name: 'Diagnostic', slug: 'dia', providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {}, steps: DIAGNOSTIC_STEPS, transitions: DIAGNOSTIC_TRANSITIONS },
      'results_ready',
    );
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
    expect(contentValidate).toHaveBeenCalled();
  });

  it('surgery recovery_instructions complete blocked without care_notes', async () => {
    const contentValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['Recovery instructions must be attached'] });
    mocks.mockFlagHandlers.set('requires_content', { flag: 'requires_content', validate: contentValidate });

    const inst = makeInstance(
      { id: 'TPL-SURG', name: 'Surgery', slug: 'surg', providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {}, steps: SURGERY_STEPS, transitions: SURGERY_TRANSITIONS },
      'recovery_instructions',
    );
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
  });
});

// ─── 7. STOCK OPERATIONS ──────────────────────────────────────────────────────

describe('Stock operations', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const STOCK_TEMPLATE = {
    id: 'TPL-STOCK', name: 'Stock Test', slug: 'stock-test', providerType: 'PHARMACIST', serviceMode: 'office',
    serviceConfig: { stock: { checkOnAcceptance: true, subtractOnCompletion: true } },
    steps: [
      { order: 1, statusCode: 'pending', flags: {}, label: 'Pending', actionsForPatient: [], actionsForProvider: [a('accept', 'Accept', 'confirmed')] },
      { order: 2, statusCode: 'confirmed', flags: {}, label: 'Confirmed', actionsForPatient: [], actionsForProvider: [a('complete', 'Complete', 'completed')] },
      { order: 3, statusCode: 'completed', flags: {}, label: 'Completed', actionsForPatient: [], actionsForProvider: [] },
    ],
    transitions: [t('pending', 'confirmed', 'accept', ['provider']), t('confirmed', 'completed', 'complete', ['provider'])],
  };

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('passes stock check on acceptance when inventory is available', async () => {
    const stockValidate = jest.fn().mockResolvedValue({ valid: true, errors: [] });
    mocks.mockFlagHandlers.set('triggers_stock_check', { flag: 'triggers_stock_check', validate: stockValidate });

    const inst = makeInstance(STOCK_TEMPLATE, 'pending', {
      metadata: { servicePrice: 200, inventoryItems: [{ itemId: 'MED001', quantity: 1 }] },
    });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(result.success).toBe(true);
    expect(stockValidate).toHaveBeenCalled();
  });

  it('deducts Health Shop stock at terminal success step', async () => {
    const subtractExecute = jest.fn().mockResolvedValue({ stockSubtracted: [{ itemId: 'MED001', newQuantity: 9 }] });
    mocks.mockFlagHandlers.set('triggers_stock_subtract', { flag: 'triggers_stock_subtract', execute: subtractExecute });

    const inst = makeInstance(STOCK_TEMPLATE, 'confirmed', {
      metadata: { servicePrice: 200, inventoryItems: [{ itemId: 'MED001', quantity: 1 }] },
    });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'completed', completedAt: new Date() });

    const result = await service.transition({ instanceId: 'INST001', action: 'complete', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(result.success).toBe(true);
    expect(subtractExecute).toHaveBeenCalled();
    expect(result.triggeredActions?.stockSubtracted).toBeDefined();
  });

  it('does NOT deduct stock on cancellation', async () => {
    const subtractExecute = jest.fn().mockResolvedValue({ stockSubtracted: [] });
    mocks.mockFlagHandlers.set('triggers_stock_subtract', { flag: 'triggers_stock_subtract', execute: subtractExecute });

    const tplWithCancel = {
      ...STOCK_TEMPLATE,
      steps: [...STOCK_TEMPLATE.steps, { order: 4, statusCode: 'cancelled', flags: {}, label: 'Cancelled', actionsForPatient: [a('cancel', 'Cancel', 'cancelled', 'danger')], actionsForProvider: [] }],
      transitions: [...STOCK_TEMPLATE.transitions, t('pending', 'cancelled', 'cancel', ['patient'])],
    };
    const inst = makeInstance(tplWithCancel, 'pending', {
      metadata: { servicePrice: 200, inventoryItems: [{ itemId: 'MED001', quantity: 1 }] },
    });
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'cancelled', cancelledAt: new Date() });

    const result = await service.transition({ instanceId: 'INST001', action: 'cancel', actionByRole: 'patient', actionByUserId: 'PAT001' });
    expect(result.success).toBe(true);
    expect(subtractExecute).not.toHaveBeenCalled();
  });
});

// ─── 8. TEMPLATE RESOLUTION CASCADE ──────────────────────────────────────────

describe('Template resolution cascade (startWorkflow)', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const BASE_TEMPLATE = {
    id: 'TPL-BASE', slug: 'doctor-standard-office', name: 'Doctor Standard Office',
    providerType: 'DOCTOR', serviceMode: 'office', isDefault: true, isDraft: false,
    serviceConfig: {},
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
  };

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('uses registry-resolved template when no explicit templateId given', async () => {
    mocks.mockRegistry.resolveTemplate.mockResolvedValue(BASE_TEMPLATE);
    mocks.mockInstanceRepo.create.mockResolvedValue({
      id: 'INST001', currentStatus: 'pending', ...makeInstance(BASE_TEMPLATE, 'pending'),
    });

    const result = await service.startWorkflow({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      providerUserId: 'PROV001', providerType: 'DOCTOR',
      patientUserId: 'PAT001', serviceMode: 'office',
    });

    expect(result.success).toBe(true);
    expect(mocks.mockRegistry.resolveTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ providerType: 'DOCTOR', serviceMode: 'office' }),
    );
  });

  it('pins to explicit template when workflowTemplateId is provided, bypassing registry', async () => {
    mocks.mockPrisma.workflowTemplate = { findFirst: jest.fn().mockResolvedValue({ ...BASE_TEMPLATE, id: 'TPL-PINNED' }) } as any;
    mocks.mockInstanceRepo.create.mockResolvedValue({
      id: 'INST001', currentStatus: 'pending', ...makeInstance({ ...BASE_TEMPLATE, id: 'TPL-PINNED' }, 'pending'),
    });

    const result = await service.startWorkflow({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      providerUserId: 'PROV001', providerType: 'DOCTOR',
      patientUserId: 'PAT001', serviceMode: 'office',
      workflowTemplateId: 'TPL-PINNED',
    });

    expect(result.success).toBe(true);
    expect(mocks.mockRegistry.resolveTemplate).not.toHaveBeenCalled();
  });

  it('returns error when registry resolves null (no template for provider+mode)', async () => {
    mocks.mockRegistry.resolveTemplate.mockResolvedValue(null);

    const result = await service.startWorkflow({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      providerUserId: 'PROV001', providerType: 'UNKNOWN_ROLE',
      patientUserId: 'PAT001', serviceMode: 'office',
    });

    expect(result.success).toBe(false);
    expect((result as any).error).toContain('No workflow template found');
  });

  it('creates instance with templateSnapshot (protecting against mid-flight template edits)', async () => {
    mocks.mockRegistry.resolveTemplate.mockResolvedValue(BASE_TEMPLATE);
    const createdInstance = { id: 'INST001', currentStatus: 'pending', ...makeInstance(BASE_TEMPLATE, 'pending') };
    mocks.mockInstanceRepo.create.mockResolvedValue(createdInstance);

    await service.startWorkflow({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      providerUserId: 'PROV001', providerType: 'DOCTOR',
      patientUserId: 'PAT001', serviceMode: 'office',
    });

    const createCall = mocks.mockInstanceRepo.create.mock.calls[0][0];
    expect(createCall.templateSnapshot).toBeDefined();
    expect(createCall.templateSnapshot.id).toBe('TPL-BASE');
    expect(createCall.templateSnapshot.steps).toBeDefined();
    expect(createCall.templateSnapshot.transitions).toBeDefined();
  });

  it('emits initial notifications to both patient and provider on workflow start', async () => {
    mocks.mockRegistry.resolveTemplate.mockResolvedValue(BASE_TEMPLATE);
    mocks.mockInstanceRepo.create.mockResolvedValue({ id: 'INST001', ...makeInstance(BASE_TEMPLATE, 'pending') });

    await service.startWorkflow({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      providerUserId: 'PROV001', providerType: 'DOCTOR',
      patientUserId: 'PAT001', serviceMode: 'office',
    });

    const recipientIds = mocks.mockNotifications.createNotification.mock.calls.map((c: any) => c[0].userId);
    expect(recipientIds).toContain('PAT001');
    expect(recipientIds).toContain('PROV001');
  });
});

// ─── 9. EDGE CASES ────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  let service: WorkflowEngineService;
  let mocks: ReturnType<typeof buildMocks>;

  const EDGE_TPL = {
    id: 'TPL-EDGE', name: 'Edge', slug: 'edge', providerType: 'DOCTOR', serviceMode: 'office', serviceConfig: {},
    steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS,
  };

  beforeEach(async () => {
    mocks = buildMocks();
    service = await createService(mocks);
  });

  it('uses templateSnapshot over live template to protect in-flight bookings from template edits', async () => {
    // Live template has NO write_notes step; snapshot has it — snapshot should win
    const alteredTemplate = { ...EDGE_TPL, steps: OFFICE_STEPS.filter(s => s.statusCode !== 'writing_notes'), transitions: OFFICE_TRANSITIONS.filter(t => t.to !== 'writing_notes') };
    const inst = {
      ...makeInstance(EDGE_TPL, 'in_progress'),
      template: alteredTemplate,  // live template altered
      templateSnapshot: { steps: OFFICE_STEPS, transitions: OFFICE_TRANSITIONS },  // original snapshot
    };
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'writing_notes' });

    // Should succeed because snapshot still has the write_notes transition
    const result = await service.transition({ instanceId: 'INST001', action: 'write_notes', actionByRole: 'provider', actionByUserId: 'PROV001' });
    expect(result.success).toBe(true);
    expect(result.currentStatus).toBe('writing_notes');
  });

  it('creates a step log entry on every single transition', async () => {
    const inst = makeInstance(EDGE_TPL, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    await service.transition({ instanceId: 'INST001', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001' });

    expect(mocks.mockStepLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ fromStatus: 'pending', toStatus: 'confirmed', action: 'accept' }),
    );
  });

  it('blocks provider from using patient-only actions', async () => {
    // 'cancel' from pending is a patient action in this template
    const inst = makeInstance(EDGE_TPL, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'cancel', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
  });

  it('allows system role transitions (e.g. auto check_in)', async () => {
    // check_in is allowed by system in OFFICE_TRANSITIONS
    const inst = makeInstance(EDGE_TPL, 'confirmed');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'waiting_room' });

    const result = await service.transition({ instanceId: 'INST001', action: 'check_in', actionByRole: 'system', actionByUserId: 'SYSTEM' });
    expect(result.success).toBe(true);
    expect(result.currentStatus).toBe('waiting_room');
  });

  it('handles missing bookingId gracefully when looking up by instanceId', async () => {
    mocks.mockInstanceRepo.findById.mockResolvedValue(null);

    await expect(service.transition({
      instanceId: 'NONEXISTENT', action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
  });

  it('finds instance by bookingId + bookingType when instanceId not provided', async () => {
    const inst = makeInstance(EDGE_TPL, 'pending');
    mocks.mockInstanceRepo.findByBooking.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'confirmed' });

    const result = await service.transition({
      bookingId: 'BOOK001', bookingType: 'service_booking',
      action: 'accept', actionByRole: 'provider', actionByUserId: 'PROV001',
    });
    expect(result.success).toBe(true);
    expect(mocks.mockInstanceRepo.findByBooking).toHaveBeenCalledWith('BOOK001', 'service_booking');
  });

  it('self-transitions (leave_review: completed → completed) succeed without running pre-flight', async () => {
    const payValidate = jest.fn().mockResolvedValue({ valid: false, errors: ['No balance'] });
    mocks.mockFlagHandlers.set('triggers_payment', { flag: 'triggers_payment', validate: payValidate });

    const inst = makeInstance(EDGE_TPL, 'completed', { completedAt: null }); // note: no completedAt so not blocked
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);
    mocks.mockInstanceRepo.updateStatus.mockResolvedValue({ ...inst, currentStatus: 'completed' });

    const result = await service.transition({ instanceId: 'INST001', action: 'leave_review', actionByRole: 'patient', actionByUserId: 'PAT001' });
    expect(result.success).toBe(true);
    expect(payValidate).not.toHaveBeenCalled();
  });

  it('blocks unknown action even from valid role', async () => {
    const inst = makeInstance(EDGE_TPL, 'pending');
    mocks.mockInstanceRepo.findById.mockResolvedValue(inst);

    await expect(service.transition({
      instanceId: 'INST001', action: 'teleport', actionByRole: 'provider', actionByUserId: 'PROV001',
    })).rejects.toThrow(BadRequestException);
  });
});
