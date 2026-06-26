'use client'

/**
 * TrustSecuritySection - security pillars + FAQ accordion. Addresses the main
 * objections (privacy, how video works, verification, coverage, cost) so visitors
 * convert with confidence. Brand navy/teal/sky, accessible accordion.
 */

import { useState } from 'react'
import { FaLock, FaUserShield, FaBolt, FaFileMedical, FaChevronDown } from 'react-icons/fa'
import { useTranslation } from '@/lib/i18n'

const PILLARS = [
  { Icon: FaLock,         titleKey: 'landing.trustEncryptionTitle', descKey: 'landing.trustEncryptionDesc' },
  { Icon: FaFileMedical,  titleKey: 'landing.trustConsentTitle',    descKey: 'landing.trustConsentDesc' },
  { Icon: FaUserShield,   titleKey: 'landing.trustVerifiedTitle',   descKey: 'landing.trustVerifiedDesc' },
  { Icon: FaBolt,         titleKey: 'landing.trustReliableTitle',   descKey: 'landing.trustReliableDesc' },
]

const FAQ = [
  { qKey: 'landing.faqOneQ',   aKey: 'landing.faqOneA' },
  { qKey: 'landing.faqTwoQ',   aKey: 'landing.faqTwoA' },
  { qKey: 'landing.faqThreeQ', aKey: 'landing.faqThreeA' },
  { qKey: 'landing.faqFourQ',  aKey: 'landing.faqFourA' },
  { qKey: 'landing.faqFiveQ',  aKey: 'landing.faqFiveA' },
]

export default function TrustSecuritySection() {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="bg-surface border-b border-line py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#0C6780] mb-2">
            {t('landing.trustEyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-fg">
            {t('landing.trustHeading')}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-soft max-w-2xl mx-auto">
            {t('landing.trustSubheading')}
          </p>
        </div>

        {/* Security pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16">
          {PILLARS.map(p => {
            const Icon = p.Icon
            return (
              <div key={p.titleKey} className="rounded-2xl border border-line bg-canvas p-6 hover:shadow-lg transition-shadow">
                <span className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: 'rgba(12,103,128,0.10)', color: '#0C6780' }}>
                  <Icon className="text-xl" />
                </span>
                <h3 className="text-base font-bold text-fg mb-1.5">{t(p.titleKey)}</h3>
                <p className="text-sm text-soft leading-relaxed">{t(p.descKey)}</p>
              </div>
            )
          })}
        </div>

        {/* FAQ accordion */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-fg text-center mb-7">
            {t('landing.faqHeading')}
          </h3>
          <div className="divide-y divide-line rounded-2xl border border-line overflow-hidden">
            {FAQ.map((f, i) => {
              const isOpen = open === i
              return (
                <div key={f.qKey} className="bg-surface">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 text-left px-5 sm:px-6 py-5 cursor-pointer hover:bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0C6780]"
                  >
                    <span className="text-base font-semibold text-fg">{t(f.qKey)}</span>
                    <FaChevronDown className={`flex-shrink-0 text-[#0C6780] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 sm:px-6 pb-5 -mt-1 text-sm sm:text-base text-soft leading-relaxed">{t(f.aKey)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
