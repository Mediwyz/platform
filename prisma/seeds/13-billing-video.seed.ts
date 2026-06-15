import { PrismaClient } from '@prisma/client'

export async function seedBillingAndVideo(prisma: PrismaClient) {
  // ─── 1. Additional Billing Info (BIL004–BIL011) ─────────────────────────────

  const billingRecords = [
    { id: 'BIL004', userId: 'PAT002', type: 'mcb_juice',    lastFour: '4567', cardHolder: 'Priya Doorgakant',       expiryDate: '03/27', isDefault: true  },
    { id: 'BIL005', userId: 'PAT003', type: 'credit_card',  lastFour: '8901', cardHolder: 'Aisha Khan (Visa)',      expiryDate: '11/26', isDefault: true  },
    { id: 'BIL006', userId: 'PAT004', type: 'mcb_juice',    lastFour: '2345', cardHolder: 'Vikash Doorgakant',      expiryDate: '08/27', isDefault: true  },
    { id: 'BIL007', userId: 'DOC001', type: 'credit_card',  lastFour: '6789', cardHolder: 'Dr. Sarah Johnson (Business)', expiryDate: '05/27', isDefault: true  },
    { id: 'BIL008', userId: 'DOC002', type: 'mcb_juice',    lastFour: '3456', cardHolder: 'Dr. Rajesh Patel',       expiryDate: '01/28', isDefault: true  },
    { id: 'BIL009', userId: 'NUR001', type: 'credit_card',  lastFour: '7890', cardHolder: 'Marie Claire Dupont',    expiryDate: '09/27', isDefault: true  },
    { id: 'BIL010', userId: 'PHARM001', type: 'credit_card', lastFour: '1234', cardHolder: 'Yusuf Doorgakant',      expiryDate: '06/26', isDefault: true  },
    { id: 'BIL011', userId: 'CORP001', type: 'credit_card', lastFour: '5678', cardHolder: 'HealthCorp Ltd (Corporate)', expiryDate: '12/27', isDefault: true  },
  ]
  await prisma.billingInfo.createMany({ data: billingRecords, skipDuplicates: true })

  // ─── 2. Past Video Rooms (VR006–VR015) ───────────────────────────────────────

  const videoRooms = [
    { id: 'VR006',  roomCode: 'ROOM-NUR001-PAT001',   name: 'Nurse Dupont - Emma Johnson (Home Visit Consult)',  creatorId: 'NUR001',   status: 'ended' },
    { id: 'VR007',  roomCode: 'ROOM-DOC002-PAT002-FU', name: 'Dr. Patel - Priya Doorgakant (Dermatology Follow-up)', creatorId: 'DOC002', status: 'ended' },
    { id: 'VR008',  roomCode: 'ROOM-NAN001-PAT003',   name: 'Nanny Laval - Aisha Khan (Childcare Check-in)',     creatorId: 'NAN001',   status: 'ended' },
    { id: 'VR009',  roomCode: 'ROOM-DOC001-PAT001-DM', name: 'Dr. Johnson - Emma Johnson (Diabetes Review)',      creatorId: 'DOC001',   status: 'ended' },
    { id: 'VR010',  roomCode: 'ROOM-DOC003-PAT004-CD', name: 'Dr. Dupont - Vikash Doorgakant (Cardiology)',       creatorId: 'DOC003',   status: 'ended' },
    { id: 'VR011',  roomCode: 'ROOM-NUR002-PAT005',   name: 'Nurse Ramsamy - Nadia Soobramanien (Wound Care)',    creatorId: 'NUR002',   status: 'ended' },
    { id: 'VR012',  roomCode: 'ROOM-PHARM001-PAT002',  name: 'Pharmacist Doorgakant - Priya (Medication Consult)', creatorId: 'PHARM001', status: 'ended' },
    { id: 'VR013',  roomCode: 'ROOM-DOC001-NUR001',   name: 'Dr. Johnson - Nurse Dupont (Care Coordination)',     creatorId: 'DOC001',   status: 'ended' },
    { id: 'VR014',  roomCode: 'ROOM-DOC002-PAT003-PD', name: 'Dr. Patel - Aisha Khan (Pediatric Checkup)',        creatorId: 'DOC002',   status: 'ended' },
    { id: 'VR015',  roomCode: 'ROOM-EMW001-PAT001',   name: 'EMW Beegun - Emma Johnson (Emergency Follow-up)',    creatorId: 'EMW001',   status: 'ended' },
  ]

  for (const room of videoRooms) {
    await prisma.videoRoom.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    })
  }

  // Video room participants (2 per room)
  const participants = [
    // VR006: NUR001 + PAT001
    { roomId: 'VR006', userId: 'NUR001', role: 'host' },
    { roomId: 'VR006', userId: 'PAT001', role: 'participant' },
    // VR007: DOC002 + PAT002
    { roomId: 'VR007', userId: 'DOC002', role: 'host' },
    { roomId: 'VR007', userId: 'PAT002', role: 'participant' },
    // VR008: NAN001 + PAT003
    { roomId: 'VR008', userId: 'NAN001', role: 'host' },
    { roomId: 'VR008', userId: 'PAT003', role: 'participant' },
    // VR009: DOC001 + PAT001
    { roomId: 'VR009', userId: 'DOC001', role: 'host' },
    { roomId: 'VR009', userId: 'PAT001', role: 'participant' },
    // VR010: DOC003 + PAT004
    { roomId: 'VR010', userId: 'DOC003', role: 'host' },
    { roomId: 'VR010', userId: 'PAT004', role: 'participant' },
    // VR011: NUR002 + PAT005
    { roomId: 'VR011', userId: 'NUR002', role: 'host' },
    { roomId: 'VR011', userId: 'PAT005', role: 'participant' },
    // VR012: PHARM001 + PAT002
    { roomId: 'VR012', userId: 'PHARM001', role: 'host' },
    { roomId: 'VR012', userId: 'PAT002', role: 'participant' },
    // VR013: DOC001 + NUR001
    { roomId: 'VR013', userId: 'DOC001', role: 'host' },
    { roomId: 'VR013', userId: 'NUR001', role: 'participant' },
    // VR014: DOC002 + PAT003
    { roomId: 'VR014', userId: 'DOC002', role: 'host' },
    { roomId: 'VR014', userId: 'PAT003', role: 'participant' },
    // VR015: EMW001 + PAT001
    { roomId: 'VR015', userId: 'EMW001', role: 'host' },
    { roomId: 'VR015', userId: 'PAT001', role: 'participant' },
  ]
  await prisma.videoRoomParticipant.createMany({ data: participants, skipDuplicates: true })

  // Video call sessions (2 per room - one per participant)
  const sessions = [
    // VR006: PAT001 + NUR001 - nurse home visit consultation, 25 min, good
    { roomId: 'VR006', userId: 'PAT001', startedAt: new Date('2024-11-18T09:00:00'), endedAt: new Date('2024-11-18T09:25:00'), duration: 25, callQuality: 'good', status: 'ended', notes: 'Nurse home visit consultation. Discussed wound dressing changes.' },
    { roomId: 'VR006', userId: 'NUR001', startedAt: new Date('2024-11-18T09:00:00'), endedAt: new Date('2024-11-18T09:25:00'), duration: 25, callQuality: 'good', status: 'ended', notes: 'Nurse home visit consultation. Discussed wound dressing changes.' },

    // VR007: PAT002 + DOC002 - follow-up dermatology, 18 min, excellent
    { roomId: 'VR007', userId: 'PAT002', startedAt: new Date('2024-11-22T14:30:00'), endedAt: new Date('2024-11-22T14:48:00'), duration: 18, callQuality: 'excellent', status: 'ended', notes: 'Dermatology follow-up. Skin condition improving with prescribed cream.' },
    { roomId: 'VR007', userId: 'DOC002', startedAt: new Date('2024-11-22T14:30:00'), endedAt: new Date('2024-11-22T14:48:00'), duration: 18, callQuality: 'excellent', status: 'ended', notes: 'Dermatology follow-up. Skin condition improving with prescribed cream.' },

    // VR008: PAT003 + NAN001 - childcare check-in, 12 min, good
    { roomId: 'VR008', userId: 'PAT003', startedAt: new Date('2024-11-25T10:00:00'), endedAt: new Date('2024-11-25T10:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Childcare check-in. Child adapting well. No concerns.' },
    { roomId: 'VR008', userId: 'NAN001', startedAt: new Date('2024-11-25T10:00:00'), endedAt: new Date('2024-11-25T10:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Childcare check-in. Child adapting well. No concerns.' },

    // VR009: PAT001 + DOC001 - diabetes review, 30 min, excellent
    { roomId: 'VR009', userId: 'PAT001', startedAt: new Date('2024-12-02T11:00:00'), endedAt: new Date('2024-12-02T11:30:00'), duration: 30, callQuality: 'excellent', status: 'ended', notes: 'Diabetes review. HbA1c stable. Medication unchanged.' },
    { roomId: 'VR009', userId: 'DOC001', startedAt: new Date('2024-12-02T11:00:00'), endedAt: new Date('2024-12-02T11:30:00'), duration: 30, callQuality: 'excellent', status: 'ended', notes: 'Diabetes review. HbA1c stable. Medication unchanged.' },

    // VR010: PAT004 + DOC003 - cardiology, 22 min, good
    { roomId: 'VR010', userId: 'PAT004', startedAt: new Date('2024-12-05T15:00:00'), endedAt: new Date('2024-12-05T15:22:00'), duration: 22, callQuality: 'good', status: 'ended', notes: 'Cardiology consultation. Blood pressure under control. Continue current meds.' },
    { roomId: 'VR010', userId: 'DOC003', startedAt: new Date('2024-12-05T15:00:00'), endedAt: new Date('2024-12-05T15:22:00'), duration: 22, callQuality: 'good', status: 'ended', notes: 'Cardiology consultation. Blood pressure under control. Continue current meds.' },

    // VR011: PAT005 + NUR002 - wound care follow-up, 15 min, fair
    { roomId: 'VR011', userId: 'PAT005', startedAt: new Date('2024-12-08T08:30:00'), endedAt: new Date('2024-12-08T08:45:00'), duration: 15, callQuality: 'fair', status: 'ended', notes: 'Wound care follow-up. Healing progressing but slower than expected.' },
    { roomId: 'VR011', userId: 'NUR002', startedAt: new Date('2024-12-08T08:30:00'), endedAt: new Date('2024-12-08T08:45:00'), duration: 15, callQuality: 'fair', status: 'ended', notes: 'Wound care follow-up. Healing progressing but slower than expected.' },

    // VR012: PAT002 + PHARM001 - medication consultation, 10 min, good
    { roomId: 'VR012', userId: 'PAT002', startedAt: new Date('2024-12-10T16:00:00'), endedAt: new Date('2024-12-10T16:10:00'), duration: 10, callQuality: 'good', status: 'ended', notes: 'Medication consultation. Reviewed potential drug interactions.' },
    { roomId: 'VR012', userId: 'PHARM001', startedAt: new Date('2024-12-10T16:00:00'), endedAt: new Date('2024-12-10T16:10:00'), duration: 10, callQuality: 'good', status: 'ended', notes: 'Medication consultation. Reviewed potential drug interactions.' },

    // VR013: DOC001 + NUR001 - care coordination, 20 min, excellent
    { roomId: 'VR013', userId: 'DOC001', startedAt: new Date('2024-12-12T13:00:00'), endedAt: new Date('2024-12-12T13:20:00'), duration: 20, callQuality: 'excellent', status: 'ended', notes: 'Care coordination for shared patients. Updated treatment plans.' },
    { roomId: 'VR013', userId: 'NUR001', startedAt: new Date('2024-12-12T13:00:00'), endedAt: new Date('2024-12-12T13:20:00'), duration: 20, callQuality: 'excellent', status: 'ended', notes: 'Care coordination for shared patients. Updated treatment plans.' },

    // VR014: PAT003 + DOC002 - pediatric checkup, failed
    { roomId: 'VR014', userId: 'PAT003', startedAt: new Date('2024-12-15T10:00:00'), endedAt: null, duration: null, callQuality: null, status: 'failed', notes: 'Connection failed. Patient could not establish video link.' },
    { roomId: 'VR014', userId: 'DOC002', startedAt: new Date('2024-12-15T10:00:00'), endedAt: null, duration: null, callQuality: null, status: 'failed', notes: 'Connection failed. Patient could not establish video link.' },

    // VR015: PAT001 + EMW001 - emergency follow-up, 8 min, good
    { roomId: 'VR015', userId: 'PAT001', startedAt: new Date('2024-12-18T17:00:00'), endedAt: new Date('2024-12-18T17:08:00'), duration: 8, callQuality: 'good', status: 'ended', notes: 'Emergency follow-up. Patient stable after ER visit.' },
    { roomId: 'VR015', userId: 'EMW001', startedAt: new Date('2024-12-18T17:00:00'), endedAt: new Date('2024-12-18T17:08:00'), duration: 8, callQuality: 'good', status: 'ended', notes: 'Emergency follow-up. Patient stable after ER visit.' },
  ]
  await prisma.videoCallSession.createMany({ data: sessions, skipDuplicates: true })

  // ─── 3. Notifications (NOTIF005–NOTIF024) ────────────────────────────────────

  const notifications = [
    // Appointment notifications
    { id: 'NOTIF005', userId: 'PAT001', type: 'appointment', title: 'Upcoming Appointment', message: 'You have a video consultation with Dr. Johnson on Dec 2 at 11:00 AM.', readAt: new Date('2024-12-01T18:00:00'), createdAt: new Date('2024-11-30T09:00:00') },
    { id: 'NOTIF006', userId: 'PAT002', type: 'appointment', title: 'Upcoming Appointment', message: 'Your dermatology follow-up with Dr. Patel is scheduled for Nov 22 at 2:30 PM.', readAt: new Date('2024-11-21T20:00:00'), createdAt: new Date('2024-11-20T10:00:00') },
    { id: 'NOTIF007', userId: 'PAT004', type: 'appointment', title: 'Appointment Cancelled', message: 'Your appointment with Dr. Dupont on Dec 20 has been cancelled. Please reschedule.', readAt: null, createdAt: new Date('2024-12-18T14:00:00') },
    { id: 'NOTIF008', userId: 'DOC001', type: 'appointment', title: 'New Appointment', message: 'Vikash Doorgakant has booked a cardiology consultation for Dec 5.', readAt: new Date('2024-12-04T08:00:00'), createdAt: new Date('2024-12-03T16:00:00') },

    // Prescription notifications
    { id: 'NOTIF009', userId: 'PAT001', type: 'prescription', title: 'Prescription Ready', message: 'Your Metformin prescription is ready for pickup at HealthPharm Rose Hill.', readAt: new Date('2024-11-16T10:30:00'), createdAt: new Date('2024-11-16T08:00:00') },
    { id: 'NOTIF010', userId: 'PAT004', type: 'prescription', title: 'Refill Reminder', message: 'Your Atorvastatin prescription is due for refill in 5 days.', readAt: null, createdAt: new Date('2024-12-28T09:00:00') },
    { id: 'NOTIF011', userId: 'PAT005', type: 'prescription', title: 'Prescription Ready', message: 'Your wound care supplies prescription is ready for pickup.', readAt: new Date('2024-12-09T11:00:00'), createdAt: new Date('2024-12-09T07:30:00') },
    { id: 'NOTIF012', userId: 'PHARM001', type: 'prescription', title: 'New Prescription to Dispense', message: 'A new prescription for Emma Johnson (Metformin 500mg) is pending.', readAt: new Date('2024-11-16T08:15:00'), createdAt: new Date('2024-11-15T17:00:00') },

    // Lab result notifications
    { id: 'NOTIF013', userId: 'PAT001', type: 'lab_result', title: 'Lab Results Available', message: 'Your HbA1c and fasting glucose results are now available. View in your dashboard.', readAt: new Date('2024-11-17T09:00:00'), createdAt: new Date('2024-11-17T07:00:00') },
    { id: 'NOTIF014', userId: 'PAT004', type: 'lab_result', title: 'Lab Results Available', message: 'Your lipid panel results are ready. Please review with your doctor.', readAt: null, createdAt: new Date('2024-12-07T08:00:00') },
    { id: 'NOTIF015', userId: 'DOC003', type: 'lab_result', title: 'Patient Lab Results', message: 'Lab results for Vikash Doorgakant (lipid panel) are now available for review.', readAt: new Date('2024-12-07T09:30:00'), createdAt: new Date('2024-12-07T08:05:00') },

    // Message notifications
    { id: 'NOTIF016', userId: 'PAT001', type: 'message', title: 'New Message from Dr. Johnson', message: 'Dr. Johnson sent you a message regarding your diabetes management plan.', readAt: new Date('2024-12-03T10:00:00'), createdAt: new Date('2024-12-02T15:00:00') },
    { id: 'NOTIF017', userId: 'PAT003', type: 'message', title: 'New Message from Nanny Laval', message: 'Your nanny sent an update about your child\'s activities today.', readAt: null, createdAt: new Date('2024-11-25T16:00:00') },
    { id: 'NOTIF018', userId: 'NUR001', type: 'message', title: 'New Message from Dr. Johnson', message: 'Dr. Johnson shared updated care instructions for patient Emma Johnson.', readAt: new Date('2024-12-13T08:00:00'), createdAt: new Date('2024-12-12T14:00:00') },
    { id: 'NOTIF019', userId: 'PAT002', type: 'message', title: 'New Message from Pharmacist', message: 'Your pharmacist has a question about your current medication list.', readAt: null, createdAt: new Date('2024-12-11T11:00:00') },

    // System notifications
    { id: 'NOTIF020', userId: 'DOC002', type: 'system', title: 'Profile Verification Complete', message: 'Your professional profile has been verified successfully. All features are now enabled.', readAt: new Date('2024-11-05T10:00:00'), createdAt: new Date('2024-11-05T08:00:00') },
    { id: 'NOTIF021', userId: 'NUR002', type: 'system', title: 'Profile Verification Complete', message: 'Your nursing credentials have been verified. You can now accept bookings.', readAt: new Date('2024-11-10T09:00:00'), createdAt: new Date('2024-11-10T07:00:00') },
    { id: 'NOTIF022', userId: 'PAT001', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Dec 22 from 2:00 AM to 4:00 AM. Services may be unavailable.', readAt: null, createdAt: new Date('2024-12-20T12:00:00') },
    { id: 'NOTIF023', userId: 'PAT005', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Dec 22 from 2:00 AM to 4:00 AM. Services may be unavailable.', readAt: null, createdAt: new Date('2024-12-20T12:00:00') },
    { id: 'NOTIF024', userId: 'PHARM001', type: 'system', title: 'System Maintenance', message: 'Scheduled maintenance on Dec 22 from 2:00 AM to 4:00 AM. Services may be unavailable.', readAt: null, createdAt: new Date('2024-12-20T12:00:00') },
  ]
  await prisma.notification.createMany({ data: notifications, skipDuplicates: true })

  // ─── 4. Additional Video Rooms (VR016–VR023) - mixed provider pairings ──────

  const extraVideoRooms = [
    { id: 'VR016', roomCode: 'ROOM-NUR001-PAT002', name: 'Nurse Ramgoolam - Jean Pierre (Asthma Home Visit)', creatorId: 'NUR001', status: 'ended' },
    { id: 'VR017', roomCode: 'ROOM-NAN001-PAT004', name: 'Nanny Beeharry - Vikash Doorgakant (Childcare Consult)', creatorId: 'NAN001', status: 'ended' },
    { id: 'VR018', roomCode: 'ROOM-LAB001-PAT001', name: 'Lab Tech Ah-Kee - Emma Johnson (Test Instructions)', creatorId: 'LAB001', status: 'ended' },
    { id: 'VR019', roomCode: 'ROOM-NUR002-PAT004', name: 'Nurse Laurent - Vikash Doorgakant (Hypertension Monitoring)', creatorId: 'NUR002', status: 'ended' },
    { id: 'VR020', roomCode: 'ROOM-NAN002-PAT003', name: 'Nanny Morel - Aisha Khan (Childcare Review)', creatorId: 'NAN002', status: 'ended' },
    { id: 'VR021', roomCode: 'ROOM-EMW001-PAT004', name: 'EMW Lafleur - Vikash Doorgakant (Emergency Follow-up)', creatorId: 'EMW001', status: 'ended' },
    { id: 'VR022', roomCode: 'ROOM-DOC002-PAT005', name: 'Dr. Patel - Nadia Soobramanien (Back Pain Consult)', creatorId: 'DOC002', status: 'active' },
    { id: 'VR023', roomCode: 'ROOM-PHARM002-PAT003', name: 'Pharmacist Doobur - Aisha Khan (Hypothyroid Medication Query)', creatorId: 'PHARM002', status: 'active' },
  ]

  for (const room of extraVideoRooms) {
    await prisma.videoRoom.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    })
  }

  const extraParticipants = [
    // VR016: NUR001 + PAT002
    { roomId: 'VR016', userId: 'NUR001', role: 'host' },
    { roomId: 'VR016', userId: 'PAT002', role: 'participant' },
    // VR017: NAN001 + PAT004
    { roomId: 'VR017', userId: 'NAN001', role: 'host' },
    { roomId: 'VR017', userId: 'PAT004', role: 'participant' },
    // VR018: LAB001 + PAT001
    { roomId: 'VR018', userId: 'LAB001', role: 'host' },
    { roomId: 'VR018', userId: 'PAT001', role: 'participant' },
    // VR019: NUR002 + PAT004
    { roomId: 'VR019', userId: 'NUR002', role: 'host' },
    { roomId: 'VR019', userId: 'PAT004', role: 'participant' },
    // VR020: NAN002 + PAT003
    { roomId: 'VR020', userId: 'NAN002', role: 'host' },
    { roomId: 'VR020', userId: 'PAT003', role: 'participant' },
    // VR021: EMW001 + PAT004
    { roomId: 'VR021', userId: 'EMW001', role: 'host' },
    { roomId: 'VR021', userId: 'PAT004', role: 'participant' },
    // VR022: DOC002 + PAT005 (active)
    { roomId: 'VR022', userId: 'DOC002', role: 'host' },
    { roomId: 'VR022', userId: 'PAT005', role: 'participant' },
    // VR023: PHARM002 + PAT003 (active)
    { roomId: 'VR023', userId: 'PHARM002', role: 'host' },
    { roomId: 'VR023', userId: 'PAT003', role: 'participant' },
  ]
  await prisma.videoRoomParticipant.createMany({ data: extraParticipants, skipDuplicates: true })

  const extraSessions = [
    // VR016: PAT002 + NUR001 - asthma home visit, 20 min, good
    { roomId: 'VR016', userId: 'PAT002', startedAt: new Date('2025-01-05T10:00:00'), endedAt: new Date('2025-01-05T10:20:00'), duration: 20, callQuality: 'good', status: 'ended', notes: 'Nurse reviewed asthma action plan. Peak flow readings acceptable.' },
    { roomId: 'VR016', userId: 'NUR001', startedAt: new Date('2025-01-05T10:00:00'), endedAt: new Date('2025-01-05T10:20:00'), duration: 20, callQuality: 'good', status: 'ended', notes: 'Nurse reviewed asthma action plan. Peak flow readings acceptable.' },
    // VR017: PAT004 + NAN001 - childcare consult, 15 min, excellent
    { roomId: 'VR017', userId: 'PAT004', startedAt: new Date('2025-01-08T14:00:00'), endedAt: new Date('2025-01-08T14:15:00'), duration: 15, callQuality: 'excellent', status: 'ended', notes: 'Childcare routine discussion. Children settling well with nanny.' },
    { roomId: 'VR017', userId: 'NAN001', startedAt: new Date('2025-01-08T14:00:00'), endedAt: new Date('2025-01-08T14:15:00'), duration: 15, callQuality: 'excellent', status: 'ended', notes: 'Childcare routine discussion. Children settling well with nanny.' },
    // VR018: PAT001 + LAB001 - pre-test instructions, 10 min, good
    { roomId: 'VR018', userId: 'PAT001', startedAt: new Date('2025-01-10T08:00:00'), endedAt: new Date('2025-01-10T08:10:00'), duration: 10, callQuality: 'good', status: 'ended', notes: 'Fasting instructions confirmed. Appointment details reviewed with patient.' },
    { roomId: 'VR018', userId: 'LAB001', startedAt: new Date('2025-01-10T08:00:00'), endedAt: new Date('2025-01-10T08:10:00'), duration: 10, callQuality: 'good', status: 'ended', notes: 'Fasting instructions confirmed. Appointment details reviewed with patient.' },
    // VR019: PAT004 + NUR002 - hypertension monitoring, 25 min, excellent
    { roomId: 'VR019', userId: 'PAT004', startedAt: new Date('2025-01-12T09:30:00'), endedAt: new Date('2025-01-12T09:55:00'), duration: 25, callQuality: 'excellent', status: 'ended', notes: 'BP log reviewed. Readings improving on Lisinopril. Continue current dose.' },
    { roomId: 'VR019', userId: 'NUR002', startedAt: new Date('2025-01-12T09:30:00'), endedAt: new Date('2025-01-12T09:55:00'), duration: 25, callQuality: 'excellent', status: 'ended', notes: 'BP log reviewed. Readings improving on Lisinopril. Continue current dose.' },
    // VR020: PAT003 + NAN002 - childcare review, 18 min, fair
    { roomId: 'VR020', userId: 'PAT003', startedAt: new Date('2025-01-15T11:00:00'), endedAt: new Date('2025-01-15T11:18:00'), duration: 18, callQuality: 'fair', status: 'ended', notes: 'Routine check-in. Minor audio issues but call completed successfully.' },
    { roomId: 'VR020', userId: 'NAN002', startedAt: new Date('2025-01-15T11:00:00'), endedAt: new Date('2025-01-15T11:18:00'), duration: 18, callQuality: 'fair', status: 'ended', notes: 'Routine check-in. Minor audio issues but call completed successfully.' },
    // VR021: PAT004 + EMW001 - emergency follow-up, 12 min, good
    { roomId: 'VR021', userId: 'PAT004', startedAt: new Date('2025-01-18T16:00:00'), endedAt: new Date('2025-01-18T16:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Post-hypertensive crisis follow-up. Patient stable. Referred to GP for ongoing management.' },
    { roomId: 'VR021', userId: 'EMW001', startedAt: new Date('2025-01-18T16:00:00'), endedAt: new Date('2025-01-18T16:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Post-hypertensive crisis follow-up. Patient stable. Referred to GP for ongoing management.' },
    // VR022: PAT005 + DOC002 - active session (no end time)
    { roomId: 'VR022', userId: 'PAT005', startedAt: new Date(Date.now() - 600000), endedAt: null, duration: null, callQuality: null, status: 'active', notes: 'Back pain consultation in progress.' },
    { roomId: 'VR022', userId: 'DOC002', startedAt: new Date(Date.now() - 600000), endedAt: null, duration: null, callQuality: null, status: 'active', notes: 'Back pain consultation in progress.' },
    // VR023: PAT003 + PHARM002 - active session (no end time)
    { roomId: 'VR023', userId: 'PAT003', startedAt: new Date(Date.now() - 300000), endedAt: null, duration: null, callQuality: null, status: 'active', notes: 'Medication query call in progress.' },
    { roomId: 'VR023', userId: 'PHARM002', startedAt: new Date(Date.now() - 300000), endedAt: null, duration: null, callQuality: null, status: 'active', notes: 'Medication query call in progress.' },
  ]
  await prisma.videoCallSession.createMany({ data: extraSessions, skipDuplicates: true })

  console.log(`  Seeded ${billingRecords.length} billing records, ${videoRooms.length + extraVideoRooms.length} video rooms, ${participants.length + extraParticipants.length} participants, ${sessions.length + extraSessions.length} video sessions, ${notifications.length} notifications`)
}
