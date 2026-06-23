"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
 FaVideo,
 FaVideoSlash,
 FaMicrophone,
 FaMicrophoneSlash,
 FaPhone,
 FaComments,
 FaClock,
 FaExpand,
 FaCompress,
 FaDesktop,
 FaPaperclip,
 FaPaperPlane,
 FaFileMedical,
 FaNotesMedical,
 FaExclamationTriangle,
 FaArrowLeft,
 FaFileDownload
} from "react-icons/fa"

interface ConsultationData {
 id: string;
 doctor: {
 name: string;
 specialty: string[];
 avatar: string | null;
 };
 patient: {
 name: string;
 };
 scheduledTime: string;
 status: string;
 notes: string | null;
}

interface Message {
 id: number;
 sender: "patient" | "doctor";
 text: string;
 time: string;
}

export default function PatientTeleconsultationPage() {
 const params = useParams()
 const appointmentId = params?.id as string

 const [isVideoOn, setIsVideoOn] = useState(true)
 const [isMicOn, setIsMicOn] = useState(true)
 const [isFullScreen, setIsFullScreen] = useState(false)
 const [isScreenSharing, setIsScreenSharing] = useState(false)
 const [messages, setMessages] = useState<Message[]>([])
 const [newMessage, setNewMessage] = useState("")
 const [showChat, setShowChat] = useState(false)
 const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
 const [callDuration, setCallDuration] = useState(0)
 const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
 const [consultation, setConsultation] = useState<ConsultationData | null>(null)
 const [loadError, setLoadError] = useState<string | null>(null)

 // Fetch real appointment data
 useEffect(() => {
 async function fetchConsultation() {
 try {
 // Get the current user first
 const meRes = await fetch("/api/auth/me", { credentials: 'include' })
 if (!meRes.ok) {
 setLoadError("Unable to verify identity. Please log in again.")
 setConnectionStatus("disconnected")
 return
 }
 const meData = await meRes.json()
 const patientId = meData.user?.id
 if (!patientId) {
 setLoadError("No user session found.")
 setConnectionStatus("disconnected")
 return
 }

 // Fetch the patient's appointments to find this one
 const apptRes = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 if (!apptRes.ok) {
 setLoadError("Failed to load consultation data.")
 setConnectionStatus("disconnected")
 return
 }
 const apptData = await apptRes.json()
 const appointments = apptData.data ?? []

 // Find the appointment matching the URL param
 const appt = appointments.find((a: { id: string }) => a.id === appointmentId)

 if (!appt) {
 setLoadError("Consultation not found.")
 setConnectionStatus("disconnected")
 return
 }

 const doctorName = appt.doctor?.user
 ? `Dr. ${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`
 : "Doctor"

 setConsultation({
 id: appt.id,
 doctor: {
 name: doctorName,
 specialty: appt.doctor?.specialty ?? [],
 avatar: appt.doctor?.user?.profileImage ?? null,
 },
 patient: {
 name: `${meData.user.firstName} ${meData.user.lastName}`,
 },
 scheduledTime: new Date(appt.scheduledAt).toLocaleTimeString([], {
 hour: "2-digit",
 minute: "2-digit",
 }),
 status: appt.status,
 notes: appt.notes ?? null,
 })

 // Simulate connection established after data loads
 setTimeout(() => setConnectionStatus("connected"), 1500)
 } catch {
 setLoadError("An unexpected error occurred.")
 setConnectionStatus("disconnected")
 }
 }

 fetchConsultation()
 }, [appointmentId])

 // Call duration timer (only runs when connected)
 useEffect(() => {
 if (connectionStatus !== "connected") return
 const timer = setInterval(() => {
 setCallDuration(prev => prev + 1)
 }, 1000)
 return () => clearInterval(timer)
 }, [connectionStatus])

 const formatDuration = (seconds: number) => {
 const mins = Math.floor(seconds / 60)
 const secs = seconds % 60
 return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
 }

 const handleSendMessage = () => {
 if (newMessage.trim()) {
 const message: Message = {
 id: messages.length + 1,
 sender: "patient",
 text: newMessage,
 time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
 }
 setMessages([...messages, message])
 setNewMessage("")
 }
 }

 const handleEndCall = () => {
 setShowEndCallConfirm(false)
 window.location.href = "/patient/appointments"
 }

 if (connectionStatus === "connecting") {
 return (
 <div className="min-h-screen bg-gray-900 flex items-center justify-center">
 <div className="text-center">
 <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
 <h2 className="text-white text-xl font-semibold mb-2">Connecting to consultation...</h2>
 <p className="text-faint">Please wait while we establish a secure connection</p>
 </div>
 </div>
 )
 }

 if (loadError || !consultation) {
 return (
 <div className="min-h-screen bg-gray-900 flex items-center justify-center">
 <div className="text-center">
 <FaExclamationTriangle className="text-yellow-400 text-5xl mx-auto mb-4" />
 <h2 className="text-white text-xl font-semibold mb-2">Unable to load consultation</h2>
 <p className="text-faint mb-6">{loadError ?? "The consultation could not be found."}</p>
 <Link href="/patient/appointments" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
 Back to Appointments
 </Link>
 </div>
 </div>
 )
 }

 const doctorSpecialty = consultation.doctor.specialty.length > 0
 ? consultation.doctor.specialty[0]
 : "Specialist"

 return (
 <div className="min-h-screen bg-gray-900 flex flex-col">
 {/* Header */}
 <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link href="/patient/appointments" className="text-white hover:text-faint">
 <FaArrowLeft />
 </Link>
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
 {consultation.doctor.name.charAt(0)}
 </div>
 <div>
 <h3 className="text-white font-semibold">{consultation.doctor.name}</h3>
 <p className="text-faint text-sm">{doctorSpecialty}</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}`}></div>
 <span className="text-white text-sm">{connectionStatus === "connected" ? "Connected" : "Disconnected"}</span>
 </div>
 <div className="flex items-center gap-2 text-white">
 <FaClock />
 <span>{formatDuration(callDuration)}</span>
 </div>
 </div>
 </div>

 {/* Main Video Area */}
 <div className="flex-1 relative">
 {/* Doctor's Video (Main) */}
 <div className="h-full bg-gray-800 flex items-center justify-center">
 {isVideoOn ? (
 <div className="text-center">
 <div className="w-32 h-32 rounded-full bg-blue-700 flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4">
 {consultation.doctor.name.charAt(0)}
 </div>
 <p className="text-white text-xl">{consultation.doctor.name}</p>
 </div>
 ) : (
 <div className="text-center">
 <FaVideoSlash className="text-soft text-6xl mx-auto mb-4" />
 <p className="text-faint">Video is turned off</p>
 </div>
 )}
 </div>

 {/* Patient's Video (PiP) */}
 <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg shadow-lg border-2 border-gray-600">
 {isVideoOn ? (
 <div className="h-full flex items-center justify-center">
 <div className="text-center">
 <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold mx-auto">
 {consultation.patient.name.charAt(0)}
 </div>
 <p className="text-white text-xs mt-1">You</p>
 </div>
 </div>
 ) : (
 <div className="h-full flex items-center justify-center">
 <FaVideoSlash className="text-soft text-2xl" />
 </div>
 )}
 </div>

 {/* Chat Panel */}
 {showChat && (
 <div className="absolute top-0 right-0 h-full w-96 bg-surface shadow-lg">
 <div className="flex items-center justify-between p-4 border-b">
 <h3 className="font-semibold">Chat</h3>
 <button
 onClick={() => setShowChat(false)}
 className="text-soft hover:text-soft"
 >
 
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 h-[calc(100%-8rem)]">
 {messages.length === 0 && (
 <p className="text-faint text-sm text-center mt-8">No messages yet. Start the conversation.</p>
 )}
 {messages.map((message) => (
 <div
 key={message.id}
 className={`mb-4 ${message.sender === "patient" ? "text-right" : "text-left"}`}
 >
 <div className={`inline-block p-3 rounded-lg max-w-xs ${
 message.sender === "patient"
 ? "bg-primary-blue text-white"
 : "bg-subtle text-fg"
 }`}>
 <p>{message.text}</p>
 <p className={`text-xs mt-1 ${
 message.sender === "patient" ? "text-blue-100" : "text-soft"
 }`}>
 {message.time}
 </p>
 </div>
 </div>
 ))}
 </div>

 <div className="p-4 border-t">
 <div className="flex gap-2">
 <button className="p-2 text-soft hover:text-soft">
 <FaPaperclip />
 </button>
 <input
 type="text"
 value={newMessage}
 onChange={(e) => setNewMessage(e.target.value)}
 onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
 placeholder="Type a message..."
 className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 <button
 onClick={handleSendMessage}
 className="p-2 bg-primary-blue text-white rounded-lg hover:bg-blue-600"
 >
 <FaPaperPlane />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Quick Actions */}
 <div className="absolute left-4 top-1/2 transform -translate-y-1/2 space-y-3">
 <button className="w-12 h-12 bg-surface rounded-full shadow-lg flex items-center justify-center hover:bg-subtle">
 <FaFileMedical className="text-soft" />
 </button>
 <button className="w-12 h-12 bg-surface rounded-full shadow-lg flex items-center justify-center hover:bg-subtle">
 <FaNotesMedical className="text-soft" />
 </button>
 <button className="w-12 h-12 bg-surface rounded-full shadow-lg flex items-center justify-center hover:bg-subtle">
 <FaFileDownload className="text-soft" />
 </button>
 </div>
 </div>

 {/* Control Bar */}
 <div className="bg-gray-800 px-4 py-4">
 <div className="max-w-4xl mx-auto flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setIsVideoOn(!isVideoOn)}
 className={`p-3 rounded-full ${
 isVideoOn ? "bg-gray-700 text-white" : "bg-red-500 text-white"
 } hover:opacity-80`}
 >
 {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
 </button>

 <button
 onClick={() => setIsMicOn(!isMicOn)}
 className={`p-3 rounded-full ${
 isMicOn ? "bg-gray-700 text-white" : "bg-red-500 text-white"
 } hover:opacity-80`}
 >
 {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
 </button>

 <button
 onClick={() => setIsScreenSharing(!isScreenSharing)}
 className={`p-3 rounded-full ${
 isScreenSharing ? "bg-primary-blue text-white" : "bg-gray-700 text-white"
 } hover:opacity-80`}
 >
 <FaDesktop />
 </button>

 <button
 onClick={() => setShowChat(!showChat)}
 className={`p-3 rounded-full ${
 showChat ? "bg-primary-blue text-white" : "bg-gray-700 text-white"
 } hover:opacity-80 relative`}
 >
 <FaComments />
 {messages.length > 0 && !showChat && (
 <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
 {messages.length}
 </span>
 )}
 </button>

 <button
 onClick={() => setIsFullScreen(!isFullScreen)}
 className="p-3 rounded-full bg-gray-700 text-white hover:opacity-80"
 >
 {isFullScreen ? <FaCompress /> : <FaExpand />}
 </button>
 </div>

 <button
 onClick={() => setShowEndCallConfirm(true)}
 className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center gap-2"
 >
 <FaPhone className="rotate-135" />
 End Call
 </button>
 </div>
 </div>

 {/* End Call Confirmation Modal */}
 {showEndCallConfirm && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-surface rounded-lg p-6 max-w-md w-full">
 <div className="flex items-center gap-3 mb-4">
 <FaExclamationTriangle className="text-yellow-500 text-xl" />
 <h3 className="text-lg font-semibold">End Consultation?</h3>
 </div>
 <p className="text-soft mb-6">
 Are you sure you want to end this consultation? Make sure you have discussed all your concerns with the doctor.
 </p>
 <div className="flex gap-3">
 <button
 onClick={() => setShowEndCallConfirm(false)}
 className="flex-1 px-4 py-2 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Continue Call
 </button>
 <button
 onClick={handleEndCall}
 className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
 >
 End Call
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
