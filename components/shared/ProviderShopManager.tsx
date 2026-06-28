'use client'

import { useState } from 'react'
import ProviderInventoryManager from './ProviderInventoryManager'
import ProviderOrdersReceived from './ProviderOrdersReceived'

/** Health Shop seller hub: manage stock (Inventory) and fulfil patient orders
 *  (Orders received) under one tabbed view. */
export default function ProviderShopManager() {
  const [tab, setTab] = useState<'inventory' | 'orders'>('inventory')
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-line">
        {(['inventory', 'orders'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${tab === t ? 'border-[#0C6780] text-[#0C6780]' : 'border-transparent text-soft hover:text-fg'}`}
          >
            {t === 'inventory' ? 'Inventory' : 'Orders received'}
          </button>
        ))}
      </div>
      {tab === 'inventory' ? <ProviderInventoryManager /> : <ProviderOrdersReceived />}
    </div>
  )
}
