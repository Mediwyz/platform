#!/usr/bin/env node

/**
 * Cross-Role Full Flow Integration Tests
 *
 * Tests complete workflows between different user role pairs:
 *   1. Patient → Doctor: Book → Accept → Video Call → Prescription
 *   2. Patient → Nurse:  Book → Accept → Video Call
 *   3. Patient → Nanny:  Book → Accept
 *   4. Patient → Lab Tech: Book → Accept → Submit Results
 *   5. Patient → Emergency: Book → Dispatch
 *   6. Patient → Pharmacist: Order Medicine
 *   7. Doctor → Doctor: Book another doctor (cross-provider)
 *   8. Pharmacist → Doctor: Book a doctor (non-patient booking)
 *   9. Nurse → Lab Tech: Book lab test (non-patient booking)
 *
 * Run: node scripts/test-cross-role-flows.mjs
 * Requires: dev server on port 3000 with seeded database.
 */

const BASE = 'http://localhost:3000'
let passed = 0
let failed = 0
let skipped = 0
// ─── Seed Credentials ──────────────────────────────────────────────────────────

const USERS = {
  patient1:    { email: 'emma.johnson@mediwyz.com',       password: 'Patient123!',    id: 'PAT001',   profileId: 'PPROF001' },
  patient2:    { email: 'jean.pierre@mediwyz.com',        password: 'Patient123!',    id: 'PAT002',   profileId: 'PPROF002' },
  doctor1:     { email: 'sarah.johnson@mediwyz.com',      password: 'Doctor123!',     id: 'DOC001',   profileId: 'DPROF001' },
  doctor2:     { email: 'raj.patel@mediwyz.com',          password: 'Doctor123!',     id: 'DOC002',   profileId: 'DPROF002' },
  nurse1:      { email: 'priya.ramgoolam@mediwyz.com',    password: 'Nurse123!',      id: 'NUR001',   profileId: 'NPROF001' },
  nanny1:      { email: 'anita.beeharry@mediwyz.com',     password: 'Nanny123!',      id: 'NAN001',   profileId: 'NAPROF001' },
  pharmacist1: { email: 'rajesh.doorgakant@mediwyz.com', password: 'Pharma123!',     id: 'PHARM001', profileId: 'PHPROF001' },
  labtech1:    { email: 'david.ahkee@mediwyz.com',       password: 'Lab123!',        id: 'LAB001',   profileId: 'LTPROF001' },
  responder1:  { email: 'jeanmarc.lafleur@mediwyz.com',  password: 'Emergency123!',  id: 'EMW001',   profileId: 'EWPROF001' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function test(name, condition) {
  if (condition) {
    console.log(`    \x1b[32m✓\x1b[0m ${name}`)
    passed++
  } else {
    console.log(`    \x1b[31m✗\x1b[0m ${name}`)
    failed++
  }
}

function skip(name, reason) {
  console.log(`    \x1b[33m⊘\x1b[0m ${name} (${reason})`)
  skipped++
}


const loginCache = new Map()

async function loginAs(user) {
  if (loginCache.has(user.email)) return loginCache.get(user.email)
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  })
  const setCookie = res.headers.get('set-cookie') || ''
  const cookie = setCookie.split(',').map(c => c.trim().split(';')[0]).filter(Boolean).join('; ')
  const data = await res.json()
  const result = { cookie, success: data.success, data }
  if (data.success) loginCache.set(user.email, result)
  return result
}

async function getAvailableSlot(cookie, providerId, providerType, startDay = 28) {
  // Try multiple days to find an available slot (only weekdays — seeded availability is Mon-Fri)
  // Start 14+ days ahead to avoid collisions with previously-created bookings
  for (let i = startDay; i < startDay + 60; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    // Skip weekends (0=Sunday, 6=Saturday)
    if (d.getDay() === 0 || d.getDay() === 6) continue
    const date = d.toISOString().split('T')[0]
    const res = await api(cookie, `/api/bookings/available-slots?providerId=${providerId}&date=${date}&providerType=${providerType}`)
    const slots = res.data?.slots || res.data?.data || []
    if (Array.isArray(slots) && slots.length > 0) {
      // Pick a random slot to avoid collisions between flows
      const idx = Math.min(Math.floor(Math.random() * slots.length), slots.length - 1)
      return { date, time: slots[idx] }
    }
  }
  return null
}

