'use client'

import { Suspense } from 'react'
import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
 return (
 <div className="min-h-screen bg-surface flex items-center justify-center p-4">
 <Suspense fallback={<div className="animate-pulse bg-surface rounded-2xl w-full max-w-md h-96" />}>
 <LoginForm />
 </Suspense>
 </div>
 )
}
