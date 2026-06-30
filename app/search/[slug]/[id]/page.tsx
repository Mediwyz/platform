'use client'

import { useParams } from 'next/navigation'
import ProviderDetailPage from '@/components/search/ProviderDetailPage'

/**
 * Generic provider detail route: /search/[slug]/[id]
 * One reusable page for EVERY provider category (doctors, nurses, childcare,
 * dentists, …) — the category is resolved from the slug via the CRUD roles API.
 * Replaces the old per-category /search/<type>/[id] files.
 */
export default function DynamicProviderDetailPage() {
  const params = useParams()
  return <ProviderDetailPage slug={params.slug as string} />
}
