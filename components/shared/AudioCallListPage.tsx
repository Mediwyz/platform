'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaPhone, FaClock, FaSpinner, FaPlay } from 'react-icons/fa'
import { useT } from '@/lib/i18n/useT'

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaPhone className="text-brand-teal" /> {t('audio.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('audio.subtitle')}</p>
      </div>

      {loading && (
        <div className="h-24 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
          <FaSpinner className="animate-spin text-gray-400" />
        </div>
      )}

      {!loading && rooms.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <FaPhone className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">{t('audio.empty.title')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('audio.empty.subtitle')}</p>
        </div>
      )}

      <div className="space-y-3">
        {rooms.map(room => (
          <div key={room.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <FaPhone className="text-cyan-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">{room.participantName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                {new Date(room.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                <span className="mx-1">·</span>
                <span>{room.reason}</span>
                {room.status === 'ended' && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Ended</span>
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
              <span className="text-xs text-gray-400"> - </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
