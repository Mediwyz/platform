'use client'

import WalletBalanceCard from '@/components/shared/WalletBalanceCard'
import PaymentMethodForm from '@/components/shared/PaymentMethodForm'
import SubscriptionTab from '@/components/settings/tabs/SubscriptionTab'
import DashboardPageHeader from '@/components/shared/DashboardPageHeader'
import { FaMoneyBillWave } from 'react-icons/fa'

interface BillingDashboardProps {
 userId: string
}

export default function BillingDashboard({ userId }: BillingDashboardProps) {
 return (
 <div className="space-y-6">
 <DashboardPageHeader
 icon={FaMoneyBillWave}
 title="Billing & Account Balance"
 description="Your plan, wallet balance and payment methods."
 />

 {/* Subscription Plan - current plan + change */}
 <div className="bg-surface rounded-xl shadow-sm border border-line p-4 sm:p-6">
 <SubscriptionTab userId={userId} />
 </div>

 {/* Wallet */}
 <WalletBalanceCard userId={userId} />

 {/* Payment Methods */}
 <div className="bg-surface rounded-xl shadow-sm border border-line p-6">
 <h2 className="text-lg font-semibold text-fg mb-4">Payment Methods</h2>
 <PaymentMethodForm />
 </div>
 </div>
 )
}
