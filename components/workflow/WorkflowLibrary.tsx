'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { FiSearch, FiCopy, FiEdit2, FiFilter, FiX, FiUser, FiShield, FiServer, FiBookOpen } from 'react-icons/fi'
import WorkflowStepper from './WorkflowStepper'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

interface LibraryTemplate {
  id: string
  name: string
  slug: string
  description: string | null
  providerType: string
  serviceMode: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  steps: Array<{
    order: number
    statusCode: string
    label: string
    flags?: Record<string, unknown>
    actionsForPatient?: unknown[]
    actionsForProvider?: unknown[]
  }>
  creator:
    | { kind: 'system' }
    | { kind: 'admin'; user: { id: string; firstName: string; lastName: string; userType: string } | null }
    | { kind: 'provider'; user: { id: string; firstName: string; lastName: string; userType: string } | null }
    | { kind: 'unknown' }
  linkedService: { id: string; serviceName: string; defaultPrice: number; currency: string } | null
  statusCodes: string[]
}

interface WorkflowLibraryProps {
  /** Where "Edit" and "Clone & use" should land after the action. Default: auto-detect from pathname. */
  builderPathBase?: string
  /** Current user id (from /api/auth/me) - enables "Mine / Others" quick filter. */
  currentUserId?: string
}

/**
 * Shared library page - BOTH regional admins and providers see every active
 * template (system defaults + admin-authored + provider-authored) and can
 * clone any into their own workspace to customise.
 *
 * No hardcoded role codes: `providerType` filter options come from the
 * distinct set of types in the fetched result. A new `ProviderRole` added
 * by an admin shows up automatically the moment any template targets it.
 */
