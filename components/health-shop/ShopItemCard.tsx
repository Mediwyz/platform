'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaPlus, FaMinus, FaShoppingCart, FaPrescription } from 'react-icons/fa'
import { useCart } from './CartContext'
import PrescriptionUploadModal from '@/components/shared/PrescriptionUploadModal'

const CATEGORY_EMOJI: Record<string, string> = {
  medication: '', vitamins: '', first_aid: '', personal_care: '',
  dental_care: '', baby_care: '', nutrition: '', eyewear: '',
  medical_devices: '', monitoring: '', supplements: '', rehab_equipment: '',
  contact_lenses: '',
  prescription_medicines: '', otc_medicines: '', fitness_wellness: '',
  beauty_care: '', ayurveda: '', first_aid_kit: '',
  eye_care: '', dental: '', vitamins_supplements: '',
}

interface Product {
  id: string
  providerUserId: string
  providerType: string
  name: string
  genericName?: string
  category: string
  description?: string
  imageUrl?: string
  unitOfMeasure: string
  strength?: string
  price: number
  quantity: number
  inStock: boolean
  requiresPrescription: boolean
  isFeatured: boolean
  sellerName?: string | null
  sellerType?: 'organisation' | 'provider'
  providerName?: string | null
  organisationName?: string | null
  organisationType?: string | null
}

export default function ShopItemCard({ product, rxMatch = false }: { product: Product; rxMatch?: boolean }) {
  const { items, addToCart, updateQuantity } = useCart()
  const cartItem = items.find(i => i.id === product.id)
  const qtyInCart = cartItem?.quantity || 0

  const [imgError, setImgError] = useState(false)
  const [showRxModal, setShowRxModal] = useState(false)

  const doAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      genericName: product.genericName,
      providerUserId: product.providerUserId,
      providerType: product.providerType,
      category: product.category,
      price: product.price,
      quantity: 1,
      maxQuantity: product.quantity,
      requiresPrescription: product.requiresPrescription,
      unitOfMeasure: product.unitOfMeasure,
    })
  }

  const handleAdd = () => {
    if (product.requiresPrescription) {
      setShowRxModal(true)
      return
    }
    doAddToCart()
  }

  const handleRxConfirmed = (_: string) => {
    doAddToCart()
    setShowRxModal(false)
  }

  return (
    <>
    <div className={`bg-surface rounded-xl border ${rxMatch ? 'border-amber-300 ring-1 ring-amber-200 dark:border-amber-500/40' : product.isFeatured ? 'border-[#0C6780] ring-1 ring-[#0C6780]/20 dark:border-accent/50' : 'border-line'} overflow-hidden hover:shadow-md transition-shadow`}>
      {/* Product image / fallback */}
      {product.imageUrl && !imgError ? (
        <div className="h-32 bg-subtle overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={80}
            height={80}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            style={{ objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-sky-50 to-teal-50 dark:from-subtle dark:to-canvas flex flex-col items-center justify-center gap-1">
          {CATEGORY_EMOJI[product.category] ? (
            <span className="text-4xl">{CATEGORY_EMOJI[product.category]}</span>
          ) : (
            <Image src="/images/logo-icon.svg" alt="MediWyz" width={40} height={40} className="w-10 h-10 opacity-40" />
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-fg text-sm truncate">{product.name}</h3>
            {product.genericName && <p className="text-xs text-faint truncate">{product.genericName}</p>}
            {(product.providerName || product.organisationName) && (
              <p className="text-[11px] text-[#0C6780] dark:text-accent font-medium truncate" title={`${product.providerName ?? ''}${product.organisationName ? `  ${product.organisationName}` : ''}`}>
                {product.providerName ?? 'Provider'}
                {product.organisationName && (
                  <span className="text-faint font-normal">  {product.organisationName}</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {rxMatch && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                 Rx match
              </span>
            )}
            {product.requiresPrescription && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                <FaPrescription className="text-[8px]" /> Rx
              </span>
            )}
            {product.isFeatured && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0C6780]/10 text-[#0C6780] dark:text-accent">Featured</span>
            )}
          </div>
        </div>

        {product.description && (
          <p className="text-xs text-soft line-clamp-2 mb-2">{product.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-faint mb-3">
          <span className="px-1.5 py-0.5 rounded bg-subtle text-soft">{product.category}</span>
          {product.strength && <span>{product.strength}</span>}
          <span className="text-line">|</span>
          <span className={product.inStock ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
            {product.inStock ? `${product.quantity} in stock` : 'Out of stock'}
          </span>
        </div>

        {/* Price + Cart Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-fg">Rs {product.price.toLocaleString()}</span>
            <span className="text-xs text-faint ml-1">/ {product.unitOfMeasure}</span>
          </div>

          {!product.inStock ? (
            <span className="text-xs text-red-400 font-medium">Unavailable</span>
          ) : qtyInCart > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(product.id, qtyInCart - 1)}
                className="w-7 h-7 rounded-lg bg-subtle flex items-center justify-center text-soft hover:bg-line transition-colors"
              >
                <FaMinus className="text-[10px]" />
              </button>
              <span className="text-sm font-bold text-[#0C6780] dark:text-accent w-6 text-center">{qtyInCart}</span>
              <button
                onClick={() => updateQuantity(product.id, qtyInCart + 1)}
                disabled={qtyInCart >= product.quantity}
                className="w-7 h-7 rounded-lg bg-[#0C6780] dark:bg-accent dark:text-[#04121f] flex items-center justify-center text-white hover:bg-[#0a5568] disabled:opacity-40 transition-colors"
              >
                <FaPlus className="text-[10px]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C6780] dark:bg-accent dark:text-[#04121f] text-white rounded-lg text-xs font-medium hover:bg-[#0a5568] transition-colors"
            >
              <FaShoppingCart className="text-[10px]" /> Add
            </button>
          )}
        </div>
      </div>
    </div>

    {showRxModal && (
      <PrescriptionUploadModal
        medicineName={product.name}
        onConfirm={handleRxConfirmed}
        onClose={() => setShowRxModal(false)}
      />
    )}
    </>
  )
}