async function resetWallet(cookie, userId) {
  const res = await api(cookie, `/api/users/${userId}/wallet/reset`, {
    method: 'POST',
  })
  return res.status === 200 && res.data?.success
}

async function api(cookie, path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        ...options.headers,
      },
    })
    const data = await res.json().catch(() => null)
    return { status: res.status, data }
  } catch (err) {
    return { status: 0, data: null, error: err.message }
  }
}

// ─── Flow 1: Patient → Doctor (Full Flow) ────────────────────────────────────

async function testPatientDoctorFlow() {
  console.log('\n  \x1b[36mFlow 1: Patient → Doctor (Book → Accept → Video → Prescription)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const doctor = await loginAs(USERS.doctor1)

  if (!patient.success || !doctor.success) {
    skip('Patient-Doctor flow', 'login failed')
    return
  }

  // Step 1: Patient books doctor (find available slot first)
  const slot = await getAvailableSlot(patient.cookie, USERS.doctor1.id, 'doctor')
  if (!slot) { skip('Patient-Doctor flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/doctor', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: USERS.doctor1.id,
      consultationType: 'video',
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      reason: 'E2E Test: Annual checkup',
      duration: 30,
    }),
  })
  test('Patient creates doctor booking', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Doctor accept + video + prescription', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  // Step 2: Doctor accepts the booking
  const acceptRes = await api(doctor.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'doctor',
      action: 'accept',
    }),
  })
  test('Doctor accepts booking', acceptRes.status === 200 && acceptRes.data?.success)

  // Step 3: Video call — create room & join sessions
  // Use the booking's roomId if it was a video consultation
  const bookingRoomId = bookRes.data?.booking?.roomId
  let roomCode = null

  if (bookingRoomId) {
    // Video booking auto-generates a roomId — create the actual room for it
    const roomRes = await api(doctor.cookie, '/api/video/room', {
      method: 'POST',
      body: JSON.stringify({
        creatorId: doctor.data?.user?.id || USERS.doctor1.id,
        reason: 'Doctor Consultation',
      }),
    })
    test('Doctor creates video room', roomRes.status === 200 || roomRes.status === 201)
    roomCode = roomRes.data?.data?.roomCode
  } else {
    skip('Video room creation', 'no roomId in booking response')
  }

  if (roomCode) {
    // Doctor joins session
    const docSession = await api(doctor.cookie, '/api/webrtc/session', {
      method: 'POST',
      body: JSON.stringify({
        roomId: roomCode,
        userId: doctor.data?.user?.id || USERS.doctor1.id,
        userName: 'Dr. Sarah Johnson',
        userType: 'DOCTOR',
      }),
    })
    test('Doctor joins video session', docSession.status === 200 && docSession.data?.data?.session)

    // Patient joins same session
    const patSession = await api(patient.cookie, '/api/webrtc/session', {
      method: 'POST',
      body: JSON.stringify({
        roomId: roomCode,
        userId: patient.data?.user?.id || USERS.patient1.id,
        userName: 'Emma Johnson',
        userType: 'PATIENT',
      }),
    })
    test('Patient joins same video session', patSession.status === 200 && patSession.data?.data?.session)

    // Both should see the same session
    const sameSession = docSession.data?.data?.session?.id === patSession.data?.data?.session?.id
    test('Both users share the same session', sameSession)

    // End the session
    const sessionId = docSession.data?.data?.session?.id
    if (sessionId) {
      const endRes = await api(doctor.cookie, `/api/webrtc/session?sessionId=${sessionId}`, {
        method: 'DELETE',
      })
      test('Doctor ends video session', endRes.status === 200)
    }
  } else {
    skip('Video session tests', 'room creation failed')
  }

  // Step 4: Doctor sends prescription to patient
  const rxRes = await api(doctor.cookie, `/api/doctors/${USERS.doctor1.id}/prescriptions`, {
    method: 'POST',
    body: JSON.stringify({
      patientId: USERS.patient1.profileId,
      diagnosis: 'E2E Test: Mild hypertension',
      notes: 'Monitor blood pressure daily',
      medicines: [
        {
          name: 'Amlodipine',
          dosage: '5mg',
          frequency: 'Once daily',
          duration: '3 months',
          instructions: 'Take in the morning',
        },
      ],
    }),
  })
  test('Doctor creates prescription', rxRes.status === 201 || rxRes.status === 200)

  // Patient checks their prescriptions
  const patRx = await api(patient.cookie, `/api/patients/${USERS.patient1.id}/prescriptions`)
  test('Patient can view prescriptions', patRx.status === 200)
}

