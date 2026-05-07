'use client'

import '@/lib/utils/register-icons'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCalendarAlt, FaUsers } from 'react-icons/fa'
import { useBookingDrawer } from '@/lib/contexts/booking-drawer-context'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Role {
  code: string
  label: string
  singularLabel: string
  color?: string | null
}

interface GlobalSlot {
  time: string
  available: number
  total: number
  taken: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function upcomingDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function toSlotLabel(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${display}:${m.toString().padStart(2, '0')} ${period}`
}

/** Fallback slots when no ProviderAvailability is seeded — covers standard hours. */
function fallbackSlots(): GlobalSlot[] {
  const slots: GlobalSlot[] = []
  for (let h = 9; h < 18; h++) {
    if (h === 12) continue
    for (let m = 0; m < 60; m += 30) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      slots.push({ time, available: 1, total: 1, taken: false })
    }
  }
  return slots
}

// ── Component ─────────────────────────────────────────────────────────────────

interface HeroBookingWidgetProps {
  fullHeight?: boolean
}

export default function HeroBookingWidget({ fullHeight = false }: HeroBookingWidgetProps) {
  const { openDrawer } = useBookingDrawer()

  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const [days] = useState<Date[]>(() => upcomingDays(7))
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())

  const [slots, setSlots] = useState<GlobalSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [providerCount, setProviderCount] = useState(0)

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Load roles once
  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data?.length) {
          const list: Role[] = j.data
          setRoles(list)
          setSelectedRole(list[0])
        }
      })
      .catch(() => {})
  }, [])

  // Reload global slots whenever role or day changes
  useEffect(() => {
    if (!selectedRole) return
    const dateStr = selectedDay.toISOString().slice(0, 10)
    setSlotsLoading(true)
    setSlots([])
    setSelectedSlot(null)

    fetch(`/api/search/available-slots?date=${dateStr}&roleCode=${selectedRole.code}`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data?.slots?.length) {
          setSlots(j.data.slots.filter((s: GlobalSlot) => !s.taken))
          setProviderCount(j.data.providerCount ?? 0)
        } else {
          // Fallback: generate standard hours so widget is never empty
          setSlots(fallbackSlots())
          setProviderCount(j.data?.providerCount ?? 0)
        }
      })
      .catch(() => {
        setSlots(fallbackSlots())
      })
      .finally(() => setSlotsLoading(false))
  }, [selectedRole, selectedDay])

  function handleSlotClick(slot: GlobalSlot) {
    if (!selectedRole) return
    const [h, m] = slot.time.split(':').map(Number)
    const dateStr = selectedDay.toISOString().slice(0, 10)
    const timeStr = slot.time
    const timeLabel = toSlotLabel(slot.time)
    const dateLabel = `${DOW[selectedDay.getDay()]}, ${MONTHS[selectedDay.getMonth()]} ${selectedDay.getDate()}`
    setSelectedSlot(slot.time)
    openDrawer({
      // No specific provider pre-selected — drawer will handle provider selection
      provider: {
        id: '',
        name: selectedRole.singularLabel || selectedRole.label,
        userType: selectedRole.code,
        profileImage: null,
        address: null,
        rating: 0,
        specializations: [],
      },
      date: dateStr,
      time: timeStr,
      timeLabel,
      dateLabel,
    })
    void h; void m // parsed but only timeStr used above
  }

  const isSunday = selectedDay.getDay() === 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.3, ease: 'easeOut' }}
      className={fullHeight ? 'flex-1 min-h-0 flex flex-col' : 'w-full'}
    >
      <div
        className={`rounded-xl overflow-hidden border border-white/20 shadow-2xl ${
          fullHeight ? 'flex flex-col flex-1 min-h-0' : ''
        }`}
        style={{ background: 'rgba(0,10,25,0.55)', backdropFilter: 'blur(18px)' }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-4 pt-3.5 pb-2.5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-[#9AE1FF] text-sm" />
            <span className="text-xs font-bold text-white/90 tracking-wide">Book a Slot</span>
          </div>
          {providerCount > 0 && selectedRole && (
            <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              <FaUsers className="text-[8px]" />
              {providerCount} {(selectedRole.singularLabel || selectedRole.label).toLowerCase()}s available
            </span>
          )}
        </div>

        {/* ── Role chips ───────────────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-0 flex-shrink-0">
          {roles.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-2.5">
              {roles.slice(0, 7).map(r => {
                const active = selectedRole?.code === r.code
                return (
                  <button
                    key={r.code}
                    onClick={() => { setSelectedRole(r); setSelectedSlot(null) }}
                    className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all border whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#001E40] border-white shadow'
                        : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {r.singularLabel || r.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Day strip ────────────────────────────────────────────────── */}
          <div className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden mb-3">
            {days.map(d => {
              const sel = d.toDateString() === selectedDay.toDateString()
              const isToday = d.toDateString() === new Date().toDateString()
              const closed = d.getDay() === 0
              return (
                <button
                  key={d.toDateString()}
                  onClick={() => { setSelectedDay(d); setSelectedSlot(null) }}
                  disabled={closed}
                  className={`flex-shrink-0 flex flex-col items-center px-2.5 py-2 rounded-xl transition-all min-w-[42px]
                    ${closed ? 'opacity-30 cursor-not-allowed' : ''}
                    ${sel
                      ? 'bg-white text-[#001E40] shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-wider">{DOW[d.getDay()]}</span>
                  <span className={`text-sm font-black mt-0.5 leading-none ${isToday && !sel ? 'text-[#9AE1FF]' : ''}`}>
                    {d.getDate()}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Slot grid ───────────────────────────────────────────────── */}
        <div className={`px-3 pt-2 pb-2 ${fullHeight ? 'flex-1 min-h-0 overflow-y-auto' : ''}`}>
          {isSunday ? (
            <div className="py-5 text-center">
              <p className="text-white/30 text-xs">Closed on Sundays</p>
              <p className="text-white/20 text-[10px] mt-1">Select another day →</p>
            </div>
          ) : slotsLoading ? (
            <div className="py-5 flex justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <div className="py-5 text-center">
              <p className="text-white/30 text-xs">No open slots for this day</p>
              <p className="text-white/20 text-[10px] mt-1">Try another day →</p>
            </div>
          ) : (
            <div
              className={`flex flex-wrap justify-center gap-1.5
                [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20
                ${fullHeight ? 'content-start' : 'max-h-44 overflow-y-auto'}`}
            >
              {slots.map(slot => {
                const sel = selectedSlot === slot.time
                return (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    className={`w-[calc(25%-6px)] py-2 rounded-lg text-[10px] font-semibold transition-all text-center leading-tight cursor-pointer relative group
                      ${sel
                        ? 'bg-white text-[#001E40] ring-2 ring-white/60 shadow-lg scale-105'
                        : 'bg-white/15 text-white hover:bg-[#9AE1FF]/30 hover:text-white hover:scale-105 active:scale-95'
                      }`}
                  >
                    {toSlotLabel(slot.time)}
                    {slot.available > 1 && (
                      <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#9AE1FF] text-[#001E40] text-[7px] font-black flex items-center justify-center leading-none">
                        {slot.available > 9 ? '9+' : slot.available}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 bg-black/25 flex items-center border-t border-white/10 flex-shrink-0">
          <span className="text-[11px] min-w-0">
            {selectedSlot ? (
              <span className="text-[#9AE1FF] font-semibold">
                {toSlotLabel(selectedSlot)} — completing booking…
              </span>
            ) : selectedRole ? (
              <span className="text-white/40">
                Select a time slot to book a {(selectedRole.singularLabel || selectedRole.label).toLowerCase()}
              </span>
            ) : (
              <span className="text-white/40">Pick a provider type above</span>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
