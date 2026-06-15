/**
 * Seed 39 - Rich Bookings & Workflows
 *
 * Creates ServiceBookings with attached WorkflowInstances at various statuses
 * for every provider type, plus VideoRoom records for video bookings.
 */
import { PrismaClient, UserType } from '@prisma/client'

// ── Status progression paths per provider type ──────────────────────────────
// Each array defines the order statuses are traversed (for step log generation)
const STATUS_PATHS: Record<string, string[]> = {
  DOCTOR: ['pending', 'confirmed', 'in_progress', 'completed'],
  NURSE: ['pending', 'confirmed', 'in_progress', 'completed'],
  NANNY: ['pending', 'confirmed', 'in_progress', 'completed'],
  PHARMACIST: ['pending', 'order_confirmed', 'preparing', 'ready_for_pickup', 'completed'],
  LAB_TECHNICIAN: ['pending', 'sample_collected', 'analysis_in_progress', 'results_ready', 'completed'],
  EMERGENCY_WORKER: ['pending', 'dispatched', 'on_scene', 'resolved'],
  CAREGIVER: ['pending', 'confirmed', 'in_progress', 'completed'],
  PHYSIOTHERAPIST: ['pending', 'confirmed', 'in_progress', 'completed'],
  DENTIST: ['pending', 'confirmed', 'in_progress', 'completed'],
  OPTOMETRIST: ['pending', 'confirmed', 'in_progress', 'completed'],
  NUTRITIONIST: ['pending', 'confirmed', 'in_progress', 'completed'],
}

// ── Action names for status transitions ─────────────────────────────────────
function actionForTransition(from: string | null, to: string): string {
  if (!from) return 'create'
  const map: Record<string, string> = {
    confirmed: 'accept',
    order_confirmed: 'confirm_order',
    in_progress: 'start',
    dispatched: 'dispatch',
    on_scene: 'arrive',
    resolved: 'resolve',
    sample_collected: 'collect_sample',
    analysis_in_progress: 'start_analysis',
    results_ready: 'publish_results',
    preparing: 'start_preparing',
    ready_for_pickup: 'mark_ready',
    completed: 'complete',
  }
  return map[to] || 'transition'
}

function roleForAction(from: string | null): string {
  if (!from) return 'patient'
  return 'provider'
}

function labelForStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

// ── Service names per provider type ─────────────────────────────────────────
const SERVICE_NAMES: Record<string, string[]> = {
  DOCTOR: ['General Consultation', 'Follow-up Visit', 'Specialist Referral Review'],
  NURSE: ['Wound Dressing', 'IV Therapy Session', 'Post-Op Check'],
  NANNY: ['Childcare Session', 'Overnight Care', 'Infant Monitoring'],
  PHARMACIST: ['Medication Dispensing', 'Prescription Refill', 'Health Supplements Order'],
  LAB_TECHNICIAN: ['Blood Test Panel', 'Urine Analysis', 'Lipid Profile Test'],
  EMERGENCY_WORKER: ['Emergency Response', 'First Aid Response', 'Medical Transport'],
  CAREGIVER: ['Elder Daily Care', 'Dementia Companion', 'Post-Surgery Home Aide'],
  PHYSIOTHERAPIST: ['Rehabilitation Session', 'Sports Injury Treatment', 'Back Pain Therapy'],
  DENTIST: ['Dental Cleaning', 'Root Canal Treatment', 'Orthodontic Consultation'],
  OPTOMETRIST: ['Comprehensive Eye Exam', 'Contact Lens Fitting', 'Glaucoma Screening'],
  NUTRITIONIST: ['Nutrition Assessment', 'Meal Plan Creation', 'Diabetes Diet Plan'],
}

// ── Service mode mapping ────────────────────────────────────────────────────
function toServiceMode(bookingType: string): string {
  return bookingType === 'video' ? 'video' : 'office'
}

