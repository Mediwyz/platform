import { PrismaClient } from '@prisma/client'

export async function seedVideoRooms(prisma: PrismaClient) {
  const rooms = [
    { id: 'VR001', roomCode: 'ROOM-DOC001-PAT001', name: 'Dr. Johnson - Emma Johnson', creatorId: 'DOC001', status: 'active', mode: 'video' },
    { id: 'VR002', roomCode: 'ROOM-DOC003-PAT004', name: 'Dr. Dupont - Vikash Doorgakant', creatorId: 'DOC003', status: 'active', mode: 'video' },
    { id: 'VR003', roomCode: 'ROOM-DOC001-PAT005', name: 'Dr. Johnson - Nadia Soobramanien', creatorId: 'DOC001', status: 'active', mode: 'video' },
    { id: 'VR004', roomCode: 'ROOM-DOC002-PAT002', name: 'Dr. Patel - Jean Pierre', creatorId: 'DOC002', status: 'active', mode: 'video' },
    { id: 'VR005', roomCode: 'ROOM-DOC002-PAT003', name: 'Dr. Patel - Aisha Khan', creatorId: 'DOC002', status: 'active', mode: 'video' },
    // Audio-only rooms (voice calls - faster to connect on weak networks)
    { id: 'VRA01', roomCode: 'AUDIO-DOC001-PAT002', name: 'Dr. Johnson - Jean Pierre (audio)', creatorId: 'DOC001', status: 'active', mode: 'audio' },
    { id: 'VRA02', roomCode: 'AUDIO-DOC002-PAT001', name: 'Dr. Patel - Emma Johnson (audio)', creatorId: 'DOC002', status: 'active', mode: 'audio' },
    { id: 'VRA03', roomCode: 'AUDIO-DOC003-PAT005', name: 'Dr. Dupont - Nadia Soobramanien (audio)', creatorId: 'DOC003', status: 'active', mode: 'audio' },
  ]

  for (const room of rooms) {
    await prisma.videoRoom.upsert({
      where: { id: room.id },
      update: {},
      create: room,
    })
  }

  // Video room participants
  const participants = [
    { roomId: 'VR001', userId: 'DOC001', role: 'host' },
    { roomId: 'VR001', userId: 'PAT001', role: 'participant' },
    { roomId: 'VR002', userId: 'DOC003', role: 'host' },
    { roomId: 'VR002', userId: 'PAT004', role: 'participant' },
    { roomId: 'VR003', userId: 'DOC001', role: 'host' },
    { roomId: 'VR003', userId: 'PAT005', role: 'participant' },
    { roomId: 'VR004', userId: 'DOC002', role: 'host' },
    { roomId: 'VR004', userId: 'PAT002', role: 'participant' },
    { roomId: 'VR005', userId: 'DOC002', role: 'host' },
    { roomId: 'VR005', userId: 'PAT003', role: 'participant' },
    // Audio room participants
    { roomId: 'VRA01', userId: 'DOC001', role: 'host' },
    { roomId: 'VRA01', userId: 'PAT002', role: 'participant' },
    { roomId: 'VRA02', userId: 'DOC002', role: 'host' },
    { roomId: 'VRA02', userId: 'PAT001', role: 'participant' },
    { roomId: 'VRA03', userId: 'DOC003', role: 'host' },
    { roomId: 'VRA03', userId: 'PAT005', role: 'participant' },
  ]
  await prisma.videoRoomParticipant.createMany({ data: participants })

  // Past video call sessions - one entry per participant per call
  const sessions = [
    // Call 1: VR001 on 2024-11-15 (DOC001 + PAT001)
    { roomId: 'VR001', userId: 'PAT001', startedAt: new Date('2024-11-15T10:00:00'), endedAt: new Date('2024-11-15T10:30:00'), duration: 30, callQuality: 'excellent', status: 'ended', notes: 'Diabetes follow-up. Patient doing well.' },
    { roomId: 'VR001', userId: 'DOC001', startedAt: new Date('2024-11-15T10:00:00'), endedAt: new Date('2024-11-15T10:30:00'), duration: 30, callQuality: 'excellent', status: 'ended', notes: 'Diabetes follow-up. Patient doing well.' },
    // Call 2: VR002 on 2024-12-05 (DOC003 + PAT004)
    { roomId: 'VR002', userId: 'PAT004', startedAt: new Date('2024-12-05T14:00:00'), endedAt: new Date('2024-12-05T14:45:00'), duration: 45, callQuality: 'good', status: 'ended', notes: 'Discussed cholesterol management plan.' },
    { roomId: 'VR002', userId: 'DOC003', startedAt: new Date('2024-12-05T14:00:00'), endedAt: new Date('2024-12-05T14:45:00'), duration: 45, callQuality: 'good', status: 'ended', notes: 'Discussed cholesterol management plan.' },
    // Audio call 1: VRA01 on 2024-12-10 (DOC001 + PAT002) - quick voice follow-up
    { roomId: 'VRA01', userId: 'PAT002', startedAt: new Date('2024-12-10T09:00:00'), endedAt: new Date('2024-12-10T09:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Audio-only - medication query resolved.' },
    { roomId: 'VRA01', userId: 'DOC001', startedAt: new Date('2024-12-10T09:00:00'), endedAt: new Date('2024-12-10T09:12:00'), duration: 12, callQuality: 'good', status: 'ended', notes: 'Audio-only - medication query resolved.' },
    // Audio call 2: VRA02 on 2024-12-12 (DOC002 + PAT001) - weak-network voice call
    { roomId: 'VRA02', userId: 'PAT001', startedAt: new Date('2024-12-12T16:30:00'), endedAt: new Date('2024-12-12T16:50:00'), duration: 20, callQuality: 'fair', status: 'ended', notes: 'Voice call - patient on weak mobile signal.' },
    { roomId: 'VRA02', userId: 'DOC002', startedAt: new Date('2024-12-12T16:30:00'), endedAt: new Date('2024-12-12T16:50:00'), duration: 20, callQuality: 'fair', status: 'ended', notes: 'Voice call - patient on weak mobile signal.' },
  ]
  await prisma.videoCallSession.createMany({ data: sessions })

  console.log(`  Seeded ${rooms.length} video rooms, ${participants.length} participants, ${sessions.length} past sessions`)
  return rooms
}
