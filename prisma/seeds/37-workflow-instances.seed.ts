/**
 * Seed 37 - Workflow Instances
 *
 * 1. Attaches WorkflowInstance to every existing booking that does not have one yet
 * 2. Creates 5 new cross-provider ServiceBookings with workflow instances at various statuses
 */
import { PrismaClient } from '@prisma/client'

export async function seedWorkflowInstances(prisma: PrismaClient) {
  console.log('  Seeding workflow instances...')

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  let migratedCount = 0
  let newBookingCount = 0

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Attach workflow instances to ALL existing bookings without one
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper: find default template for a provider type + service mode
  async function findTemplate(providerType: string, serviceMode: string) {
    return prisma.workflowTemplate.findFirst({
      where: { providerType, serviceMode, isDefault: true, isActive: true },
      select: { id: true, steps: true },
    })
  }

  // Helper: map booking type field to workflow service mode
  function toServiceMode(bookingType: string): string {
    const map: Record<string, string> = {
      'video': 'video',
      'in-person': 'office',
      'in_person': 'office',
      'home_visit': 'home',
      'clinic_visit': 'office',
      'regular': 'home',
      'emergency': 'home',
    }
    return map[bookingType] || 'office'
  }

  // Helper: extract label from template steps JSON for a given status
  function getLabelForStatus(steps: unknown, status: string): string {
    if (Array.isArray(steps)) {
      const step = steps.find((s: { statusCode?: string }) => s.statusCode === status)
      if (step && typeof step.label === 'string') return step.label
    }
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  }

  // Helper: create workflow instance + initial step log for an existing booking
  async function migrateBooking(opts: {
    bookingId: string
    bookingType: string
    currentStatus: string
    patientUserId: string
    providerUserId: string
    serviceMode: string
    providerType: string
    startedAt?: Date
  }) {
    const template = await findTemplate(opts.providerType, opts.serviceMode)
    if (!template) {
      console.log(`    ⚠ No template for ${opts.providerType}/${opts.serviceMode} - skipping ${opts.bookingId}`)
      return
    }

    // Check if instance already exists
    const existing = await prisma.workflowInstance.findFirst({
      where: { bookingId: opts.bookingId, bookingType: opts.bookingType },
    })
    if (existing) return

    const label = getLabelForStatus(template.steps, opts.currentStatus)
    const isCompleted = ['completed', 'resolved'].includes(opts.currentStatus)
    const isCancelled = opts.currentStatus === 'cancelled'

    const instance = await prisma.workflowInstance.create({
      data: {
        templateId: template.id,
        bookingId: opts.bookingId,
        bookingType: opts.bookingType,
        currentStatus: opts.currentStatus,
        patientUserId: opts.patientUserId,
        providerUserId: opts.providerUserId,
        serviceMode: opts.serviceMode,
        startedAt: opts.startedAt || now,
        completedAt: isCompleted ? now : null,
        cancelledAt: isCancelled ? now : null,
        steps: {
          create: {
            fromStatus: null,
            toStatus: opts.currentStatus,
            action: 'migration',
            actionByUserId: opts.patientUserId,
            actionByRole: 'system',
            label,
            message: `Migrated from existing booking (status: ${opts.currentStatus})`,
          },
        },
      },
    })

    migratedCount++
    return instance
  }

  // ── Appointments ─────────────────────────────────────────────────────────
  try {
    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        patientId: true,
        doctorId: true,
        patient: { select: { userId: true } },
        doctor: { select: { userId: true } },
      },
    })

    for (const apt of appointments) {
      await migrateBooking({
        bookingId: apt.id,
        bookingType: 'appointment',
        currentStatus: apt.status,
        patientUserId: apt.patient.userId,
        providerUserId: apt.doctor.userId,
        serviceMode: toServiceMode(apt.type),
        providerType: 'DOCTOR',
        startedAt: apt.scheduledAt,
      })
    }
    console.log(`    Appointments: ${appointments.length} processed`)
  } catch (error) {
    console.error('    Error migrating appointments:', error)
  }

  // ── Nurse Bookings ───────────────────────────────────────────────────────
  try {
    const nurseBookings = await prisma.nurseBooking.findMany({
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        patientId: true,
        nurseId: true,
        patient: { select: { userId: true } },
        nurse: { select: { userId: true } },
      },
    })

    for (const nb of nurseBookings) {
      await migrateBooking({
        bookingId: nb.id,
        bookingType: 'nurse_booking',
        currentStatus: nb.status,
        patientUserId: nb.patient.userId,
        providerUserId: nb.nurse.userId,
        serviceMode: toServiceMode(nb.type),
        providerType: 'NURSE',
        startedAt: nb.scheduledAt,
      })
    }
    console.log(`    Nurse bookings: ${nurseBookings.length} processed`)
  } catch (error) {
    console.error('    Error migrating nurse bookings:', error)
  }

  // ── Childcare Bookings ───────────────────────────────────────────────────
  try {
    const childcareBookings = await prisma.childcareBooking.findMany({
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        patientId: true,
        nannyId: true,
        patient: { select: { userId: true } },
        nanny: { select: { userId: true } },
      },
    })

    for (const cb of childcareBookings) {
      await migrateBooking({
        bookingId: cb.id,
        bookingType: 'childcare_booking',
        currentStatus: cb.status,
        patientUserId: cb.patient.userId,
        providerUserId: cb.nanny.userId,
        serviceMode: toServiceMode(cb.type),
        providerType: 'NANNY',
        startedAt: cb.scheduledAt,
      })
    }
    console.log(`    Childcare bookings: ${childcareBookings.length} processed`)
  } catch (error) {
    console.error('    Error migrating childcare bookings:', error)
  }

  // ── Lab Test Bookings ────────────────────────────────────────────────────
  try {
    const labBookings = await prisma.labTestBooking.findMany({
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        patientId: true,
        labTechId: true,
        patient: { select: { userId: true } },
        labTech: { select: { userId: true } },
      },
    })

    for (const lb of labBookings) {
      if (!lb.labTechId || !lb.labTech) {
        console.log(`    ⚠ Lab booking ${lb.id} has no lab tech - skipping`)
        continue
      }
      await migrateBooking({
        bookingId: lb.id,
        bookingType: 'lab_test_booking',
        currentStatus: lb.status,
        patientUserId: lb.patient.userId,
        providerUserId: lb.labTech.userId,
        serviceMode: 'office',
        providerType: 'LAB_TECHNICIAN',
        startedAt: lb.scheduledAt,
      })
    }
    console.log(`    Lab test bookings: ${labBookings.length} processed`)
  } catch (error) {
    console.error('    Error migrating lab test bookings:', error)
  }

  // ── Emergency Bookings ───────────────────────────────────────────────────
  try {
    const emergencyBookings = await prisma.emergencyBooking.findMany({
      select: {
        id: true,
        status: true,
        patientId: true,
        responderId: true,
        patient: { select: { userId: true } },
        responder: { select: { userId: true } },
        createdAt: true,
      },
    })

    for (const eb of emergencyBookings) {
      if (!eb.responderId || !eb.responder) {
        console.log(`    ⚠ Emergency booking ${eb.id} has no responder - skipping`)
        continue
      }
      await migrateBooking({
        bookingId: eb.id,
        bookingType: 'emergency_booking',
        currentStatus: eb.status,
        patientUserId: eb.patient.userId,
        providerUserId: eb.responder.userId,
        serviceMode: 'home',
        providerType: 'EMERGENCY_WORKER',
        startedAt: eb.createdAt,
      })
    }
    console.log(`    Emergency bookings: ${emergencyBookings.length} processed`)
  } catch (error) {
    console.error('    Error migrating emergency bookings:', error)
  }

  // ── Service Bookings ─────────────────────────────────────────────────────
  try {
    const serviceBookings = await prisma.serviceBooking.findMany({
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        patientId: true,
        providerUserId: true,
        providerType: true,
      },
    })

    // Need patient userIds - ServiceBooking.patientId references User.id directly
    // Actually patientId on ServiceBooking is a user ID (not profile ID)
    // Let's verify by checking the schema - it's just a string, no relation
    for (const sb of serviceBookings) {
      await migrateBooking({
        bookingId: sb.id,
        bookingType: 'service_booking',
        currentStatus: sb.status,
        patientUserId: sb.patientId,
        providerUserId: sb.providerUserId,
        serviceMode: toServiceMode(sb.type),
        providerType: sb.providerType,
        startedAt: sb.scheduledAt,
      })
    }
    console.log(`    Service bookings: ${serviceBookings.length} processed`)
  } catch (error) {
    console.error('    Error migrating service bookings:', error)
  }

  console.log(`  ✓ ${migratedCount} workflow instances created for existing bookings`)

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Create 5 new cross-provider ServiceBookings with workflow instances
  // ═══════════════════════════════════════════════════════════════════════════

  const patient = await prisma.user.findFirst({
    where: { id: 'PAT001' },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) {
    console.log('  ⚠ PAT001 not found - skipping new cross-provider bookings')
    return
  }

  const newBookings: {
    providerId: string
    providerType: string
    serviceMode: string
    bookingStatus: string
    workflowStatus: string
    serviceName: string
    servicePrice: number
    scheduledAt: Date
    type: string
    reason: string
  }[] = [
    {
      providerId: 'CARE001',
      providerType: 'CAREGIVER',
      serviceMode: 'office',
      bookingStatus: 'confirmed',
      workflowStatus: 'confirmed',
      serviceName: 'Daily Companion Care',
      servicePrice: 800,
      scheduledAt: new Date(now.getTime() + 2 * DAY),
      type: 'in_person',
      reason: 'Elder companion care - morning routine assistance',
    },
    {
      providerId: 'PHYSIO001',
      providerType: 'PHYSIOTHERAPIST',
      serviceMode: 'home',
      bookingStatus: 'pending',
      workflowStatus: 'pending',
      serviceName: 'Home Rehabilitation Session',
      servicePrice: 1200,
      scheduledAt: new Date(now.getTime() + 5 * DAY),
      type: 'home_visit',
      reason: 'Post-knee-surgery rehab - home visit',
    },
    {
      providerId: 'DENT001',
      providerType: 'DENTIST',
      serviceMode: 'video',
      bookingStatus: 'pending',
      workflowStatus: 'pending',
      serviceName: 'Dental Teleconsultation',
      servicePrice: 600,
      scheduledAt: new Date(now.getTime() + 7 * DAY),
      type: 'video',
      reason: 'Persistent toothache - initial video assessment',
    },
    {
      providerId: 'OPT001',
      providerType: 'OPTOMETRIST',
      serviceMode: 'office',
      bookingStatus: 'accepted',
      workflowStatus: 'confirmed',
      serviceName: 'Comprehensive Eye Exam',
      servicePrice: 1500,
      scheduledAt: new Date(now.getTime() + 10 * DAY),
      type: 'in_person',
      reason: 'Annual eye exam + glaucoma screening',
    },
    {
      providerId: 'NUTR001',
      providerType: 'NUTRITIONIST',
      serviceMode: 'video',
      bookingStatus: 'pending',
      workflowStatus: 'pending',
      serviceName: 'Nutrition Video Consultation',
      servicePrice: 900,
      scheduledAt: new Date(now.getTime() + 13 * DAY),
      type: 'video',
      reason: 'Diabetes diet plan - initial assessment',
    },
  ]

  for (const nb of newBookings) {
    try {
      // Find the provider user
      const provider = await prisma.user.findFirst({
        where: { id: nb.providerId },
        select: { id: true, firstName: true, lastName: true },
      })
      if (!provider) {
        console.log(`    ⚠ Provider ${nb.providerId} not found - skipping`)
        continue
      }

      // Find the workflow template
      const template = await findTemplate(nb.providerType, nb.serviceMode)
      if (!template) {
        console.log(`    ⚠ No template for ${nb.providerType}/${nb.serviceMode} - skipping`)
        continue
      }

      // Create the ServiceBooking
      const booking = await prisma.serviceBooking.create({
        data: {
          patientId: patient.id,
          providerUserId: provider.id,
          providerType: nb.providerType as never,
          providerName: `${provider.firstName} ${provider.lastName}`,
          scheduledAt: nb.scheduledAt,
          duration: 30,
          type: nb.type,
          status: nb.bookingStatus,
          reason: nb.reason,
          serviceName: nb.serviceName,
          servicePrice: nb.servicePrice,
        },
      })

      // Create the WorkflowInstance with initial step log
      const label = getLabelForStatus(template.steps, nb.workflowStatus)
      const isCompleted = nb.workflowStatus === 'completed'
      const isCancelled = nb.workflowStatus === 'cancelled'

      await prisma.workflowInstance.create({
        data: {
          templateId: template.id,
          bookingId: booking.id,
          bookingType: 'service_booking',
          currentStatus: nb.workflowStatus,
          patientUserId: patient.id,
          providerUserId: provider.id,
          serviceMode: nb.serviceMode,
          startedAt: now,
          completedAt: isCompleted ? now : null,
          cancelledAt: isCancelled ? now : null,
          steps: {
            create: {
              fromStatus: null,
              toStatus: nb.workflowStatus,
              action: nb.workflowStatus === 'pending' ? 'create' : 'accept',
              actionByUserId: nb.workflowStatus === 'pending' ? patient.id : provider.id,
              actionByRole: nb.workflowStatus === 'pending' ? 'patient' : 'provider',
              label,
              message: `Booking created - ${nb.serviceName}`,
            },
          },
        },
      })

      newBookingCount++
      console.log(`    ✓ ${nb.providerType} booking → ${nb.workflowStatus}`)
    } catch (error) {
      console.error(`    Error creating ${nb.providerType} booking:`, error)
    }
  }

  console.log(`  ✓ ${newBookingCount} new cross-provider bookings with workflow instances`)
}
