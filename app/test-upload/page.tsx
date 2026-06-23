'use client'

import { useState } from 'react'

interface TestResult {
 success?: boolean;
 error?: string;
 message?: string;
 [key: string]: unknown;
}

export default function TestUploadPage() {
 const [result, setResult] = useState<TestResult | null>(null)
 const [loading, setLoading] = useState(false)

 const testUpload = async () => {
 setLoading(true)
 try {
 const response = await fetch('/api/upload', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ test: true })
 })
 const data = await response.json()
 setResult(data)
 } catch (error) {
 setResult({ error: error instanceof Error ? error.message : String(error) })
 }
 setLoading(false)
 }

 const testStorage = async () => {
 setLoading(true)
 try {
 const response = await fetch('/api/test-storage')
 const data = await response.json()
 setResult(data)
 } catch (error) {
 setResult({ error: error instanceof Error ? error.message : String(error) })
 }
 setLoading(false)
 }

 return (
 <div className="p-8">
 <h1 className="text-2xl font-bold mb-4">Test Storage Integration</h1>
 <div className="space-y-4">
 <button
 onClick={testUpload}
 disabled={loading}
 className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
 >
 Test Upload
 </button>

 <button
 onClick={testStorage}
 disabled={loading}
 className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
 >
 Test Storage Connection
 </button>
 </div>

 {loading && <p className="mt-4">Loading...</p>}
 {result && (
 <div className="mt-4 p-4 bg-subtle rounded">
 <pre>{JSON.stringify(result, null, 2)}</pre>
 </div>
 )}
 </div>
 )
}