'use client'

import { useState, useEffect } from 'react'
import { useUser, getUserId } from '@/hooks/useUser'
import type { Patient } from '@/lib/data/patients'

/**
 * Hook that adapts any authenticated user's data into a Patient-compatible shape.
 * Patient health components accept `patientData: Patient` but mostly only use
 * basic user fields (id, firstName, lastName) and fetch domain data via API.
 * This hook provides a minimal Patient object so those components work under any role.
 */
export function useUserAsPatient(): { patientData: Patient | null; loading: boolean } {
  const { user, loading: userLoading } = useUser()
  const [patientData, setPatientData] = useState<Patient | null>(null)

  useEffect(() => {
    if (userLoading || !user) return

    const userId = getUserId() || (user as any).id || ''

    // Build a minimal Patient-compatible object.
    // Components fetch their own domain data via API - they just need user identification.
    const adapted: Patient = {
      id: userId,
      firstName: (user as any).firstName || '',
      lastName: (user as any).lastName || '',
      email: (user as any).email || '',
      password: '',
      profileImage: (user as any).profileImage || '',
      token: '',
      dateOfBirth: '',
      age: 0,
      userType: 'patient',
      gender: 'Male',
      phone: (user as any).phone || '',
      address: '',
      nationalId: '',
      emergencyContact: { name: '', relationship: '', phone: '', address: '' },
      bloodType: '',
      allergies: [],
      chronicConditions: [],
      healthScore: 0,
      bodyAge: 0,
      medicalRecords: [],
      activePrescriptions: [],
      prescriptionHistory: [],
      vitalSigns: [],
      upcomingAppointments: [],
      pastAppointments: [],
      childcareBookings: [],
      nurseBookings: [],
      emergencyServiceContacts: [],
      chatHistory: { doctors: [], nurses: [], nannies: [], emergencyServices: [] },
      botHealthAssistant: {
        sessions: [],
        dietHistory: [],
        currentMealPlan: { startDate: '', endDate: '', meals: [], calorieTarget: 0, proteinTarget: 0, carbTarget: 0, fatTarget: 0 },
        hydrationTracking: [],
        exerciseSuggestions: [],
      },
      videoCallHistory: [],
      labTests: [],
      healthMetrics: {
        cholesterol: { total: 0, ldl: 0, hdl: 0, triglycerides: 0, date: '' },
        bloodPressure: { systolic: 0, diastolic: 0, date: '' },
        bmi: { value: 0, category: '', date: '' },
        heartRateVariability: 0,
        sleepQuality: { averageHours: 0, quality: 'fair' },
        stressLevel: 'low',
        bodyAge: 0,
        metabolicAge: 0,
        visceralFat: 0,
        muscleMass: 0,
        boneDensity: 0,
      },
      insuranceCoverage: {
        provider: '', policyNumber: '', subscriberId: '', validFrom: '', validUntil: '',
        copay: 0, deductible: 0, coverageType: 'individual',
        emergencyCoverage: false, pharmacyCoverage: false, dentalCoverage: false, visionCoverage: false,
      },
      billingInformation: [],
      subscriptionPlan: { type: 'free', planName: 'Free', startDate: '', features: [], price: 0, billingCycle: 'monthly' },
      notificationPreferences: {
        appointments: true, medications: true, testResults: true, healthTips: true,
        emergencyAlerts: true, chatMessages: true, videoCallReminders: true,
        dietReminders: true, exerciseReminders: true, notificationTime: '08:00',
        emailNotifications: true, smsNotifications: false, pushNotifications: true,
      },
      securitySettings: { twoFactorEnabled: false, biometricEnabled: false, loginHistory: [], securityQuestions: [], lastPasswordChange: '' },
      documents: [],
      lastCheckupDate: '',
      nextScheduledCheckup: '',
      pillReminders: [],
      emergencyContacts: [],
      nutritionAnalyses: [],
      medicineOrders: [],
    }

    setPatientData(adapted)
  }, [user, userLoading])

  return { patientData, loading: userLoading }
}
