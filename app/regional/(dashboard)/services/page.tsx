'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { DashboardLoadingState } from '@/components/dashboard'
import { FiSearch, FiFilter, FiPlus, FiEdit2, FiTrash2, FiLink } from 'react-icons/fi'
import { Icon } from '@iconify/react'
import ServiceWorkflowLinker from '@/components/workflow/ServiceWorkflowLinker'

interface PlatformService {
  id: string
  providerType: string
  serviceName: string
  category: string
  description: string
  defaultPrice: number
  isDefault: boolean
  isActive: boolean
  iconKey?: string | null
  emoji?: string | null
}

interface ProviderRole {
  code: string
  name: string
  color?: string | null
}

export default function RegionalServicesPage() {
  const user = useDashboardUser()
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [providerRoles, setProviderRoles] = useState<ProviderRole[]>([])
  const [filterType, setFilterType] = useState('')
  const [allWorkflows, setAllWorkflows] = useState<unknown[]>([])
  const [deleting, setDeleting] = useState<string | null>(null)

  // Load provider roles for labels and filter options
  useEffect(() => {
    fetch('/api/roles?isProvider=true')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) setProviderRoles(json.data)
      })
      .catch(() => {})
  }, [])

  // Load services from the catalog endpoint
  const loadServices = () => {
    setLoading(true)
    fetch('/api/services/catalog', { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (!json.success || !Array.isArray(json.data)) return
        const flat: PlatformService[] = []
        for (const group of json.data as Array<{ category: string; services: PlatformService[] }>) {
          const parts = (group.category as string).split(' - ')
          const pt = parts[0] || ''
          const cat = parts[1] || group.category
          for (const svc of group.services || []) {
            flat.push({ ...svc, providerType: pt, category: cat, defaultPrice: svc.defaultPrice ?? 0 })
          }
        }
        setServices(flat)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { loadServices() }, [])

  // Load all workflow templates once so ServiceWorkflowLinker can show links per card
  useEffect(() => {
    fetch('/api/workflow/templates', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success && Array.isArray(data.data)) setAllWorkflows(data.data) })
      .catch(() => {})
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate "${name}"? It will no longer appear in the catalog.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/services/admin/${id}`, { method: 'DELETE', credentials: 'include' })
      const json = await res.json()
      if (json.success) setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s))
      else alert(json.message || 'Failed to deactivate')
    } catch { alert('Failed to deactivate') }
    finally { setDeleting(null) }
  }

  const roleLabel = (code: string) => {
    const r = providerRoles.find(r => r.code === code)
    return r?.name || code.replace(/_/g, ' ')
  }

  if (!user) return <DashboardLoadingState />

  const filtered = services.filter(s => {
    if (filterType && s.providerType !== filterType) return false
    if (search && !s.serviceName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const grouped = filtered.reduce<Record<string, PlatformService[]>>((acc, s) => {
    if (!acc[s.providerType]) acc[s.providerType] = []
    acc[s.providerType].push(s)
    return acc
  }, {})

  const filterOptions = providerRoles.length > 0
    ? providerRoles
    : [{ code: '', name: '' }].concat(
        Array.from(new Set(services.map(s => s.providerType)))
          .map(code => ({ code, name: code.replace(/_/g, ' ') }))
      )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage services, assign icons, and link workflow templates.{' '}
            <span className="font-medium text-gray-700">{services.length}</span> services total.
          </p>
        </div>
        <Link
          href="/regional/services/create"
          className="flex items-center gap-2 px-4 py-2 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5a6e] transition-colors shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          Add Service
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30"
          >
            <option value="">All Provider Types</option>
            {filterOptions.filter(r => r.code).map(r => (
              <option key={r.code} value={r.code}>{r.name || r.code.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C6780]" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <FiSearch className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            {search || filterType ? 'No services match your search.' : 'No services in the catalog yet.'}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {search || filterType ? 'Try clearing the filter.' : 'Add the first service to start building workflows.'}
          </p>
          <Link href="/regional/services/create" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0C6780] hover:underline">
            <FiPlus className="w-3.5 h-3.5" /> Create a service
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([providerType, svcs]) => (
            <div key={providerType}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-[#001E40]">{roleLabel(providerType)}</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{svcs.length} service{svcs.length !== 1 ? 's' : ''}</span>
                <Link
                  href={`/regional/workflows/create`}
                  className="ml-auto text-xs text-[#0C6780] hover:underline flex items-center gap-1"
                >
                  <FiLink className="w-3 h-3" /> Add workflow
                </Link>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {svcs.map(svc => (
                  <div
                    key={svc.id}
                    className={`bg-white rounded-xl p-4 border transition-all ${svc.isActive ? 'border-gray-200 hover:border-[#0C6780]/30' : 'border-gray-100 opacity-60'}`}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0C6780]/10 flex items-center justify-center flex-shrink-0">
                          {svc.iconKey ? (
                            <Icon icon={svc.iconKey} width={22} height={22} color="#0C6780" />
                          ) : svc.emoji ? (
                            <span className="text-lg">{svc.emoji}</span>
                          ) : (
                            <Icon icon="healthicons:stethoscope" width={22} height={22} color="#0C6780" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{svc.serviceName}</h3>
                          <p className="text-xs text-gray-500">{svc.category} · Rs {svc.defaultPrice.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${svc.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Link href={`/regional/services/${svc.id}`} className="p-1.5 text-gray-400 hover:text-[#0C6780] rounded" title="Edit">
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(svc.id, svc.serviceName)}
                          disabled={deleting === svc.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded disabled:opacity-40"
                          title="Deactivate"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{svc.description}</p>

                    {/* Linked workflows */}
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">Linked Workflows</p>
                      <ServiceWorkflowLinker
                        serviceId={svc.id}
                        serviceName={svc.serviceName}
                        providerType={svc.providerType}
                        createWorkflowHref="/regional/workflows/create"
                        workflows={allWorkflows as never[]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