// ─── Flow 2: Patient → Nurse ─────────────────────────────────────────────────

async function testPatientNurseFlow() {
  console.log('\n  \x1b[36mFlow 2: Patient → Nurse (Book → Accept → Video)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const nurse = await loginAs(USERS.nurse1)

  if (!patient.success || !nurse.success) {
    skip('Patient-Nurse flow', 'login failed')
    return
  }

  const nurseSlot = await getAvailableSlot(patient.cookie, USERS.nurse1.id, 'nurse')
  if (!nurseSlot) { skip('Patient-Nurse flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/nurse', {
    method: 'POST',
    body: JSON.stringify({
      nurseId: USERS.nurse1.id,
      consultationType: 'home_visit',
      scheduledDate: nurseSlot.date,
      scheduledTime: nurseSlot.time,
      reason: 'E2E Test: Wound dressing',
      duration: 60,
    }),
  })
  test('Patient creates nurse booking', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Nurse accept', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const acceptRes = await api(nurse.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'nurse',
      action: 'accept',
    }),
  })
  test('Nurse accepts booking', acceptRes.status === 200 && acceptRes.data?.success)
}

// ─── Flow 3: Patient → Nanny ────────────────────────────────────────────────

async function testPatientNannyFlow() {
  console.log('\n  \x1b[36mFlow 3: Patient → Nanny (Book → Accept)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const nanny = await loginAs(USERS.nanny1)

  if (!patient.success || !nanny.success) {
    skip('Patient-Nanny flow', 'login failed')
    return
  }

  const nannySlot = await getAvailableSlot(patient.cookie, USERS.nanny1.id, 'nanny', 35)
  if (!nannySlot) { skip('Patient-Nanny flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/nanny', {
    method: 'POST',
    body: JSON.stringify({
      nannyId: USERS.nanny1.id,
      consultationType: 'in_person',
      scheduledDate: nannySlot.date,
      scheduledTime: nannySlot.time,
      reason: 'E2E Test: Childcare for afternoon',
      duration: 180,
    }),
  })
  test('Patient creates nanny booking', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Nanny accept', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const acceptRes = await api(nanny.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'nanny',
      action: 'accept',
    }),
  })
  test('Nanny accepts booking', acceptRes.status === 200 && acceptRes.data?.success)
}

// ─── Flow 4: Patient → Lab Tech (Book → Accept → Results) ───────────────────

