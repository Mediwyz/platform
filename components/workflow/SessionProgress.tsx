'use client'

import { FiCheckCircle, FiCircle, FiClock, FiCalendar } from 'react-icons/fi'

export interface SessionEntry {
  sessionNumber: number
  label?: string
  completedAt?: string | null
  scheduledAt?: string | null
  status: 'completed' | 'in_progress' | 'scheduled' | 'pending'
  notes?: string | null
}

interface SessionProgressProps {
  /** Programme or service name displayed in the header */
  programName: string
  totalSessions: number
  sessions: SessionEntry[]
  /** Optional compact mode - shows only the progress bar + count, no session list */
  compact?: boolean
  /** Optional next session info */
  nextSessionAt?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-MU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG: Record<SessionEntry['status'], { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completed', color: 'text-green-600', icon: <FiCheckCircle className="w-4 h-4 text-green-500" /> },
  in_progress: { label: 'In progress', color: 'text-brand-teal', icon: <FiClock className="w-4 h-4 text-brand-teal animate-pulse" /> },
  scheduled: { label: 'Scheduled', color: 'text-blue-600', icon: <FiCalendar className="w-4 h-4 text-blue-500" /> },
  pending: { label: 'Pending', color: 'text-gray-400', icon: <FiCircle className="w-4 h-4 text-gray-300" /> },
}

export default function SessionProgress({ programName, totalSessions, sessions, compact, nextSessionAt }: SessionProgressProps) {
  const completedCount = sessions.filter(s => s.status === 'completed').length
  const pct = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-700 truncate">{programName}</span>
          <span className="text-gray-500 ml-2 flex-shrink-0">{completedCount}/{totalSessions} sessions</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{programName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {completedCount} of {totalSessions} sessions completed
            {nextSessionAt && ` · Next: ${formatDate(nextSessionAt)}`}
          </p>
        </div>
        <span className="text-2xl font-bold text-brand-teal">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-teal rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Session list */}
      <div className="space-y-1">
        {sessions.map(s => {
          const cfg = STATUS_CONFIG[s.status]
          return (
            <div key={s.sessionNumber} className="flex items-center gap-3 py-1.5">
              {cfg.icon}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-800">
                  Session {s.sessionNumber}
                  {s.label && ` - ${s.label}`}
                </span>
                {s.completedAt && (
                  <span className="text-xs text-gray-400 ml-2">{formatDate(s.completedAt)}</span>
                )}
                {s.scheduledAt && s.status === 'scheduled' && (
                  <span className="text-xs text-blue-500 ml-2">{formatDate(s.scheduledAt)}</span>
                )}
                {s.notes && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{s.notes}</p>
                )}
              </div>
              <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          )
        })}
        {/* Render pending placeholders for sessions not yet created */}
        {Array.from({ length: Math.max(0, totalSessions - sessions.length) }).map((_, i) => (
          <div key={`placeholder-${i}`} className="flex items-center gap-3 py-1.5 opacity-40">
            <FiCircle className="w-4 h-4 text-gray-300" />
            <span className="text-sm text-gray-400">Session {sessions.length + i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
