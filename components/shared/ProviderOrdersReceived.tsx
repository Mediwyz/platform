'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiPackage, FiTruck, FiCheckCircle, FiMapPin } from 'react-icons/fi'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'

interface OrderItem { id: string; quantity: number; inventoryItem?: { name?: string } | null }
interface Order {
  id: string
  patientUserId: string
  status: string
  totalAmount: number
  currency?: string
  deliveryType?: string | null
  deliveryAddress?: string | null
  createdAt: string
  items: OrderItem[]
}

const DONE = ['delivered', 'picked_up', 'completed']
const CANCELLED = ['cancelled']

/** Seller-facing "Orders received" view — which patient orders are still to
 *  fulfil vs already delivered, with one-tap status updates. Patients place
 *  orders via the Health Shop / the Wyzo agent; this is the fulfilment side. */
export default function ProviderOrdersReceived() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'done' | 'all'>('pending')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/orders?role=provider', { credentials: 'include' })
      const j = await res.json()
      if (j.success) setOrders(j.data || [])
    } catch { /* */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: string) {
    setBusy(id)
    try {
      await fetch(`/api/inventory/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ status }),
      })
      await load()
    } catch { /* */ } finally { setBusy(null) }
  }

  const pending = orders.filter(o => !DONE.includes(o.status) && !CANCELLED.includes(o.status))
  const done = orders.filter(o => DONE.includes(o.status))
  const shown = filter === 'pending' ? pending : filter === 'done' ? done : orders

  return (
    <div className="space-y-5">
      <DashboardPageHeader icon={FiPackage} title="Orders received" description={`${pending.length} to fulfil · ${done.length} delivered`} />
      <div className="flex gap-2">
        {([['pending', `To fulfil (${pending.length})`], ['done', `Delivered (${done.length})`], ['all', 'All']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${filter === k ? 'bg-[#0C6780] text-white' : 'bg-surface border border-line text-soft hover:border-[#0C6780]'}`}>{label}</button>
        ))}
      </div>
      {loading ? (
        <p className="text-soft text-sm">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center text-soft text-sm">No orders here yet.</div>
      ) : (
        <div className="space-y-3">{shown.map(o => <OrderCard key={o.id} o={o} busy={busy === o.id} onStatus={setStatus} />)}</div>
      )}
    </div>
  )
}

function OrderCard({ o, busy, onStatus }: { o: Order; busy: boolean; onStatus: (id: string, s: string) => void }) {
  const delivery = o.deliveryType === 'delivery'
  const done = DONE.includes(o.status)
  const cancelled = CANCELLED.includes(o.status)
  const statusColor = done ? 'bg-green-100 text-green-700' : cancelled ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{o.items.map(i => `${i.quantity}× ${i.inventoryItem?.name ?? 'item'}`).join(', ')}</p>
          <p className="text-xs text-soft mt-1 flex items-center gap-1">
            {delivery ? <FiTruck className="w-3 h-3 flex-shrink-0" /> : <FiMapPin className="w-3 h-3 flex-shrink-0" />}
            {delivery ? `Delivery → ${o.deliveryAddress ?? 'address pending'}` : 'Pickup at your location'}
          </p>
          <p className="text-[11px] text-faint mt-0.5">{new Date(o.createdAt).toLocaleString()} · Patient #{o.patientUserId.slice(0, 6)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-[#0C6780]">{o.currency || 'Rs'} {o.totalAmount}</p>
          <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor}`}>{o.status.replace(/_/g, ' ')}</span>
        </div>
      </div>
      {!done && !cancelled && (
        <div className="flex gap-2 mt-3">
          {delivery && o.status !== 'delivery_in_progress' && (
            <button disabled={busy} onClick={() => onStatus(o.id, 'delivery_in_progress')} className="text-xs font-semibold text-[#0C6780] border border-[#0C6780]/30 px-3 py-1.5 rounded-lg hover:bg-[#0C6780]/5 disabled:opacity-50 transition">
              Mark dispatched
            </button>
          )}
          <button disabled={busy} onClick={() => onStatus(o.id, delivery ? 'delivered' : 'picked_up')} className="text-xs font-semibold text-white bg-[#0C6780] hover:bg-[#001E40] px-3 py-1.5 rounded-lg inline-flex items-center gap-1 disabled:opacity-50 transition">
            <FiCheckCircle className="w-3 h-3" /> Mark {delivery ? 'delivered' : 'picked up'}
          </button>
        </div>
      )}
    </div>
  )
}