async function testPatientLabTechFlow() {
  console.log('\n  \x1b[36mFlow 4: Patient → Lab Tech (Book → Accept → Submit Results)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const labtech = await loginAs(USERS.labtech1)

  if (!patient.success || !labtech.success) {
    skip('Patient-LabTech flow', 'login failed')
    return
  }

  const labSlot = await getAvailableSlot(patient.cookie, USERS.labtech1.id, 'lab-test', 35)
  if (!labSlot) { skip('Patient-LabTech flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/lab-test', {
    method: 'POST',
    body: JSON.stringify({
      labTechId: USERS.labtech1.id,
      testName: 'E2E Test: Complete Blood Count',
      scheduledDate: labSlot.date,
      scheduledTime: labSlot.time,
      sampleType: 'blood',
      notes: 'Fasting required',
      price: 500,
    }),
  })
  test('Patient creates lab test booking', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Lab tech accept + results', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  // Lab tech accepts the booking
  const acceptRes = await api(labtech.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'lab_test',
      action: 'accept',
    }),
  })
  test('Lab tech accepts booking', acceptRes.status === 200 && acceptRes.data?.success)

  // Lab tech submits results
  const resultRes = await api(labtech.cookie, `/api/lab-techs/${USERS.labtech1.id}/results/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      resultFindings: 'WBC: 7.2 x10^9/L, RBC: 4.8 x10^12/L, Hemoglobin: 14.2 g/dL, Platelets: 250 x10^9/L',
      resultNotes: 'All values within normal range. No abnormalities detected.',
    }),
  })
  test('Lab tech submits results', resultRes.status === 200 && resultRes.data?.success)

  // Patient views lab test bookings (includes results)
  const patResults = await api(patient.cookie, `/api/patients/${USERS.patient1.id}/lab-tests`)
  test('Patient can view lab results', patResults.status === 200)
}

// ─── Flow 5: Patient → Emergency ─────────────────────────────────────────────

async function testEmergencyFlow() {
  console.log('\n  \x1b[36mFlow 5: Patient → Emergency (Book → Dispatch)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const responder = await loginAs(USERS.responder1)

  if (!patient.success) {
    skip('Emergency flow', 'patient login failed')
    return
  }

  const bookRes = await api(patient.cookie, '/api/bookings/emergency', {
    method: 'POST',
    body: JSON.stringify({
      emergencyType: 'trauma',
      location: '123 Test Street, Port Louis, Mauritius',
      contactNumber: '+230 5999 0000',
      notes: 'E2E Test: Minor injury',
      priority: 'medium',
    }),
  })
  test('Patient creates emergency booking', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId || !responder.success) {
    skip('Emergency dispatch', `booking failed or responder login failed`)
    return
  }

  // Responder accepts the emergency
  const acceptRes = await api(responder.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'emergency',
      action: 'accept',
    }),
  })
  test('Responder accepts emergency', acceptRes.status === 200 && acceptRes.data?.success)
}

// ─── Flow 6: Patient → Pharmacist (Order Medicine) ──────────────────────────

async function testMedicineOrderFlow() {
  console.log('\n  \x1b[36mFlow 6: Patient → Pharmacist (Order Medicine)\x1b[0m')

  const patient = await loginAs(USERS.patient1)

  if (!patient.success) {
    skip('Medicine order flow', 'login failed')
    return
  }

  // First, find available pharmacy medicines
  const searchRes = await api(patient.cookie, '/api/search?type=medicines&q=')
  test('Patient can search for medicines', searchRes.status === 200)

  // Check if there are pharmacy medicines in the response
  const medicines = searchRes.data?.data || searchRes.data?.results || []
  if (medicines.length > 0 && medicines[0]?.id) {
    // Try to order (may fail due to insufficient balance, which is OK)
    const orderRes = await api(patient.cookie, '/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ pharmacyMedicineId: medicines[0].id, quantity: 1 }],
      }),
    })
    // 201 = success, 400 = insufficient balance or prescription required (both valid)
    test('Order API processes request', [201, 400].includes(orderRes.status))
  } else {
    skip('Medicine order', 'no pharmacy medicines found in search')
  }

  // Patient can view their orders
  const ordersRes = await api(patient.cookie, '/api/orders')
  test('Patient can view orders', ordersRes.status === 200)
}

// ─── Flow 7: Doctor → Doctor (Cross-Provider Booking) ───────────────────────

async function testDoctorBooksDoctorFlow() {
  console.log('\n  \x1b[36mFlow 7: Doctor → Doctor (Non-patient books provider)\x1b[0m')

  const doctor1 = await loginAs(USERS.doctor1)
  const doctor2 = await loginAs(USERS.doctor2)

  if (!doctor1.success || !doctor2.success) {
    skip('Doctor-Doctor flow', 'login failed')
    return
  }

  const doc2Slot = await getAvailableSlot(doctor1.cookie, USERS.doctor2.id, 'doctor')
  if (!doc2Slot) { skip('Doctor-Doctor flow', 'no available slots'); return }
  const bookRes = await api(doctor1.cookie, '/api/bookings/doctor', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: USERS.doctor2.id,
      consultationType: 'video',
      scheduledDate: doc2Slot.date,
      scheduledTime: doc2Slot.time,
      reason: 'E2E Test: Doctor consulting another doctor',
      duration: 30,
    }),
  })
  // Should succeed because ensurePatientProfile auto-creates a patient profile
  test('Doctor1 books Doctor2 (auto-creates patient profile)', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Doctor2 accept', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const acceptRes = await api(doctor2.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'doctor',
      action: 'accept',
    }),
  })
  test('Doctor2 accepts booking from Doctor1', acceptRes.status === 200 && acceptRes.data?.success)
}

// ─── Flow 8: Pharmacist → Doctor (Any role can book) ────────────────────────

async function testPharmacistBooksDoctorFlow() {
  console.log('\n  \x1b[36mFlow 8: Pharmacist → Doctor (Any user can book a doctor)\x1b[0m')

  const pharmacist = await loginAs(USERS.pharmacist1)
  const doctor = await loginAs(USERS.doctor1)

  if (!pharmacist.success || !doctor.success) {
    skip('Pharmacist-Doctor flow', 'login failed')
    return
  }

  const docSlot = await getAvailableSlot(pharmacist.cookie, USERS.doctor1.id, 'doctor', 35)
  if (!docSlot) { skip('Pharmacist-Doctor flow', 'no available slots'); return }
  const bookRes = await api(pharmacist.cookie, '/api/bookings/doctor', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: USERS.doctor1.id,
      consultationType: 'in_person',
      scheduledDate: docSlot.date,
      scheduledTime: docSlot.time,
      reason: 'E2E Test: Pharmacist visiting doctor',
      duration: 30,
    }),
  })
  test('Pharmacist books doctor (auto-creates patient profile)', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Doctor accept pharmacist booking', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const acceptRes = await api(doctor.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'doctor',
      action: 'accept',
    }),
  })
  test('Doctor accepts pharmacist booking', acceptRes.status === 200 && acceptRes.data?.success)
}

// ─── Flow 9: Nurse → Lab Tech (Any role can book lab test) ──────────────────

async function testNurseBooksLabTestFlow() {
  console.log('\n  \x1b[36mFlow 9: Nurse → Lab Tech (Any user can book lab test)\x1b[0m')

  const nurse = await loginAs(USERS.nurse1)
  const labtech = await loginAs(USERS.labtech1)

  if (!nurse.success || !labtech.success) {
    skip('Nurse-LabTech flow', 'login failed')
    return
  }

  const labSlot2 = await getAvailableSlot(nurse.cookie, USERS.labtech1.id, 'lab-test', 35)
  if (!labSlot2) { skip('Nurse-LabTech flow', 'no available slots'); return }
  const bookRes = await api(nurse.cookie, '/api/bookings/lab-test', {
    method: 'POST',
    body: JSON.stringify({
      labTechId: USERS.labtech1.id,
      testName: 'E2E Test: Nurse Blood Test',
      scheduledDate: labSlot2.date,
      scheduledTime: labSlot2.time,
      sampleType: 'blood',
      notes: 'Nurse requesting own lab test',
      price: 350,
    }),
  })
  test('Nurse books lab test (auto-creates patient profile)', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Lab tech accept + results for nurse', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  // Lab tech accepts
  const acceptRes = await api(labtech.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'lab_test',
      action: 'accept',
    }),
  })
  test('Lab tech accepts nurse booking', acceptRes.status === 200 && acceptRes.data?.success)

  // Lab tech submits results
  const resultRes = await api(labtech.cookie, `/api/lab-techs/${USERS.labtech1.id}/results/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      resultFindings: 'WBC: 6.8, RBC: 4.5, Hemoglobin: 13.8 g/dL',
      resultNotes: 'Normal values — nurse is healthy.',
    }),
  })
  test('Lab tech submits results for nurse', resultRes.status === 200 && resultRes.data?.success)
}

