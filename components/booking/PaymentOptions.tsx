import { useState } from 'react'
import Image from 'next/image'
import { FaShieldAlt, FaWallet, FaCreditCard, FaLock } from 'react-icons/fa'
import type { BookingData, PaymentMethod, CreditCardData } from '@/types/booking'

interface PaymentOptionsProps {
 bookingData: BookingData
 onUpdate: (updates: Partial<BookingData>) => void
 onPayment: () => void
 onBack: () => void
 isProcessing: boolean
 creditCardData: CreditCardData
 onCreditCardUpdate: (data: CreditCardData) => void
}

const paymentMethods: PaymentMethod[] = [
 {
 id: "mcb-juice",
 type: "mcb-juice",
 name: "MCB Juice",
 description: "Pay instantly with MCB Juice mobile payment",
 icon: "https://mcb.mu/images/juicelibraries/default-album/logo.tmb-thumbnail.png?Culture=en&sfvrsn=4a22ed51_1",
 available: true
 },
 {
 id: "credit-card",
 type: "credit-card",
 name: "Credit/Debit Card",
 description: "Visa, Mastercard, American Express accepted",
 icon: "",
 available: true
 },
 {
 id: "corporate",
 type: "corporate",
 name: "Corporate Health Plan",
 description: "Use your company's health benefits",
 discount: 50,
 icon: "",
 available: true
 },
 {
 id: "insurance",
 type: "insurance",
 name: "Insurance Coverage",
 description: "Apply insurance coverage (80% covered)",
 discount: 80,
 icon: "",
 available: true
 },
 {
 id: "subscription",
 type: "subscription",
 name: "Monthly Subscription",
 description: "Use your active healthcare subscription",
 discount: 100,
 icon: "",
 available: false
 }
]

