/**
 * Seed 50 - Complete Domain Workflow Templates
 *
 * Adds 12 comprehensive workflow templates covering the healthcare domains
 * that the standard seed 34 only partially addressed:
 *   - Emergency ambulance response (PAY_LATER)
 *   - Recurrent physiotherapy programme
 *   - Mental health therapy (recurrent)
 *   - Dental multi-visit treatment
 *   - Nutrition coaching programme
 *   - Health shop delivery order
 *   - Health shop pickup order
 *   - Vaccination campaign
 *   - Corporate health screening
 *   - Pharmacy prescription fulfilment
 *   - Home nurse visit (enhanced)
 *   - Optician eye exam + prescription
 *
 * All templates are SYSTEM defaults (isDefault=true, createdByAdminId=null,
 * createdByProviderId=null) and use slug-based upsert so re-seeding is safe.
 */
import { PrismaClient, Prisma } from '@prisma/client'

type Step = {
  order: number
  statusCode: string
  label: string
  flags?: Record<string, unknown>
  actionsForPatient?: Array<{ action: string; label: string; targetStatus: string; style: string }>
  actionsForProvider?: Array<{ action: string; label: string; targetStatus: string; style: string }>
  notifyPatient?: { title: string; message: string }
  notifyProvider?: { title: string; message: string }
  expectedDurationMinutes?: number
}

type Template = {
  slug: string
  name: string
  description: string
  providerType: string
  serviceMode: string
  paymentTiming: string
  serviceConfig?: Record<string, unknown>
  steps: Step[]
}