// ─── Flow 10: Messaging Between Roles ───────────────────────────────────────

async function testCrossRoleMessaging() {
  console.log('\n  \x1b[36mFlow 10: Cross-Role Messaging (Patient ↔ Doctor)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const doctor = await loginAs(USERS.doctor1)

  if (!patient.success || !doctor.success) {
    skip('Cross-role messaging', 'login failed')
    return
  }

  // Patient checks conversations
  const patConvRes = await api(patient.cookie, '/api/conversations')
  test('Patient can list conversations', patConvRes.status === 200)

  // Doctor checks conversations
  const docConvRes = await api(doctor.cookie, '/api/conversations')
  test('Doctor can list conversations', docConvRes.status === 200)

  // Find or create conversation between patient and doctor
  const conversations = patConvRes.data?.data || patConvRes.data || []
  let conversationId = null

  if (Array.isArray(conversations)) {
    const existing = conversations.find(c =>
      c.participants?.some(p => p.userId === USERS.doctor1.id)
    )
    if (existing) conversationId = existing.id
  }

  if (!conversationId) {
    // Create a new conversation
    const createRes = await api(patient.cookie, '/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId: USERS.doctor1.id }),
    })
    test('Patient creates conversation with doctor', [200, 201, 409].includes(createRes.status))
    conversationId = createRes.data?.data?.id || createRes.data?.id
  }

  if (conversationId) {
    // Patient sends message
    const msgRes = await api(patient.cookie, `/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello Doctor, this is a cross-role test message!' }),
    })
    test('Patient sends message to doctor', [200, 201].includes(msgRes.status))

    // Doctor reads messages
    const readRes = await api(doctor.cookie, `/api/conversations/${conversationId}/messages`)
    test('Doctor reads messages from patient', readRes.status === 200)

    // Doctor replies
    const replyRes = await api(doctor.cookie, `/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello Patient, message received!' }),
    })
    test('Doctor replies to patient', [200, 201].includes(replyRes.status))
  } else {
    skip('Message exchange', 'could not create/find conversation')
  }
}

