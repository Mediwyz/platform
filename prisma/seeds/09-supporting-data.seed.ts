import { PrismaClient } from '@prisma/client'

export async function seedSupportingData(prisma: PrismaClient) {
  // Pill reminders
  const pillReminders = [
    { patientId: 'PPROF001', prescriptionId: 'PRE001', medicineName: 'Metformin', dosage: '500mg', times: ['08:00', '20:00'], frequency: 'Twice daily', nextDose: new Date(Date.now() + 3600000), isActive: true, notificationEnabled: true },
    { patientId: 'PPROF001', prescriptionId: 'PRE002', medicineName: 'Lisinopril', dosage: '10mg', times: ['08:00'], frequency: 'Once daily', nextDose: new Date(Date.now() + 3600000), isActive: true, notificationEnabled: true },
    { patientId: 'PPROF004', prescriptionId: 'PRE004', medicineName: 'Atorvastatin', dosage: '40mg', times: ['22:00'], frequency: 'Once daily', nextDose: new Date(Date.now() + 36000000), isActive: true, notificationEnabled: true },
  ]
  await prisma.pillReminder.createMany({ data: pillReminders })

  // Emergency service contacts
  const emergencyServices = [
    { patientId: 'PPROF001', name: 'SAMU Mauritius', service: 'Ambulance', phone: '114', available24h: true, responseTime: '10-15 min', specialization: ['Emergency', 'Trauma'], location: 'National', priority: 'high' },
    { patientId: 'PPROF001', name: 'City Medical Center ER', service: 'Hospital Emergency', phone: '+230 5200 0000', available24h: true, responseTime: '5 min', specialization: ['Emergency', 'ICU'], location: 'Port Louis', priority: 'high' },
    { patientId: 'PPROF002', name: 'SAMU Mauritius', service: 'Ambulance', phone: '114', available24h: true, responseTime: '10-15 min', specialization: ['Emergency', 'Trauma'], location: 'National', priority: 'high' },
  ]
  await prisma.emergencyServiceContact.createMany({ data: emergencyServices })

  // Nutrition analyses
  const nutritionEntries = [
    { patientId: 'PPROF001', foodName: 'Grilled Fish with Rice', date: new Date('2024-12-15T12:30:00'), calories: 450, carbs: 55, protein: 35, fat: 12, vitamins: ['B12', 'D', 'Omega-3'], healthScore: 85, suggestions: ['Add more vegetables'], allergens: [], nutritionalBenefits: ['High protein', 'Low fat', 'Rich in Omega-3'], mealType: 'lunch' },
    { patientId: 'PPROF001', foodName: 'Dal with Roti', date: new Date('2024-12-15T19:00:00'), calories: 380, carbs: 48, protein: 18, fat: 10, vitamins: ['B6', 'Iron', 'Folate'], healthScore: 80, suggestions: ['Good choice for diabetic diet'], allergens: ['Gluten'], nutritionalBenefits: ['High fiber', 'Plant-based protein'], mealType: 'dinner' },
  ]
  await prisma.nutritionAnalysis.createMany({ data: nutritionEntries })

  // Billing info (last 4 digits only - no sensitive data)
  // BillingInfo now references User IDs, not PatientProfile IDs
  const billingInfo = [
    { userId: 'PAT001', type: 'credit_card', lastFour: '4567', cardHolder: 'Emma Johnson', expiryDate: '12/26', isDefault: true },
    { userId: 'PAT001', type: 'mcb_juice', lastFour: '8901', cardHolder: 'Emma Johnson', expiryDate: '06/27', isDefault: false },
    { userId: 'PAT002', type: 'credit_card', lastFour: '2345', cardHolder: 'Jean Pierre', expiryDate: '09/26', isDefault: true },
  ]
  await prisma.billingInfo.createMany({ data: billingInfo })

  // Notifications - now uses single userId field referencing User IDs
  const notifications = [
    { userId: 'PAT001', type: 'appointment', title: 'Upcoming Appointment', message: 'You have a video consultation with Dr. Johnson tomorrow.', createdAt: new Date() },
    { userId: 'PAT001', type: 'prescription', title: 'Prescription Refill', message: 'Your Metformin prescription is due for refill on Feb 15.', createdAt: new Date(Date.now() - 86400000) },
    { userId: 'PAT004', type: 'lab_result', title: 'Lab Results Ready', message: 'Your lipid panel results are now available.', createdAt: new Date(Date.now() - 2 * 86400000) },
    { userId: 'DOC001', type: 'appointment', title: 'New Appointment', message: 'Emma Johnson has booked a video consultation.', createdAt: new Date() },
  ]
  await prisma.notification.createMany({ data: notifications })

  console.log(`  Seeded ${pillReminders.length} pill reminders, ${emergencyServices.length} emergency contacts, ${nutritionEntries.length} nutrition entries, ${billingInfo.length} billing records, ${notifications.length} notifications`)
}
