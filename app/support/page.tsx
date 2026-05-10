'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaLifeRing, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setSent(true)
      } else {
        setError(json.message || 'Could not send message')
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <Link href="/help" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft /> Back to help
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#001E40] flex items-center gap-3 mb-2">
            <FaLifeRing className="text-[#0C6780]" /> Contact support
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Your message reaches the MediWyz admin team via in-app notification. We&apos;ll respond inside the app.
          </p>

          {sent ? (
            <div className="text-center py-8">
              <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-3" />
              <p className="text-lg font-semibold text-[#001E40] mb-1">Message sent</p>
              <p className="text-sm text-gray-500">We&apos;ll get back to you inside the app.</p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '', website: '' }) }}
                className="mt-5 text-[#0C6780] hover:underline text-sm"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(s => ({ ...s, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={e => setForm(s => ({ ...s, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(s => ({ ...s, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none resize-y"
                />
              </div>

              {/* Honeypot — real users never see or fill this field */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={e => setForm(s => ({ ...s, website: e.target.value }))}
                className="absolute opacity-0 pointer-events-none h-0 w-0"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-[#0C6780] text-white rounded-lg font-medium hover:bg-[#0a5568] disabled:bg-gray-300"
              >
                {busy ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
