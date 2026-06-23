'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaShoppingCart, FaTimes, FaMinus, FaPlus, FaTrash, FaPrescription } from 'react-icons/fa'
import { useCart } from './CartContext'

export default function FloatingCart() {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart, hasRxItems } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Floating button - slot 4: highest position */}
      <button
        onClick={() => setOpen(!open)}
        title="Health Shop"
        aria-label="Health Shop"
        className={`fixed bottom-[336px] sm:bottom-[260px] right-4 sm:right-5 z-[150]
          h-12 w-12 justify-center rounded-full shadow-lg shadow-black/25
          flex items-center text-sm font-semibold
          transition-all hover:scale-105 active:scale-95
          ${totalItems > 0 ? 'bg-[#0C6780] text-white' : 'bg-surface dark:bg-surface border-2 border-line dark:border-line text-faint dark:text-soft hover:border-[#0C6780] hover:text-[#0C6780] dark:hover:text-accent'}`}
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          <FaShoppingCart className="text-base" />
        </span>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            {totalItems}
          </span>
        )}
      </button>

      {/* Empty cart panel */}
      {open && totalItems === 0 && (
        <div className="fixed bottom-[404px] sm:bottom-[328px] right-4 sm:right-5 z-[150] bg-surface rounded-2xl shadow-xl border border-line p-4 w-52">
          <p className="text-sm font-semibold text-fg mb-1">Health Shop</p>
          <p className="text-xs text-soft mb-3">Your cart is empty. Browse products from all providers.</p>
          <Link href="/search/health-shop" className="block w-full text-center bg-[#0C6780] text-white py-2 rounded-xl text-xs font-medium">
            Browse Health Shop
          </Link>
        </div>
      )}

      {/* Cart panel - when items present */}
      {open && totalItems > 0 && (
        <div className="fixed bottom-[404px] sm:bottom-[328px] right-4 sm:right-5 z-[150] w-[360px] max-h-[70vh] bg-surface rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-subtle">
            <h3 className="font-bold text-fg text-sm">Cart ({totalItems} items)</h3>
            <div className="flex items-center gap-2">
              <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
              <button onClick={() => setOpen(false)}><FaTimes className="text-faint" /></button>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-subtle rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-soft">Rs {item.price}</span>
                    {item.requiresPrescription && (
                      <FaPrescription className="text-amber-500 text-[10px]" title="Prescription required" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 rounded bg-line flex items-center justify-center hover:bg-faint/40 text-fg">
                    <FaMinus className="text-[8px]" />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.maxQuantity}
                    className="w-6 h-6 rounded bg-[#0C6780] text-white flex items-center justify-center hover:bg-[#0a5568] disabled:opacity-40">
                    <FaPlus className="text-[8px]" />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1">
                    <FaTrash className="text-[8px]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-subtle space-y-3">
            {hasRxItems && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <FaPrescription /> Some items require a prescription
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-soft">Total</span>
              <span className="text-lg font-bold text-fg">Rs {totalPrice.toLocaleString()}</span>
            </div>
            <Link
              href="/search/health-shop/checkout"
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-[#0C6780] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#0a5568] transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
