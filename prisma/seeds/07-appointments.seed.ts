import { PrismaClient } from '@prisma/client'

export async function seedAppointments(prisma: PrismaClient) {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  const nextWeek = new Date(now.getTime() + 7 * 86400000)
  const lastWeek = new Date(now.getTime() - 7 * 86400000)
  const lastMonth = new Date(now.getTime() - 30 * 86400000)

  const appointments = [
    // Upcoming
    { id: 'APT001', patientId: 'PPROF001', doctorId: 'DPROF001', scheduledAt: tomorrow, type: 'video', status: 'upcoming', specialty: 'Endocrinology', reason: 'Diabetes follow-up', duration: 30, roomId: 'ROOM-DOC001-PAT001' },
    { id: 'APT002', patientId: 'PPROF002', doctorId: 'DPROF002', scheduledAt: nextWeek, type: 'in-person', status: 'upcoming', specialty: 'General Medicine', reason: 'Asthma review', duration: 20, location: 'Rose Hill Medical Clinic' },
    { id: 'APT003', patientId: 'PPROF004', doctorId: 'DPROF003', scheduledAt: new Date(now.getTime() + 3 * 86400000), type: 'video', status: 'upcoming', specialty: 'Cardiology', reason: 'Cholesterol follow-up', duration: 30, roomId: 'ROOM-DOC003-PAT004' },
    { id: 'APT004', patientId: 'PPROF003', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() + 5 * 86400000), type: 'in-person', status: 'upcoming', specialty: 'General Medicine', reason: 'Annual checkup', duration: 30, location: 'Rose Hill Medical Clinic' },
    { id: 'APT005', patientId: 'PPROF005', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() + 10 * 86400000), type: 'video', status: 'upcoming', specialty: 'Endocrinology', reason: 'Thyroid screening', duration: 30, roomId: 'ROOM-DOC001-PAT005' },
    // Past
    { id: 'APT006', patientId: 'PPROF001', doctorId: 'DPROF001', scheduledAt: lastWeek, type: 'video', status: 'completed', specialty: 'Endocrinology', reason: 'HbA1c review', duration: 30 },
    { id: 'APT007', patientId: 'PPROF001', doctorId: 'DPROF003', scheduledAt: lastMonth, type: 'in-person', status: 'completed', specialty: 'Cardiology', reason: 'Cardiac screening', duration: 45, location: 'Cardiac Care Center' },
    { id: 'APT008', patientId: 'PPROF002', doctorId: 'DPROF002', scheduledAt: lastWeek, type: 'in-person', status: 'completed', specialty: 'General Medicine', reason: 'Flu symptoms', duration: 20, location: 'Rose Hill Medical Clinic' },

    // ── 5 additional doctor appointments ────────────────────────────────────
    // Upcoming - spread across next 2 weeks
    { id: 'APT024', patientId: 'PPROF002', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() + 2 * 86400000), type: 'video', status: 'upcoming', specialty: 'Endocrinology', reason: 'Migraine prophylaxis review', duration: 20, roomId: 'ROOM-DOC001-PAT002', notes: 'Review propranolol efficacy and headache diary' },
    { id: 'APT025', patientId: 'PPROF004', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() + 4 * 86400000), type: 'in-person', status: 'upcoming', specialty: 'Endocrinology', reason: 'Blood pressure and vitamin D check-in', duration: 30, location: 'City Medical Center', notes: 'Recheck BP after 4 weeks of Lisinopril' },
    { id: 'APT026', patientId: 'PPROF005', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() + 9 * 86400000), type: 'in-person', status: 'upcoming', specialty: 'General Medicine', reason: 'Back pain follow-up', duration: 20, location: 'Rose Hill Medical Clinic', notes: 'Assess recovery from acute low back pain episode' },
    // Completed - past 2 weeks
    { id: 'APT027', patientId: 'PPROF003', doctorId: 'DPROF003', scheduledAt: new Date(now.getTime() - 3 * 86400000), type: 'video', status: 'completed', specialty: 'Cardiology', reason: 'Iron deficiency anemia - cardiac clearance', duration: 20, notes: 'Cardiac evaluation clear. Continue iron supplementation.' },
    { id: 'APT028', patientId: 'PPROF002', doctorId: 'DPROF003', scheduledAt: new Date(now.getTime() - 10 * 86400000), type: 'in-person', status: 'completed', specialty: 'Cardiology', reason: 'Palpitation evaluation', duration: 30, location: 'Cardiac Care Center', notes: 'Holter monitor results reviewed. No significant arrhythmia.' },

    // ── 10 more appointments for richer data ─────────────────────────────────
    // Pending (awaiting provider approval)
    { id: 'APT029', patientId: 'PPROF001', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() + 6 * 86400000), type: 'video', status: 'pending', specialty: 'General Medicine', reason: 'Persistent headaches for 2 weeks', duration: 20, notes: 'Patient reports worsening headaches in afternoon. OTC analgesics not helping.' },
    { id: 'APT030', patientId: 'PPROF003', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() + 8 * 86400000), type: 'in-person', status: 'pending', specialty: 'Endocrinology', reason: 'Suspected hypothyroid symptoms', duration: 30, location: 'City Medical Center' },
    { id: 'APT031', patientId: 'PPROF005', doctorId: 'DPROF003', scheduledAt: new Date(now.getTime() + 12 * 86400000), type: 'video', status: 'pending', specialty: 'Cardiology', reason: 'Post-exercise chest discomfort', duration: 30 },
    // More completed
    { id: 'APT032', patientId: 'PPROF004', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() - 14 * 86400000), type: 'in-person', status: 'completed', specialty: 'General Medicine', reason: 'Recurring stomach pain', duration: 20, location: 'Rose Hill Medical Clinic', notes: 'Gastritis suspected. Prescribed PPI and dietary changes.' },
    { id: 'APT033', patientId: 'PPROF001', doctorId: 'DPROF003', scheduledAt: new Date(now.getTime() - 20 * 86400000), type: 'video', status: 'completed', specialty: 'Cardiology', reason: 'ECG review follow-up', duration: 20, notes: 'ECG within normal limits. Continue current medication.' },
    { id: 'APT034', patientId: 'PPROF002', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() - 25 * 86400000), type: 'in-person', status: 'completed', specialty: 'Endocrinology', reason: 'Diabetes risk assessment', duration: 30, location: 'City Medical Center', notes: 'Fasting glucose borderline. Lifestyle counseling provided.' },
    { id: 'APT035', patientId: 'PPROF005', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() - 17 * 86400000), type: 'video', status: 'completed', specialty: 'General Medicine', reason: 'Chronic fatigue evaluation', duration: 30, notes: 'Iron studies and thyroid panel ordered.' },
    // Cancelled
    { id: 'APT036', patientId: 'PPROF004', doctorId: 'DPROF001', scheduledAt: new Date(now.getTime() - 2 * 86400000), type: 'video', status: 'cancelled', specialty: 'Endocrinology', reason: 'Blood sugar review', duration: 20, notes: 'Patient cancelled - rescheduling for next week.' },
    { id: 'APT037', patientId: 'PPROF003', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() + 1 * 86400000), type: 'in-person', status: 'pending', specialty: 'General Medicine', reason: 'Skin rash evaluation', duration: 20, location: 'Rose Hill Medical Clinic' },
    { id: 'APT038', patientId: 'PPROF001', doctorId: 'DPROF002', scheduledAt: new Date(now.getTime() + 14 * 86400000), type: 'video', status: 'upcoming', specialty: 'General Medicine', reason: 'Quarterly health review', duration: 30, roomId: 'ROOM-DOC002-PAT001' },
  ]

  await prisma.appointment.createMany({ data: appointments, skipDuplicates: true })

  // Nurse bookings
  const nurseBookings = [
    { patientId: 'PPROF001', nurseId: 'NPROF001', scheduledAt: new Date(now.getTime() + 2 * 86400000), duration: 60, type: 'home_visit', status: 'upcoming', notes: 'Blood pressure monitoring and wound dressing' },
    { patientId: 'PPROF003', nurseId: 'NPROF002', scheduledAt: new Date(now.getTime() + 4 * 86400000), duration: 45, type: 'home_visit', status: 'upcoming', notes: 'Post-surgery wound care' },

    // ── 3 additional nurse bookings ──────────────────────────────────────────
    { patientId: 'PPROF002', nurseId: 'NPROF001', scheduledAt: new Date(now.getTime() + 6 * 86400000), duration: 30, type: 'home_visit', status: 'upcoming', notes: 'Asthma management check and peak flow measurement' },
    { patientId: 'PPROF004', nurseId: 'NPROF002', scheduledAt: new Date(now.getTime() - 5 * 86400000), duration: 60, type: 'home_visit', status: 'completed', notes: 'Hypertension home monitoring - BP log reviewed and medication compliance checked' },
    { patientId: 'PPROF005', nurseId: 'NPROF001', scheduledAt: new Date(now.getTime() - 11 * 86400000), duration: 45, type: 'clinic_visit', status: 'completed', notes: 'Post-injury wound assessment and dressing change' },
    // Additional nurse bookings for more data
    { patientId: 'PPROF001', nurseId: 'NPROF002', scheduledAt: new Date(now.getTime() + 9 * 86400000), duration: 60, type: 'home_visit', status: 'pending', notes: 'Weekly insulin injection assistance and glucose monitoring' },
    { patientId: 'PPROF003', nurseId: 'NPROF001', scheduledAt: new Date(now.getTime() - 15 * 86400000), duration: 30, type: 'clinic_visit', status: 'completed', notes: 'Post-surgical check-up - wound healing well' },
    { patientId: 'PPROF002', nurseId: 'NPROF002', scheduledAt: new Date(now.getTime() + 12 * 86400000), duration: 45, type: 'home_visit', status: 'upcoming', notes: 'Nebulizer treatment and respiratory assessment' },
    { patientId: 'PPROF004', nurseId: 'NPROF001', scheduledAt: new Date(now.getTime() + 3 * 86400000), duration: 30, type: 'home_visit', status: 'pending', notes: 'Blood pressure monitoring follow-up' },
  ]
  await prisma.nurseBooking.createMany({ data: nurseBookings, skipDuplicates: true })

  // Childcare bookings
  const childcareBookings = [
    { patientId: 'PPROF001', nannyId: 'NAPROF001', scheduledAt: new Date(now.getTime() + 3 * 86400000), duration: 480, type: 'regular', children: ['Emily Johnson', 'James Johnson'], status: 'upcoming', specialInstructions: 'Emily has peanut allergy' },
    { patientId: 'PPROF003', nannyId: 'NAPROF002', scheduledAt: new Date(now.getTime() + 6 * 86400000), duration: 360, type: 'regular', children: ['Sara Khan'], status: 'upcoming' },

    // ── 3 additional childcare bookings ─────────────────────────────────────
    { patientId: 'PPROF002', nannyId: 'NAPROF001', scheduledAt: new Date(now.getTime() + 8 * 86400000), duration: 300, type: 'regular', children: ['Lucas Pierre'], status: 'upcoming', specialInstructions: 'Lucas is lactose intolerant. Check snack labels.' },
    { patientId: 'PPROF004', nannyId: 'NAPROF002', scheduledAt: new Date(now.getTime() - 4 * 86400000), duration: 480, type: 'regular', children: ['Ananya Doorgakant', 'Rishi Doorgakant'], status: 'completed', specialInstructions: 'After-school pickup at 15:30 from Floreal Primary School' },
    { patientId: 'PPROF005', nannyId: 'NAPROF001', scheduledAt: new Date(now.getTime() - 9 * 86400000), duration: 240, type: 'emergency', children: ['Mia Soobramanien'], status: 'completed', specialInstructions: 'Emergency booking - parent hospitalised. Child needs dinner and bedtime routine.' },
  ]
  await prisma.childcareBooking.createMany({ data: childcareBookings, skipDuplicates: true })

  console.log(`  Seeded ${appointments.length} appointments, ${nurseBookings.length} nurse bookings, ${childcareBookings.length} childcare bookings`)
}