// ─── Flow 11: Booking Deny Flow ─────────────────────────────────────────────

async function testBookingDenyFlow() {
  console.log('\n  \x1b[36mFlow 11: Booking Deny (Doctor denies patient booking)\x1b[0m')

  const patient = await loginAs(USERS.patient2)
  const doctor = await loginAs(USERS.doctor2)

  if (!patient.success || !doctor.success) {
    skip('Booking deny flow', 'login failed')
    return
  }

  const denySlot = await getAvailableSlot(patient.cookie, USERS.doctor2.id, 'doctor', 42)
  if (!denySlot) { skip('Booking deny flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/doctor', {
    method: 'POST',
    body: JSON.stringify({
      doctorId: USERS.doctor2.id,
      consultationType: 'in_person',
      scheduledDate: denySlot.date,
      scheduledTime: denySlot.time,
      reason: 'E2E Test: This will be denied',
      duration: 30,
    }),
  })
  test('Patient creates booking (to be denied)', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Doctor deny', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const denyRes = await api(doctor.cookie, '/api/bookings/action', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'doctor',
      action: 'deny',
    }),
  })
  test('Doctor denies booking', denyRes.status === 200 && denyRes.data?.success)
}

// ─── Flow 12: Booking Cancel Flow ───────────────────────────────────────────

