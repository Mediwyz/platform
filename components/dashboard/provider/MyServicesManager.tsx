'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react'
import {
  FaPlus, FaTrash, FaSearch, FaCheckCircle, FaTimes, FaEdit,
  FaConciergeBell, FaListAlt, FaArrowLeft, FaExclamationTriangle,
  FaCog, FaSave,
} from 'react-icons/fa'
import ServiceIcon from '@/components/shared/ServiceIcon'

const HealthiconPicker = dynamic(() => import('@/components/shared/HealthiconPicker'), { ssr: false })
const WorkflowWizard = dynamic(() => import('@/components/workflow/builder/WorkflowWizard'), { ssr: false })
import type { GeneratedTemplate } from '@/components/workflow/builder/WorkflowWizard'

//  Types 

interface WorkflowStep {
  order: number
  label: string
  statusCode: string
}

interface WorkflowTemplate {
  id: string
  name: string
  serviceMode: string
  steps: WorkflowStep[]
  isDefault?: boolean
  createdByAdminId?: string | null
  createdByProviderId?: string | null
}

interface ServiceConfig {
  id: string
  platformServiceId: string
  priceOverride: number | null
  isActive: boolean
  workflows: WorkflowTemplate[]
  platformService: {
    id: string
    serviceName: string
    category: string
    description: string | null
    defaultPrice: number
    duration: number | null
    iconKey: string | null
    emoji: string | null
    currency: string
  }
}

interface CatalogService {
  id: string
  serviceName: string
  defaultPrice: number
  description: string | null
  duration: number | null
  iconKey: string | null
  emoji: string | null
}

interface CatalogGroup {
  category: string
  services: CatalogService[]
}

//  Constants 

const MODE_LABEL: Record<string, string> = {
  office: 'In-Person', home: 'Home Visit', video: 'Video Call',
}
const MODE_COLOR: Record<string, string> = {
  office: 'bg-sky-100 text-sky-700 border-sky-200',
  home:   'bg-orange-100 text-orange-700 border-orange-200',
  video:  'bg-purple-100 text-purple-700 border-purple-200',
}
const MODE_EMOJI: Record<string, string> = {
  office: '', home: '', video: '',
}

//  Main Component 

