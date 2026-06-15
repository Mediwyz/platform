// components/video/VideoConsultation.tsx
// Shared video consultation component with session management
// Used by both patient and doctor dashboards

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import VideoCallRoom from './VideoCallRoom'
import {
 FaVideoSlash,
 FaClock,
 FaStethoscope,
 FaUser,
 FaUserMd,
 FaSync,
 FaWifi,
 FaExclamationTriangle,
 FaCheckCircle,
 FaDatabase,
 FaRedo,
 FaPrescriptionBottleAlt,
 FaNotesMedical
} from 'react-icons/fa'

interface VideoConsultationUser {
 id: string
 firstName: string
 lastName: string
 userType?: string
 upcomingAppointments?: VideoAppointment[]
}

interface VideoConsultationProps {
 /** Generic current user - works for any user type (patient, doctor, nurse, nanny, etc.) */
 currentUser?: VideoConsultationUser
 /** @deprecated Use currentUser instead */
 patientData?: VideoConsultationUser
 /** @deprecated Use currentUser instead */
 doctorData?: VideoConsultationUser
}

type UserType = 'doctor' | 'patient' | 'nurse' | 'nanny' | string

interface VideoAppointment {
 id: string
 type: 'video'
 doctorId?: string
 doctorName?: string
 patientId?: string
 patientName?: string
 participantName?: string
 specialty?: string
 date: string
 time: string
 reason?: string
 roomId: string
}

interface SessionData {
 sessionId: string
 roomId: string
 status: string
 isActive: boolean
 canRecover: boolean
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({ currentUser, patientData, doctorData }) => {
 const {
 socket,
 connected,
 isReconnecting: socketReconnecting,
 reconnectAttempts,
 saveRoomState,
 clearRoomState,
 manualReconnect
 } = useSocket()

 const [isInCall, setIsInCall] = useState(false)
 const [selectedAppointment, setSelectedAppointment] = useState<VideoAppointment | null>(null)
 const [roomId, setRoomId] = useState<string>('')
 const [localStream, setLocalStream] = useState<MediaStream | null>(null)
 const [isVideoOn, setIsVideoOn] = useState(true)
 const [isMicOn, setIsMicOn] = useState(true)
 const [callDuration, setCallDuration] = useState(0)
 const [showChat, setShowChat] = useState(false)
 const [chatMessage, setChatMessage] = useState('')
 const [mediaError, setMediaError] = useState<string>('')
 const [sessionData, setSessionData] = useState<SessionData | null>(null)
 const [recoveryAvailable, setRecoveryAvailable] = useState(false)
 const [connectionHealth, setConnectionHealth] = useState<'good' | 'poor' | 'recovering'>('good')

 const callIntervalRef = useRef<NodeJS.Timeout | null>(null)
 const callStartTime = useRef<number | null>(null)
 const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)

 // Resolve effective user: prefer currentUser, fall back to deprecated props
 const effectiveUser = currentUser || patientData || doctorData
 const effectiveType: UserType = effectiveUser?.userType || (patientData ? 'patient' : 'doctor')

 const userInfo = {
 id: effectiveUser?.id || '',
 name: effectiveType === 'doctor'
 ? `Dr. ${effectiveUser?.firstName || ''} ${effectiveUser?.lastName || ''}`.trim()
 : `${effectiveUser?.firstName || ''} ${effectiveUser?.lastName || ''}`.trim(),
 type: effectiveType
 }

 const videoAppointments: VideoAppointment[] = (() => {
 if (!effectiveUser?.upcomingAppointments) return []
 return effectiveUser.upcomingAppointments.filter(apt => apt.type === 'video') as VideoAppointment[]
 })()

 /** Get the remote participant's display name from an appointment */
 const getRemoteParticipantName = (appointment: VideoAppointment | null): string | undefined => {
 if (!appointment) return undefined
 if (appointment.participantName) return appointment.participantName
 if (effectiveType === 'patient') return appointment.doctorName
 if (effectiveType === 'doctor') return appointment.patientName
 return appointment.doctorName || appointment.patientName
 }

 const {
 remoteStreams,
 chatMessages,
 isScreenSharing,
 connectionStatus,
 isReconnecting: webrtcReconnecting,
 sessionId,
 sendChatMessage,
 toggleVideo: toggleVideoWebRTC,
 toggleAudio: toggleAudioWebRTC,
 startScreenShare,
 stopScreenShare,
 triggerIceRestart,
 requestRecovery
 } = useWebRTC({
 socket,
 roomId,
 userId: userInfo.id,
 userName: userInfo.name,
 userType: userInfo.type,
 localStream,
 saveRoomState,
 clearRoomState
 })