async function testBookingCancelFlow() {
  console.log('\n  \x1b[36mFlow 12: Booking Cancel (Patient cancels own booking)\x1b[0m')

  const patient = await loginAs(USERS.patient2)

  if (!patient.success) {
    skip('Booking cancel flow', 'login failed')
    return
  }

  const cancelSlot = await getAvailableSlot(patient.cookie, USERS.nurse1.id, 'nurse', 35)
  if (!cancelSlot) { skip('Booking cancel flow', 'no available slots'); return }
  const bookRes = await api(patient.cookie, '/api/bookings/nurse', {
    method: 'POST',
    body: JSON.stringify({
      nurseId: USERS.nurse1.id,
      consultationType: 'in_person',
      scheduledDate: cancelSlot.date,
      scheduledTime: cancelSlot.time,
      reason: 'E2E Test: This will be cancelled',
      duration: 30,
    }),
  })
  test('Patient creates booking (to be cancelled)', bookRes.status === 201 || bookRes.status === 200)
  const bookingId = bookRes.data?.booking?.id

  if (!bookingId) {
    skip('Patient cancel', `booking failed: ${bookRes.data?.message || bookRes.status}`)
    return
  }

  const cancelRes = await api(patient.cookie, '/api/bookings/cancel', {
    method: 'POST',
    body: JSON.stringify({
      bookingId,
      bookingType: 'nurse',
    }),
  })
  test('Patient cancels booking', cancelRes.status === 200 && cancelRes.data?.success)
}

// ─── Flow 13: Notifications Check ──────────────────────────────────────────

async function testNotificationsFlow() {
  console.log('\n  \x1b[36mFlow 13: Notifications (Users receive notifications)\x1b[0m')

  const patient = await loginAs(USERS.patient1)
  const doctor = await loginAs(USERS.doctor1)

  if (!patient.success || !doctor.success) {
    skip('Notifications flow', 'login failed')
    return
  }

  // Patient checks notifications
  const patNotif = await api(patient.cookie, `/api/users/${USERS.patient1.id}/notifications`)
  test('Patient has notifications', patNotif.status === 200)

  // Doctor checks notifications
  const docNotif = await api(doctor.cookie, `/api/users/${USERS.doctor1.id}/notifications`)
  test('Doctor has notifications', docNotif.status === 200)
}

// ─── Run All Flows ──────────────────────────────────────────────────────────

async function run() {
  console.log('\n\x1b[1m=== Cross-Role Full Flow Integration Tests ===\x1b[0m')

  // Reset wallets to initial trial credit for users that need to make bookings/orders
  console.log('\n  \x1b[36mSetup: Resetting wallets\x1b[0m')
  for (const key of ['patient1', 'patient2', 'doctor1', 'pharmacist1', 'nurse1']) {
    const user = USERS[key]
    const session = await loginAs(user)
    if (session.success) {
      const ok = await resetWallet(session.cookie, user.id)
      console.log(`    ${ok ? '\x1b[32m✓\x1b[0m' : '\x1b[33m⊘\x1b[0m'} ${key} wallet reset`)
    }
  }

  await testPatientDoctorFlow()
  await testPatientNurseFlow()
  await testPatientNannyFlow()
  await testPatientLabTechFlow()
  await testEmergencyFlow()
  await testMedicineOrderFlow()
  await testDoctorBooksDoctorFlow()
  await testPharmacistBooksDoctorFlow()
  await testNurseBooksLabTestFlow()
  await testCrossRoleMessaging()
  await testBookingDenyFlow()
  await testBookingCancelFlow()
  await testNotificationsFlow()

  console.log(`\n\x1b[1m─── Results ───\x1b[0m`)
  console.log(`  \x1b[32m${passed} passed\x1b[0m`)
  if (failed > 0) console.log(`  \x1b[31m${failed} failed\x1b[0m`)
  if (skipped > 0) console.log(`  \x1b[33m${skipped} skipped\x1b[0m`)
  console.log()

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Test script error:', err)
  process.exit(1)
})