export default function MyServicesManager({ providerType }: { providerType: string; slug?: string }) {
  //  State 
  const [configs, setConfigs] = useState<ServiceConfig[]>([])
  const [catalogGroups, setCatalogGroups] = useState<CatalogGroup[]>([])
  const [availableTemplates, setAvailableTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Panel views
  type Panel = 'list' | 'add-catalog' | 'create-service' | 'create-wizard' | 'manage-workflows' | 'edit-price'
  const [panel, setPanel] = useState<Panel>('list')

  // Catalog add flow
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedCatalogSvc, setSelectedCatalogSvc] = useState<CatalogService | null>(null)
  const [newPriceOverride, setNewPriceOverride] = useState('')
  const [newWorkflowIds, setNewWorkflowIds] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // Manage workflows for existing service
  const [managingConfig, setManagingConfig] = useState<ServiceConfig | null>(null)
  const [managedWorkflowIds, setManagedWorkflowIds] = useState<Set<string>>(new Set())

  // Edit price for existing service
  const [editingConfig, setEditingConfig] = useState<ServiceConfig | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')

  // Create custom service form
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createCategory, setCreateCategory] = useState('')
  const [createEmoji, setCreateEmoji] = useState('')
  const [createIconKey, setCreateIconKey] = useState('')
  const [createImageUrl, setCreateImageUrl] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [createPrice, setCreatePrice] = useState('')
  const [createDuration, setCreateDuration] = useState('')
  // Appointment-type step: build a new workflow with the wizard, or pick existing.
  const [createMode, setCreateMode] = useState<'wizard' | 'pick'>('wizard')

  //  Data fetchers 

  const fetchMyServices = useCallback(async () => {
    try {
      const res = await fetch('/api/services/my-services', { credentials: 'include' })
      const j = await res.json()
      if (j.success) setConfigs(j.data ?? [])
    } catch { /* non-fatal */ }
    finally { setLoading(false) }
  }, [])

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch(`/api/services/catalog?providerType=${providerType}`)
      const j = await res.json()
      if (j.success) setCatalogGroups(j.data ?? [])
    } catch { /* non-fatal */ }
  }, [providerType])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/workflow/templates?providerType=${providerType}`, { credentials: 'include' })
      const j = await res.json()
      if (j.success) setAvailableTemplates(j.data ?? [])
    } catch { /* non-fatal */ }
  }, [providerType])

  useEffect(() => {
    fetchMyServices()
    fetchCatalog()
    fetchTemplates()
  }, [fetchMyServices, fetchCatalog, fetchTemplates])

  //  Toast helper 

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  //  Derived 

  // Services already offered by this provider (by platformServiceId)
  const offeredIds = useMemo(() => new Set(configs.filter(c => c.isActive).map(c => c.platformServiceId)), [configs])

  // All catalog services, filtered only by search query
  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.toLowerCase()
    return catalogGroups.map(group => ({
      ...group,
      services: group.services.filter(s =>
        !q || s.serviceName.toLowerCase().includes(q)
      ),
    })).filter(g => g.services.length > 0)
  }, [catalogGroups, catalogSearch])

  // Active configs
  const activeConfigs = configs.filter(c => c.isActive)

  //  Handlers 

  function openAddCatalog() {
    setCatalogSearch('')
    setSelectedCatalogSvc(null)
    setNewPriceOverride('')
    setNewWorkflowIds(new Set())
    setPanel('add-catalog')
  }

  function openCreateService() {
    setCreateName('')
    setCreateDescription('')
    setCreateCategory('')
    setCreateEmoji('')
    setCreatePrice('')
    setCreateDuration('')
    setPanel('create-service')
  }

  function resetCreateForm() {
    setCreateName(''); setCreateDescription(''); setCreateCategory('')
    setCreateEmoji(''); setCreateIconKey(''); setCreateImageUrl('')
    setCreatePrice(''); setCreateDuration('')
  }

  // Final step: persist the service together with the wizard-generated workflow
  // so it's published, linked and instantly bookable.
  async function handleCreateService(workflow: GeneratedTemplate) {
    if (!createName.trim()) { showToast('error', 'Service name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/services/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
          category: createCategory.trim() || undefined,
          iconKey: createIconKey || undefined,
          imageUrl: createImageUrl || undefined,
          emoji: createEmoji.trim() || undefined,
          price: createPrice ? Number(createPrice) : undefined,
          duration: createDuration ? Number(createDuration) : undefined,
          workflow: {
            name: workflow.name,
            description: workflow.description,
            serviceMode: workflow.serviceMode,
            paymentTiming: workflow.paymentTiming,
            steps: workflow.steps,
            transitions: workflow.transitions,
            serviceConfig: workflow.serviceConfig,
          },
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', `"${createName}" created and ready to book`)
      resetCreateForm()
      setPanel('list')
      fetchMyServices()
      fetchCatalog()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to create service')
    } finally {
      setSaving(false)
    }
  }

  // Alternative to the wizard: create the service linked to EXISTING workflows
  // the provider picked (one or more appointment types).
  async function handleCreateServiceWithExisting() {
    if (!createName.trim()) { showToast('error', 'Service name is required'); return }
    if (newWorkflowIds.size === 0) { showToast('error', 'Pick at least one appointment type'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/services/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim() || undefined,
          category: createCategory.trim() || undefined,
          iconKey: createIconKey || undefined,
          imageUrl: createImageUrl || undefined,
          emoji: createEmoji.trim() || undefined,
          price: createPrice ? Number(createPrice) : undefined,
          duration: createDuration ? Number(createDuration) : undefined,
          workflowTemplateIds: [...newWorkflowIds],
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', `"${createName}" created and ready to book`)
      resetCreateForm()
      setNewWorkflowIds(new Set())
      setPanel('list')
      fetchMyServices()
      fetchCatalog()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to create service')
    } finally {
      setSaving(false)
    }
  }

  function openManageWorkflows(config: ServiceConfig) {
    setManagingConfig(config)
    setManagedWorkflowIds(new Set(config.workflows.map(w => w.id)))
    setPanel('manage-workflows')
  }

  function openEditPrice(config: ServiceConfig) {
    setEditingConfig(config)
    setEditPriceValue(config.priceOverride != null ? String(config.priceOverride) : '')
    setPanel('edit-price')
  }

  function toggleNewWorkflow(id: string) {
    setNewWorkflowIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleManagedWorkflow(id: string) {
    setManagedWorkflowIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  async function handleAddService() {
    if (!selectedCatalogSvc) return
    if (newWorkflowIds.size === 0) {
      showToast('error', 'Select at least one appointment type (workflow) to continue')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/services/my-services/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platformServiceId: selectedCatalogSvc.id,
          priceOverride: newPriceOverride ? Number(newPriceOverride) : undefined,
          workflowTemplateIds: [...newWorkflowIds],
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', `"${selectedCatalogSvc.serviceName}" added to your services`)
      setPanel('list')
      fetchMyServices()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to add service')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveWorkflows() {
    if (!managingConfig) return
    if (managedWorkflowIds.size === 0) {
      showToast('error', 'At least one appointment type is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/services/my-services/${managingConfig.platformServiceId}/workflows`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workflowTemplateIds: [...managedWorkflowIds] }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', 'Appointment types updated')
      setPanel('list')
      fetchMyServices()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handleSavePrice() {
    if (!editingConfig) return
    setSaving(true)
    try {
      const res = await fetch('/api/services/my-services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          configId: editingConfig.id,
          priceOverride: editPriceValue !== '' ? Number(editPriceValue) : null,
        }),
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', 'Price updated')
      setPanel('list')
      fetchMyServices()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to update price')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveService(config: ServiceConfig) {
    if (!confirm(`Remove "${config.platformService.serviceName}" from your services? Patients will no longer be able to book this.`)) return
    try {
      const res = await fetch(`/api/services/my-services/${config.platformServiceId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const j = await res.json()
      if (!j.success) throw new Error(j.message)
      showToast('success', 'Service removed')
      fetchMyServices()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to remove service')
    }
  }

  //  Render 

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[500] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          {toast.text}
          <button onClick={() => setToast(null)} className="ml-1 opacity-80 hover:opacity-100"><FaTimes /></button>
        </div>
      )}

      {/*  Header  */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {panel !== 'list' && (
            <button
              onClick={() => setPanel('list')}
              className="flex items-center gap-2 text-sm text-soft hover:text-[#0C6780] mb-2 transition-colors"
            >
              <FaArrowLeft className="text-xs" /> Back to My Services
            </button>
          )}

          <h1 className="text-2xl font-bold text-[#001E40]">
            {panel === 'list'             && 'My Services'}
            {panel === 'add-catalog'      && 'Add from Catalog'}
            {panel === 'create-service'   && 'Create a Service'}
            {panel === 'manage-workflows' && 'Appointment Types'}
            {panel === 'edit-price'       && 'Edit Price'}
          </h1>
          <p className="text-sm text-faint mt-0.5">
            {panel === 'list'             && `${activeConfigs.length} service${activeConfigs.length !== 1 ? 's' : ''} - patients see these when booking`}
            {panel === 'add-catalog'      && 'Pick any service from the catalog and choose which appointment types you offer'}
            {panel === 'create-service'   && 'Create a new service template shared with all providers of your type'}
            {panel === 'manage-workflows' && `Appointment types patients can choose for "${managingConfig?.platformService.serviceName}"`}
            {panel === 'edit-price'       && `Override the default price for "${editingConfig?.platformService.serviceName}"`}
          </p>
        </div>
      </div>

      {/*  */}
      {/* PANEL: LIST                                                        */}
      {/*  */}
      {panel === 'list' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse bg-subtle rounded-2xl h-48" />
            ))}
          </div>
        ) : activeConfigs.length === 0 ? (
          <EmptyServicesState onAdd={openAddCatalog} onCreate={openCreateService} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeConfigs.map(config => (
              <ServiceCard
                key={config.id}
                config={config}
                onManageWorkflows={() => openManageWorkflows(config)}
                onEditPrice={() => openEditPrice(config)}
                onRemove={() => handleRemoveService(config)}
              />
            ))}
            {/* Add from catalog tile */}
            <button
              onClick={openAddCatalog}
              className="flex flex-col items-center justify-center gap-3 min-h-[180px] rounded-2xl border-2 border-dashed border-line
                hover:border-[#0C6780] hover:bg-[#0C6780]/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-subtle group-hover:bg-[#0C6780]/15 flex items-center justify-center transition-colors">
                <FaListAlt className="text-faint group-hover:text-[#0C6780] transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-soft group-hover:text-[#0C6780] transition-colors">Add from catalog</p>
                <p className="text-xs text-faint mt-0.5">Platform &amp; shared services</p>
              </div>
            </button>
            {/* Create service tile */}
            <button
              onClick={openCreateService}
              className="flex flex-col items-center justify-center gap-3 min-h-[180px] rounded-2xl border-2 border-dashed border-line
                hover:border-purple-400 hover:bg-purple-50/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-subtle group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                <FaPlus className="text-faint group-hover:text-purple-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-soft group-hover:text-purple-600 transition-colors">Create a service</p>
                <p className="text-xs text-faint mt-0.5">Share with other providers</p>
              </div>
            </button>
          </div>
        )
      )}

      {/*  */}
      {/* PANEL: ADD FROM CATALOG                                            */}
      {/*  */}
      {panel === 'add-catalog' && (
        <div className="space-y-5">
          {!selectedCatalogSvc ? (
            <>
              {/* Step 1: pick a service from catalog */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-surface">
                <FaSearch className="text-faint text-sm" />
                <input
                  type="text"
                  placeholder="Search services"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="flex-1 text-sm outline-none bg-transparent"
                  autoFocus
                />
              </div>

              {filteredCatalog.length === 0 ? (
                <div className="text-center py-12 text-faint">
                  <FaConciergeBell className="text-3xl mx-auto mb-3" />
                  <p className="text-sm">No services match your search.</p>
                  <button onClick={openCreateService} className="mt-3 text-sm font-semibold text-[#0C6780] hover:underline">
                    Create a new service 
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCatalog.map(group => (
                    <div key={group.category}>
                      <p className="text-xs font-bold text-faint uppercase tracking-wider mb-2 px-1">
                        {group.category.replace(/^[A-Z_]+\s - \s/, '')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.services.map(svc => {
                          const alreadyAdded = offeredIds.has(svc.id)
                          const existingConfig = configs.find(c => c.platformServiceId === svc.id && c.isActive)
                          return (
                            <button
                              key={svc.id}
                              onClick={() => {
                                if (alreadyAdded && existingConfig) {
                                  openManageWorkflows(existingConfig)
                                } else {
                                  setSelectedCatalogSvc(svc)
                                  setNewWorkflowIds(new Set())
                                }
                              }}
                              className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                                alreadyAdded
                                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                                  : 'border-line bg-surface hover:border-[#0C6780]/60 hover:bg-[#0C6780]/5'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-[#0C6780]/10 flex items-center justify-center flex-shrink-0">
                                {svc.emoji ? (
                                  <span className="text-xl">{svc.emoji}</span>
                                ) : svc.iconKey ? (
                                  <Icon icon={svc.iconKey} width={24} height={24} color="#0C6780" />
                                ) : (
                                  <FaConciergeBell className="text-[#0C6780]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#001E40] truncate">{svc.serviceName}</p>
                                <p className="text-xs text-faint">Rs {svc.defaultPrice.toLocaleString()}
                                  {svc.duration ? `  ${svc.duration}m` : ''}
                                </p>
                              </div>
                              {alreadyAdded && (
                                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  <FaCheckCircle className="text-[9px]" /> Added
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Step 2: configure workflows + price */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#0C6780]/8 rounded-xl border border-[#0C6780]/20">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center flex-shrink-0 shadow-sm">
                  {selectedCatalogSvc.emoji ? (
                    <span className="text-xl">{selectedCatalogSvc.emoji}</span>
                  ) : selectedCatalogSvc.iconKey ? (
                    <Icon icon={selectedCatalogSvc.iconKey} width={22} height={22} color="#0C6780" />
                  ) : (
                    <FaConciergeBell className="text-[#0C6780]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#001E40]">{selectedCatalogSvc.serviceName}</p>
                  <p className="text-xs text-soft">Default price: Rs {selectedCatalogSvc.defaultPrice.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedCatalogSvc(null)}
                  className="text-xs text-faint hover:text-soft underline"
                >
                  Change
                </button>
              </div>

              {/* Workflow selection */}
              <div>
                <p className="text-sm font-semibold text-[#001E40] mb-1">
                  Appointment types <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-faint mb-3">
                  Choose how patients can book this service. At least one is required.
                </p>
                <WorkflowSelector
                  templates={availableTemplates}
                  selectedIds={newWorkflowIds}
                  onToggle={toggleNewWorkflow}
                />
              </div>

              {/* Price override */}
              <div>
                <p className="text-sm font-semibold text-[#001E40] mb-1">Your price (optional)</p>
                <p className="text-xs text-faint mb-2">Leave blank to use the default price of Rs {selectedCatalogSvc.defaultPrice.toLocaleString()}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-soft font-medium">Rs</span>
                  <input
                    type="number"
                    value={newPriceOverride}
                    onChange={e => setNewPriceOverride(e.target.value)}
                    placeholder={String(selectedCatalogSvc.defaultPrice)}
                    className="w-40 px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 pt-2 border-t border-line">
                <button
                  onClick={() => setSelectedCatalogSvc(null)}
                  className="px-4 py-2.5 text-sm text-soft bg-subtle rounded-xl hover:bg-line transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAddService}
                  disabled={saving || newWorkflowIds.size === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold
                    hover:bg-[#0a5a6e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
                  ) : (
                    <><FaPlus className="text-xs" /> Add to My Services</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/*  */}
      {/* PANEL: MANAGE WORKFLOWS                                            */}
      {/*  */}
      {panel === 'manage-workflows' && managingConfig && (
        <div className="space-y-5">
          <p className="text-xs text-faint">
            These define what appointment types patients can choose when they book this service from you.
            Changes take effect immediately for new bookings.
          </p>

          <WorkflowSelector
            templates={availableTemplates}
            selectedIds={managedWorkflowIds}
            onToggle={toggleManagedWorkflow}
          />

          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <button
              onClick={() => setPanel('list')}
              className="px-4 py-2.5 text-sm text-soft bg-subtle rounded-xl hover:bg-line transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveWorkflows}
              disabled={saving || managedWorkflowIds.size === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold
                hover:bg-[#0a5a6e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
              ) : (
                <><FaSave className="text-xs" /> Save Appointment Types</>
              )}
            </button>
          </div>
        </div>
      )}

      {/*  */}
      {/* PANEL: CREATE CUSTOM SERVICE                                       */}
      {/*  */}
      {panel === 'create-service' && (
        <div className="max-w-lg space-y-5">
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800">
            <strong>Shared template:</strong> this service will be visible to all providers of your type and can be added to their catalog too.
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Service name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="e.g. Home Blood Pressure Check"
                className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Service icon</label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full px-3 py-2 border border-line rounded-xl text-sm flex items-center gap-2.5 hover:border-[#0C6780] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                >
                  <span className="w-9 h-9 rounded-lg bg-[#0C6780]/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <ServiceIcon
                      serviceName={createName}
                      category={createCategory}
                      iconKey={createIconKey}
                      imageUrl={createImageUrl}
                      size={22}
                    />
                  </span>
                  <span className="text-soft">
                    {createImageUrl ? 'Custom image' : createIconKey ? createIconKey.split('/')[1]?.replace(/_/g, ' ') : 'Choose an icon'}
                  </span>
                </button>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Category</label>
                <input
                  type="text"
                  value={createCategory}
                  onChange={e => setCreateCategory(e.target.value)}
                  placeholder="e.g. Consultation"
                  className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                />
              </div>
            </div>

            {showIconPicker && (
              <HealthiconPicker
                value={createIconKey}
                onSelectIcon={(p) => { setCreateIconKey(p); setCreateImageUrl('') }}
                onSelectImage={(url) => { setCreateImageUrl(url); setCreateIconKey('') }}
                onClose={() => setShowIconPicker(false)}
              />
            )}

            <div>
              <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Description</label>
              <textarea
                value={createDescription}
                onChange={e => setCreateDescription(e.target.value)}
                placeholder="What does this service include?"
                rows={2}
                className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Default price (Rs)</label>
                <input
                  type="number"
                  value={createPrice}
                  onChange={e => setCreatePrice(e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Duration (minutes)</label>
                <input
                  type="number"
                  value={createDuration}
                  onChange={e => setCreateDuration(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <button onClick={() => { resetCreateForm(); setPanel('list') }} className="px-4 py-2.5 text-sm text-soft bg-subtle rounded-xl hover:bg-line transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { if (!createName.trim()) { showToast('error', 'Service name is required'); return } setPanel('create-wizard') }}
              disabled={!createName.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold
                hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next: appointment type 
            </button>
          </div>
          <p className="text-xs text-faint text-center">Step 1 of 2  next you&apos;ll set how this service is delivered</p>
        </div>
      )}

      {/*  */}
      {/* PANEL: CREATE SERVICE  STEP 2, WORKFLOW WIZARD                    */}
      {/* The provider configures the appointment type; the wizard generates */}
      {/* a workflow that is published + linked when the service is created.  */}
      {/*  */}
      {panel === 'create-wizard' && (
        <div className="space-y-4">
          <button
            onClick={() => setPanel('create-service')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-soft hover:text-[#0C6780] transition-colors"
          >
            <FaArrowLeft className="text-xs" /> Back to service details
          </button>
          <div className="px-4 py-3 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-sm font-semibold text-[#001E40]">{createName || 'New service'}</p>
            <p className="text-xs text-soft">Step 2 of 2  choose how patients book this service</p>
          </div>

          {/* Mode toggle: build a fresh workflow with the wizard, or reuse existing ones */}
          <div className="inline-flex p-1 bg-subtle rounded-xl">
            <button
              onClick={() => setCreateMode('wizard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${createMode === 'wizard' ? 'bg-surface text-[#0C6780] shadow-sm' : 'text-soft hover:text-fg'}`}
            >
              Configure with wizard
            </button>
            <button
              onClick={() => setCreateMode('pick')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${createMode === 'pick' ? 'bg-surface text-[#0C6780] shadow-sm' : 'text-soft hover:text-fg'}`}
            >
              Pick existing workflow
            </button>
          </div>

          {createMode === 'wizard' ? (
            <WorkflowWizard
              providerType={providerType}
              saveLabel="Create service"
              hideBuilderButton
              onCancel={() => setPanel('create-service')}
              onComplete={() => { /* builder button hidden in this flow */ }}
              onSave={async (generated) => { await handleCreateService(generated) }}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-soft">
                Choose one or more appointment types (workflows) patients can book for this service.
              </p>
              <WorkflowSelector
                templates={availableTemplates}
                selectedIds={newWorkflowIds}
                onToggle={toggleNewWorkflow}
              />
              <button
                onClick={handleCreateServiceWithExisting}
                disabled={saving || newWorkflowIds.size === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0C6780] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5568] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating' : `Create service${newWorkflowIds.size > 0 ? ` (${newWorkflowIds.size} type${newWorkflowIds.size !== 1 ? 's' : ''})` : ''}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/*  */}
      {/* PANEL: EDIT PRICE                                                  */}
      {/*  */}
      {panel === 'edit-price' && editingConfig && (
        <div className="max-w-sm space-y-5">
          <div className="px-4 py-3 bg-subtle rounded-xl border border-line">
            <p className="text-xs text-faint mb-0.5">Platform default</p>
            <p className="text-base font-bold text-soft">
              Rs {editingConfig.platformService.defaultPrice.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#001E40] mb-1.5 block">Your price (Rs)</label>
            <p className="text-xs text-faint mb-2">Leave blank to use the platform default price.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-soft font-medium">Rs</span>
              <input
                type="number"
                value={editPriceValue}
                onChange={e => setEditPriceValue(e.target.value)}
                placeholder={String(editingConfig.platformService.defaultPrice)}
                className="flex-1 px-3 py-2.5 border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30"
                autoFocus
              />
            </div>
            {editPriceValue && (
              <button
                onClick={() => setEditPriceValue('')}
                className="mt-1.5 text-xs text-faint hover:text-soft underline"
              >
                Reset to default
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-line">
            <button onClick={() => setPanel('list')} className="px-4 py-2.5 text-sm text-soft bg-subtle rounded-xl hover:bg-line transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSavePrice}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold
                hover:bg-[#0a5a6e] transition-colors disabled:opacity-40"
            >
              {saving ? (
                <span className="flex gap-1">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
              ) : (
                <><FaSave className="text-xs" /> Save Price</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

//  Service Card 

function ServiceCard({
  config, onManageWorkflows, onEditPrice, onRemove,
}: {
  config: ServiceConfig
  onManageWorkflows: () => void
  onEditPrice: () => void
  onRemove: () => void
}) {
  const svc = config.platformService
  const price = config.priceOverride ?? svc.defaultPrice
  const hasPriceOverride = config.priceOverride != null

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      {/* Illustration header */}
      <div className="h-20 bg-gradient-to-br from-[#0C6780]/10 to-sky-50 flex items-center justify-center relative">
        {svc.emoji ? (
          <span className="text-4xl select-none">{svc.emoji}</span>
        ) : svc.iconKey ? (
          <Icon icon={svc.iconKey} width={40} height={40} color="#0C6780" />
        ) : (
          <FaConciergeBell className="text-3xl text-[#0C6780]/40" />
        )}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0C6780]" />
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Title row */}
        <div>
          <h3 className="font-bold text-[#001E40] text-sm leading-tight line-clamp-2">{svc.serviceName}</h3>
          <span className="text-[10px] text-[#0C6780] font-semibold uppercase tracking-wider">{svc.category}</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-[#001E40]">Rs {price.toLocaleString()}</span>
          {hasPriceOverride && (
            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold">YOUR PRICE</span>
          )}
          {svc.duration && <span className="text-xs text-faint ml-auto">{svc.duration}m</span>}
        </div>

        {/* Workflow chips */}
        <div>
          <p className="text-[10px] font-semibold text-faint uppercase tracking-wider mb-1.5">Appointment types</p>
          {config.workflows.length === 0 ? (
            <button
              onClick={onManageWorkflows}
              className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors w-full justify-center"
            >
              <FaExclamationTriangle className="text-[10px]" /> No appointment types - tap to set
            </button>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {config.workflows.map(wf => (
                <span
                  key={wf.id}
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${MODE_COLOR[wf.serviceMode] ?? 'bg-subtle text-soft border-line'}`}
                >
                  {MODE_EMOJI[wf.serviceMode] ?? ''} {MODE_LABEL[wf.serviceMode] ?? wf.serviceMode}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-line mt-auto">
          <button
            onClick={onManageWorkflows}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold
              text-[#0C6780] bg-[#0C6780]/8 hover:bg-[#0C6780]/15 transition-colors"
            title="Manage appointment types"
          >
            <FaCog className="text-[10px]" /> Appt. Types
          </button>
          <button
            onClick={onEditPrice}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold
              text-soft bg-subtle hover:bg-line transition-colors"
            title="Edit price"
          >
            <FaEdit className="text-[10px]" /> Price
          </button>
          <button
            onClick={onRemove}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-faint hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Remove service"
          >
            <FaTrash className="text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

//  Workflow Selector 

function WorkflowSelector({
  templates, selectedIds, onToggle,
}: {
  templates: WorkflowTemplate[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-8 bg-amber-50 rounded-2xl border border-amber-200">
        <FaExclamationTriangle className="text-amber-500 text-2xl mx-auto mb-2" />
        <p className="text-sm font-semibold text-amber-800">No workflow templates found</p>
        <p className="text-xs text-amber-600 mt-1">A regional admin must create workflow templates for your role before you can offer services.</p>
      </div>
    )
  }

  // Group by serviceMode
  const grouped = templates.reduce<Record<string, WorkflowTemplate[]>>((acc, t) => {
    const key = t.serviceMode ?? 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([mode, wfs]) => (
        <div key={mode}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{MODE_EMOJI[mode] ?? ''}</span>
            <p className="text-xs font-bold text-soft uppercase tracking-wider">
              {MODE_LABEL[mode] ?? mode}
            </p>
          </div>
          <div className="space-y-2">
            {wfs.map(wf => {
              const selected = selectedIds.has(wf.id)
              const source = wf.createdByAdminId ? 'Regional Admin' : wf.isDefault ? 'Platform Default' : 'Custom'
              const steps = Array.isArray(wf.steps) ? wf.steps : []
              return (
                <button
                  key={wf.id}
                  onClick={() => onToggle(wf.id)}
                  className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all duration-150
                    ${selected
                      ? 'border-[#0C6780] shadow-sm shadow-[#0C6780]/15'
                      : 'border-line hover:border-line'}`}
                >
                  {/* Header */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${selected ? 'bg-[#0C6780]/5' : 'bg-surface'}`}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: selected ? '#0C678018' : '#F3F4F6' }}
                    >
                      {MODE_EMOJI[mode] ?? ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${selected ? 'text-[#0C6780]' : 'text-[#001E40]'}`}>{wf.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MODE_COLOR[mode] ?? 'bg-subtle text-soft border-line'} border`}>
                          {MODE_LABEL[mode] ?? mode}
                        </span>
                        <span className="text-[10px] text-faint">{source}  {steps.length} steps</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
                      ${selected ? 'bg-[#0C6780] border-[#0C6780]' : 'border-line bg-surface'}`}>
                      {selected && <FaCheckCircle className="text-white text-[10px]" />}
                    </div>
                  </div>

                  {/* Steps timeline - visible when selected */}
                  {selected && steps.length > 0 && (
                    <div className="px-4 pb-3 pt-1 bg-subtle border-t border-line">
                      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                        {steps.slice(0, 6).map((step, i) => (
                          <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
                              ${i === 0 ? 'bg-[#0C6780] text-white' : i === steps.length - 1 ? 'bg-emerald-500 text-white' : 'bg-line text-soft'}`}>
                              {step.label}
                            </span>
                            {i < steps.length - 1 && <span className="text-faint text-[10px]"></span>}
                          </div>
                        ))}
                        {steps.length > 6 && <span className="text-[10px] text-faint flex-shrink-0">+{steps.length - 6} more</span>}
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

//  Empty State 

function EmptyServicesState({ onAdd, onCreate }: { onAdd: () => void; onCreate: () => void }) {
  return (
    <div className="text-center py-16 bg-surface rounded-2xl border-2 border-dashed border-line">
      <div className="w-16 h-16 bg-[#0C6780]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FaListAlt className="text-[#0C6780] text-2xl" />
      </div>
      <h3 className="text-base font-bold text-[#001E40] mb-1">No services yet</h3>
      <p className="text-sm text-faint max-w-xs mx-auto mb-5">
        Add from the service catalog or create your own. For each service, you choose which appointment types patients can book.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-semibold hover:bg-[#0a5a6e] transition-colors"
        >
          <FaListAlt className="text-xs" /> Add from catalog
        </button>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-purple-300 text-purple-600 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-colors"
        >
          <FaPlus className="text-xs" /> Create new
        </button>
      </div>
    </div>
  )
}