// Separate function for bookings that depend on user types seeded later (lab techs, emergency workers)
export async function seedExtendedBookings(prisma: PrismaClient) {
  const now = new Date()

  // ── Lab test bookings ────────────────────────────────────────────────────
  const labTestBookings = [
    { patientId: 'PPROF001', labTechId: 'LTPROF001', testName: 'HbA1c + Fasting Glucose Panel', scheduledAt: new Date(now.getTime() + 3 * 86400000), status: 'upcoming', sampleType: 'blood', notes: 'Fasting required for 8 hours prior', price: 850 },
    { patientId: 'PPROF002', labTechId: 'LTPROF002', testName: 'Full Blood Count + Allergy Panel', scheduledAt: new Date(now.getTime() + 5 * 86400000), status: 'upcoming', sampleType: 'blood', notes: 'Include IgE for dust mite and pollen allergens', price: 1200 },
    { patientId: 'PPROF004', labTechId: 'LTPROF001', testName: 'Lipid Panel + Vitamin D', scheduledAt: new Date(now.getTime() - 6 * 86400000), status: 'completed', sampleType: 'blood', notes: 'Follow-up cholesterol and vitamin D monitoring', price: 950 },
    { patientId: 'PPROF003', labTechId: 'LTPROF002', testName: 'Thyroid Function + Iron Studies', scheduledAt: new Date(now.getTime() - 12 * 86400000), status: 'completed', sampleType: 'blood', notes: 'Thyroid recheck and iron deficiency anemia follow-up', price: 1100 },
  ]
  await prisma.labTestBooking.createMany({ data: labTestBookings, skipDuplicates: true })

  // ── Emergency bookings ───────────────────────────────────────────────────
  const emergencyBookings = [
    { patientId: 'PPROF001', responderId: 'EWPROF001', emergencyType: 'Hypoglycaemic episode', location: 'Rose Hill, Mauritius', contactNumber: '+230 5789 1234', status: 'resolved', notes: 'Patient found unconscious. Glucose IV administered on-site. Recovered fully.', priority: 'critical' },
    { patientId: 'PPROF004', responderId: 'EWPROF002', emergencyType: 'Hypertensive crisis', location: 'Vacoas, Mauritius', contactNumber: '+230 5012 4567', status: 'resolved', notes: 'BP 190/115 at scene. Emergency antihypertensives given. Transported to hospital.', priority: 'high' },
    { patientId: 'PPROF005', responderId: 'EWPROF001', emergencyType: 'Severe back pain with neurological symptoms', location: 'Moka, Mauritius', contactNumber: '+230 5123 5678', status: 'resolved', notes: 'Acute lower back pain radiating down left leg. Sciatica suspected. Pain management administered.', priority: 'medium' },
    { patientId: 'PPROF002', responderId: null, emergencyType: 'Acute asthma attack', location: 'Curepipe, Mauritius', contactNumber: '+230 5890 2345', status: 'dispatched', notes: 'Patient reporting significant breathlessness. Salbutamol inhaler not controlling symptoms.', priority: 'high' },
  ]
  await prisma.emergencyBooking.createMany({ data: emergencyBookings, skipDuplicates: true })

  console.log(`  Seeded ${labTestBookings.length} lab test bookings, ${emergencyBookings.length} emergency bookings`)
}
