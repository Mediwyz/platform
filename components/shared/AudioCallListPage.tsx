'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaPhone, FaClock, FaSpinner, FaPlay } from 'react-icons/fa'
import { useT } from '@/lib/i18n/useT'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

/**
 * Shared Audio Calls list page. Mirrors the video-call list but filters to
 * `mode=audio` rooms only. Audio rooms are created by workflow steps with
 * `triggers_audio_call: true` - mostly emergency dispatch today, but any
 * template author can opt in via the flag toggles.
 *
 * Audio rooms are created automatically (Tier 2 / Tier 3 systematic trigger):
 *   - Tier 2: when a booking's serviceMode === 'audio' and it is accepted
 *   - Tier 3: when the workflow step type is AUDIO_CALL_READY or AUDIO_CALL_ACTIVE
 * No manual flag toggle is needed - the engine fires the room creation.
 *
 * Reuses the existing `/video/{roomCode}` join path - that page negotiates
 * media based on the room's `mode` field.
 */
interface Room {
  id: string
  roomId: string
  mode: 'video' | 'audio'
  status: string
  reason: string
  participantName: string
  participantImage: string | null
  scheduledAt: string
  duration: number
}

export default function AudioCallListPage() {
  const t = useT()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/video/rooms?mode=audio', { credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (j?.success) setRooms(j.data) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <DashboardPageHeader icon={FaPhone} title={t('audio.title')} description={t('audio.subtitle')} />

      {loading && (
        <div className="h-24 bg-surface rounded-xl border border-line flex items-center justify-center">
          <FaSpinner className="animate-spin text-faint" />
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="bg-surface rounded-xl border border-line p-10 text-center">
          <FaPhone className="text-4xl text-faint mx-auto mb-3" />
          <p className="font-medium text-soft">{t('audio.empty.title')}</p>
          <p className="text-sm text-faint mt-1">{t('audio.empty.subtitle')}</p>
        </div>
      )}

      <div className="space-y-3">
        {rooms.map(room => (
          <div key={room.id} className="bg-surface rounded-xl border border-line p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <FaPhone className="text-cyan-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-fg truncate">{room.participantName}</p>
              <p className="text-xs text-soft flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                {new Date(room.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                <span className="mx-1">·</span>
                <span>{room.reason}</span>
                {room.status === 'ended' && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-subtle text-soft">Ended</span>
                )}
              </p>
            </div>
            {room.status !== 'ended' ? (
              <Link
                href={`/video/${room.roomId}?mode=audio`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-navy hover:bg-brand-teal text-white text-xs font-semibold"
              >
                <FaPlay className="w-3 h-3" /> {t('audio.action.join')}
              </Link>
            ) : (
              <span className="text-xs text-faint"> - </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