export default function PaymentOptions({
 bookingData,
 onUpdate,
 onPayment,
 onBack,
 isProcessing,
 creditCardData,
 onCreditCardUpdate
}: PaymentOptionsProps) {
 const [showCreditCardForm, setShowCreditCardForm] = useState(false)
 const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

 const computeCardErrors = (data: CreditCardData): Record<string, string> => {
 const errors: Record<string, string> = {}
 
 if (!data.holderName.trim()) {
 errors.holderName = 'Cardholder name is required'
 }
 
 const cleanedNumber = data.cardNumber.replace(/\s/g, '')
 if (cleanedNumber.length < 13 || cleanedNumber.length > 16) {
 errors.cardNumber = 'Invalid card number'
 }
 
 if (!data.expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
 errors.expiryDate = 'Invalid expiry date (MM/YY)'
 }
 
 if (data.cvv.length < 3 || data.cvv.length > 4) {
 errors.cvv = 'Invalid CVV'
 }
 
 return errors
}

 const handlePaymentMethodSelect = (method: PaymentMethod) => {
 onUpdate({ selectedPaymentMethod: method })
 setShowCreditCardForm(method.type === 'credit-card')
 }

 const detectCardType = (number: string): 'visa' | 'mastercard' | 'amex' | undefined => {
 const cleaned = number.replace(/\s/g, '')
 if (cleaned.startsWith('4')) return 'visa'
 if (cleaned.startsWith('5') || cleaned.startsWith('2')) return 'mastercard'
 if (cleaned.startsWith('3')) return 'amex'
 return undefined
 }

 const formatCardNumber = (value: string) => {
 const cleaned = value.replace(/\s/g, '')
 const limited = cleaned.slice(0, 16)
 return limited.replace(/(.{4})/g, '$1 ').trim()
 }

 const handleCreditCardChange = (field: keyof CreditCardData, value: string) => {
 let processedValue = value
 
 if (field === 'cardNumber') {
 processedValue = formatCardNumber(value)
 const cardType = detectCardType(processedValue)
 onCreditCardUpdate({ 
 ...creditCardData, 
 [field]: processedValue,
 cardType 
 })
 return
 }
 
 if (field === 'expiryDate') {
 processedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5)
 }
 
 if (field === 'cvv') {
 processedValue = value.replace(/\D/g, '').slice(0, 4)
 }
 
 onCreditCardUpdate({ ...creditCardData, [field]: processedValue })
 
 // Clear error when user starts typing
 if (cardErrors[field]) {
 setCardErrors({ ...cardErrors, [field]: '' })
 }
 }

 const calculateTotal = () => {
 const baseAmount = bookingData.type === 'video' 
 ? bookingData.doctor.videoConsultationFee 
 : bookingData.doctor.consultationFee
 const platformFee = 50
 const totalBeforeDiscount = baseAmount + platformFee
 
 if (bookingData.selectedPaymentMethod?.discount) {
 return totalBeforeDiscount * (1 - bookingData.selectedPaymentMethod.discount / 100)
 }
 
 return totalBeforeDiscount
 }

 const canProceed = () => {
 if (!bookingData.selectedPaymentMethod) return false
 if (bookingData.selectedPaymentMethod.type === 'credit-card') {
 // Pure check using computed errors (no setState here)
 const errors = computeCardErrors(creditCardData)
 return Object.keys(errors).length === 0
 }
 return true
 }

 const baseAmount = bookingData.type === 'video' 
 ? bookingData.doctor.videoConsultationFee 
 : bookingData.doctor.consultationFee

 return (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-fg mb-6">Payment Options</h2>
 
 {/* Payment Methods */}
 <div className="space-y-4 mb-8">
 <h3 className="font-semibold text-fg mb-4">Select Payment Method</h3>
 {paymentMethods.map((method) => (
 <label
 key={method.id}
 className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-subtle ${
 !method.available ? 'opacity-50 cursor-not-allowed' : ''
 } ${
 bookingData.selectedPaymentMethod?.id === method.id 
 ? "border-blue-600 bg-blue-50" 
 : "border-line"
 }`}
 >
 <input
 type="radio"
 name="payment"
 checked={bookingData.selectedPaymentMethod?.id === method.id}
 onChange={() => method.available && handlePaymentMethodSelect(method)}
 disabled={!method.available}
 className="mr-4"
 />
 <div className="mr-4">
 {method.type === 'mcb-juice' ? (
 <Image 
 src={method.icon} 
 alt="MCB Juice" 
 width={32} 
 height={32}
 className="rounded"
 />
 ) : method.type === 'credit-card' ? (
 <FaCreditCard className="text-2xl text-blue-600" />
 ) : (
 <div className="text-3xl">{method.icon}</div>
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <span className="font-semibold">{method.name}</span>
 {method.discount && (
 <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
 {method.discount}% OFF
 </span>
 )}
 </div>
 <p className="text-sm text-soft mt-1">{method.description}</p>
 </div>
 {!method.available && (
 <span className="text-sm text-red-600 font-medium">Unavailable</span>
 )}
 </label>
 ))}
 </div>

 {/* Credit Card Form */}
 {showCreditCardForm && bookingData.selectedPaymentMethod?.type === 'credit-card' && (
 <div className="mb-8 p-6 bg-subtle rounded-xl border border-line">
 <div className="flex items-center gap-2 mb-4">
 <FaLock className="text-green-600" />
 <h4 className="font-semibold text-fg">Credit Card Information</h4>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-soft mb-2">
 Cardholder Name *
 </label>
 <input
 type="text"
 value={creditCardData.holderName}
 onChange={(e) => handleCreditCardChange('holderName', e.target.value)}
 placeholder="John Doe"
 className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600 ${
 cardErrors.holderName ? 'border-red-500' : 'border-line'
 }`}
 />
 {cardErrors.holderName && (
 <p className="text-red-500 text-sm mt-1">{cardErrors.holderName}</p>
 )}
 </div>
 
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-soft mb-2">
 Card Number *
 </label>
 <div className="relative">
 <input
 type="text"
 value={creditCardData.cardNumber}
 onChange={(e) => handleCreditCardChange('cardNumber', e.target.value)}
 placeholder="1234 5678 9012 3456"
 className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:border-blue-600 ${
 cardErrors.cardNumber ? 'border-red-500' : 'border-line'
 }`}
 />
 {creditCardData.cardType && (
 <div className="absolute right-3 top-3">
 {creditCardData.cardType === 'visa' && <span className="text-blue-600 font-bold text-lg">VISA</span>}
 {creditCardData.cardType === 'mastercard' && <span className="text-red-600 font-bold text-lg">MC</span>}
 {creditCardData.cardType === 'amex' && <span className="text-blue-600 font-bold text-lg">AMEX</span>}
 </div>
 )}
 </div>
 {cardErrors.cardNumber && (
 <p className="text-red-500 text-sm mt-1">{cardErrors.cardNumber}</p>
 )}
 </div>
 
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Expiry Date *
 </label>
 <input
 type="text"
 value={creditCardData.expiryDate}
 onChange={(e) => handleCreditCardChange('expiryDate', e.target.value)}
 placeholder="MM/YY"
 className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600 ${
 cardErrors.expiryDate ? 'border-red-500' : 'border-line'
 }`}
 />
 {cardErrors.expiryDate && (
 <p className="text-red-500 text-sm mt-1">{cardErrors.expiryDate}</p>
 )}
 </div>
 
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 CVV *
 </label>
 <input
 type="text"
 value={creditCardData.cvv}
 onChange={(e) => handleCreditCardChange('cvv', e.target.value)}
 placeholder="123"
 className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600 ${
 cardErrors.cvv ? 'border-red-500' : 'border-line'
 }`}
 />
 {cardErrors.cvv && (
 <p className="text-red-500 text-sm mt-1">{cardErrors.cvv}</p>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Payment Summary */}
 <div className=" rounded-xl p-6 mb-6 border">
 <h3 className="font-bold text-fg mb-4">Payment Summary</h3>
 <div className="space-y-3">
 <div className="flex justify-between">
 <span className="text-soft">
 {bookingData.type === 'video' ? 'Video' : 'In-Person'} Consultation
 </span>
 <span className="font-medium">Rs {baseAmount.toLocaleString()}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-soft">Platform Fee</span>
 <span className="font-medium">Rs 50</span>
 </div>
 {bookingData.selectedPaymentMethod?.discount && (
 <div className="flex justify-between text-green-600">
 <span>Discount ({bookingData.selectedPaymentMethod.discount}%)</span>
 <span className="font-medium">
 - Rs {Math.round((baseAmount + 50) * bookingData.selectedPaymentMethod.discount / 100).toLocaleString()}
 </span>
 </div>
 )}
 <div className="border-t pt-3 flex justify-between">
 <span className="font-bold text-lg">Total Amount</span>
 <span className="font-bold text-xl text-green-600">
 Rs {Math.round(calculateTotal()).toLocaleString()}
 </span>
 </div>
 </div>
 </div>

 {/* Security Notice */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
 <div className="flex items-start gap-3">
 <FaShieldAlt className="text-blue-600 mt-1" />
 <div>
 <h4 className="font-semibold text-blue-800 mb-1">Secure Payment</h4>
 <p className="text-blue-700 text-sm">All payments are encrypted and processed securely. Your financial information is protected with bank-level security.</p>
 </div>
 </div>
 </div>

 <div className="flex justify-between">
 <button
 onClick={onBack}
 className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button
 onClick={onPayment}
 disabled={!canProceed() || isProcessing}
 className="bg-brand-navy text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 {isProcessing ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Processing...
 </>
 ) : (
 <>
 <FaWallet />
 Confirm & Pay Rs {Math.round(calculateTotal()).toLocaleString()}
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )
}