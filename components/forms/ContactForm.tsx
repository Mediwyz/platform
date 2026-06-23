'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import type { ContactFormData } from '@/types'

const ContactForm: React.FC = () => {
 const [formData, setFormData] = useState<ContactFormData>({
 name: '',
 email: '',
 message: ''
 })

 const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
 const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

 const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target
 setStatus(null)
 setFormData(prev => ({
 ...prev,
 [name]: value
 }))
 }

 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
 e.preventDefault()
 setIsSubmitting(true)
 setStatus(null)

 try {
 const res = await fetch('/api/contact', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(formData),
 })
 const data = await res.json()

 if (res.ok && data.success) {
 setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' })
 setFormData({ name: '', email: '', message: '' })
 } else {
 setStatus({ type: 'error', message: data.message || 'Failed to send message. Please try again.' })
 }
 } catch {
 setStatus({ type: 'error', message: 'Network error. Please try again.' })
 } finally {
 setIsSubmitting(false)
 }
 }

 return (
 <div className="bg-surface rounded-2xl shadow-lg p-8">
 <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
 {status && (
 <div className={`mb-4 p-3 rounded-lg text-sm ${
 status.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
 }`}>
 {status.message}
 </div>
 )}
 <form onSubmit={handleSubmit}>
 <div className="mb-4">
 <label htmlFor="name" className="block text-soft mb-2">
 Name
 </label>
 <input
 type="text"
 id="name"
 name="name"
 required
 placeholder="Your full name"
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 value={formData.name}
 onChange={handleChange}
 />
 </div>
 
 <div className="mb-4">
 <label htmlFor="email" className="block text-soft mb-2">
 Email
 </label>
 <input
 type="email"
 id="email"
 name="email"
 required
 placeholder="your.email@example.com"
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 value={formData.email}
 onChange={handleChange}
 />
 </div>
 
 <div className="mb-6">
 <label htmlFor="message" className="block text-soft mb-2">
 Message
 </label>
 <textarea
 id="message"
 name="message"
 required
 rows={5}
 placeholder="How can we help you?"
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 value={formData.message}
 onChange={handleChange}
 />
 </div>
 
 <button 
 type="submit" 
 disabled={isSubmitting}
 className="w-full btn-gradient py-3 disabled:opacity-50"
 >
 {isSubmitting ? 'Sending...' : 'Send Message'}
 </button>
 </form>
 </div>
 )
}

export default ContactForm