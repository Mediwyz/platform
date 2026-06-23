'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaArrowLeft, FaUserMd } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'

interface Provider {
  id: string
  name: string
  userType: string
  profileImage: string | null
  role: string | null
  isPrimary: boolean
}

interface OrgDetail {
  id: string
  name: string
  type: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  phone: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  isVerified: boolean
  providerCount: number
  sampleProviders: Provider[]
  providers: { provider: { id: string; firstName: string; lastName: string; userType: string; profileImage: string | null }; role: string | null; isPrimary: boolean }[]
}

const TYPE_COLORS: Record<string, string> = {
  clinic: '#0C6780',
  hospital: '#C53030',
  laboratory: '#805AD5',
  dental_clinic: '#3182CE',
  optical_center: '#38A169',
  wellness_center: '#DD6B20',
  other: '#718096',
}

const TYPE_LABELS: Record<string, string> = {
  clinic: 'Clinic',
  hospital: 'Hospital',
  laboratory: 'Laboratory',
  dental_clinic: 'Dental Clinic',
  optical_center: 'Optical Centre',
  wellness_center: 'Wellness Centre',
  other: 'Healthcare Facility',
}

export default function OrgDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [entity, setEntity] = useState<OrgDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/search/organizations?limit=100`)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          const found = j.data?.find((e: OrgDetail) => e.id === id)
          setEntity(found ?? null)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <div className="animate-pulse text-faint">Loading...</div>
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-subtle flex flex-col items-center justify-center gap-4">
        <span className="text-5xl"></span>
        <h2 className="font-bold text-fg text-xl">Organization not found</h2>
        <Link href="/search/organizations" className="text-[#0C6780] text-sm hover:underline"> Back to organizations</Link>
      </div>
    )
  }

  const color = TYPE_COLORS[entity.type] ?? '#0C6780'
  const typeLabel = TYPE_LABELS[entity.type] ?? entity.type

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header banner */}
      <div className="bg-surface border-b border-line shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/search/organizations" className="flex items-center gap-1.5 text-sm text-soft hover:text-[#0C6780] mb-4">
            <FaArrowLeft size={11} /> Back to Organizations
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
              {entity.logoUrl ? (
                <Image src={entity.logoUrl} alt={entity.name} width={48} height={48} className="rounded-xl object-cover" />
              ) : (
                <span className="text-3xl"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-fg">{entity.name}</h1>
                {entity.isVerified && <MdVerified className="text-[#0C6780]" size={20} title="Verified" />}
              </div>
              <span className="text-sm font-medium px-2.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                {typeLabel}
              </span>
              {entity.city && (
                <div className="flex items-center gap-1 mt-1 text-sm text-soft">
                  <FaMapMarkerAlt size={11} />
                  <span>{entity.address ? `${entity.address}, ` : ''}{entity.city}, {entity.country}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          {entity.description && (
            <div className="bg-surface rounded-xl border border-line p-5">
              <h2 className="font-bold text-fg mb-2">About</h2>
              <p className="text-sm text-soft leading-relaxed">{entity.description}</p>
            </div>
          )}

          {/* Providers list */}
          <div className="bg-surface rounded-xl border border-line p-5">
            <h2 className="font-bold text-fg mb-3 flex items-center gap-2">
              <FaUserMd className="text-[#0C6780]" />
              Providers ({entity.sampleProviders.length})
            </h2>
            {entity.sampleProviders.length === 0 ? (
              <p className="text-sm text-faint">No providers listed yet.</p>
            ) : (
              <div className="space-y-3">
                {entity.sampleProviders.map(p => (
                  <Link
                    key={p.id}
                    href={`/profile/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-subtle hover:bg-subtle transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.profileImage ? (
                        <Image src={p.profileImage} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-soft">{p.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-fg truncate">{p.name}</p>
                      <p className="text-xs text-soft capitalize">{p.role ?? p.userType?.toLowerCase()?.replace('_', ' ')}</p>
                    </div>
                    {p.isPrimary && (
                      <span className="text-[10px] bg-[#0C6780]/10 text-[#0C6780] font-medium px-2 py-0.5 rounded-full flex-shrink-0">Primary</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-surface rounded-xl border border-line p-5">
            <h2 className="font-bold text-fg mb-3">Contact</h2>
            <div className="space-y-2.5">
              {entity.phone && (
                <a href={`tel:${entity.phone}`} className="flex items-center gap-2 text-sm text-soft hover:text-[#0C6780]">
                  <FaPhone size={12} className="text-faint" />
                  {entity.phone}
                </a>
              )}
              {entity.email && (
                <a href={`mailto:${entity.email}`} className="flex items-center gap-2 text-sm text-soft hover:text-[#0C6780]">
                  <FaEnvelope size={12} className="text-faint" />
                  {entity.email}
                </a>
              )}
              {entity.website && (
                <a href={entity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#0C6780] hover:underline">
                  <FaGlobe size={12} className="text-faint" />
                  {entity.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {entity.address && (
                <div className="flex items-start gap-2 text-sm text-soft">
                  <FaMapMarkerAlt size={12} className="text-faint mt-0.5 flex-shrink-0" />
                  <span>{entity.address}{entity.city ? `, ${entity.city}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            href={`/search/doctors`}
            className="block w-full text-center py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            Book a Provider Here
          </Link>
        </div>
      </div>
    </div>
  )
}