const templates: Template[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. Emergency Ambulance Response
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'emergency-ambulance-response',
    name: 'Emergency Ambulance Response',
    description: 'Full dispatch-to-handoff flow for emergency ambulance calls. Payment billed after care.',
    providerType: 'EMERGENCY_WORKER',
    serviceMode: 'emergency',
    paymentTiming: 'PAY_LATER',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Emergency Call Received',
        actionsForProvider: [{ action: 'dispatch', label: 'Dispatch responder', targetStatus: 'confirmed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Emergency call received', message: 'Your emergency call has been received. A responder is being dispatched, {{patientName}}.' },
        notifyProvider: { title: 'New emergency call', message: 'Emergency call from {{patientName}} - dispatch now.' },
        expectedDurationMinutes: 2,
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Responder Dispatched',
        actionsForProvider: [{ action: 'en_route', label: 'En Route', targetStatus: 'en_route', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Responder dispatched', message: 'Emergency responder dispatched. Stay calm - help is on the way.' },
        expectedDurationMinutes: 3,
      },
      {
        order: 3, statusCode: 'en_route', label: 'Responder En Route',
        actionsForProvider: [{ action: 'on_scene', label: 'Arrived on scene', targetStatus: 'on_scene', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Responder en route', message: 'Your emergency responder is en route to your location.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 4, statusCode: 'on_scene', label: 'On Scene',
        flags: {},
        actionsForProvider: [
          { action: 'triage', label: 'Begin triage', targetStatus: 'triage', style: 'primary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Responder arrived', message: 'Your emergency responder has arrived and is assessing the situation.' },
        expectedDurationMinutes: 5,
      },
      {
        order: 5, statusCode: 'triage', label: 'Triaging Patient',
        actionsForProvider: [
          { action: 'transport', label: 'Transport to facility', targetStatus: 'transporting', style: 'primary' },
          { action: 'treat_scene', label: 'Treat on scene', targetStatus: 'treating_on_scene', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 10,
      },
      {
        order: 6, statusCode: 'treating_on_scene', label: 'Treating On Scene',
        actionsForProvider: [
          { action: 'complete', label: 'Resolved on scene', targetStatus: 'completed', style: 'primary' },
          { action: 'transport', label: 'Now transporting', targetStatus: 'transporting', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 20,
      },
      {
        order: 7, statusCode: 'transporting', label: 'Transporting to Facility',
        actionsForProvider: [
          { action: 'handoff', label: 'Handed off to facility', targetStatus: 'facility_handoff', style: 'primary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Being transported', message: 'You are being transported to a medical facility.' },
        expectedDurationMinutes: 15,
      },
      {
        order: 8, statusCode: 'facility_handoff', label: 'Handed Off to Facility',
        actionsForProvider: [{ action: 'complete', label: 'Confirm handoff', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 5,
      },
      {
        order: 9, statusCode: 'completed', label: 'Emergency Resolved',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Emergency case closed', message: 'Your emergency case has been closed. Please follow up with your doctor if needed.' },
      },
      {
        order: 10, statusCode: 'cancelled', label: 'Call Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. Recurrent Physiotherapy Programme
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'physiotherapy-recurrent-programme',
    name: 'Physiotherapy Rehabilitation Programme',
    description: 'Multi-session rehabilitation workflow: intake → protocol → sessions → discharge.',
    providerType: 'PHYSIOTHERAPIST',
    serviceMode: 'recurrent',
    paymentTiming: 'ON_COMPLETION',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Programme Requested',
        actionsForProvider: [{ action: 'accept', label: 'Accept patient', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel request', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'New rehab request', message: '{{patientName}} has requested a physiotherapy programme.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Programme Accepted',
        actionsForProvider: [{ action: 'intake', label: 'Start intake assessment', targetStatus: 'intake_assessment', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Programme accepted', message: '{{providerName}} has accepted your physiotherapy programme request. An intake assessment will be scheduled.' },
        expectedDurationMinutes: 5,
      },
      {
        order: 3, statusCode: 'intake_assessment', label: 'Intake Assessment',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [{ action: 'create_protocol', label: 'Create rehab protocol', targetStatus: 'protocol_created', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Assessment complete', message: 'Your physiotherapist has completed your intake assessment.' },
        expectedDurationMinutes: 60,
      },
      {
        order: 4, statusCode: 'protocol_created', label: 'Rehab Protocol Created',
        actionsForProvider: [{ action: 'schedule', label: 'Schedule first session', targetStatus: 'session_scheduled', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel programme', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Your rehab plan is ready', message: '{{providerName}} has created your rehabilitation protocol. Expect your first session to be scheduled soon.' },
        expectedDurationMinutes: 15,
      },
      {
        order: 5, statusCode: 'session_scheduled', label: 'Session Scheduled',
        actionsForProvider: [{ action: 'start', label: 'Start session', targetStatus: 'session_in_progress', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel session', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Session scheduled', message: 'Your physiotherapy session is scheduled for {{scheduledAt}}.' },
      },
      {
        order: 6, statusCode: 'session_in_progress', label: 'Session In Progress',
        actionsForProvider: [{ action: 'end', label: 'End session', targetStatus: 'session_notes_pending', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 60,
      },
      {
        order: 7, statusCode: 'session_notes_pending', label: 'Session Notes Pending',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [
          { action: 'submit_notes', label: 'Submit notes + schedule next', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'assess_discharge', label: 'Begin discharge assessment', targetStatus: 'discharge_assessment', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 15,
      },
      {
        order: 8, statusCode: 'discharge_assessment', label: 'Discharge Assessment',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [{ action: 'discharge', label: 'Discharge patient', targetStatus: 'discharged', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Discharge assessment today', message: '{{providerName}} is conducting your final assessment today.' },
        expectedDurationMinutes: 45,
      },
      {
        order: 9, statusCode: 'discharged', label: 'Discharged',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Programme complete', message: 'Congratulations, {{patientName}}! You have been discharged from your physiotherapy programme.' },
        notifyProvider: { title: 'Patient discharged', message: '{{patientName}} has been successfully discharged.' },
      },
      {
        order: 10, statusCode: 'program_suspended', label: 'Programme Suspended',
        actionsForProvider: [
          { action: 'resume', label: 'Resume programme', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'close', label: 'Close programme', targetStatus: 'cancelled', style: 'danger' },
        ],
        actionsForPatient: [],
      },
      {
        order: 11, statusCode: 'completed', label: 'Programme Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 12, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. Mental Health Therapy - Recurrent
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'mental-health-therapy-recurrent',
    name: 'Mental Health Therapy Programme',
    description: 'Ongoing therapy sessions with crisis pathway, medication reviews, and formal outcome tracking.',
    providerType: 'DOCTOR',
    serviceMode: 'recurrent',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Therapy Request',
        actionsForProvider: [{ action: 'accept', label: 'Accept patient', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel request', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'New therapy request', message: '{{patientName}} has requested a mental health therapy programme.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Programme Accepted',
        actionsForProvider: [
          { action: 'crisis_assess', label: 'Conduct crisis assessment', targetStatus: 'crisis_assessment', style: 'primary' },
          { action: 'intake', label: 'Standard intake', targetStatus: 'intake_assessment', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Programme accepted', message: 'Dr. {{providerName}} has accepted your therapy programme. Please attend your first assessment.' },
      },
      {
        order: 3, statusCode: 'crisis_assessment', label: 'Crisis Assessment',
        actionsForProvider: [
          { action: 'schedule', label: 'Schedule therapy sessions', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'refer', label: 'Refer to inpatient', targetStatus: 'completed', style: 'danger' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 60,
      },
      {
        order: 4, statusCode: 'intake_assessment', label: 'Intake Assessment',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [{ action: 'schedule', label: 'Schedule first session', targetStatus: 'session_scheduled', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 50,
      },
      {
        order: 5, statusCode: 'session_scheduled', label: 'Session Scheduled',
        actionsForProvider: [{ action: 'start', label: 'Start session', targetStatus: 'therapy_session_active', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Therapy session confirmed', message: 'Your therapy session is scheduled for {{scheduledAt}}.' },
      },
      {
        order: 6, statusCode: 'therapy_session_active', label: 'Therapy Session Active',
        flags: { triggers_video_call: true },
        actionsForProvider: [{ action: 'end', label: 'End session', targetStatus: 'session_notes_pending', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 50,
      },
      {
        order: 7, statusCode: 'session_notes_pending', label: 'Session Notes Pending',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [
          { action: 'next_session', label: 'Schedule next session', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'med_review', label: 'Schedule medication review', targetStatus: 'medication_review', style: 'secondary' },
          { action: 'evaluate', label: 'Outcome evaluation', targetStatus: 'progress_evaluation', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 15,
      },
      {
        order: 8, statusCode: 'medication_review', label: 'Medication Review',
        flags: { requires_prescription: true },
        actionsForProvider: [{ action: 'complete', label: 'Review complete', targetStatus: 'progress_evaluation', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 9, statusCode: 'progress_evaluation', label: 'Progress Evaluation',
        actionsForProvider: [
          { action: 'continue', label: 'Continue therapy', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'discharge', label: 'Discharge patient', targetStatus: 'discharged', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Progress review today', message: 'Your therapist is reviewing your progress today.' },
        expectedDurationMinutes: 30,
      },
      {
        order: 10, statusCode: 'discharged', label: 'Discharged',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Therapy programme complete', message: 'You have successfully completed your therapy programme. Well done, {{patientName}}.' },
      },
      {
        order: 11, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 12, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. Dental Multi-Visit Treatment
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'dental-multi-visit-treatment',
    name: 'Dental Multi-Visit Treatment',
    description: 'Exam → treatment plan → procedure(s) → post-care → follow-up.',
    providerType: 'DENTIST',
    serviceMode: 'office',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Appointment Requested',
        actionsForProvider: [{ action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Appointment Confirmed',
        actionsForProvider: [{ action: 'start_exam', label: 'Begin examination', targetStatus: 'initial_exam', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel appointment', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Dental appointment confirmed', message: 'Your dental appointment with {{providerName}} is confirmed for {{scheduledAt}}.' },
      },
      {
        order: 3, statusCode: 'initial_exam', label: 'Initial Examination',
        actionsForProvider: [
          { action: 'plan', label: 'Create treatment plan', targetStatus: 'treatment_planned', style: 'primary' },
          { action: 'complete', label: 'No treatment needed', targetStatus: 'completed', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 4, statusCode: 'treatment_planned', label: 'Treatment Plan Ready',
        actionsForProvider: [{ action: 'start', label: 'Begin procedure', targetStatus: 'procedure_in_progress', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Decline treatment', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Treatment plan ready', message: 'Your dentist has prepared a treatment plan. Please review and confirm at your next visit.' },
        expectedDurationMinutes: 15,
      },
      {
        order: 5, statusCode: 'procedure_in_progress', label: 'Procedure In Progress',
        actionsForProvider: [{ action: 'post_care', label: 'Done - give post-care advice', targetStatus: 'post_care_given', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 60,
      },
      {
        order: 6, statusCode: 'post_care_given', label: 'Post-Care Advice Given',
        actionsForProvider: [
          { action: 'schedule_followup', label: 'Schedule follow-up', targetStatus: 'follow_up_scheduled', style: 'primary' },
          { action: 'complete', label: 'Treatment complete', targetStatus: 'treatment_complete', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Post-care instructions sent', message: 'Your dentist has shared post-care instructions. Follow them carefully.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 7, statusCode: 'follow_up_scheduled', label: 'Follow-Up Scheduled',
        actionsForProvider: [{ action: 'start', label: 'Start follow-up', targetStatus: 'procedure_in_progress', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Follow-up appointment scheduled', message: 'Your follow-up dental appointment is scheduled for {{scheduledAt}}.' },
      },
      {
        order: 8, statusCode: 'treatment_complete', label: 'Treatment Complete',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Dental treatment complete', message: 'Your dental treatment is now complete. We recommend check-ups every 6 months.' },
      },
      {
        order: 9, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 10, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. Nutrition Coaching Programme
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'nutrition-coaching-programme',
    name: 'Nutrition Coaching Programme',
    description: 'Nutritional assessment → personalised meal plan → progress reviews until goal achieved.',
    providerType: 'NUTRITIONIST',
    serviceMode: 'recurrent',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Coaching Request',
        actionsForProvider: [{ action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Programme Confirmed',
        actionsForProvider: [{ action: 'assess', label: 'Start nutritional assessment', targetStatus: 'nutrition_assessment', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Nutrition programme confirmed', message: '{{providerName}} has confirmed your nutrition coaching programme.' },
      },
      {
        order: 3, statusCode: 'nutrition_assessment', label: 'Nutritional Assessment',
        actionsForProvider: [{ action: 'create_plan', label: 'Create meal plan', targetStatus: 'meal_plan_created', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 45,
      },
      {
        order: 4, statusCode: 'meal_plan_created', label: 'Meal Plan Created',
        actionsForProvider: [{ action: 'deliver', label: 'Share plan with patient', targetStatus: 'plan_delivered', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 5, statusCode: 'plan_delivered', label: 'Plan Delivered',
        actionsForProvider: [
          { action: 'review', label: 'Schedule progress review', targetStatus: 'progress_review', style: 'primary' },
          { action: 'complete', label: 'Close programme', targetStatus: 'completed', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Meal plan ready', message: '{{providerName}} has shared your personalised nutrition plan.' },
      },
      {
        order: 6, statusCode: 'progress_review', label: 'Progress Review',
        actionsForProvider: [
          { action: 'adjust', label: 'Adjust meal plan', targetStatus: 'meal_plan_created', style: 'primary' },
          { action: 'goal_achieved', label: 'Goal achieved!', targetStatus: 'goal_achieved', style: 'primary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 7, statusCode: 'goal_achieved', label: 'Goal Achieved',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Goal achieved! 🎉', message: 'Congratulations {{patientName}}! You have reached your nutritional goal.' },
      },
      {
        order: 8, statusCode: 'completed', label: 'Programme Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 9, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. Health Shop - Delivery Order
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'health-shop-delivery-order',
    name: 'Health Shop - Delivery',
    description: 'Order placement → optional prescription check → preparation → delivery.',
    providerType: 'PHARMACIST',
    serviceMode: 'delivery',
    paymentTiming: 'IMMEDIATE',
    // Stock lifecycle for Health Shop orders:
    //   • verify items are available before confirming the order (acceptance)
    //   • deduct stock when the order is delivered (terminal success step)
    // Prescription check is per-item (requiresPrescription on ProviderInventoryItem)
    // and enforced by InventoryService for direct orders. For workflow-based orders
    // (e.g. prescription-only delivery), add "db:prescription" to preflight.requires.
    serviceConfig: {
      stock: { checkOnAcceptance: true, subtractOnCompletion: true },
    },
    steps: [
      {
        order: 1, statusCode: 'order_placed', label: 'Order Placed',
        actionsForProvider: [
          { action: 'confirm', label: 'Confirm order', targetStatus: 'order_confirmed', style: 'primary' },
          { action: 'rx_check', label: 'Request prescription', targetStatus: 'prescription_validation', style: 'secondary' },
          { action: 'cancel', label: 'Reject order', targetStatus: 'order_cancelled', style: 'danger' },
        ],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel order', targetStatus: 'order_cancelled', style: 'danger' }],
        notifyPatient: { title: 'Order received', message: 'Your health shop order has been received and is being processed.' },
        notifyProvider: { title: 'New order', message: '{{patientName}} has placed an order. Review and confirm.' },
      },
      {
        order: 2, statusCode: 'prescription_validation', label: 'Prescription Validation',
        flags: { requires_prescription: true },
        actionsForProvider: [
          { action: 'validate', label: 'Prescription valid - proceed', targetStatus: 'order_confirmed', style: 'primary' },
          { action: 'reject', label: 'Invalid prescription', targetStatus: 'order_cancelled', style: 'danger' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Prescription required', message: 'Your order requires a valid prescription. Please upload it.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 3, statusCode: 'order_confirmed', label: 'Order Confirmed',
        actionsForProvider: [{ action: 'prepare', label: 'Start preparing', targetStatus: 'preparing', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Order confirmed', message: 'Your order has been confirmed and is being prepared.' },
        expectedDurationMinutes: 5,
      },
      {
        order: 4, statusCode: 'preparing', label: 'Preparing',
        actionsForProvider: [{ action: 'dispatch', label: 'Out for delivery', targetStatus: 'out_for_delivery', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 5, statusCode: 'out_for_delivery', label: 'Out for Delivery',
        actionsForProvider: [{ action: 'delivered', label: 'Mark as delivered', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Order on the way', message: 'Your health shop order is on its way to you.' },
        expectedDurationMinutes: 45,
      },
      {
        order: 6, statusCode: 'completed', label: 'Delivered',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Order delivered', message: 'Your health shop order has been delivered. Enjoy!' },
      },
      {
        order: 7, statusCode: 'order_cancelled', label: 'Order Cancelled',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Order cancelled', message: 'Your health shop order has been cancelled.' },
      },
      {
        order: 8, statusCode: 'order_refunded', label: 'Refunded',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Refund processed', message: 'Your Health Credit refund has been processed.' },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. Health Shop - Pickup Order
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'health-shop-pickup-order',
    name: 'Health Shop - Click & Collect',
    description: 'Order online, collect at the provider pharmacy or clinic.',
    providerType: 'PHARMACIST',
    serviceMode: 'office',
    paymentTiming: 'IMMEDIATE',
    // Same stock lifecycle as delivery but subtract fires when patient collects
    // (the "Confirm collection" action reaches the terminal COMPLETED step).
    serviceConfig: {
      stock: { checkOnAcceptance: true, subtractOnCompletion: true },
    },
    steps: [
      {
        order: 1, statusCode: 'order_placed', label: 'Order Placed',
        actionsForProvider: [
          { action: 'confirm', label: 'Confirm order', targetStatus: 'order_confirmed', style: 'primary' },
          { action: 'rx_check', label: 'Request prescription', targetStatus: 'prescription_validation', style: 'secondary' },
          { action: 'cancel', label: 'Reject order', targetStatus: 'order_cancelled', style: 'danger' },
        ],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel order', targetStatus: 'order_cancelled', style: 'danger' }],
        notifyPatient: { title: 'Order received', message: 'Your click & collect order has been received.' },
      },
      {
        order: 2, statusCode: 'prescription_validation', label: 'Prescription Check',
        flags: { requires_prescription: true },
        actionsForProvider: [
          { action: 'validate', label: 'Prescription OK', targetStatus: 'order_confirmed', style: 'primary' },
          { action: 'reject', label: 'Invalid Rx', targetStatus: 'order_cancelled', style: 'danger' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 10,
      },
      {
        order: 3, statusCode: 'order_confirmed', label: 'Order Confirmed',
        actionsForProvider: [{ action: 'prepare', label: 'Prepare order', targetStatus: 'preparing', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Order confirmed', message: 'Your order is confirmed. We will notify you when it is ready for collection.' },
      },
      {
        order: 4, statusCode: 'preparing', label: 'Preparing',
        actionsForProvider: [{ action: 'ready', label: 'Ready for pickup', targetStatus: 'ready_for_pickup', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 20,
      },
      {
        order: 5, statusCode: 'ready_for_pickup', label: 'Ready for Pickup',
        actionsForProvider: [{ action: 'complete', label: 'Confirm collection', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Ready for collection', message: 'Your health shop order is ready for collection at the pharmacy.' },
      },
      {
        order: 6, statusCode: 'completed', label: 'Collected',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Order collected', message: 'Thank you for collecting your order.' },
      },
      {
        order: 7, statusCode: 'order_cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. Vaccination Campaign
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'vaccination-campaign',
    name: 'Vaccination / Immunisation',
    description: 'Pre-check → administer → observation period → completion with adverse reaction pathway.',
    providerType: 'NURSE',
    serviceMode: 'office',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Appointment Requested',
        actionsForProvider: [{ action: 'accept', label: 'Confirm appointment', targetStatus: 'confirmed', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Appointment Confirmed',
        actionsForProvider: [{ action: 'pre_check', label: 'Start pre-vaccination check', targetStatus: 'pre_vaccination_check', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Vaccination appointment confirmed', message: 'Your vaccination appointment is confirmed for {{scheduledAt}}. Please arrive 5 minutes early.' },
      },
      {
        order: 3, statusCode: 'pre_vaccination_check', label: 'Pre-Vaccination Check',
        actionsForProvider: [
          { action: 'administer', label: 'Administer vaccine', targetStatus: 'vaccine_administered', style: 'primary' },
          { action: 'defer', label: 'Defer - contraindicated', targetStatus: 'cancelled', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 10,
      },
      {
        order: 4, statusCode: 'vaccine_administered', label: 'Vaccine Administered',
        actionsForProvider: [{ action: 'obs', label: 'Begin observation', targetStatus: 'observation_period', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Vaccine given', message: 'Your vaccine has been administered. Please remain seated for observation.' },
        expectedDurationMinutes: 2,
      },
      {
        order: 5, statusCode: 'observation_period', label: 'Observation Period',
        actionsForProvider: [
          { action: 'clear', label: 'All clear', targetStatus: 'vaccination_complete', style: 'primary' },
          { action: 'reaction', label: 'Adverse reaction', targetStatus: 'reaction_observed', style: 'danger' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 15,
      },
      {
        order: 6, statusCode: 'reaction_observed', label: 'Adverse Reaction',
        actionsForProvider: [
          { action: 'resolve', label: 'Reaction resolved', targetStatus: 'vaccination_complete', style: 'primary' },
          { action: 'emergency', label: 'Refer to emergency', targetStatus: 'completed', style: 'danger' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Reaction observed - nurse attending', message: 'A nurse is attending to an adverse reaction. You are in good hands.' },
      },
      {
        order: 7, statusCode: 'vaccination_complete', label: 'Vaccination Complete',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Vaccination complete', message: 'Your vaccination is complete. You may now leave. A certificate will be issued.' },
      },
      {
        order: 8, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 9, statusCode: 'cancelled', label: 'Cancelled / Deferred',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. Corporate Health Screening
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'corporate-health-screening',
    name: 'Corporate Health Screening',
    description: 'On-site employee health screening: schedule → screen → generate reports → deliver to company.',
    providerType: 'DOCTOR',
    serviceMode: 'office',
    paymentTiming: 'PAY_LATER',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Screening Request',
        actionsForProvider: [{ action: 'accept', label: 'Accept contract', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel request', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'Corporate screening request', message: 'A corporate health screening has been requested.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Contract Accepted',
        actionsForProvider: [{ action: 'schedule', label: 'Confirm screening date', targetStatus: 'screening_scheduled', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Screening contract accepted', message: 'The health screening contract has been accepted.' },
      },
      {
        order: 3, statusCode: 'screening_scheduled', label: 'Screening Date Confirmed',
        actionsForProvider: [{ action: 'start', label: 'Start screening', targetStatus: 'screening_in_progress', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Screening date confirmed', message: 'Corporate health screening is scheduled for {{scheduledAt}}.' },
      },
      {
        order: 4, statusCode: 'screening_in_progress', label: 'Screening In Progress',
        actionsForProvider: [{ action: 'reports', label: 'Generate reports', targetStatus: 'reports_generated', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 240,
      },
      {
        order: 5, statusCode: 'reports_generated', label: 'Reports Generated',
        flags: { requires_content: 'lab_result' },
        actionsForProvider: [{ action: 'deliver', label: 'Deliver to company', targetStatus: 'reports_delivered', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 120,
      },
      {
        order: 6, statusCode: 'reports_delivered', label: 'Reports Delivered',
        actionsForProvider: [{ action: 'complete', label: 'Close contract', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Health screening reports delivered', message: 'Your corporate health screening reports have been delivered.' },
      },
      {
        order: 7, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 8, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. Pharmacy Prescription Fulfilment
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'pharmacy-prescription-fulfilment',
    name: 'Pharmacy Prescription Fulfilment',
    description: 'Receive Rx → verify → prepare (with substitution pathway) → dispense.',
    providerType: 'PHARMACIST',
    serviceMode: 'office',
    paymentTiming: 'ON_ACCEPTANCE',
    // Patient must have an active prescription before the order is accepted.
    // Stock is checked before acceptance and deducted when dispensed (terminal step).
    serviceConfig: {
      preflight: { requires: ['db:prescription'] },
      stock: { checkOnAcceptance: true, subtractOnCompletion: true },
    },
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Prescription Submitted',
        actionsForProvider: [{ action: 'receive', label: 'Acknowledge receipt', targetStatus: 'rx_received', style: 'primary' }],
        actionsForPatient: [],
        notifyProvider: { title: 'New prescription', message: '{{patientName}} has submitted a prescription for review.' },
      },
      {
        order: 2, statusCode: 'rx_received', label: 'Prescription Received',
        actionsForProvider: [
          { action: 'verify', label: 'Verify prescription', targetStatus: 'rx_verified', style: 'primary' },
          { action: 'reject', label: 'Reject - invalid', targetStatus: 'cancelled', style: 'danger' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Prescription received', message: 'The pharmacy has received your prescription and is verifying it.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 3, statusCode: 'rx_verified', label: 'Prescription Verified',
        actionsForProvider: [
          { action: 'prepare', label: 'Prepare medication', targetStatus: 'medication_ready', style: 'primary' },
          { action: 'substitute', label: 'Propose substitution', targetStatus: 'substitution_proposed', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Prescription verified', message: 'Your prescription has been verified. Medication is being prepared.' },
        expectedDurationMinutes: 15,
      },
      {
        order: 4, statusCode: 'substitution_proposed', label: 'Substitution Proposed',
        actionsForProvider: [],
        actionsForPatient: [
          { action: 'accept', label: 'Accept generic', targetStatus: 'medication_ready', style: 'primary' },
          { action: 'decline', label: 'Keep original brand', targetStatus: 'rx_verified', style: 'secondary' },
        ],
        notifyPatient: { title: 'Generic substitute available', message: 'Your pharmacist proposes a generic equivalent. Please confirm your preference.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 5, statusCode: 'medication_ready', label: 'Medication Ready',
        actionsForProvider: [{ action: 'dispense', label: 'Dispense to patient', targetStatus: 'dispensed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Medication ready', message: 'Your medication is ready for collection at the pharmacy.' },
        expectedDurationMinutes: 5,
      },
      {
        order: 6, statusCode: 'dispensed', label: 'Dispensed',
        actionsForProvider: [{ action: 'complete', label: 'Complete order', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Medication dispensed', message: 'Your medication has been dispensed. Take as prescribed.' },
      },
      {
        order: 7, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
      },
      {
        order: 8, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. Home Nurse Visit (Enhanced)
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'home-nurse-visit-enhanced',
    name: 'Home Nurse Visit (Enhanced)',
    description: 'Enhanced home visit with travel tracking, notes requirement, and optional prescription.',
    providerType: 'NURSE',
    serviceMode: 'home',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Home Visit Requested',
        actionsForProvider: [{ action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel request', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'New home visit request', message: '{{patientName}} has requested a home visit.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Visit Confirmed',
        actionsForProvider: [{ action: 'depart', label: 'I am on my way', targetStatus: 'provider_travelling', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel visit', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Home visit confirmed', message: '{{providerName}} will visit you on {{scheduledAt}}.' },
      },
      {
        order: 3, statusCode: 'provider_travelling', label: 'Nurse En Route',
        actionsForProvider: [{ action: 'arrived', label: 'I have arrived', targetStatus: 'provider_arrived', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Nurse is on the way', message: 'Your nurse {{providerName}} is on the way to your address.' },
        expectedDurationMinutes: 20,
      },
      {
        order: 4, statusCode: 'provider_arrived', label: 'Nurse Arrived',
        actionsForProvider: [{ action: 'start', label: 'Begin care session', targetStatus: 'session_in_progress', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Nurse arrived', message: 'Your nurse has arrived. Care session starting.' },
        expectedDurationMinutes: 5,
      },
      {
        order: 5, statusCode: 'session_in_progress', label: 'Care Session In Progress',
        actionsForProvider: [{ action: 'end', label: 'End session - write notes', targetStatus: 'writing_notes', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 45,
      },
      {
        order: 6, statusCode: 'writing_notes', label: 'Writing Clinical Notes',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [{ action: 'submit', label: 'Submit notes & complete', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 10,
      },
      {
        order: 7, statusCode: 'completed', label: 'Visit Completed',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Home visit complete', message: 'Your home nursing visit is complete. Clinical notes have been saved to your record.' },
      },
      {
        order: 8, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. Optician Eye Exam + Prescription
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'optician-eye-exam-prescription',
    name: 'Eye Exam + Prescription',
    description: 'Comprehensive eye examination with prescription issue and optional eyewear order.',
    providerType: 'OPTOMETRIST',
    serviceMode: 'office',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Appointment Requested',
        actionsForProvider: [{ action: 'accept', label: 'Confirm', targetStatus: 'confirmed', style: 'primary' }, { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' }],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Appointment Confirmed',
        actionsForProvider: [{ action: 'start_exam', label: 'Begin eye exam', targetStatus: 'initial_exam', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Eye exam confirmed', message: 'Your eye examination with {{providerName}} is confirmed for {{scheduledAt}}.' },
      },
      {
        order: 3, statusCode: 'initial_exam', label: 'Eye Examination',
        actionsForProvider: [
          { action: 'plan', label: 'Issue prescription', targetStatus: 'treatment_planned', style: 'primary' },
          { action: 'complete', label: 'No prescription needed', targetStatus: 'completed', style: 'secondary' },
        ],
        actionsForPatient: [],
        expectedDurationMinutes: 30,
      },
      {
        order: 4, statusCode: 'treatment_planned', label: 'Prescription Issued',
        flags: { requires_prescription: true },
        actionsForProvider: [
          { action: 'order', label: 'Order eyewear', targetStatus: 'order_placed', style: 'primary' },
          { action: 'complete', label: 'Patient has own eyewear', targetStatus: 'completed', style: 'secondary' },
        ],
        actionsForPatient: [
          { action: 'order_eyewear', label: 'Order glasses / lenses', targetStatus: 'order_placed', style: 'primary' },
        ],
        notifyPatient: { title: 'Prescription ready', message: 'Your eye prescription is ready. You can order eyewear now.' },
        expectedDurationMinutes: 10,
      },
      {
        order: 5, statusCode: 'order_placed', label: 'Eyewear Order Placed',
        actionsForProvider: [{ action: 'confirm', label: 'Confirm order', targetStatus: 'order_confirmed', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 5,
      },
      {
        order: 6, statusCode: 'order_confirmed', label: 'Eyewear Being Made',
        actionsForProvider: [{ action: 'ready', label: 'Eyewear ready', targetStatus: 'ready_for_pickup', style: 'primary' }],
        actionsForPatient: [],
        expectedDurationMinutes: 4320, // 3 days
      },
      {
        order: 7, statusCode: 'ready_for_pickup', label: 'Ready for Collection',
        actionsForProvider: [{ action: 'complete', label: 'Confirm collection', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Eyewear ready', message: 'Your glasses / contact lenses are ready for collection at the optician.' },
      },
      {
        order: 8, statusCode: 'completed', label: 'Completed',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Eye exam complete', message: 'Your eye examination and eyewear order are complete.' },
      },
      {
        order: 9, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 13. Caregiver - Recurrent Home Support
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'caregiver-recurrent-home',
    name: 'Caregiver - Recurrent Home Support',
    description: 'Multi-session home care program: assessment → protocol → recurring visits → discharge.',
    providerType: 'CAREGIVER',
    serviceMode: 'home',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Pending',
        actionsForProvider: [
          { action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' },
          { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' },
        ],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'New Request', message: 'New home care request from {{patientName}}.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Confirmed',
        actionsForProvider: [{ action: 'travel', label: 'I am travelling', targetStatus: 'provider_travelling', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Confirmed', message: 'Your caregiver confirmed your session for {{scheduledAt}}.' },
      },
      {
        order: 3, statusCode: 'provider_travelling', label: 'Caregiver En Route',
        actionsForProvider: [{ action: 'arrived', label: 'Arrived at patient', targetStatus: 'provider_arrived', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'En Route', message: 'Your caregiver is on the way.' },
      },
      {
        order: 4, statusCode: 'provider_arrived', label: 'Caregiver Arrived',
        actionsForProvider: [{ action: 'start_assessment', label: 'Start assessment', targetStatus: 'program_assessment', style: 'primary' }],
        actionsForPatient: [],
      },
      {
        order: 5, statusCode: 'program_assessment', label: 'Initial Assessment',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [{ action: 'create_protocol', label: 'Create care protocol', targetStatus: 'protocol_created', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Assessment Done', message: 'Your caregiver has completed your initial assessment.' },
      },
      {
        order: 6, statusCode: 'protocol_created', label: 'Care Protocol Created',
        actionsForProvider: [{ action: 'schedule_next', label: 'Schedule next session', targetStatus: 'session_scheduled', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Protocol Ready', message: 'Your personalised care protocol is ready.' },
      },
      {
        order: 7, statusCode: 'session_scheduled', label: 'Session Scheduled',
        actionsForProvider: [{ action: 'start_session', label: 'Start session', targetStatus: 'session_in_progress', style: 'primary' }],
        actionsForPatient: [{ action: 'cancel_session', label: 'Cancel session', targetStatus: 'cancelled', style: 'danger' }],
        notifyPatient: { title: 'Session Booked', message: 'Your next care session is confirmed for {{scheduledAt}}.' },
      },
      {
        order: 8, statusCode: 'session_in_progress', label: 'Session in Progress',
        actionsForProvider: [{ action: 'complete_session', label: 'Complete session', targetStatus: 'session_complete', style: 'primary' }],
        actionsForPatient: [],
      },
      {
        order: 9, statusCode: 'session_complete', label: 'Session Complete',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [
          { action: 'next_session', label: 'Schedule next session', targetStatus: 'session_scheduled', style: 'primary' },
          { action: 'discharge', label: 'End program', targetStatus: 'discharged', style: 'secondary' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Session Done', message: 'Care session {{sessionNumber}} complete. Next session will be booked.' },
      },
      {
        order: 10, statusCode: 'discharged', label: 'Program Complete',
        flags: { triggers_review_request: true },
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Program Complete', message: 'Your care program is complete. Great progress!' },
      },
      {
        order: 11, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 14. Insurance Pre-Authorization
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'insurance-pre-authorization',
    name: 'Insurance Pre-Authorization',
    description: 'Pre-authorization flow: submit → review → approve / deny → proceed with service.',
    providerType: 'INSURANCE_REP',
    serviceMode: 'office',
    paymentTiming: 'PAY_LATER',
    steps: [
      {
        order: 1, statusCode: 'pre_auth_submitted', label: 'Pre-Authorization Submitted',
        actionsForProvider: [{ action: 'review', label: 'Begin review', targetStatus: 'pre_auth_under_review', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Pre-Auth Submitted', message: 'Your pre-authorization request has been received and is under review.' },
      },
      {
        order: 2, statusCode: 'pre_auth_under_review', label: 'Under Review',
        actionsForProvider: [
          { action: 'approve', label: 'Approve', targetStatus: 'pre_auth_approved', style: 'primary' },
          { action: 'deny', label: 'Deny', targetStatus: 'pre_auth_denied', style: 'danger' },
        ],
        actionsForPatient: [],
        notifyPatient: { title: 'Under Review', message: 'Your pre-authorization is being reviewed.' },
      },
      {
        order: 3, statusCode: 'pre_auth_approved', label: 'Approved',
        actionsForProvider: [{ action: 'proceed', label: 'Proceed with service', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Pre-Auth Approved!', message: 'Your pre-authorization has been approved. Proceed with scheduling your service.' },
      },
      {
        order: 4, statusCode: 'pre_auth_denied', label: 'Denied',
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Pre-Auth Denied', message: 'Your pre-authorization was not approved. Please contact your insurer for details.' },
      },
      {
        order: 5, statusCode: 'completed', label: 'Service Complete',
        flags: { triggers_review_request: true },
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Complete', message: 'Your pre-authorized service is complete.' },
      },
      {
        order: 6, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 15. Telemedicine + Prescription Issue
  // ═══════════════════════════════════════════════════════════════════
  {
    slug: 'telemedicine-with-prescription',
    name: 'Telemedicine + Prescription Issue',
    description: 'Full telemedicine workflow: video consultation → clinical notes → optional prescription.',
    providerType: 'DOCTOR',
    serviceMode: 'video',
    paymentTiming: 'ON_ACCEPTANCE',
    steps: [
      {
        order: 1, statusCode: 'pending', label: 'Pending',
        actionsForProvider: [
          { action: 'accept', label: 'Accept', targetStatus: 'confirmed', style: 'primary' },
          { action: 'deny', label: 'Decline', targetStatus: 'cancelled', style: 'danger' },
        ],
        actionsForPatient: [{ action: 'cancel', label: 'Cancel', targetStatus: 'cancelled', style: 'danger' }],
        notifyProvider: { title: 'New Request', message: 'New telemedicine consultation request.' },
      },
      {
        order: 2, statusCode: 'confirmed', label: 'Confirmed',
        actionsForProvider: [{ action: 'open_room', label: 'Open video room', targetStatus: 'video_call_ready', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Confirmed', message: 'Your consultation is confirmed for {{scheduledAt}}.' },
      },
      {
        order: 3, statusCode: 'video_call_ready', label: 'Video Call Ready',
        flags: { triggers_video_call: true },
        actionsForProvider: [{ action: 'join', label: 'Join call', targetStatus: 'video_call_active', style: 'primary' }],
        actionsForPatient: [{ action: 'join', label: 'Join call', targetStatus: 'video_call_active', style: 'primary' }],
        notifyPatient: { title: 'Call Ready', message: 'Your video call is ready. Click to join.' },
      },
      {
        order: 4, statusCode: 'video_call_active', label: 'Consultation Active',
        flags: { triggers_video_call: true },
        actionsForProvider: [{ action: 'end_call', label: 'End consultation', targetStatus: 'writing_notes', style: 'primary' }],
        actionsForPatient: [],
      },
      {
        order: 5, statusCode: 'writing_notes', label: 'Writing Clinical Notes',
        flags: { requires_content: 'care_notes' },
        actionsForProvider: [
          { action: 'issue_prescription', label: 'Issue prescription', targetStatus: 'prescription_issued', style: 'primary' },
          { action: 'close_no_rx', label: 'Close (no prescription)', targetStatus: 'completed', style: 'secondary' },
        ],
        actionsForPatient: [],
      },
      {
        order: 6, statusCode: 'prescription_issued', label: 'Prescription Issued',
        flags: { requires_content: 'prescription' },
        actionsForProvider: [{ action: 'complete', label: 'Close booking', targetStatus: 'completed', style: 'primary' }],
        actionsForPatient: [],
        notifyPatient: { title: 'Prescription Ready', message: 'Your prescription is ready. View it in the app.' },
      },
      {
        order: 7, statusCode: 'completed', label: 'Consultation Complete',
        flags: { triggers_review_request: true },
        actionsForProvider: [], actionsForPatient: [],
        notifyPatient: { title: 'Complete', message: 'Your consultation is complete. Follow up if needed.' },
      },
      {
        order: 8, statusCode: 'cancelled', label: 'Cancelled',
        actionsForProvider: [], actionsForPatient: [],
      },
    ],
  },
]

export async function seedWorkflowDomainTemplates(prisma: PrismaClient) {
  console.log('  Seeding domain workflow templates (seed 50)...')
  let created = 0

  for (const tpl of templates) {
    const data = {
      name: tpl.name,
      description: tpl.description,
      providerType: tpl.providerType,
      serviceMode: tpl.serviceMode,
      paymentTiming: tpl.paymentTiming as any,
      isDefault: true,
      isActive: true,
      steps: tpl.steps as any,
      transitions: buildTransitions(tpl.steps),
      ...(tpl.serviceConfig !== undefined && { serviceConfig: tpl.serviceConfig as Prisma.InputJsonValue }),
    }

    await prisma.workflowTemplate.upsert({
      where: { slug: tpl.slug },
      update: data,
      create: { slug: tpl.slug, ...data },
    })
    created++
  }

  console.log(`✅ Seeded ${created} domain workflow templates`)
}

function buildTransitions(steps: Step[]) {
  const transitions: Array<{ from: string; to: string; action: string }> = []
  for (const step of steps) {
    const actions = [...(step.actionsForProvider ?? []), ...(step.actionsForPatient ?? [])]
    for (const a of actions) {
      if (!transitions.find(t => t.from === step.statusCode && t.to === a.targetStatus && t.action === a.action)) {
        transitions.push({ from: step.statusCode, to: a.targetStatus, action: a.action })
      }
    }
  }
  return transitions
}
