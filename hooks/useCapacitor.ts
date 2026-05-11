'use client'

import { useState, useEffect } from 'react'

/**
 * Detect if the app is running inside a Capacitor WebView (Android/iOS).
 * Used to add safe area padding for status bar (top) and navigation bar (bottom).
 */
export function useCapacitor(): boolean {
  const [isCapacitor, setIsCapacitor] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (
      ua.includes('MediWyz-Android') ||
       
      window.hasOwnProperty('Capacitor') ||
      ua.includes('wv') // Android WebView marker
    ) {
      setIsCapacitor(true)
    }
  }, [])

  return isCapacitor
}