export async function seedRichBookingsAndWorkflows(prisma: PrismaClient) {
  console.log('  Seeding rich bookings with workflow instances...')

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000

  // ── Fetch patients ──────────────────────────────────────────────────────
  const patients: Record<string, { id: string; firstName: string; lastName: string }> = {}
  for (const patId of ['PAT001', 'PAT002', 'PAT003']) {
    const p = await prisma.user.findFirst({
      where: { id: patId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (p) patients[patId] = p
  }

  if (Object.keys(patients).length === 0) {
    console.log('  Skipping - no patients found')
    return
  }

  // ── Provider booking definitions ──────────────────────────────────────────
  interface BookingDef {
    providerId: string
    providerType: UserType
    patientId: string
    status: string
    type: 'video' | 'in_person'
    serviceIdx: number
    daysOffset: number
    servicePrice: number
  }

  const bookingDefs: BookingDef[] = [
    // 1. DOC001 (DOCTOR): in_progress + completed
    { providerId: 'DOC001', providerType: 'DOCTOR', patientId: 'PAT001', status: 'in_progress', type: 'video', serviceIdx: 0, daysOffset: -2, servicePrice: 800 },
    { providerId: 'DOC001', providerType: 'DOCTOR', patientId: 'PAT002', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -10, servicePrice: 600 },

    // 2. NUR001 (NURSE): confirmed + completed
    { providerId: 'NUR001', providerType: 'NURSE', patientId: 'PAT002', status: 'confirmed', type: 'in_person', serviceIdx: 0, daysOffset: 3, servicePrice: 500 },
    { providerId: 'NUR001', providerType: 'NURSE', patientId: 'PAT003', status: 'completed', type: 'video', serviceIdx: 1, daysOffset: -8, servicePrice: 450 },

    // 3. NAN001 (NANNY): pending + completed
    { providerId: 'NAN001', providerType: 'NANNY', patientId: 'PAT001', status: 'pending', type: 'in_person', serviceIdx: 0, daysOffset: 5, servicePrice: 700 },
    { providerId: 'NAN001', providerType: 'NANNY', patientId: 'PAT003', status: 'completed', type: 'video', serviceIdx: 1, daysOffset: -12, servicePrice: 1200 },

    // 4. PHARM001 (PHARMACIST): order_confirmed + completed
    { providerId: 'PHARM001', providerType: 'PHARMACIST', patientId: 'PAT001', status: 'order_confirmed', type: 'in_person', serviceIdx: 0, daysOffset: -1, servicePrice: 350 },
    { providerId: 'PHARM001', providerType: 'PHARMACIST', patientId: 'PAT002', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -9, servicePrice: 200 },

    // 5. LAB001 (LAB_TECHNICIAN): analysis_in_progress + completed
    { providerId: 'LAB001', providerType: 'LAB_TECHNICIAN', patientId: 'PAT003', status: 'analysis_in_progress', type: 'in_person', serviceIdx: 0, daysOffset: -3, servicePrice: 1500 },
    { providerId: 'LAB001', providerType: 'LAB_TECHNICIAN', patientId: 'PAT001', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -14, servicePrice: 900 },

    // 6. EMW001 (EMERGENCY_WORKER): dispatched + resolved
    { providerId: 'EMW001', providerType: 'EMERGENCY_WORKER', patientId: 'PAT002', status: 'dispatched', type: 'in_person', serviceIdx: 0, daysOffset: 0, servicePrice: 1200 },
    { providerId: 'EMW001', providerType: 'EMERGENCY_WORKER', patientId: 'PAT003', status: 'resolved', type: 'in_person', serviceIdx: 1, daysOffset: -7, servicePrice: 1000 },

    // 7. CARE001 (CAREGIVER): in_progress + completed
    { providerId: 'CARE001', providerType: 'CAREGIVER', patientId: 'PAT001', status: 'in_progress', type: 'video', serviceIdx: 0, daysOffset: -1, servicePrice: 800 },
    { providerId: 'CARE001', providerType: 'CAREGIVER', patientId: 'PAT002', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -11, servicePrice: 650 },

    // 8. PHYSIO001 (PHYSIOTHERAPIST): confirmed + completed
    { providerId: 'PHYSIO001', providerType: 'PHYSIOTHERAPIST', patientId: 'PAT003', status: 'confirmed', type: 'in_person', serviceIdx: 0, daysOffset: 4, servicePrice: 900 },
    { providerId: 'PHYSIO001', providerType: 'PHYSIOTHERAPIST', patientId: 'PAT001', status: 'completed', type: 'video', serviceIdx: 1, daysOffset: -6, servicePrice: 750 },

    // 9. DENT001 (DENTIST): in_progress + completed
    { providerId: 'DENT001', providerType: 'DENTIST', patientId: 'PAT002', status: 'in_progress', type: 'video', serviceIdx: 0, daysOffset: -1, servicePrice: 400 },
    { providerId: 'DENT001', providerType: 'DENTIST', patientId: 'PAT001', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -13, servicePrice: 1500 },

    // 10. OPT001 (OPTOMETRIST): confirmed + completed
    { providerId: 'OPT001', providerType: 'OPTOMETRIST', patientId: 'PAT003', status: 'confirmed', type: 'in_person', serviceIdx: 0, daysOffset: 6, servicePrice: 1000 },
    { providerId: 'OPT001', providerType: 'OPTOMETRIST', patientId: 'PAT002', status: 'completed', type: 'video', serviceIdx: 1, daysOffset: -5, servicePrice: 800 },

    // 11. NUTR001 (NUTRITIONIST): pending + completed
    { providerId: 'NUTR001', providerType: 'NUTRITIONIST', patientId: 'PAT001', status: 'pending', type: 'video', serviceIdx: 0, daysOffset: 7, servicePrice: 1100 },
    { providerId: 'NUTR001', providerType: 'NUTRITIONIST', patientId: 'PAT003', status: 'completed', type: 'in_person', serviceIdx: 1, daysOffset: -4, servicePrice: 600 },
  ]

  let bookingCount = 0
  let instanceCount = 0
  let stepLogCount = 0

  // ── Helper: find default workflow template ──────────────────────────────
  async function findTemplate(providerType: string, serviceMode: string) {
    return prisma.workflowTemplate.findFirst({
      where: { providerType, serviceMode, isDefault: true, isActive: true },
      select: { id: true, steps: true },
    })
  }

  // ── Helper: get statuses traversed up to target status ──────────────────
  function getStatusPath(providerType: string, targetStatus: string): string[] {
    const fullPath = STATUS_PATHS[providerType] || ['pending', 'confirmed', 'in_progress', 'completed']
    const idx = fullPath.indexOf(targetStatus)
    if (idx === -1) return [targetStatus] // fallback: just the target
    return fullPath.slice(0, idx + 1)
  }

  // ── Create bookings with workflow instances ─────────────────────────────
  for (const def of bookingDefs) {
    try {
      const patient = patients[def.patientId]
      if (!patient) {
        console.log(`    Skipping - patient ${def.patientId} not found`)
        continue
      }

      const provider = await prisma.user.findFirst({
        where: { id: def.providerId },
        select: { id: true, firstName: true, lastName: true },
      })
      if (!provider) {
        console.log(`    Skipping - provider ${def.providerId} not found`)
        continue
      }

      const serviceNames = SERVICE_NAMES[def.providerType] || ['Consultation']
      const serviceName = serviceNames[def.serviceIdx % serviceNames.length]

      const scheduledAt = new Date(now.getTime() + def.daysOffset * DAY)
      scheduledAt.setHours(9 + (def.serviceIdx * 2) % 8, 0, 0, 0)

      // Create the ServiceBooking
      const booking = await prisma.serviceBooking.create({
        data: {
          patientId: patient.id,
          providerUserId: provider.id,
          providerType: def.providerType as UserType,
          providerName: `${provider.firstName} ${provider.lastName}`,
          scheduledAt,
          duration: 30,
          type: def.type,
          status: def.status,
          serviceName,
          servicePrice: def.servicePrice,
          reason: `${serviceName} - ${def.type === 'video' ? 'video consultation' : 'in-person visit'}`,
        },
      })
      bookingCount++

      // Find matching workflow template
      const serviceMode = toServiceMode(def.type)
      const template = await findTemplate(def.providerType, serviceMode)
      if (!template) {
        console.log(`    No template for ${def.providerType}/${serviceMode} - booking created without workflow`)
        continue
      }

      // Determine status path for step log generation
      const statusPath = getStatusPath(def.providerType, def.status)
      const previousStatus = statusPath.length > 1 ? statusPath[statusPath.length - 2] : null
      const isCompleted = ['completed', 'resolved'].includes(def.status)

      // Create WorkflowInstance
      const instance = await prisma.workflowInstance.create({
        data: {
          templateId: template.id,
          bookingId: booking.id,
          bookingType: 'service_booking',
          currentStatus: def.status,
          previousStatus,
          patientUserId: patient.id,
          providerUserId: provider.id,
          serviceMode,
          startedAt: new Date(scheduledAt.getTime() - 1 * DAY),
          completedAt: isCompleted ? scheduledAt : null,
        },
      })
      instanceCount++

      // Create WorkflowStepLog entries for each status transition
      for (let i = 0; i < statusPath.length; i++) {
        const fromStatus = i === 0 ? null : statusPath[i - 1]
        const toStatus = statusPath[i]
        const action = actionForTransition(fromStatus, toStatus)
        const role = roleForAction(fromStatus)
        const actionByUserId = role === 'patient' ? patient.id : provider.id

        await prisma.workflowStepLog.create({
          data: {
            instanceId: instance.id,
            fromStatus,
            toStatus,
            action,
            actionByUserId,
            actionByRole: role,
            label: labelForStatus(toStatus),
            message: `${serviceName}: ${labelForStatus(toStatus)}`,
            createdAt: new Date(scheduledAt.getTime() - (statusPath.length - i) * 60 * 60 * 1000),
          },
        })
        stepLogCount++
      }

      console.log(`    ${def.providerType} ${def.providerId} → ${def.status} (${def.type})`)
    } catch (error) {
      console.error(`    Error creating booking for ${def.providerId}:`, error)
    }
  }

  console.log(`  ✓ ${bookingCount} service bookings, ${instanceCount} workflow instances, ${stepLogCount} step logs`)

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO ROOMS - for video bookings and additional provider rooms
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('  Seeding video rooms for workflow bookings...')

  let roomCount = 0

  interface VideoRoomDef {
    roomCode: string
    name: string
    creatorId: string
    status: string
    participants: { userId: string; role: string }[]
  }

  const videoRoomDefs: VideoRoomDef[] = [
    // 5 additional video rooms for providers with video-status bookings
    {
      roomCode: 'WF-DOC001-PAT001',
      name: 'Dr. Consultation - Video',
      creatorId: 'DOC001',
      status: 'active',
      participants: [
        { userId: 'DOC001', role: 'host' },
        { userId: 'PAT001', role: 'participant' },
      ],
    },
    {
      roomCode: 'WF-NUR001-PAT002',
      name: 'Nurse Consultation - Video',
      creatorId: 'NUR001',
      status: 'active',
      participants: [
        { userId: 'NUR001', role: 'host' },
        { userId: 'PAT002', role: 'participant' },
      ],
    },
    {
      roomCode: 'WF-CARE001-PAT001',
      name: 'Caregiver Session - Video',
      creatorId: 'CARE001',
      status: 'ended',
      participants: [
        { userId: 'CARE001', role: 'host' },
        { userId: 'PAT001', role: 'participant' },
      ],
    },
    {
      roomCode: 'WF-DENT001-PAT003',
      name: 'Dental Teleconsultation - Video',
      creatorId: 'DENT001',
      status: 'active',
      participants: [
        { userId: 'DENT001', role: 'host' },
        { userId: 'PAT003', role: 'participant' },
      ],
    },
    {
      roomCode: 'WF-PHYSIO001-PAT002',
      name: 'Physiotherapy Video Session',
      creatorId: 'PHYSIO001',
      status: 'active',
      participants: [
        { userId: 'PHYSIO001', role: 'host' },
        { userId: 'PAT002', role: 'participant' },
      ],
    },
  ]

  for (const roomDef of videoRoomDefs) {
    try {
      // Verify creator exists
      const creator = await prisma.user.findFirst({
        where: { id: roomDef.creatorId },
        select: { id: true },
      })
      if (!creator) {
        console.log(`    Skipping room ${roomDef.roomCode} - creator ${roomDef.creatorId} not found`)
        continue
      }

      // Check if room code already exists
      const existing = await prisma.videoRoom.findFirst({
        where: { roomCode: roomDef.roomCode },
      })
      if (existing) {
        console.log(`    Skipping room ${roomDef.roomCode} - already exists`)
        continue
      }

      // Verify all participants exist
      let allParticipantsExist = true
      for (const p of roomDef.participants) {
        const user = await prisma.user.findFirst({
          where: { id: p.userId },
          select: { id: true },
        })
        if (!user) {
          console.log(`    Skipping room ${roomDef.roomCode} - participant ${p.userId} not found`)
          allParticipantsExist = false
          break
        }
      }
      if (!allParticipantsExist) continue

      const room = await prisma.videoRoom.create({
        data: {
          roomCode: roomDef.roomCode,
          name: roomDef.name,
          creatorId: roomDef.creatorId,
          status: roomDef.status,
          maxParticipants: 2,
          participants: {
            create: roomDef.participants.map((p) => ({
              userId: p.userId,
              role: p.role,
            })),
          },
        },
      })

      roomCount++
      console.log(`    Room ${room.roomCode} (${roomDef.status})`)
    } catch (error) {
      console.error(`    Error creating video room ${roomDef.roomCode}:`, error)
    }
  }

  console.log(`  ✓ ${roomCount} video rooms created`)
}
