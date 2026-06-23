'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/health-shop/CartContext'
import { useAuth } from '@/hooks/useAuth'
import {
  FaShoppingCart, FaMapMarkerAlt, FaTruck, FaStore,
  FaPrescription, FaCheckCircle, FaSpinner, FaArrowLeft,
  FaMinus, FaPlus, FaTrash, FaWallet,
} from 'react-icons/fa'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, totalItems, totalPrice, hasRxItems, updateQuantity, removeFromCart, clearCart, providerGroups } = useCart()

  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null)
  const [prescriptions, setPrescriptions] = useState<{ id: string; medication: string }[]>([])

  const deliveryFee = deliveryType === 'delivery' ? 150 : 0
  const grandTotal = totalPrice + deliveryFee

  // Fetch wallet balance
  useEffect(() => {
    if (!user) return
    fetch(`/api/users/${user.id}/wallet`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => { if (json.success) setWalletBalance(json.data.balance) })
      .catch(() => {})
  }, [user])

  // Fetch prescriptions if cart has Rx items
  useEffect(() => {
    if (!user || !hasRxItems) return
    fetch(`/api/patients/${user.id}/prescriptions`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setPrescriptions(json.data.map((p: { id: string; medication: string }) => ({ id: p.id, medication: p.medication })))
        }
      })
      .catch(() => {})
  }, [user, hasRxItems])

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/login'); return }
    if (walletBalance !== null && walletBalance < grandTotal) {
      setError(`Insufficient balance. You need Rs ${grandTotal.toLocaleString()} but have Rs ${walletBalance.toLocaleString()}.`)
      return
    }
    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter a delivery address.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Place one order per provider (multi-provider cart  multiple orders)
      const orderIds: string[] = []

      for (const [providerUserId, providerItems] of providerGroups) {
        const res = await fetch('/api/inventory/orders', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerUserId,
            deliveryMethod: deliveryType,
            deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : undefined,
            items: providerItems.map(i => ({
              itemId: i.id,
              quantity: i.quantity,
            })),
          }),
        })

        const json = await res.json()
        if (!json.success) {
          throw new Error(json.message || 'Order failed')
        }
        orderIds.push(json.data?.id || 'unknown')
      }

      setSuccess({ orderId: orderIds.join(', '), total: grandTotal })
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <FaCheckCircle className="text-green-500 text-5xl mx-auto" />
        <h1 className="text-2xl font-bold text-fg">Order Placed!</h1>
        <p className="text-soft">Your order has been placed successfully.</p>
        <p className="text-sm text-faint">Order ID: {success.orderId}</p>
        <p className="text-lg font-bold text-fg">Total: Rs {success.total.toLocaleString()}</p>
        <Link href="/search/health-shop" className="inline-block mt-4 px-6 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5568]">
          Continue Shopping
        </Link>
      </div>
    )
  }

  // Empty cart
  if (totalItems === 0) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <FaShoppingCart className="text-faint text-5xl mx-auto" />
        <h1 className="text-xl font-bold text-fg">Your cart is empty</h1>
        <Link href="/search/health-shop" className="inline-block px-6 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5568]">
          Browse Health Shop
        </Link>
      </div>
    )
  }

  const insufficientBalance = walletBalance !== null && walletBalance < grandTotal

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/search/health-shop" className="text-faint hover:text-soft"><FaArrowLeft /></Link>
        <h1 className="text-2xl font-bold text-fg">Checkout</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface rounded-xl border border-line overflow-hidden">
            <div className="p-4 border-b bg-subtle">
              <h2 className="font-semibold text-fg text-sm">Items ({totalItems})</h2>
            </div>
            <div className="divide-y">
              {items.map(item => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-fg text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-faint mt-0.5">
                      <span>{item.category}</span>
                      {item.requiresPrescription && (
                        <span className="flex items-center gap-0.5 text-amber-600"><FaPrescription className="text-[9px]" /> Rx</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-soft mt-1">Rs {item.price} x {item.quantity} = Rs {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-subtle flex items-center justify-center hover:bg-line"><FaMinus className="text-[10px]" /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.maxQuantity}
                      className="w-7 h-7 rounded-lg bg-[#0C6780] text-white flex items-center justify-center hover:bg-[#0a5568] disabled:opacity-40"><FaPlus className="text-[10px]" /></button>
                    <button onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-2"><FaTrash className="text-[10px]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prescription Notice */}
          {hasRxItems && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2"><FaPrescription /> Prescription Required</h3>
              <p className="text-xs text-amber-700">Some items require a valid prescription. Your prescriptions on file will be verified.</p>
              {prescriptions.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-800">Your prescriptions ({prescriptions.length}):</p>
                  {prescriptions.slice(0, 5).map(p => (
                    <p key={p.id} className="text-xs text-amber-600">- {p.medication}</p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-600 font-medium">No prescriptions found on your profile. Rx items may be rejected.</p>
              )}
            </div>
          )}

          {/* Delivery Options */}
          <div className="bg-surface rounded-xl border border-line p-4 space-y-3">
            <h2 className="font-semibold text-fg text-sm">Delivery Method</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeliveryType('pickup')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${deliveryType === 'pickup' ? 'border-[#0C6780] bg-[#0C6780]/5' : 'border-line hover:border-line'}`}>
                <FaStore className={`text-lg mb-1 ${deliveryType === 'pickup' ? 'text-[#0C6780]' : 'text-faint'}`} />
                <p className="font-medium text-sm text-fg">Pickup</p>
                <p className="text-xs text-soft">Collect from provider</p>
                <p className="text-xs font-medium text-green-600 mt-1">Free</p>
              </button>
              <button onClick={() => setDeliveryType('delivery')}
                className={`p-3 rounded-xl border-2 text-left transition-all ${deliveryType === 'delivery' ? 'border-[#0C6780] bg-[#0C6780]/5' : 'border-line hover:border-line'}`}>
                <FaTruck className={`text-lg mb-1 ${deliveryType === 'delivery' ? 'text-[#0C6780]' : 'text-faint'}`} />
                <p className="font-medium text-sm text-fg">Home Delivery</p>
                <p className="text-xs text-soft">Delivered to your door</p>
                <p className="text-xs font-medium text-soft mt-1">Rs 150</p>
              </button>
            </div>
            {deliveryType === 'delivery' && (
              <div>
                <label className="block text-xs font-medium text-soft mb-1"><FaMapMarkerAlt className="inline mr-1" />Delivery Address</label>
                <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
                  rows={2} placeholder="Enter your full address..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none resize-none" />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-line p-4 space-y-3 sticky top-6">
            <h2 className="font-semibold text-fg text-sm">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-soft">Subtotal ({totalItems} items)</span><span>Rs {totalPrice.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-soft">Delivery</span><span>{deliveryFee > 0 ? `Rs ${deliveryFee}` : 'Free'}</span></div>
              <hr />
              <div className="flex justify-between font-bold text-lg"><span>Total</span><span>Rs {grandTotal.toLocaleString()}</span></div>
            </div>

            {/* Wallet */}
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${insufficientBalance ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <FaWallet className={insufficientBalance ? 'text-red-500' : 'text-green-600'} />
              <div>
                <p className="font-medium">{walletBalance !== null ? `Rs ${walletBalance.toLocaleString()}` : 'Loading...'}</p>
                <p className="text-xs text-soft">Wallet balance</p>
              </div>
            </div>
            {insufficientBalance && (
              <p className="text-xs text-red-600">Insufficient balance. Please top up your wallet.</p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={submitting || insufficientBalance || !user}
              className="w-full py-3 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5568] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? <><FaSpinner className="animate-spin" /> Processing...</> : `Pay Rs ${grandTotal.toLocaleString()}`}
            </button>

            {!user && (
              <p className="text-xs text-center text-faint">Please <Link href="/login" className="text-[#0C6780] underline">log in</Link> to place an order.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
