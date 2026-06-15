import { PrismaClient } from '@prisma/client'

export async function seedConnections(prisma: PrismaClient) {
  // ─── 1. UserConnection records ─────────────────────────────────────────────
  // Uses User IDs (not profile IDs): PAT001-005, DOC001-003, NUR001-002,
  // NAN001-002, PHARM001-002, LAB001-002, EMW001-002, INS001-002, CORP001

  const connections = [
    // ── Accepted connections ──────────────────────────────────────────────────
    { senderId: 'PAT001', receiverId: 'DOC001', status: 'accepted' },  // Emma → Dr. Johnson
    { senderId: 'PAT002', receiverId: 'NUR001', status: 'accepted' },  // Jean → Nurse Ramgoolam
    { senderId: 'PAT003', receiverId: 'NAN001', status: 'accepted' },  // Aisha → Nanny Beeharry
    { senderId: 'DOC001', receiverId: 'PHARM001', status: 'accepted' }, // Dr. Johnson → Pharmacist Doorgakant
    // Additional accepted
    { senderId: 'PAT004', receiverId: 'DOC003', status: 'accepted' },  // Vikash → Dr. Dupont
    { senderId: 'PAT005', receiverId: 'DOC002', status: 'accepted' },  // Nadia → Dr. Patel
    { senderId: 'NUR001', receiverId: 'DOC001', status: 'accepted' },  // Nurse Ramgoolam → Dr. Johnson (care coordination)
    { senderId: 'PAT001', receiverId: 'NUR001', status: 'accepted' },  // Emma → Nurse Ramgoolam

    // ── Pending connections ───────────────────────────────────────────────────
    { senderId: 'PAT002', receiverId: 'DOC003', status: 'pending' },   // Jean → Dr. Dupont (requesting cardiology)
    { senderId: 'PAT003', receiverId: 'PHARM001', status: 'pending' }, // Aisha → Pharmacist (medication query)
    { senderId: 'PAT005', receiverId: 'NAN002', status: 'pending' },   // Nadia → Nanny Morel
    { senderId: 'DOC002', receiverId: 'LAB001', status: 'pending' },   // Dr. Patel → Lab Tech Ah-Kee
    // Additional pending
    { senderId: 'PAT004', receiverId: 'NUR002', status: 'pending' },   // Vikash → Nurse Laurent
    { senderId: 'PAT001', receiverId: 'LAB001', status: 'pending' },   // Emma → Lab Tech Ah-Kee
    { senderId: 'CORP001', receiverId: 'DOC001', status: 'pending' },  // Corporate → Dr. Johnson (corporate health)
    { senderId: 'PAT003', receiverId: 'DOC002', status: 'pending' },   // Aisha → Dr. Patel

    // ── Rejected / declined connections ──────────────────────────────────────
    { senderId: 'PAT002', receiverId: 'EMW001', status: 'rejected' },  // Jean → EMW Lafleur (declined)
    { senderId: 'PAT005', receiverId: 'INS001', status: 'rejected' },  // Nadia → Insurance rep (not interested)
  ]

  await prisma.userConnection.createMany({ data: connections, skipDuplicates: true })

  // ─── 2. InsuranceClaim records ──────────────────────────────────────────────
  // insuranceRepId references InsuranceRepProfile IDs: IRPROF001, IRPROF002
  // patientId references PatientProfile IDs: PPROF001-005

  const insuranceClaims = [
    // ── IRPROF001 (Swan Life Ltd) claims ────────────────────────────────────
    {
      insuranceRepId: 'IRPROF001',
      patientId: 'PPROF001',
      planId: 'INSPLAN001',
      policyHolderName: 'Emma Johnson',
      description: 'Hospitalization claim for diabetic ketoacidosis episode - 3-day inpatient stay at City Medical Center',
      policyType: 'Health',
      claimAmount: 45000,
      status: 'approved',
      submittedDate: new Date('2025-01-05'),
      resolvedDate: new Date('2025-01-18'),
    },
    {
      insuranceRepId: 'IRPROF001',
      patientId: 'PPROF001',
      planId: 'INSPLAN001',
      policyHolderName: 'Emma Johnson',
      description: 'Outpatient specialist consultation - endocrinology follow-up x 4 visits',
      policyType: 'Health',
      claimAmount: 6000,
      status: 'approved',
      submittedDate: new Date('2025-01-10'),
      resolvedDate: new Date('2025-01-20'),
    },
    {
      insuranceRepId: 'IRPROF001',
      patientId: 'PPROF004',
      planId: 'INSPLAN001',
      policyHolderName: 'Vikash Doorgakant',
      description: 'Emergency ambulance call and hypertensive crisis treatment - paramedic intervention at home',
      policyType: 'Health',
      claimAmount: 12000,
      status: 'pending',
      submittedDate: new Date('2025-01-28'),
    },
    {
      insuranceRepId: 'IRPROF001',
      patientId: 'PPROF002',
      planId: 'INSPLAN001',
      policyHolderName: 'Jean Pierre',
      description: 'Prescription drug claim - 6-month supply of asthma inhalers and antihistamines',
      policyType: 'Health',
      claimAmount: 8500,
      status: 'rejected',
      submittedDate: new Date('2024-12-20'),
      resolvedDate: new Date('2025-01-08'),
    },

    // ── IRPROF002 (MUA Insurance) claims ────────────────────────────────────
    {
      insuranceRepId: 'IRPROF002',
      patientId: 'PPROF003',
      planId: 'INSPLAN005',
      policyHolderName: 'Aisha Khan',
      description: 'Lab test claim - thyroid panel, iron studies, and full blood count',
      policyType: 'Health',
      claimAmount: 3200,
      status: 'approved',
      submittedDate: new Date('2025-01-15'),
      resolvedDate: new Date('2025-01-22'),
    },
    {
      insuranceRepId: 'IRPROF002',
      patientId: 'PPROF005',
      planId: 'INSPLAN005',
      policyHolderName: 'Nadia Soobramanien',
      description: 'Annual wellness exam and preventive screening package',
      policyType: 'Health',
      claimAmount: 4800,
      status: 'pending',
      submittedDate: new Date('2025-02-01'),
    },
    {
      insuranceRepId: 'IRPROF002',
      patientId: 'PPROF004',
      planId: 'INSPLAN005',
      policyHolderName: 'Vikash Doorgakant',
      description: 'Cardiology specialist consultation and lipid panel - cholesterol management program',
      policyType: 'Health',
      claimAmount: 9500,
      status: 'pending',
      submittedDate: new Date('2025-02-05'),
    },
    {
      insuranceRepId: 'IRPROF002',
      patientId: 'PPROF001',
      planId: 'INSPLAN006',
      policyHolderName: 'Emma Johnson',
      description: 'Vision care claim - annual eye exam and prescription glasses',
      policyType: 'Vision',
      claimAmount: 5200,
      status: 'pending',
      submittedDate: new Date('2025-02-10'),
    },
  ]

  await prisma.insuranceClaim.createMany({ data: insuranceClaims, skipDuplicates: true })

  console.log(`  Seeded ${connections.length} user connections, ${insuranceClaims.length} insurance claims`)
}
