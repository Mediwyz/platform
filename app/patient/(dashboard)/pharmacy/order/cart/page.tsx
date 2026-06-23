'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
 FaArrowLeft,
 FaShoppingCart,
 FaPlus,
 FaMinus,
 FaTrash,
 FaWallet,
 FaCheckCircle,
 FaExclamationTriangle,
 FaSpinner,
} from 'react-icons/fa'
import { useCart } from '@/app/search/medicines/contexts/CartContext'

interface WalletData {
 balance: number
 currency: string
}

interface OrderResult {
 orderId: string
 totalAmount: number
 status: string
 itemCount: number
 newBalance: number
 items?: { pharmacyMedicineId: string; name: string; quantity: number; price: number; subtotal: number }[]
}

export default function CheckoutPage() {
 const { cartItems, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart()

 const [walletData, setWalletData] = useState<WalletData | null>(null)
 const [walletLoading, setWalletLoading] = useState(true)
 const [placing, setPlacing] = useState(false)
 const [orderResult, setOrderResult] = useState<OrderResult | null>(null)
 const [error, setError] = useState<string | null>(null)

 const userId = typeof window !== 'undefined'
 ? (() => { try { const u = localStorage.getItem('mediwyz_user'); return u ? JSON.parse(u).id : null } catch { return null } })()
 : null

 const fetchWallet = useCallback(async () => {
 if (!userId) {
 setWalletLoading(false)
 return
 }
 try {
 const res = await fetch(`/api/users/${userId}/wallet`, { credentials: 'include' })
 const json = await res.json()
 if (json.success && json.data) {
 setWalletData({
 balance: json.data.balance,
 currency: json.data.currency || 'MUR',
 })
 }
 } catch (err) {
 console.error('Failed to fetch wallet:', err)
 } finally {
 setWalletLoading(false)
 }
 }, [userId])

 useEffect(() => {
 fetchWallet()
 }, [fetchWallet])

 const subtotal = getTotalPrice()
 const deliveryFee = 0
 const total = subtotal + deliveryFee
 const hasInsufficientBalance = walletData !== null && walletData.balance < total
 const canPlaceOrder = cartItems.length > 0 && !hasInsufficientBalance && !placing && walletData !== null

 const handlePlaceOrder = async () => {
 if (!canPlaceOrder) return

 setPlacing(true)
 setError(null)

 try {
 const orderItems = cartItems.map((item) => ({
 pharmacyMedicineId: String(item.id),
 quantity: item.quantity,
 }))

 const res = await fetch('/api/orders', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ items: orderItems }),
 })

 const json = await res.json()

 if (!res.ok || !json.success) {
 setError(json.message || 'Failed to place order')
 setPlacing(false)
 return
 }

 clearCart()
 setOrderResult({
 orderId: json.data.orderId,
 totalAmount: json.data.totalAmount,
 status: json.data.status,
 itemCount: json.data.items?.length ?? json.data.itemCount ?? 0,
 newBalance: json.data.walletBalance ?? json.data.newBalance ?? 0,
 items: json.data.items,
 })
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An unexpected error occurred')
 } finally {
 setPlacing(false)
 }
 }

 // Order success state
 if (orderResult) {
 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-12">
 <div className="max-w-lg mx-auto bg-surface rounded-2xl shadow-lg p-8 text-center">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaCheckCircle className="text-green-600 text-3xl" />
 </div>
 <h1 className="text-2xl font-bold text-fg mb-2">Order Placed Successfully!</h1>
 <p className="text-soft mb-6">
 Your order has been confirmed and is being processed.
 </p>

 <div className="bg-subtle rounded-xl p-5 mb-6 text-left space-y-3">
 <div className="flex justify-between">
 <span className="text-soft">Order ID</span>
 <span className="font-semibold text-fg">{orderResult.orderId.slice(0, 8)}...</span>
 </div>
 <div className="flex justify-between">
 <span className="text-soft">Items</span>
 <span className="font-semibold text-fg">{orderResult.itemCount}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-soft">Total Paid</span>
 <span className="font-bold text-green-600">Rs {orderResult.totalAmount.toFixed(2)}</span>
 </div>
 <div className="flex justify-between border-t pt-3">
 <span className="text-soft">New Wallet Balance</span>
 <span className="font-semibold text-fg">Rs {orderResult.newBalance.toFixed(2)}</span>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <Link
 href="/patient"
 className="bg-brand-teal transition-all text-center"
 >
 View Orders
 </Link>
 <Link
 href="/patient/search/medicines"
 className="border-2 border-line text-soft py-3 px-6 rounded-lg font-semibold hover:bg-subtle transition-all text-center"
 >
 Continue Shopping
 </Link>
 </div>
 </div>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen to-white">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center gap-4">
 <Link href="/patient/search/medicines" className="text-soft hover:text-green-600">
 <FaArrowLeft className="text-xl" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-fg">Checkout</h1>
 <p className="text-soft text-sm">{cartItems.length} item(s) in your cart</p>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {cartItems.length === 0 ? (
 <div className="max-w-md mx-auto text-center py-16">
 <FaShoppingCart className="text-6xl text-faint mx-auto mb-4" />
 <h2 className="text-xl font-semibold text-soft mb-2">Your cart is empty</h2>
 <p className="text-soft mb-6">Add some medicines to get started.</p>
 <Link
 href="/patient/search/medicines"
 className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
 >
 Browse Medicines
 </Link>
 </div>
 ) : (
 <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left Column -- Cart Items */}
 <div className="lg:col-span-2 space-y-4">
 <h2 className="text-lg font-bold text-fg mb-2">Cart Items</h2>
 {cartItems.map((item) => (
 <div
 key={item.id}
 className="bg-surface rounded-xl shadow-sm border border-line p-5"
 >
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <h3 className="font-semibold text-fg">{item.name}</h3>
 <p className="text-sm text-soft">
 {item.genericName && <span>{item.genericName} &middot; </span>}
 {item.brand}
 </p>
 </div>
 <button
 onClick={() => removeFromCart(item.id)}
 className="text-red-500 hover:text-red-700 p-1"
 title="Remove item"
 >
 <FaTrash />
 </button>
 </div>

 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button
 onClick={() => updateQuantity(item.id, item.quantity - 1)}
 className="w-8 h-8 border border-line rounded-lg flex items-center justify-center hover:bg-subtle transition-colors"
 >
 <FaMinus className="text-xs" />
 </button>
 <span className="font-medium w-10 text-center">{item.quantity}</span>
 <button
 onClick={() => updateQuantity(item.id, item.quantity + 1)}
 className="w-8 h-8 border border-line rounded-lg flex items-center justify-center hover:bg-subtle transition-colors"
 >
 <FaPlus className="text-xs" />
 </button>
 </div>
 <div className="text-right">
 <p className="text-sm text-soft">Rs {item.price} x {item.quantity}</p>
 <p className="font-bold text-green-600">Rs {(item.price * item.quantity).toFixed(2)}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Right Column -- Order Summary */}
 <div className="lg:col-span-1">
 <div className="bg-surface rounded-xl shadow-sm border border-line p-6 sticky top-8">
 <h2 className="text-lg font-bold text-fg mb-4">Order Summary</h2>

 <div className="space-y-3 mb-4">
 <div className="flex justify-between text-soft">
 <span>Subtotal</span>
 <span className="font-medium text-fg">Rs {subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-soft">
 <span>Delivery Fee</span>
 <span className="font-medium text-green-600">Free</span>
 </div>
 <div className="border-t pt-3 flex justify-between">
 <span className="font-bold text-fg">Total</span>
 <span className="font-bold text-xl text-green-600">Rs {total.toFixed(2)}</span>
 </div>
 </div>

 {/* Wallet Balance */}
 <div className="bg-subtle rounded-lg p-4 mb-4">
 <div className="flex items-center gap-2 mb-1">
 <FaWallet className="text-blue-600" />
 <span className="font-semibold text-fg">Wallet Balance</span>
 </div>
 {walletLoading ? (
 <div className="flex items-center gap-2 text-soft text-sm">
 <FaSpinner className="animate-spin" />
 Loading balance...
 </div>
 ) : walletData ? (
 <p className="text-lg font-bold text-fg">
 Rs {walletData.balance.toFixed(2)}
 </p>
 ) : (
 <p className="text-sm text-soft">Wallet not available</p>
 )}
 </div>

 {/* Insufficient balance warning */}
 {hasInsufficientBalance && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
 <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
 <p className="text-sm text-red-700">
 Insufficient trial balance. Your wallet has Rs {walletData!.balance.toFixed(2)} but the order total is Rs {total.toFixed(2)}.
 </p>
 </div>
 )}

 {/* Error */}
 {error && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
 <p className="text-sm text-red-700">{error}</p>
 </div>
 )}

 {/* Place Order Button */}
 <button
 onClick={handlePlaceOrder}
 disabled={!canPlaceOrder}
 className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
 canPlaceOrder
 ? 'bg-brand-teal'
 : 'bg-gray-300 text-soft cursor-not-allowed'
 }`}
 >
 {placing ? (
 <>
 <FaSpinner className="animate-spin" />
 Processing Order...
 </>
 ) : (
 <>
 <FaShoppingCart />
 Place Order - Rs {total.toFixed(2)}
 </>
 )}
 </button>

 <Link
 href="/patient/search/medicines"
 className="block text-center text-green-600 hover:text-green-700 font-medium mt-3 text-sm"
 >
 Continue Shopping
 </Link>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
