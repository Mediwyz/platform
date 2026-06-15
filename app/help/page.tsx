'use client'

import Link from 'next/link'
import { FaQuestionCircle, FaArrowLeft, FaBookOpen, FaLifeRing, FaEnvelope } from 'react-icons/fa'

const FAQS = [
  {
    q: 'How do I book a consultation?',
    a: 'Sign in, open the search and pick the provider you want. Select a service, pick a time slot, and confirm. You\'ll see the booking under "My Bookings".',
  },
  {
    q: 'How does the Health Shop work?',
    a: 'Any provider with inventory can sell items. Browse the Health Shop, add items to the cart, and checkout - stock and prescription requirements are enforced automatically.',
  },
  {
    q: 'How do video calls work?',
    a: 'When a video booking is accepted, a room is automatically created. Click "Join call" on your dashboard when it\'s time.',
  },
  {
    q: 'I forgot my password - how do I reset it?',
    a: 'On the sign-in screen click "Forgot password?". Answer the security question you set at signup and you\'ll be taken straight to the reset form.',
  },
  {
    q: 'What if I don\'t have a security question set?',
    a: 'Log in, open your Profile → Security, and set one before you forget your password. You only need to do this once.',
  },
  {
    q: 'How does my Account Balance work?',
    a: 'Every user has an Account Balance in MUR that powers bookings, subscriptions and insurance premiums. Top up from Billing; bookings and shop orders are debited automatically. Provider earnings and insurance reimbursements are credited back to the same balance.',
  },
  {
    q: 'I\'m a provider - how do I manage my services and workflow?',
    a: 'Open "My Services" to list the services you offer and "Workflows" to customise the status steps patients see for each booking.',
  },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft /> Back to home
        </Link>
        <h1 className="text-3xl font-bold text-[#001E40] flex items-center gap-3 mb-2">
          <FaQuestionCircle className="text-[#0C6780]" /> Help centre
        </h1>
        <p className="text-gray-500 mb-8">Quick answers to the questions we get most often.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Link href="/help" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#0C6780] transition-colors">
            <FaBookOpen className="text-[#0C6780] text-xl mb-2" />
            <p className="font-semibold text-[#001E40]">Guides</p>
            <p className="text-xs text-gray-500">Step-by-step walkthroughs</p>
          </Link>
          <Link href="/support" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#0C6780] transition-colors">
            <FaLifeRing className="text-[#0C6780] text-xl mb-2" />
            <p className="font-semibold text-[#001E40]">Contact support</p>
            <p className="text-xs text-gray-500">Message a human</p>
          </Link>
          <Link href="/medical-disclaimer" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#0C6780] transition-colors">
            <FaEnvelope className="text-[#0C6780] text-xl mb-2" />
            <p className="font-semibold text-[#001E40]">Medical disclaimer</p>
            <p className="text-xs text-gray-500">Important information</p>
          </Link>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-200 p-5 [&[open]>summary>span:last-child]:rotate-90 group">
              <summary className="flex items-center justify-between cursor-pointer select-none font-semibold text-[#001E40]">
                {f.q}
                <span className="transition-transform text-gray-400">▸</span>
              </summary>
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
