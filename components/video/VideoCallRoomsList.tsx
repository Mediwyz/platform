'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { FaVideo, FaCalendarAlt, FaClock, FaUser, FaSpinner, FaArrowLeft, FaHistory, FaCheckCircle } from 'react-icons/fa'
import VideoConsultation from './VideoConsultation'

interface VideoRoom {
 id: string
 roomId: string
 scheduledAt: string
 endedAt?: string
 status: string
 reason: string
 duration: number
 participantName: string
 participantImage: string | null
 participantProfileId?: string | null
 type: string
}

interface VideoCallRoomsListProps {
 currentUser: {
 id: string
 firstName: string
 lastName: string
 userType: string
 }
 /** If provided, auto-select the room whose `roomId` field matches this value */
 initialRoomId?: string | null
}

export default function VideoCallRoomsList({ currentUser, initialRoomId }: VideoCallRoomsListProps) {
 const [rooms, setRooms] = useState<VideoRoom[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
 const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
 const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

 useEffect(() => {
 const fetchRooms = async () => {
 try {
 const res = await fetch('/api/video/rooms', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success) {
 const fetchedRooms: VideoRoom[] = json.data || []
 setRooms(fetchedRooms)

 // If an initialRoomId was provided via URL query param, prefer that room.
 // Otherwise fall back to the nearest upcoming video call.
 if (initialRoomId) {
 const matchedRoom = fetchedRooms.find(r => r.roomId === initialRoomId)
 if (matchedRoom) {
 setSelectedRoomId(matchedRoom.id)
 // If it's an active/upcoming room, also open the VideoConsultation view directly
 if (isUpcoming(matchedRoom) || isActive(matchedRoom)) {
 setSelectedRoom(matchedRoom.roomId)
 }
 return
 }
 }

 // Default: auto-select the nearest/soonest upcoming video call
 const upcomingList = fetchedRooms
 .filter(r => isUpcoming(r) || isActive(r))
 .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

 if (upcomingList.length > 0) {
 setSelectedRoomId(upcomingList[0].id)
 }
 }
 }
 } catch (error) {
 console.error('Failed to fetch video rooms:', error)
 } finally {
 setLoading(false)
 }
 }

 fetchRooms()
 }, [currentUser.id, initialRoomId])

 // Derive the currently selected room object (must be before any early return to satisfy React hooks rules)
 const selectedRoomData = useMemo(() => {
 if (!selectedRoomId) return null
 return rooms.find(r => r.id === selectedRoomId) || null
 }, [rooms, selectedRoomId])

 // If a room is selected, show the VideoConsultation component
 if (selectedRoom) {
 return (
 <div>
 <button
 onClick={() => setSelectedRoom(null)}
 className="mb-4 flex items-center gap-2 text-soft hover:text-fg transition-colors"
 >
 <FaArrowLeft /> Back to Rooms List
 </button>
 <VideoConsultation
 currentUser={{
 id: currentUser.id,
 firstName: currentUser.firstName,
 lastName: currentUser.lastName,
 userType: currentUser.userType,
 upcomingAppointments: rooms
 .filter(r => isUpcoming(r) || isActive(r))
 .map(r => ({
 id: r.id,
 type: 'video' as const,
 participantName: r.participantName,
 patientId: r.participantProfileId || undefined,
 date: r.scheduledAt,
 time: new Date(r.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
 reason: r.reason,
 roomId: r.roomId,
 })),
 }}
 />
 </div>
 )
 }

 const filteredRooms = rooms.filter(room => {
 if (filter === 'upcoming') return isUpcoming(room) || isActive(room)
 if (filter === 'past') return !isUpcoming(room) && !isActive(room)
 return true
 })

 const upcomingRooms = rooms.filter(r => isUpcoming(r) || isActive(r))
 const pastRooms = rooms.filter(r => !isUpcoming(r) && !isActive(r))

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-fg flex items-center gap-3">
 <FaVideo className="text-green-500" />
 Video Consultations
 </h1>
 <p className="text-soft mt-1">Manage your video call rooms and join consultations</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setFilter('all')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-green-500 text-white' : 'bg-subtle text-soft hover:bg-line'}`}
 >
 All ({rooms.length})
 </button>
 <button
 onClick={() => setFilter('upcoming')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-subtle text-soft hover:bg-line'}`}
 >
 Upcoming ({upcomingRooms.length})
 </button>
 <button
 onClick={() => setFilter('past')}
 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'past' ? 'bg-subtle0 text-white' : 'bg-subtle text-soft hover:bg-line'}`}
 >
 Past ({pastRooms.length})
 </button>
 </div>
 </div>

 {/* Loading State */}
 {loading && (
 <div className="flex justify-center items-center py-16">
 <FaSpinner className="animate-spin text-3xl text-green-500" />
 </div>
 )}

 {/* Empty State */}
 {!loading && filteredRooms.length === 0 && (
 <div className="bg-surface rounded-2xl p-12 shadow-lg text-center">
 <FaVideo className="text-5xl text-faint mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-soft mb-2">
 {filter === 'upcoming' ? 'No Upcoming Video Calls' : filter === 'past' ? 'No Past Video Calls' : 'No Video Calls Yet'}
 </h3>
 <p className="text-soft">
 {filter === 'upcoming'
 ? 'When you book a video consultation, it will appear here with a Join button.'
 : 'Your video consultation history will appear here.'}
 </p>
 </div>
 )}

 {/* Selected Room - Prominent Join Call Panel */}
 {!loading && selectedRoomData && (isUpcoming(selectedRoomData) || isActive(selectedRoomData)) && (
 <div className=" rounded-2xl p-6 shadow-lg border-2 border-green-400">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl bg-green-500 shadow-md">
 {selectedRoomData.participantImage ? (
 <Image src={selectedRoomData.participantImage} alt={selectedRoomData.participantName} width={64} height={64} className="w-16 h-16 rounded-full" />
 ) : (
 <FaUser />
 )}
 </div>
 <div>
 <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Next Consultation</p>
 <h2 className="text-xl font-bold text-fg">{selectedRoomData.participantName}</h2>
 <div className="flex flex-wrap gap-3 mt-1 text-sm text-soft">
 <span className="flex items-center gap-1">
 <FaCalendarAlt className="text-xs text-green-600" />
 {new Date(selectedRoomData.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
 </span>
 <span className="flex items-center gap-1">
 <FaClock className="text-xs text-green-600" />
 {new Date(selectedRoomData.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 {selectedRoomData.reason && selectedRoomData.reason !== 'Video Session' && (
 <p className="text-sm text-soft mt-1">{selectedRoomData.reason}</p>
 )}
 </div>
 </div>
 {selectedRoomData.roomId && (
 <button
 onClick={() => setSelectedRoom(selectedRoomData.roomId)}
 className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-base flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
 >
 <FaVideo className="text-lg" />
 Join Call
 </button>
 )}
 </div>
 </div>
 )}

 {/* Rooms List */}
 {!loading && filteredRooms.length > 0 && (
 <div className="space-y-4">
 {filteredRooms.map((room) => {
 const upcoming = isUpcoming(room) || isActive(room)
 const isSelected = room.id === selectedRoomId
 const scheduledDate = new Date(room.scheduledAt)

 return (
 <div
 key={`${room.roomId}-${room.id}`}
 onClick={() => {
 if (upcoming) setSelectedRoomId(room.id)
 }}
 className={`bg-surface rounded-2xl p-5 shadow-lg border-l-4 transition-all hover:shadow-xl ${
 isSelected && upcoming
 ? 'border-green-500 ring-2 ring-green-300 ring-offset-1'
 : upcoming
 ? 'border-green-500 cursor-pointer'
 : 'border-line'
 }`}
 >
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
 <div className="flex items-center gap-4 flex-1">
 {/* Participant Avatar */}
 <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${
 upcoming ? 'bg-green-500' : 'bg-gray-400'
 }`}>
 {room.participantImage ? (
 <Image src={room.participantImage} alt={room.participantName} width={56} height={56} className="w-14 h-14 rounded-full" />
 ) : (
 <FaUser />
 )}
 </div>

 <div className="flex-1">
 <h3 className="font-semibold text-fg text-lg flex items-center gap-2">
 {room.participantName}
 {isSelected && upcoming && (
 <FaCheckCircle className="text-green-500 text-sm" title="Selected" />
 )}
 </h3>
 <div className="flex flex-wrap gap-3 mt-1 text-sm text-soft">
 <span className="flex items-center gap-1">
 <FaCalendarAlt className="text-xs" />
 {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
 </span>
 <span className="flex items-center gap-1">
 <FaClock className="text-xs" />
 {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
 </span>
 {room.duration && (
 <span className="text-faint">{room.duration} min</span>
 )}
 </div>
 {room.reason && room.reason !== 'Video Session' && (
 <p className="text-sm text-faint mt-1">{room.reason}</p>
 )}
 </div>
 </div>

 <div className="flex items-center gap-3">
 {/* Status Badge */}
 <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(room.status, upcoming)}`}>
 {upcoming ? 'Upcoming' : room.status === 'completed' ? 'Completed' : room.status}
 </span>

 {/* Join Button - shown on selected upcoming room */}
 {upcoming && room.roomId && isSelected && (
 <button
 onClick={(e) => {
 e.stopPropagation()
 setSelectedRoom(room.roomId)
 }}
 className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
 >
 <FaVideo />
 Join Call
 </button>
 )}

 {/* Select hint for non-selected upcoming rooms */}
 {upcoming && room.roomId && !isSelected && (
 <span className="text-sm text-green-600 font-medium">Click to select</span>
 )}

 {!upcoming && (
 <div className="flex items-center gap-1 text-faint text-sm">
 <FaHistory />
 <span>Ended</span>
 </div>
 )}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )
}

function isUpcoming(room: VideoRoom): boolean {
 const now = new Date()
 const scheduled = new Date(room.scheduledAt)
 return scheduled > now && (room.status === 'upcoming' || room.status === 'pending' || room.status === 'confirmed')
}

function isActive(room: VideoRoom): boolean {
 return room.status === 'active' || room.status === 'upcoming'
}

function getStatusBadgeColor(status: string, upcoming: boolean): string {
 if (upcoming) return 'bg-green-100 text-green-800'
 switch (status) {
 case 'completed': return 'bg-subtle text-soft'
 case 'cancelled': return 'bg-red-100 text-red-600'
 case 'active': return 'bg-blue-100 text-blue-800'
 default: return 'bg-subtle text-soft'
 }
}
