import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalNavbar from '@/components/layout/ConditionalNavbar'
import ConditionalFooter from '@/components/layout/ConditionalFooter'
import { CartProvider } from '@/app/search/medicines/contexts/CartContext'
import { CartProvider as HealthShopCartProvider } from '@/components/health-shop/CartContext'
import { BookingCartProvider } from '@/lib/contexts/booking-cart-context'
import ToastProvider from '@/components/shared/ToastProvider'
import DesktopModeWarning from '@/components/shared/DesktopModeWarning'
import FloatingChatWidget from '@/components/shared/FloatingChatWidget'
import FloatingBookingCart from '@/components/shared/FloatingBookingCart'
import FloatingAuthFAB from '@/components/shared/FloatingAuthFAB'
import FloatingCart from '@/components/health-shop/FloatingCart'
import FloatingPrescriptionFAB from '@/components/shared/FloatingPrescriptionFAB'
import FloatingGeoFAB from '@/components/shared/FloatingGeoFAB'
import { PrescriptionProvider } from '@/lib/contexts/prescription-context'
import { BookingDrawerProvider } from '@/lib/contexts/booking-drawer-context'
import BookingDrawer from '@/components/shared/BookingDrawer'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
 viewportFit: 'cover',
}

export const metadata: Metadata = {
 title: {
 default: 'MediWyz - Digital Health Platform',
 template: '%s | MediWyz',
 },
 description:
 'A digital health platform connecting patients in Mauritius with trusted healthcare providers — doctors, nurses, pharmacies, and emergency services — through one seamless app.',
 keywords: [
 'healthcare',
 'doctors',
 'nurses',
 'Mauritius',
 'telemedicine',
 'video consultation',
 'prescription',
 'pharmacy',
 'health platform',
 'medical appointments',
 'nanny',
 'lab technician',
 'emergency services',
 'health insurance',
 ],
 authors: [{ name: 'MediWyz' }],
 creator: 'MediWyz',
 publisher: 'MediWyz',
 metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mediwyz.com'),
 openGraph: {
 type: 'website',
 locale: 'en_MU',
 siteName: 'MediWyz',
 title: 'MediWyz - Digital Health Platform',
 description:
 'A digital health platform connecting patients in Mauritius with trusted healthcare providers — doctors, nurses, pharmacies, and emergency services.',
 images: [
 {
 url: '/images/og-banner.png',
 width: 1200,
 height: 630,
 alt: 'MediWyz - Digital Health Platform',
 },
 ],
 },
 twitter: {
 card: 'summary_large_image',
 title: 'MediWyz - Digital Health Platform',
 description:
 'A digital health platform connecting patients in Mauritius with trusted healthcare providers.',
 images: ['/images/og-banner.png'],
 },
 robots: {
 index: true,
 follow: true,
 googleBot: {
 index: true,
 follow: true,
 'max-video-preview': -1,
 'max-image-preview': 'large',
 'max-snippet': -1,
 },
 },
 icons: {
 icon: '/favicon.ico',
 apple: '/icons/apple-touch-icon.png',
 },
 manifest: '/manifest.json',
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediwyz.com'

const jsonLd = {
 '@context': 'https://schema.org',
 '@type': 'Organization',
 name: 'MediWyz',
 url: appUrl,
 logo: `${appUrl}/images/logo.png`,
 image: `${appUrl}/images/og-banner.png`,
 description:
 'A digital health platform connecting patients in Mauritius with trusted healthcare providers — doctors, nurses, pharmacies, and emergency services — through one seamless app.',
 address: {
 '@type': 'PostalAddress',
 addressCountry: 'MU',
 addressLocality: 'Mauritius',
 },
 areaServed: {
 '@type': 'Country',
 name: 'Mauritius',
 },
 medicalSpecialty: [
 'Cardiology',
 'Neurology',
 'Pediatrics',
 'Dermatology',
 'Orthopedic Surgery',
 'Emergency Medicine',
 'Psychiatry',
 'General Practice',
 ],
 availableService: [
 { '@type': 'MedicalTherapy', name: 'Video Consultation' },
 { '@type': 'MedicalTherapy', name: 'In-Person Consultation' },
 { '@type': 'MedicalTherapy', name: 'Prescription Management' },
 { '@type': 'MedicalTherapy', name: 'Lab Test Booking' },
 { '@type': 'MedicalTherapy', name: 'Medicine Ordering' },
 { '@type': 'MedicalTherapy', name: 'Emergency Services' },
 ],
 sameAs: [],
 contactPoint: {
 '@type': 'ContactPoint',
 contactType: 'customer support',
 email: 'support@mediwyz.com',
 availableLanguage: ['en', 'fr'],
 },
}

const webSiteJsonLd = {
 '@context': 'https://schema.org',
 '@type': 'WebSite',
 name: 'MediWyz',
 url: appUrl,
 potentialAction: {
 '@type': 'SearchAction',
 target: `${appUrl}/search/results?q={search_term_string}`,
 'query-input': 'required name=search_term_string',
 },
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
 <html lang="en">
 <head>
 <meta name="theme-color" content="#2563eb" />
 <meta name="apple-mobile-web-app-capable" content="yes" />
 <meta name="apple-mobile-web-app-status-bar-style" content="default" />
 <meta name="apple-mobile-web-app-title" content="MediWyz" />
 <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
 />
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
 />
 </head>
 <body className={inter.className}>
 <HealthShopCartProvider>
 <PrescriptionProvider>
 <CartProvider>
 <BookingCartProvider>
 <BookingDrawerProvider>
 <ConditionalNavbar />
 <main id="main-content" className="min-h-screen">
 {children}
 </main>
 <ConditionalFooter />
 <ToastProvider />
 <DesktopModeWarning />
 {/* Floating elements — visible everywhere */}
 <FloatingAuthFAB />
 <FloatingBookingCart />
 <FloatingCart />
 <FloatingGeoFAB />
 <FloatingPrescriptionFAB />
 <FloatingChatWidget />
 <BookingDrawer />
 </BookingDrawerProvider>
 </BookingCartProvider>
 </CartProvider>
 </PrescriptionProvider>
 </HealthShopCartProvider>
 <script
 dangerouslySetInnerHTML={{
 __html: `
 if ('serviceWorker' in navigator) {
 window.addEventListener('load', function() {
 navigator.serviceWorker.register('/sw.js').catch(function(err) {
 console.log('ServiceWorker registration failed:', err);
 });
 });
 }
 // Detect Capacitor WebView and add class for safe area CSS
 (function() {
 var ua = navigator.userAgent || '';
 if (ua.indexOf('MediWyz-Android') !== -1 || ua.indexOf('wv') !== -1 || window.Capacitor) {
 document.body.classList.add('capacitor-app');
 }
 })();
 // Force mobile viewport when "Desktop site" is enabled in Chrome Android
 // Chrome's "Desktop site" ignores width=device-width, so we use the actual screen width
 (function() {
 var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 var screenW = window.screen.width;
 if (isMobile && screenW < 768 && window.innerWidth > screenW) {
 var vp = document.querySelector('meta[name="viewport"]');
 if (vp) {
 vp.setAttribute('content',
 'width=' + screenW + ', initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
 );
 }
 }
 })();
 `,
 }}
 />
 </body>
 </html>
 )
}