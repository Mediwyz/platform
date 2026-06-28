import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'

/**
 * Seed #44 - Expanded Workflows, Services, Statuses & Triggerable Methods
 *
 * Creates comprehensive test data to verify:
 * 1. Dynamic role management (regional admin CRUD)
 * 2. Services linked to multiple workflows
 * 3. Workflows with multiple statuses + triggerable methods per status
 * 4. Booking flow through full workflow lifecycle
 * 5. Calendar availability slot checking
 * 6. Notifications, payment checks, video call triggers
 */
export async function seedExpandedWorkflowsServices(prisma: PrismaClient) {
  console.log('  44. Seeding expanded workflows, services & statuses...')

  const hash = await bcrypt.hash('Provider123!', 10)
  const regionMU = await prisma.region.findFirst({ where: { countryCode: 'MU' } })
  const regionKE = await prisma.region.findFirst({ where: { countryCode: 'KE' } })
  const adminMU = await prisma.user.findFirst({ where: { userType: 'REGIONAL_ADMIN', regionalAdminProfile: { country: 'Mauritius' } }, select: { id: true } })
  const adminKE = await prisma.user.findFirst({ where: { userType: 'REGIONAL_ADMIN', regionalAdminProfile: { country: 'Kenya' } }, select: { id: true } })

  // ─── 1. Extra patients for booking diversity ─────────────────────────────

  const extraPatients = [
    { id: 'PAT-EXP-001', firstName: 'Rani', lastName: 'Doorgakant', email: 'rani.doorgakant@mediwyz.com' },
    { id: 'PAT-EXP-002', firstName: 'Youssef', lastName: 'Atchade', email: 'youssef.atchade@mediwyz.com' },
    { id: 'PAT-EXP-003', firstName: 'Aisha', lastName: 'Mwangi', email: 'aisha.mwangi@mediwyz.com' },
    { id: 'PAT-EXP-004', firstName: 'Jean-Pierre', lastName: 'Ramgoolam', email: 'jp.ramgoolam@mediwyz.com' },
    { id: 'PAT-EXP-005', firstName: 'Fatima', lastName: 'Otieno', email: 'fatima.otieno@mediwyz.com' },
  ]

  for (const p of extraPatients) {
    const exists = await prisma.user.findUnique({ where: { id: p.id } })
    if (!exists) {
      await prisma.user.create({
        data: {
          id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email,
          password: await bcrypt.hash('Patient123!', 10), phone: '+230-5' + String(Math.floor(Math.random() * 10000000)),
          userType: 'MEMBER', accountStatus: 'active', verified: true, regionId: regionMU?.id,
          patientProfile: {
            create: { nationalId: `NID-${p.id}`, bloodType: 'O+', allergies: [], chronicConditions: [], healthScore: 75 },
          },
          wallet: { create: { balance: 15000, currency: 'MUR' } },
        },
      })
    }
  }

  // ─── 2. Extra providers - skipped (use existing seeded providers) ──────

  // ─── 3. Provider availability for slot checking ──────────────────────────

  // Cover EVERY provider type and don't filter by accountStatus — some seeded
  // providers (e.g. doctors) have a null accountStatus, which previously left
  // them with no availability and made the in-chat booking dead-end. The
  // `existing > 0` guard below keeps this idempotent and respects custom hours.
  const allProviders = await prisma.user.findMany({
    where: { userType: { in: ['DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST'] } },
    select: { id: true },
    take: 1000,
  })

  for (const provider of allProviders) {
    const existing = await prisma.providerAvailability.count({ where: { userId: provider.id } })
    if (existing > 0) continue

    // Monday to Friday, 9am-5pm with 1-hour slots
    for (let day = 1; day <= 5; day++) {
      await prisma.providerAvailability.create({
        data: { userId: provider.id, dayOfWeek: day, startTime: '09:00', endTime: '12:00', slotDuration: 30, isActive: true },
      }).catch(() => {})
      await prisma.providerAvailability.create({
        data: { userId: provider.id, dayOfWeek: day, startTime: '14:00', endTime: '17:00', slotDuration: 30, isActive: true },
      }).catch(() => {})
    }
  }

  // ─── 4. Platform Services for all provider types ─────────────────────────

  const serviceDefinitions: Array<{ providerType: UserType; serviceName: string; category: string; description: string; defaultPrice: number; duration: number }> = [
    { providerType: 'DOCTOR', serviceName: 'Video Consultation', category: 'Consultation', description: 'Remote video consultation with a doctor', defaultPrice: 1500, duration: 30 },
    { providerType: 'DOCTOR', serviceName: 'Home Visit', category: 'Consultation', description: 'Doctor visits patient at home', defaultPrice: 2500, duration: 60 },
    { providerType: 'DOCTOR', serviceName: 'Follow-up Consultation', category: 'Consultation', description: 'Follow-up after initial visit', defaultPrice: 800, duration: 15 },
    { providerType: 'NURSE', serviceName: 'Wound Dressing', category: 'Nursing Care', description: 'Professional wound care and dressing', defaultPrice: 500, duration: 30 },
    { providerType: 'NURSE', serviceName: 'Injection Administration', category: 'Nursing Care', description: 'IM/IV injection by certified nurse', defaultPrice: 300, duration: 15 },
    { providerType: 'NURSE', serviceName: 'Home Nursing Visit', category: 'Home Care', description: 'Full nursing care at home', defaultPrice: 1200, duration: 120 },
    { providerType: 'DENTIST', serviceName: 'Dental Checkup', category: 'Preventive', description: 'Routine dental examination', defaultPrice: 1000, duration: 30 },
    { providerType: 'DENTIST', serviceName: 'Teeth Cleaning', category: 'Preventive', description: 'Professional teeth cleaning', defaultPrice: 1500, duration: 45 },
    { providerType: 'DENTIST', serviceName: 'Root Canal', category: 'Restorative', description: 'Root canal treatment', defaultPrice: 5000, duration: 90 },
    { providerType: 'OPTOMETRIST', serviceName: 'Eye Exam', category: 'Diagnostic', description: 'Comprehensive eye examination', defaultPrice: 800, duration: 30 },
    { providerType: 'OPTOMETRIST', serviceName: 'Contact Lens Fitting', category: 'Fitting', description: 'Contact lens fitting and trial', defaultPrice: 1200, duration: 45 },
    { providerType: 'NUTRITIONIST', serviceName: 'Diet Consultation', category: 'Consultation', description: 'Personalized diet consultation', defaultPrice: 1000, duration: 45 },
    { providerType: 'NUTRITIONIST', serviceName: 'Meal Plan Creation', category: 'Planning', description: 'Custom weekly meal plan', defaultPrice: 2000, duration: 60 },
    { providerType: 'PHYSIOTHERAPIST', serviceName: 'Physio Assessment', category: 'Assessment', description: 'Initial physiotherapy assessment', defaultPrice: 1200, duration: 45 },
    { providerType: 'PHYSIOTHERAPIST', serviceName: 'Sports Rehab Session', category: 'Rehabilitation', description: 'Sports injury rehabilitation', defaultPrice: 1500, duration: 60 },
    { providerType: 'CAREGIVER', serviceName: 'Elderly Home Care', category: 'Home Care', description: 'Elderly care at home', defaultPrice: 800, duration: 240 },
    { providerType: 'CAREGIVER', serviceName: 'Post-Surgery Care', category: 'Recovery', description: 'Post-operative recovery care', defaultPrice: 1200, duration: 480 },
    { providerType: 'LAB_TECHNICIAN', serviceName: 'Complete Blood Count', category: 'Blood Test', description: 'Full CBC panel', defaultPrice: 500, duration: 15 },
    { providerType: 'LAB_TECHNICIAN', serviceName: 'Lipid Profile', category: 'Blood Test', description: 'Cholesterol and lipid panel', defaultPrice: 650, duration: 15 },
    { providerType: 'EMERGENCY_WORKER', serviceName: 'Emergency Dispatch', category: 'Emergency', description: 'Emergency ambulance dispatch', defaultPrice: 0, duration: 0 },
  ]

  for (const svc of serviceDefinitions) {
    const existing = await prisma.platformService.findFirst({
      where: { providerType: svc.providerType, serviceName: svc.serviceName },
    })
    if (!existing) {
      await prisma.platformService.create({
        data: { ...svc, isDefault: true, countryCode: null },
      })
    }
  }

  // ─── 5. Workflow Templates with rich statuses & triggerable methods ──────

  const workflowTemplates = [
    {
      name: 'Doctor Video Consultation Workflow',
      providerType: 'DOCTOR',
      serviceMode: 'video',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Pending', order: 1, flags: {} },
        { status: 'accepted', label: 'Accepted', order: 2, flags: { triggers_payment: true } },
        { status: 'payment_confirmed', label: 'Payment Confirmed', order: 3, flags: { triggers_notification: true } },
        { status: 'in_progress', label: 'In Consultation', order: 4, flags: { triggers_video_call: true } },
        { status: 'prescription_issued', label: 'Prescription Issued', order: 5, flags: { requires_prescription: true, triggers_notification: true } },
        { status: 'completed', label: 'Completed', order: 6, flags: { triggers_review_request: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'pending', to: 'cancelled', action: 'cancel', allowedRoles: ['patient', 'provider'] },
        { from: 'accepted', to: 'payment_confirmed', action: 'confirm_payment', allowedRoles: ['system'] },
        { from: 'payment_confirmed', to: 'in_progress', action: 'start_consultation', allowedRoles: ['provider'] },
        { from: 'in_progress', to: 'prescription_issued', action: 'issue_prescription', allowedRoles: ['provider'] },
        { from: 'in_progress', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
        { from: 'prescription_issued', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Doctor In-Person Consultation Workflow',
      providerType: 'DOCTOR',
      serviceMode: 'office',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Pending', order: 1, flags: {} },
        { status: 'accepted', label: 'Accepted', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'checked_in', label: 'Patient Checked In', order: 3, flags: { triggers_notification: true } },
        { status: 'in_progress', label: 'In Consultation', order: 4, flags: {} },
        { status: 'completed', label: 'Completed', order: 5, flags: { triggers_review_request: true, triggers_notification: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'pending', to: 'denied', action: 'deny', allowedRoles: ['provider'] },
        { from: 'accepted', to: 'checked_in', action: 'check_in', allowedRoles: ['provider'] },
        { from: 'checked_in', to: 'in_progress', action: 'start', allowedRoles: ['provider'] },
        { from: 'in_progress', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Dentist Treatment Workflow',
      providerType: 'DENTIST',
      serviceMode: 'office',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Booking Requested', order: 1, flags: {} },
        { status: 'accepted', label: 'Appointment Confirmed', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'arrived', label: 'Patient Arrived', order: 3, flags: {} },
        { status: 'examination', label: 'Examination', order: 4, flags: {} },
        { status: 'treatment', label: 'Treatment In Progress', order: 5, flags: { requires_content: true } },
        { status: 'completed', label: 'Treatment Complete', order: 6, flags: { triggers_review_request: true, triggers_notification: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'pending', to: 'cancelled', action: 'cancel', allowedRoles: ['patient', 'provider'] },
        { from: 'accepted', to: 'arrived', action: 'check_in', allowedRoles: ['provider'] },
        { from: 'arrived', to: 'examination', action: 'start_exam', allowedRoles: ['provider'] },
        { from: 'examination', to: 'treatment', action: 'start_treatment', allowedRoles: ['provider'] },
        { from: 'treatment', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Lab Test Workflow',
      providerType: 'LAB_TECHNICIAN',
      serviceMode: 'office',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Test Requested', order: 1, flags: {} },
        { status: 'accepted', label: 'Scheduled', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'sample_collected', label: 'Sample Collected', order: 3, flags: { triggers_stock_check: true } },
        { status: 'processing', label: 'Processing', order: 4, flags: {} },
        { status: 'results_ready', label: 'Results Ready', order: 5, flags: { requires_content: true, triggers_notification: true } },
        { status: 'completed', label: 'Results Delivered', order: 6, flags: { triggers_notification: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'pending', to: 'cancelled', action: 'cancel', allowedRoles: ['patient'] },
        { from: 'accepted', to: 'sample_collected', action: 'collect_sample', allowedRoles: ['provider'] },
        { from: 'sample_collected', to: 'processing', action: 'start_processing', allowedRoles: ['provider'] },
        { from: 'processing', to: 'results_ready', action: 'upload_results', allowedRoles: ['provider'] },
        { from: 'results_ready', to: 'completed', action: 'deliver', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Nutritionist Consultation Workflow',
      providerType: 'NUTRITIONIST',
      serviceMode: 'video',
      isDefault: true,
      createdByAdminId: adminKE?.id,
      regionCode: 'KE',
      steps: JSON.stringify([
        { status: 'pending', label: 'Requested', order: 1, flags: {} },
        { status: 'accepted', label: 'Confirmed', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'in_session', label: 'In Session', order: 3, flags: { triggers_video_call: true } },
        { status: 'plan_created', label: 'Meal Plan Created', order: 4, flags: { requires_content: true, triggers_notification: true } },
        { status: 'completed', label: 'Completed', order: 5, flags: { triggers_review_request: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'accepted', to: 'in_session', action: 'start', allowedRoles: ['provider'] },
        { from: 'in_session', to: 'plan_created', action: 'create_plan', allowedRoles: ['provider'] },
        { from: 'plan_created', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Physiotherapy Rehab Workflow',
      providerType: 'PHYSIOTHERAPIST',
      serviceMode: 'office',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Requested', order: 1, flags: {} },
        { status: 'accepted', label: 'Scheduled', order: 2, flags: { triggers_payment: true } },
        { status: 'assessment', label: 'Initial Assessment', order: 3, flags: { requires_content: true } },
        { status: 'treatment', label: 'Treatment Session', order: 4, flags: {} },
        { status: 'exercises_assigned', label: 'Home Exercises Assigned', order: 5, flags: { requires_content: true, triggers_notification: true } },
        { status: 'completed', label: 'Session Complete', order: 6, flags: { triggers_review_request: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'accepted', to: 'assessment', action: 'start_assessment', allowedRoles: ['provider'] },
        { from: 'assessment', to: 'treatment', action: 'start_treatment', allowedRoles: ['provider'] },
        { from: 'treatment', to: 'exercises_assigned', action: 'assign_exercises', allowedRoles: ['provider'] },
        { from: 'exercises_assigned', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
    {
      name: 'Optometrist Eye Exam Workflow',
      providerType: 'OPTOMETRIST',
      serviceMode: 'office',
      isDefault: true,
      createdByAdminId: adminMU?.id,
      regionCode: 'MU',
      steps: JSON.stringify([
        { status: 'pending', label: 'Requested', order: 1, flags: {} },
        { status: 'accepted', label: 'Confirmed', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'in_exam', label: 'Eye Examination', order: 3, flags: {} },
        { status: 'prescription_ready', label: 'Prescription Ready', order: 4, flags: { requires_prescription: true, triggers_stock_check: true } },
        { status: 'glasses_ordered', label: 'Glasses/Lenses Ordered', order: 5, flags: { triggers_stock_subtract: true, triggers_notification: true } },
        { status: 'completed', label: 'Completed', order: 6, flags: { triggers_review_request: true } },
      ]),
      transitions: JSON.stringify([
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'accepted', to: 'in_exam', action: 'start_exam', allowedRoles: ['provider'] },
        { from: 'in_exam', to: 'prescription_ready', action: 'write_prescription', allowedRoles: ['provider'] },
        { from: 'prescription_ready', to: 'glasses_ordered', action: 'order_glasses', allowedRoles: ['provider'] },
        { from: 'prescription_ready', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
        { from: 'glasses_ordered', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ]),
    },
  ]

  for (const tmpl of workflowTemplates) {
    const existing = await prisma.workflowTemplate.findFirst({
      where: { name: tmpl.name, providerType: tmpl.providerType },
    })
    if (!existing) {
      const svc = await prisma.platformService.findFirst({
        where: { providerType: tmpl.providerType as any },
      })
      const slug = tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      await prisma.workflowTemplate.create({
        data: {
          name: tmpl.name,
          slug,
          providerType: tmpl.providerType,
          serviceMode: tmpl.serviceMode,
          isDefault: tmpl.isDefault,
          createdByAdminId: tmpl.createdByAdminId || null,
          regionCode: tmpl.regionCode || null,
          steps: JSON.parse(tmpl.steps),
          transitions: JSON.parse(tmpl.transitions),
          platformServiceId: svc?.id || null,
          isActive: true,
        },
      })
    }
  }

  // ─── 6. Create ServiceBookings through all provider types ────────────────

  const patients = await prisma.patientProfile.findMany({ select: { id: true, userId: true }, take: 8 })
  const providers = await prisma.user.findMany({
    where: { userType: { in: ['DOCTOR', 'NURSE', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST', 'PHYSIOTHERAPIST', 'CAREGIVER'] }, accountStatus: 'active' },
    select: { id: true, firstName: true, lastName: true, userType: true },
    take: 15,
  })

  const now = new Date()
  let bookingCount = 0

  for (let i = 0; i < Math.min(patients.length, 5); i++) {
    for (let j = 0; j < Math.min(providers.length, 7); j++) {
      const pat = patients[i]
      const prov = providers[(i + j) % providers.length]
      const daysOffset = (i * 3) + j + 1
      const scheduledAt = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)

      try {
        await prisma.serviceBooking.create({
          data: {
            patientId: pat.id,
            providerUserId: prov.id,
            providerType: prov.userType as any,
            providerName: `${prov.firstName} ${prov.lastName}`,
            scheduledAt,
            duration: 30,
            type: j % 3 === 0 ? 'video' : j % 3 === 1 ? 'in_person' : 'home_visit',
            status: ['pending', 'accepted', 'in_progress', 'completed'][j % 4],
            reason: `Test booking ${i}-${j}`,
            serviceName: `Service for ${prov.userType.toLowerCase()}`,
            servicePrice: 500 + (j * 200),
            priority: j === 0 ? 'high' : 'normal',
          },
        })
        bookingCount++
      } catch { /* skip duplicates */ }
    }
  }

  console.log(`    Created ${bookingCount} service bookings`)
  console.log(`    Created ${workflowTemplates.length} workflow templates`)
  console.log(`    Created ${serviceDefinitions.length} platform services`)
  console.log(`    Created availability for ${allProviders.length} providers`)
}
