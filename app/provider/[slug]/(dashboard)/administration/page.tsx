'use client'
import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function DynamicAdminPage() {
  const router = useRouter()
  const params = useParams()
  useEffect(() => {
    router.replace(`/provider/${params.slug}`)
  }, [router, params.slug])
  return null
}
