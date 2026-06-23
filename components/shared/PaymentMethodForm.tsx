'use client'

import { useState } from 'react'
import {
 FaCreditCard,
 FaMobileAlt,
 FaPlus,
 FaTrash,
 FaSave,
 FaCheckCircle,
 FaInfoCircle,
} from 'react-icons/fa'

export interface PaymentMethod {
 id: string
 type: 'credit_card' | 'mcb_juice'
 label: string
 details: string
 isDefault: boolean
}

interface PaymentMethodFormProps {
 methods?: PaymentMethod[]
 onSave?: (methods: PaymentMethod[]) => void
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
 methods: initialMethods = [],
 onSave,
}) => {
 const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)
 const [showAddForm, setShowAddForm] = useState(false)
 const [addType, setAddType] = useState<'credit_card' | 'mcb_juice'>('credit_card')
 const [cardNumber, setCardNumber] = useState('')
 const [cardHolder, setCardHolder] = useState('')
 const [expiry, setExpiry] = useState('')
 const [cvv, setCvv] = useState('')
 const [juicePhone, setJuicePhone] = useState('')

 const setDefault = (id: string) => {
 setMethods((prev) =>
 prev.map((m) => ({ ...m, isDefault: m.id === id }))
 )
 }

 const removeMethod = (id: string) => {
 setMethods((prev) => prev.filter((m) => m.id !== id))
 }

 const addMethod = () => {
 const newId = `pm_${Date.now()}`
 if (addType === 'credit_card') {
 if (!cardNumber || !cardHolder || !expiry) return
 const last4 = cardNumber.replace(/\s/g, '').slice(-4)
 setMethods((prev) => [
 ...prev,
 { id: newId, type: 'credit_card', label: `Card ending in ${last4}`, details: `${cardHolder} - Exp ${expiry}`, isDefault: prev.length === 0 },
 ])
 } else {
 if (!juicePhone) return
 setMethods((prev) => [
 ...prev,
 { id: newId, type: 'mcb_juice', label: 'MCB Juice', details: `+230 ${juicePhone}`, isDefault: prev.length === 0 },
 ])
 }
 // Reset form
 setCardNumber('')
 setCardHolder('')
 setExpiry('')
 setCvv('')
 setJuicePhone('')
 setShowAddForm(false)
 }

 return (
 <div>
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
 <div className="flex items-center gap-2 text-blue-700">
 <FaInfoCircle />
 <p className="text-sm font-medium">All payments are currently simulated using your trial credits (Rs 4,500). External payment processing will be integrated soon.</p>
 </div>
 </div>

 <h2 className="text-xl font-bold text-fg mb-6 flex items-center gap-2">
 <FaCreditCard className="text-blue-600" /> Payment Methods
 </h2>

 {/* Existing Methods */}
 <div className="space-y-3 mb-6">
 {methods.length === 0 && (
 <p className="text-soft text-sm p-4 border rounded-lg border-dashed">
 No payment methods added yet.
 </p>
 )}
 {methods.map((method) => (
 <div key={method.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-subtle transition gap-3">
 <div className="flex items-center gap-3">
 {method.type === 'mcb_juice' ? (
 <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
 <FaMobileAlt className="text-orange-600" />
 </div>
 ) : (
 <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
 <FaCreditCard className="text-blue-600" />
 </div>
 )}
 <div>
 <p className="font-medium text-fg">{method.label}</p>
 <p className="text-sm text-soft">{method.details}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {method.isDefault ? (
 <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
 <FaCheckCircle /> Default
 </span>
 ) : (
 <button onClick={() => setDefault(method.id)} className="px-3 py-1 bg-subtle text-soft rounded-full text-xs font-medium hover:bg-line transition">
 Set Default
 </button>
 )}
 <button onClick={() => removeMethod(method.id)} className="p-2 text-red-400 hover:text-red-600 transition" aria-label="Remove">
 <FaTrash />
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Add New Method */}
 {!showAddForm ? (
 <button onClick={() => setShowAddForm(true)} className="w-full p-4 border-2 border-dashed rounded-lg text-soft hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2">
 <FaPlus /> Add Payment Method
 </button>
 ) : (
 <div className="border rounded-lg p-6 space-y-4">
 <h3 className="font-semibold text-fg">Add New Payment Method</h3>

 {/* Type Selector */}
 <div className="flex gap-3">
 <button
 onClick={() => setAddType('credit_card')}
 className={`flex-1 p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
 addType === 'credit_card' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-line text-soft'
 }`}
 >
 <FaCreditCard /> Credit / Debit Card
 </button>
 <button
 onClick={() => setAddType('mcb_juice')}
 className={`flex-1 p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
 addType === 'mcb_juice' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-line text-soft'
 }`}
 >
 <FaMobileAlt /> MCB Juice
 </button>
 </div>

 {addType === 'credit_card' ? (
 <div className="space-y-3">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Card Number</label>
 <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Cardholder Name</label>
 <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="John Smith" className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Expiry Date</label>
 <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">CVV</label>
 <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="***" maxLength={4} className="w-full px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500" />
 </div>
 </div>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-medium text-soft mb-1">MCB Juice Phone Number</label>
 <div className="flex">
 <span className="inline-flex items-center px-3 bg-subtle border border-r-0 border-line rounded-l-lg text-soft text-sm">+230</span>
 <input type="tel" value={juicePhone} onChange={(e) => setJuicePhone(e.target.value)} placeholder="5XXX XXXX" maxLength={9} className="flex-1 px-4 py-2.5 border border-line rounded-r-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-500" />
 </div>
 <p className="text-xs text-soft mt-1">Enter your MCB Juice registered mobile number</p>
 </div>
 )}

 <div className="flex flex-col sm:flex-row gap-3 pt-2">
 <button onClick={addMethod} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
 <FaSave /> Add Method
 </button>
 <button onClick={() => setShowAddForm(false)} className="w-full sm:w-auto px-6 py-2.5 border border-line rounded-lg font-semibold text-soft hover:bg-subtle">
 Cancel
 </button>
 </div>
 </div>
 )}

 {onSave && methods.length > 0 && (
 <div className="text-right mt-6 pt-6 border-t">
 <button onClick={() => onSave(methods)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 ml-auto">
 <FaSave /> Save Payment Settings
 </button>
 </div>
 )}
 </div>
 )
}

export default PaymentMethodForm
