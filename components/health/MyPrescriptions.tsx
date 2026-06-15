'use client'

import { useCallback } from 'react'
import { FaPills } from 'react-icons/fa'
import HealthSectionList from './HealthSectionList'

export default function MyPrescriptions() {
 const mapData = useCallback((data: unknown[]) =>
 (data as { id: string; createdAt: string; isActive?: boolean; diagnosis?: string; doctor?: { user?: { firstName: string; lastName: string } }; medicines?: { medicine?: { name: string } }[] }[]).map(p => ({
 id: p.id,
 title: p.diagnosis || 'Prescription',
 subtitle: `Dr. ${p.doctor?.user?.firstName ?? ''} ${p.doctor?.user?.lastName ?? ''}`.trim() + (p.medicines?.length ? ` - ${p.medicines.map(m => m.medicine?.name).filter(Boolean).join(', ')}` : ''),
 date: new Date(p.createdAt).toLocaleDateString(),
 status: p.isActive ? 'active' : 'completed',
 })), [])

 return <HealthSectionList title="Prescriptions" icon={FaPills} apiUrl="/api/patients/{userId}/prescriptions" mapData={mapData} />
}