 const isReconnecting = socketReconnecting || webrtcReconnecting

 useEffect(() => {
 if (connectionStatus === 'connected') {
 setConnectionHealth('good')
 } else if (connectionStatus === 'reconnecting' || isReconnecting) {
 setConnectionHealth('recovering')
 } else if (connectionStatus === 'failed') {
 setConnectionHealth('poor')
 }
 }, [connectionStatus, isReconnecting])

 const createDatabaseSession = async (roomId: string) => {
 try {
 const response = await fetch('/api/webrtc/session', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 roomId,
 userId: userInfo.id,
 userName: userInfo.name,
 userType: userInfo.type
 }),
 credentials: 'include',
 })

 if (response.ok) {
 const data = await response.json()
 setSessionData({
 sessionId: data.data.session.id,
 roomId: data.data.session.roomId,
 status: data.data.session.status,
 isActive: true,
 canRecover: true
 })
 }
 } catch (error) {
 console.error('Failed to create database session:', error)
 }
 }

 const checkExistingSession = async (roomId: string) => {
 try {
 const response = await fetch(`/api/webrtc/session?roomId=${roomId}`, { credentials: 'include' })
 if (response.ok) {
 const data = await response.json()
 if (data.data && data.data.isActive) {
 setSessionData({
 sessionId: data.data.id,
 roomId: data.data.roomId,
 status: data.data.status,
 isActive: data.data.isActive,
 canRecover: true
 })
 setRecoveryAvailable(true)
 return data.data
 }
 }
 } catch (error) {
 console.error('Failed to check existing session:', error)
 }
 return null
 }

 const requestDatabaseRecovery = async () => {
 if (!roomId || !userInfo.id) return

 try {
 const response = await fetch('/api/webrtc/recovery', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ roomId, userId: userInfo.id }),
 credentials: 'include',
 })

 if (response.ok) {
 const data = await response.json()
 if (data.canRecover) {
 setRecoveryAvailable(true)
 if (selectedAppointment) {
 await initializeMediaAndJoin(selectedAppointment)
 }
 } else {
 setRecoveryAvailable(false)
 }
 }
 } catch (error) {
 console.error('Failed to request recovery:', error)
 }
 }

 useEffect(() => {
 if (!isInCall || !sessionData) return

 sessionCheckInterval.current = setInterval(async () => {
 try {
 await fetch('/api/webrtc/session', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 sessionId: sessionData.sessionId,
 userId: userInfo.id,
 connectionState: connectionStatus,
 iceState: connectionHealth === 'good' ? 'connected' : 'checking'
 }),
 credentials: 'include',
 })
 } catch (error) {
 console.error('Session health check failed:', error)
 }
 }, 30000)

 return () => {
 if (sessionCheckInterval.current) {
 clearInterval(sessionCheckInterval.current)
 }
 }
 }, [isInCall, sessionData, connectionStatus, connectionHealth, userInfo.id])

 const initializeMediaAndJoin = async (appointment: VideoAppointment) => {
 try {
 setMediaError('')

 // getUserMedia requires a secure context (HTTPS or localhost)
 if (!window.isSecureContext) {
 setMediaError('Video calls require a secure connection (HTTPS). Please access the site via HTTPS to use video calls.')
 return
 }

 if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
 setMediaError('Your browser does not support video calls. Please use a modern browser like Chrome or Firefox.')
 return
 }

 const existingSession = await checkExistingSession(appointment.roomId)

 const stream = await navigator.mediaDevices.getUserMedia({
 video: {
 width: { ideal: 1280 },
 height: { ideal: 720 },
 facingMode: 'user'
 },
 audio: {
 echoCancellation: true,
 noiseSuppression: true,
 autoGainControl: true,
 sampleRate: 48000
 }
 })

 setLocalStream(stream)
 setRoomId(appointment.roomId)
 setIsInCall(true)

 if (!existingSession) {
 await createDatabaseSession(appointment.roomId)
 }

 const callData = {
 appointment,
 userId: userInfo.id,
 userName: userInfo.name,
 userType: userInfo.type,
 roomId: appointment.roomId,
 sessionId: existingSession?.id || sessionId,
 startTime: new Date().toISOString()
 }

 sessionStorage.setItem(`active_call_${appointment.roomId}`, JSON.stringify(callData))

 saveRoomState({
 roomId: appointment.roomId,
 userId: userInfo.id,
 userName: userInfo.name,
 userType: userInfo.type,
 sessionId: existingSession?.id || sessionId
 })
 } catch (error) {
 if (error instanceof Error) {
 setMediaError(error.message || 'Failed to access camera/microphone')
 } else {
 setMediaError('Failed to access camera/microphone')
 }
 }
 }

 const joinCall = async (appointment: VideoAppointment) => {
 if (!appointment.roomId) {
 toast.error('No room ID found for this appointment. Please contact support.')
 return
 }

 setSelectedAppointment(appointment)
 await initializeMediaAndJoin(appointment)
 }

 const recoverSession = async () => {
 await requestDatabaseRecovery()
 requestRecovery()
 }

 const endCall = async () => {
 if (sessionData) {
 try {
 await fetch(`/api/webrtc/session?sessionId=${sessionData.sessionId}&userId=${userInfo.id}`, {
 method: 'DELETE',
 credentials: 'include',
 })
 } catch (error) {
 console.error('Failed to end database session:', error)
 }
 }

 if (roomId) {
 sessionStorage.removeItem(`active_call_${roomId}`)
 }
 clearRoomState()

 if (localStream) {
 localStream.getTracks().forEach(track => track.stop())
 }

 if (socket && socket.connected) {
 socket.emit('leave-room')
 }

 setIsInCall(false)
 setLocalStream(null)
 setRoomId('')
 setCallDuration(0)
 setSessionData(null)
 setRecoveryAvailable(false)
 callStartTime.current = null
 setMediaError('')
 }

 useEffect(() => {
 const restoreCallState = async () => {
 const activeCallKeys = Object.keys(sessionStorage).filter(key =>
 key.startsWith('active_call_')
 )

 if (activeCallKeys.length > 0) {
 try {
 const callData = JSON.parse(sessionStorage.getItem(activeCallKeys[0]) || '{}')

 if (callData.roomId && callData.appointment) {
 setSelectedAppointment(callData.appointment)
 setRoomId(callData.roomId)

 const session = await checkExistingSession(callData.roomId)
 if (session) {
 await initializeMediaAndJoin(callData.appointment)
 } else {
 sessionStorage.removeItem(activeCallKeys[0])
 }
 }
 } catch {
 sessionStorage.clear()
 }
 }
 }

 restoreCallState()
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [])

 useEffect(() => {
 if (isInCall) {
 if (!callStartTime.current) {
 callStartTime.current = Date.now()
 }

 callIntervalRef.current = setInterval(() => {
 const elapsed = Math.floor((Date.now() - callStartTime.current!) / 1000)
 setCallDuration(elapsed)
 }, 1000)
 } else {
 if (callIntervalRef.current) {
 clearInterval(callIntervalRef.current)
 }
 if (!isReconnecting) {
 setCallDuration(0)
 callStartTime.current = null
 }
 }

 return () => {
 if (callIntervalRef.current) {
 clearInterval(callIntervalRef.current)
 }
 }
 }, [isInCall, isReconnecting])

 const handleToggleVideo = () => {
 const newState = !isVideoOn
 setIsVideoOn(newState)
 toggleVideoWebRTC(newState)
 }

 const handleToggleMic = () => {
 const newState = !isMicOn
 setIsMicOn(newState)
 toggleAudioWebRTC(newState)
 }

 const handleToggleScreenShare = async () => {
 if (isScreenSharing) {
 stopScreenShare()
 } else {
 await startScreenShare()
 }
 }

 const handleToggleChat = () => {
 setShowChat(!showChat)
 }

 const handleSendMessage = () => {
 if (chatMessage.trim()) {
 sendChatMessage(chatMessage)
 setChatMessage('')
 }
 }

 const retryConnection = () => {
 manualReconnect()
 triggerIceRestart()
 }

 const renderConnectionStatus = () => {
 if (!connected && !socketReconnecting) {
 return (
 <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-3 flex items-center justify-center">
 <FaExclamationTriangle className="mr-2" />
 <span>Connection lost. Attempting to reconnect...</span>
 <button
 onClick={retryConnection}
 className="ml-4 px-3 py-1 bg-white text-red-600 rounded hover:bg-gray-100"
 >
 Retry Now
 </button>
 </div>
 )
 }

 if (socketReconnecting) {
 return (
 <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white p-3 flex items-center justify-center">
 <FaSync className="mr-2 animate-spin" />
 <span>Reconnecting... (Attempt #{reconnectAttempts})</span>
 </div>
 )
 }

 if (sessionData && recoveryAvailable && !isInCall) {
 return (
 <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-3 flex items-center justify-center">
 <FaDatabase className="mr-2" />
 <span>Previous session found. </span>
 <button
 onClick={recoverSession}
 className="ml-4 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100 flex items-center"
 >
 <FaRedo className="mr-1" />
 Recover Session
 </button>
 </div>
 )
 }

 return null
 }

 const renderConnectionHealth = () => {
 if (!isInCall) return null

 return (
 <div className="absolute top-20 right-4 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2 z-40">
 {connectionHealth === 'good' && (
 <>
 <FaCheckCircle className="text-green-500" />
 <span className="text-sm">Connection Good</span>
 </>
 )}
 {connectionHealth === 'poor' && (
 <>
 <FaExclamationTriangle className="text-red-500" />
 <span className="text-sm">Poor Connection</span>
 <button
 onClick={triggerIceRestart}
 className="ml-2 text-xs bg-red-500 px-2 py-1 rounded hover:bg-red-600"
 >
 Fix
 </button>
 </>
 )}
 {connectionHealth === 'recovering' && (
 <>
 <FaSync className="text-yellow-500 animate-spin" />
 <span className="text-sm">Recovering...</span>
 </>
 )}
 {sessionData && (
 <span className="text-xs opacity-70 ml-2">
 Session: {sessionData.sessionId.substring(0, 8)}
 </span>
 )}
 </div>
 )
 }

 if (mediaError && !localStream) {
 return (
 <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
 <div className="text-center max-w-md">
 <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
 <FaVideoSlash className="text-2xl" />
 </div>
 <h2 className="text-white text-xl font-semibold mb-2">Media Access Error</h2>
 <p className="text-gray-400 mb-6">{mediaError}</p>
 <div className="space-y-3">
 <button
 onClick={() => selectedAppointment && joinCall(selectedAppointment)}
 className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
 >
 Try Again
 </button>
 <button
 onClick={endCall}
 className="w-full text-gray-400 hover:text-white transition"
 >
 Cancel Call
 </button>
 </div>
 </div>
 </div>
 )
 }

 if (!isInCall) {
 return (
 <>
 {renderConnectionStatus()}
 <div className="space-y-6">
 <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
 <div className="bg-brand-navy text-white p-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
 <FaStethoscope className="text-2xl" />
 </div>
 <div>
 <h2 className="text-xl font-bold">Video Consultation</h2>
 {selectedAppointment && (
 <p className="text-blue-100">
 with {getRemoteParticipantName(selectedAppointment) || 'Participant'}
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {connected ? (
 <div className="flex items-center text-green-300">
 <FaWifi className="mr-2" />
 <span className="text-sm">Connected</span>
 </div>
 ) : (
 <div className="flex items-center text-yellow-300">
 <FaSync className="mr-2 animate-spin" />
 <span className="text-sm">Connecting...</span>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="relative bg-gray-900 h-[400px] sm:h-[500px] md:h-[600px] flex items-center justify-center">
 <div className="text-center text-white">
 <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaClock className="text-4xl animate-pulse" />
 </div>
 <h3 className="text-2xl font-semibold mb-2">Waiting Room</h3>

 {selectedAppointment ? (
 <>
 <p className="text-blue-100 mb-6">
 Your consultation is scheduled for {selectedAppointment.time}
 </p>
 <p className="text-sm text-blue-200 mb-8">
 Room ID: {selectedAppointment.roomId}
 </p>

 <button
 onClick={() => joinCall(selectedAppointment)}
 disabled={!connected}
 className={`px-8 py-3 rounded-xl font-semibold transition-all transform ${
 connected
 ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105'
 : 'bg-gray-600 text-gray-300 cursor-not-allowed'
 }`}
 >
 {connected ? 'Join Consultation' : 'Waiting for connection...'}
 </button>
 </>
 ) : (
 <p className="text-gray-400">No video consultations scheduled</p>
 )}
 </div>
 </div>
 </div>

 {videoAppointments.length > 0 && (
 <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
 <h3 className="text-lg font-semibold text-gray-800 mb-4">
 Upcoming Video Consultations
 </h3>
 <div className="space-y-3">
 {videoAppointments.map((appointment) => (
 <div
 key={appointment.id}
 onClick={() => setSelectedAppointment(appointment)}
 className={`cursor-pointer rounded-xl p-4 border transition-all ${
 selectedAppointment?.id === appointment.id
 ? 'border-blue-500 bg-blue-50'
 : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full flex items-center justify-center text-white">
 {effectiveType === 'patient' ? <FaUserMd /> : <FaUser />}
 </div>
 <div>
 <p className="font-medium text-gray-900">
 {getRemoteParticipantName(appointment) || 'Participant'}
 </p>
 <p className="text-sm text-gray-600">
 {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
 </p>
 </div>
 </div>
 {selectedAppointment?.id === appointment.id && (
 <span className="text-sm text-blue-600 font-medium">Selected</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </>
 )
 }

 const handleWritePrescription = () => {
 if (!selectedAppointment) return
 const patientId = selectedAppointment.patientId
 if (!patientId) return
 const url = `/doctor/prescriptions/create/${patientId}?roomId=${selectedAppointment.roomId}`
 window.open(url, '_blank')
 }

 return (
 <>
 {renderConnectionStatus()}
 {renderConnectionHealth()}

 {/* Doctor prescription button during active call */}
 {effectiveType === 'doctor' && selectedAppointment?.patientId && (
 <div className="fixed top-20 left-4 z-40 flex flex-col gap-2">
 <button
 onClick={handleWritePrescription}
 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors text-sm font-medium"
 title="Write a prescription for this patient"
 >
 <FaPrescriptionBottleAlt />
 <span className="hidden sm:inline">Write Prescription</span>
 </button>
 <button
 onClick={() => {
 if (!selectedAppointment?.patientId) return
 const notesKey = `consultation_notes_${selectedAppointment.roomId}`
 const existing = localStorage.getItem(notesKey) || ''
 const notes = prompt('Consultation Notes:', existing)
 if (notes !== null) {
 localStorage.setItem(notesKey, notes)
 }
 }}
 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 transition-colors text-sm font-medium"
 title="Save consultation notes"
 >
 <FaNotesMedical />
 <span className="hidden sm:inline">Notes</span>
 </button>
 </div>
 )}

 <VideoCallRoom
 localStream={localStream}
 remoteStreams={remoteStreams}
 isVideoOn={isVideoOn}
 isMicOn={isMicOn}
 isScreenSharing={isScreenSharing}
 isReconnecting={isReconnecting}
 connectionStatus={connectionStatus}
 callDuration={callDuration}
 onToggleVideo={handleToggleVideo}
 onToggleMic={handleToggleMic}
 onToggleScreenShare={handleToggleScreenShare}
 onEndCall={endCall}
 onToggleChat={handleToggleChat}
 participantName={userInfo.name}
 remoteParticipantName={getRemoteParticipantName(selectedAppointment)}
 />

 {showChat && (
 <div className="fixed bottom-20 right-0 w-full sm:w-96 h-96 bg-white shadow-2xl z-50 rounded-t-2xl sm:rounded-l-2xl">
 <div className="flex flex-col h-full">
 <div className="p-4 border-b flex items-center justify-between">
 <h3 className="font-semibold">Chat</h3>
 <button
 onClick={handleToggleChat}
 className="text-gray-500 hover:text-gray-700 text-2xl"
 >
 &times;
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-2" aria-live="polite" aria-label="Chat messages">
 {chatMessages.map((msg, idx) => (
 <div
 key={idx}
 className={`flex ${
 msg.socketId === socket?.id ? 'justify-end' : 'justify-start'
 }`}
 >
 <div
 className={`max-w-xs px-3 py-2 rounded-lg ${
 msg.socketId === socket?.id
 ? 'bg-blue-500 text-white'
 : 'bg-gray-200 text-gray-800'
 }`}
 >
 <p className="text-xs opacity-75">{msg.userName}</p>
 <p className="text-sm">{msg.message}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="p-4 border-t">
 <div className="flex gap-2">
 <input
 type="text"
 value={chatMessage}
 onChange={(e) => setChatMessage(e.target.value)}
 onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
 placeholder="Type a message..."
 className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 <button
 onClick={handleSendMessage}
 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
 >
 Send
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </>
 )
}

export default VideoConsultation