export default function WorkflowLibrary({ builderPathBase, currentUserId }: WorkflowLibraryProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<LibraryTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterMode, setFilterMode] = useState('')
  const [filterSource, setFilterSource] = useState<'' | 'system' | 'admin' | 'provider'>('')
  const [filterContainsStatus, setFilterContainsStatus] = useState('')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [cloneBusyId, setCloneBusyId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterRole) params.set('providerType', filterRole)
    if (filterMode) params.set('serviceMode', filterMode)
    if (filterSource) params.set('source', filterSource)
    if (filterContainsStatus.trim()) params.set('containsStatus', filterContainsStatus.trim())
    if (search.trim()) params.set('search', search.trim())

    setLoading(true)
    fetch(`/api/workflow/library/browse?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        if (j?.success) setTemplates(j.data)
      })
      .finally(() => setLoading(false))
  }, [search, filterRole, filterMode, filterSource, filterContainsStatus])

  // Extract unique filter options from loaded data - fully DB-driven, no hardcoding
  const roleOptions = useMemo(
    () => Array.from(new Set(templates.map(t => t.providerType).filter(Boolean))).sort(),
    [templates]
  )
  const modeOptions = useMemo(
    () => Array.from(new Set(templates.map(t => t.serviceMode).filter(Boolean))).sort(),
    [templates]
  )

  const visible = useMemo(() => {
    if (scope !== 'mine' || !currentUserId) return templates
    return templates.filter(t =>
      (t.creator.kind === 'provider' && t.creator.user?.id === currentUserId) ||
      (t.creator.kind === 'admin' && t.creator.user?.id === currentUserId)
    )
  }, [templates, scope, currentUserId])

  async function clone(tpl: LibraryTemplate) {
    setCloneBusyId(tpl.id)
    try {
      const res = await fetch(`/api/workflow/templates/${tpl.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `${tpl.name} (my copy)`,
          providerType: tpl.providerType,
          serviceMode: tpl.serviceMode,
        }),
      })
      const j = await res.json()
      if (j.success) {
        toast.success('Cloned - opening editor...')
        const base = builderPathBase ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/regional')
          ? '/regional/workflows'
          : '/provider/doctors/workflows') // fallback; ideally caller passes builderPathBase
        router.push(`${base}/${j.data.id}`)
      } else {
        toast.error(j.message || 'Clone failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setCloneBusyId(null)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setFilterRole('')
    setFilterMode('')
    setFilterSource('')
    setFilterContainsStatus('')
    setScope('all')
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        icon={FiBookOpen}
        title="Workflow Library"
        description="Browse every workflow on the platform — system defaults, regional admin templates, and provider customisations. Clone any to use as your own starting point."
      />

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search name, slug, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none bg-white"
          >
            <option value="">All provider roles</option>
            {roleOptions.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none bg-white"
          >
            <option value="">All service modes</option>
            {modeOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none bg-white"
          >
            <option value="">All sources</option>
            <option value="system">System defaults</option>
            <option value="admin">By regional admins</option>
            <option value="provider">By providers</option>
          </select>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={filterContainsStatus}
            onChange={e => setFilterContainsStatus(e.target.value)}
            placeholder="Contains status (e.g. sample_collected, en_route)"
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none font-mono"
          />
          <div className="inline-flex rounded-lg bg-gray-100 p-1 text-xs font-medium">
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-md ${scope === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >Everyone</button>
            <button
              onClick={() => setScope('mine')}
              disabled={!currentUserId}
              className={`px-3 py-1.5 rounded-md ${scope === 'mine' ? 'bg-white shadow text-gray-900' : 'text-gray-600'} disabled:opacity-50`}
            >Mine</button>
          </div>
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1"
          >
            <FiX className="w-3 h-3" /> Reset
          </button>
          <span className="text-xs text-gray-400 ml-auto">
            {loading ? 'Loading...' : `${visible.length} result${visible.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Cards */}
      {visible.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <FiFilter className="text-4xl text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No workflows match your filters</p>
          <p className="text-sm text-gray-400 mt-1">Try widening the search or resetting the filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map(tpl => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            busy={cloneBusyId === tpl.id}
            canEdit={
              (tpl.creator.kind === 'provider' && tpl.creator.user?.id === currentUserId) ||
              (tpl.creator.kind === 'admin' && tpl.creator.user?.id === currentUserId)
            }
            onClone={() => clone(tpl)}
            onEdit={() => {
              const base = builderPathBase ?? (window.location.pathname.startsWith('/regional')
                ? '/regional/workflows'
                : '/provider/doctors/workflows')
              router.push(`${base}/${tpl.id}`)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({
  tpl, busy, canEdit, onClone, onEdit,
}: {
  tpl: LibraryTemplate
  busy: boolean
  canEdit: boolean
  onClone: () => void
  onEdit: () => void
}) {
  const creator = tpl.creator
  const creatorLabel = creator.kind === 'system'
    ? 'System default'
    : (creator.kind === 'admin' || creator.kind === 'provider') && creator.user
    ? `${creator.user.firstName} ${creator.user.lastName}`
    : 'Unknown'

  const CreatorIcon = tpl.creator.kind === 'system' ? FiServer : tpl.creator.kind === 'admin' ? FiShield : FiUser

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-teal/40 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{tpl.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-gray-500">
            <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded">{tpl.providerType.replace(/_/g, ' ')}</span>
            <span>·</span>
            <span>{tpl.serviceMode}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <CreatorIcon className="w-3 h-3" />
              {creatorLabel}
            </span>
            {tpl.linkedService && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 text-brand-teal">
                  {tpl.linkedService.serviceName}
                </span>
              </>
            )}
          </div>
          {tpl.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{tpl.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1">
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 inline-flex items-center gap-1"
            >
              <FiEdit2 className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            onClick={onClone}
            disabled={busy}
            className="px-2.5 py-1.5 text-xs font-semibold bg-brand-navy hover:bg-brand-teal text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
          >
            <FiCopy className="w-3 h-3" /> {busy ? 'Cloning...' : 'Clone & use'}
          </button>
        </div>
      </div>

      {/* Stepper preview */}
      <WorkflowStepper
        steps={(tpl.steps ?? []).map(s => ({
          order: s.order,
          statusCode: s.statusCode,
          label: s.label,
          flags: s.flags,
          actionsForPatient: s.actionsForPatient,
          actionsForProvider: s.actionsForProvider,
        }))}
        variant="compact"
      />
    </div>
  )
}
