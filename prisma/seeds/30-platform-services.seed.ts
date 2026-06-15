import { PrismaClient, UserType } from '@prisma/client'

/**
 * Seeds PlatformService - the unified service catalog.
 * These are "default" services that get auto-assigned to new providers on registration.
 * Providers can later add custom services which also become PlatformService entries
 * (with createdByProviderId set and isDefault=false).
 */
export async function seedPlatformServices(prisma: PrismaClient) {
  console.log('  Seeding platform services...')

  const services = [
    // ── Doctor (GP) Services ─────────────────────────────────────────────
    { providerType: UserType.DOCTOR, serviceName: 'General Consultation', category: 'Consultation', description: 'Standard GP consultation for common illnesses, check-ups, and referrals.', defaultPrice: 800, duration: 30 },
    { providerType: UserType.DOCTOR, serviceName: 'Video Consultation', category: 'Consultation', description: 'Remote video consultation for non-emergency conditions.', defaultPrice: 600, duration: 20 },
    { providerType: UserType.DOCTOR, serviceName: 'Annual Health Screening', category: 'Screening', description: 'Comprehensive annual health check with lab work and physical exam.', defaultPrice: 3500, duration: 60 },
    { providerType: UserType.DOCTOR, serviceName: 'Chronic Disease Management', category: 'Consultation', description: 'Follow-up consultations for diabetes, hypertension, and other chronic conditions.', defaultPrice: 700, duration: 30 },
    { providerType: UserType.DOCTOR, serviceName: 'Travel Medicine Consultation', category: 'Consultation', description: 'Pre-travel health advice, vaccinations, and prophylaxis prescriptions.', defaultPrice: 1200, duration: 30 },
    { providerType: UserType.DOCTOR, serviceName: 'Specialist Consultation', category: 'Specialist Consultation', description: 'Specialist assessment for cardiology, dermatology, orthopaedics, etc.', defaultPrice: 2000, duration: 45 },
    { providerType: UserType.DOCTOR, serviceName: 'Mental Health Consultation', category: 'Mental Health', description: 'Psychiatric assessment and counselling session.', defaultPrice: 1500, duration: 45 },
    { providerType: UserType.DOCTOR, serviceName: 'Nutrition Consultation', category: 'Nutrition', description: 'Dietary assessment and personalised nutrition planning.', defaultPrice: 1000, duration: 30 },

    // ── Nurse Services ───────────────────────────────────────────────────
    { providerType: UserType.NURSE, serviceName: 'Blood Pressure Monitoring', category: 'Monitoring', description: 'Regular blood pressure checks with detailed logging and trend analysis.', defaultPrice: 300, duration: 30 },
    { providerType: UserType.NURSE, serviceName: 'Wound Care & Dressing', category: 'Wound Care', description: 'Professional wound cleaning, dressing, and healing assessment.', defaultPrice: 500, duration: 45 },
    { providerType: UserType.NURSE, serviceName: 'Injection Administration', category: 'Injection', description: 'Intramuscular and subcutaneous injection services including insulin.', defaultPrice: 250, duration: 15 },
    { providerType: UserType.NURSE, serviceName: 'Post-Surgery Home Care', category: 'Post-Surgery', description: 'Comprehensive post-operative care at home.', defaultPrice: 1200, duration: 120 },
    { providerType: UserType.NURSE, serviceName: 'Diabetes Management', category: 'Chronic Care', description: 'Blood glucose monitoring, insulin management, and lifestyle counseling.', defaultPrice: 600, duration: 60 },
    { providerType: UserType.NURSE, serviceName: 'Health Assessment', category: 'Assessment', description: 'Full health assessment including vital signs and health report.', defaultPrice: 800, duration: 60 },
    { providerType: UserType.NURSE, serviceName: 'Medication Administration', category: 'Medication', description: 'Safe administration of prescribed medications with dosage verification.', defaultPrice: 350, duration: 30 },
    { providerType: UserType.NURSE, serviceName: 'Elderly Care Assistance', category: 'Chronic Care', description: 'Comprehensive elderly care with mobility assistance and wellness checks.', defaultPrice: 900, duration: 120 },
    { providerType: UserType.NURSE, serviceName: 'IV Therapy', category: 'Medication', description: 'Intravenous fluid administration and IV medication management.', defaultPrice: 1500, duration: 90 },

    // ── Nanny / Child Care Services ──────────────────────────────────────
    { providerType: UserType.NANNY, serviceName: 'Childcare - Half Day', category: 'Daily Care', description: 'Half-day childcare with meals, activities, and supervision.', defaultPrice: 500, duration: 240 },
    { providerType: UserType.NANNY, serviceName: 'Childcare - Full Day', category: 'Daily Care', description: 'Full-day childcare with meals, educational activities, and nap supervision.', defaultPrice: 900, duration: 480 },
    { providerType: UserType.NANNY, serviceName: 'Homework Help', category: 'Educational', description: 'Academic support and homework assistance for school-age children.', defaultPrice: 400, duration: 60 },
    { providerType: UserType.NANNY, serviceName: 'Arts & Crafts Session', category: 'Creative', description: 'Creative activities to develop fine motor skills and artistic expression.', defaultPrice: 350, duration: 60 },
    { providerType: UserType.NANNY, serviceName: 'Safety & First Aid', category: 'Health & Safety', description: 'Comprehensive child safety supervision with certified first aid training.', defaultPrice: 600, duration: 60 },
    { providerType: UserType.NANNY, serviceName: 'Special Needs Care', category: 'Special Needs', description: 'Specialized care for children with special needs.', defaultPrice: 800, duration: 120 },

    // ── Lab Technician Services ──────────────────────────────────────────
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Complete Blood Count (CBC)', category: 'Blood', description: 'Measures red blood cells, white blood cells, hemoglobin, hematocrit, and platelets.', defaultPrice: 500, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Lipid Panel', category: 'Blood', description: 'Cholesterol levels including HDL, LDL, triglycerides, and total cholesterol.', defaultPrice: 800, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'HbA1c (Glycated Hemoglobin)', category: 'Blood', description: 'Average blood sugar levels over the past 2-3 months.', defaultPrice: 650, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Liver Function Test (LFT)', category: 'Blood', description: 'Liver health assessment - enzymes, proteins, and bilirubin.', defaultPrice: 900, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Thyroid Panel (TSH, T3, T4)', category: 'Blood', description: 'Comprehensive thyroid function assessment.', defaultPrice: 1200, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Urinalysis', category: 'Urine', description: 'Complete urine analysis for kidney function and infections.', defaultPrice: 350, duration: null },
    { providerType: UserType.LAB_TECHNICIAN, serviceName: 'Allergy Panel (IgE)', category: 'Blood', description: 'IgE antibodies for common allergens.', defaultPrice: 2500, duration: null },

    // ── Pharmacist Services ──────────────────────────────────────────────
    { providerType: UserType.PHARMACIST, serviceName: 'Prescription Dispensing', category: 'Dispensing', description: 'Professional dispensing of prescribed medications with counselling.', defaultPrice: 0, duration: 10 },
    { providerType: UserType.PHARMACIST, serviceName: 'Medication Review', category: 'Consultation', description: 'Review of current medications for interactions and optimization.', defaultPrice: 300, duration: 20 },
    { providerType: UserType.PHARMACIST, serviceName: 'Vaccination Administration', category: 'Vaccination', description: 'Flu, COVID-19, and other vaccinations.', defaultPrice: 200, duration: 15 },
    { providerType: UserType.PHARMACIST, serviceName: 'Blood Pressure Check', category: 'Screening', description: 'Quick blood pressure screening at the pharmacy.', defaultPrice: 100, duration: 10 },
    { providerType: UserType.PHARMACIST, serviceName: 'Medicine Delivery', category: 'Delivery', description: 'Home delivery of prescribed and OTC medications.', defaultPrice: 150, duration: null },

    // ── Emergency Worker Services ────────────────────────────────────────
    { providerType: UserType.EMERGENCY_WORKER, serviceName: 'Ambulance Response', category: 'Ambulance', description: 'Emergency ambulance dispatch with paramedic crew.', defaultPrice: 3500, duration: null },
    { providerType: UserType.EMERGENCY_WORKER, serviceName: 'First Aid Response', category: 'First Aid', description: 'Rapid first-response for urban emergencies.', defaultPrice: 1500, duration: null },
    { providerType: UserType.EMERGENCY_WORKER, serviceName: 'Inter-Hospital Transfer', category: 'Medical Transport', description: 'Safe patient transfer between hospitals with medical escort.', defaultPrice: 5000, duration: null },
    { providerType: UserType.EMERGENCY_WORKER, serviceName: 'Medical Event Coverage', category: 'Event Coverage', description: 'On-site medical support for events and gatherings.', defaultPrice: 8000, duration: null },

    // ── Caregiver Services ───────────────────────────────────────────
    { providerType: UserType.CAREGIVER, serviceName: 'Elder Daily Care - Half Day', category: 'Daily Care', description: 'Morning or afternoon elder care with meals and activities.', defaultPrice: 600, duration: 240 },
    { providerType: UserType.CAREGIVER, serviceName: 'Elder Daily Care - Full Day', category: 'Daily Care', description: 'Full-day elder companionship, meals, and mobility assistance.', defaultPrice: 1000, duration: 480 },
    { providerType: UserType.CAREGIVER, serviceName: 'Overnight Care', category: 'Overnight', description: 'Night-time monitoring and assistance for elderly or disabled.', defaultPrice: 1200, duration: 600 },
    { providerType: UserType.CAREGIVER, serviceName: 'Post-Surgery Home Aide', category: 'Recovery', description: 'Daily assistance during post-surgical recovery.', defaultPrice: 800, duration: 240 },
    { providerType: UserType.CAREGIVER, serviceName: 'Dementia Companion', category: 'Specialized', description: 'Specialized companionship for dementia patients.', defaultPrice: 900, duration: 240 },

    // ── Physiotherapist Services ─────────────────────────────────────
    { providerType: UserType.PHYSIOTHERAPIST, serviceName: 'Initial Assessment', category: 'Assessment', description: 'Comprehensive physical assessment and treatment plan.', defaultPrice: 1500, duration: 60 },
    { providerType: UserType.PHYSIOTHERAPIST, serviceName: 'Rehabilitation Session', category: 'Treatment', description: 'Standard physiotherapy rehabilitation session.', defaultPrice: 800, duration: 45 },
    { providerType: UserType.PHYSIOTHERAPIST, serviceName: 'Sports Injury Treatment', category: 'Sports', description: 'Sports-specific injury assessment and treatment.', defaultPrice: 1200, duration: 60 },
    { providerType: UserType.PHYSIOTHERAPIST, serviceName: 'Home Visit Physio', category: 'Home Visit', description: 'Physiotherapy session at patient home.', defaultPrice: 1500, duration: 60 },
    { providerType: UserType.PHYSIOTHERAPIST, serviceName: 'Post-Surgery Rehab', category: 'Rehabilitation', description: 'Post-operative rehabilitation program session.', defaultPrice: 1000, duration: 45 },

    // ── Dentist Services ────────────────────────────────────────────
    { providerType: UserType.DENTIST, serviceName: 'Dental Check-up', category: 'General', description: 'Routine dental examination and cleaning.', defaultPrice: 800, duration: 30 },
    { providerType: UserType.DENTIST, serviceName: 'Teeth Cleaning', category: 'General', description: 'Professional dental cleaning and polishing.', defaultPrice: 600, duration: 30 },
    { providerType: UserType.DENTIST, serviceName: 'Filling', category: 'Restorative', description: 'Dental filling for cavities.', defaultPrice: 1200, duration: 45 },
    { providerType: UserType.DENTIST, serviceName: 'Root Canal', category: 'Endodontics', description: 'Root canal treatment to save infected tooth.', defaultPrice: 5000, duration: 90 },
    { providerType: UserType.DENTIST, serviceName: 'Teeth Whitening', category: 'Cosmetic', description: 'Professional teeth whitening treatment.', defaultPrice: 3000, duration: 60 },
    { providerType: UserType.DENTIST, serviceName: 'Tooth Extraction', category: 'Surgery', description: 'Surgical or simple tooth removal.', defaultPrice: 2000, duration: 30 },

    // ── Optometrist Services ────────────────────────────────────────
    { providerType: UserType.OPTOMETRIST, serviceName: 'Eye Exam', category: 'General', description: 'Comprehensive eye examination and vision test.', defaultPrice: 800, duration: 30 },
    { providerType: UserType.OPTOMETRIST, serviceName: 'Contact Lens Fitting', category: 'Contact Lenses', description: 'Professional contact lens fitting and trial.', defaultPrice: 1200, duration: 45 },
    { providerType: UserType.OPTOMETRIST, serviceName: 'Glasses Prescription', category: 'Prescription', description: 'Vision testing and glasses prescription.', defaultPrice: 600, duration: 20 },
    { providerType: UserType.OPTOMETRIST, serviceName: 'Pediatric Eye Exam', category: 'Pediatric', description: 'Children\'s eye health screening.', defaultPrice: 1000, duration: 30 },

    // ── Nutritionist Services ───────────────────────────────────────
    { providerType: UserType.NUTRITIONIST, serviceName: 'Initial Nutrition Assessment', category: 'Assessment', description: 'Full dietary assessment and personalized plan.', defaultPrice: 1500, duration: 60 },
    { providerType: UserType.NUTRITIONIST, serviceName: 'Follow-up Consultation', category: 'Consultation', description: 'Progress review and plan adjustment.', defaultPrice: 800, duration: 30 },
    { providerType: UserType.NUTRITIONIST, serviceName: 'Meal Plan Creation', category: 'Planning', description: 'Custom weekly or monthly meal plan.', defaultPrice: 1200, duration: 45 },
    { providerType: UserType.NUTRITIONIST, serviceName: 'Sports Nutrition Plan', category: 'Sports', description: 'Nutrition plan for athletic performance.', defaultPrice: 1500, duration: 45 },
    { providerType: UserType.NUTRITIONIST, serviceName: 'Diabetes Diet Management', category: 'Clinical', description: 'Diabetic-specific dietary counseling.', defaultPrice: 1000, duration: 30 },
  ]

  for (const svc of services) {
    const existing = await prisma.platformService.findFirst({
      where: {
        providerType: svc.providerType,
        serviceName: svc.serviceName,
        countryCode: null,
      },
    })
    if (existing) {
      await prisma.platformService.update({
        where: { id: existing.id },
        data: { defaultPrice: svc.defaultPrice, description: svc.description },
      })
    } else {
      await prisma.platformService.create({
        data: {
          ...svc,
          isDefault: true,
          countryCode: null,
        },
      })
    }
  }

  console.log(`  ✓ ${services.length} platform services seeded`)

  // ── Auto-assign default services to existing seeded providers ──────────

  // Get all providers with their user types
  const providers = await prisma.user.findMany({
    where: {
      userType: { in: ['DOCTOR', 'NURSE', 'NANNY', 'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER', 'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST'] },
    },
    select: { id: true, userType: true },
  })

  const defaultServices = await prisma.platformService.findMany({
    where: { isDefault: true },
    select: { id: true, providerType: true },
  })

  let configCount = 0
  for (const provider of providers) {
    const matching = defaultServices.filter(s => s.providerType === provider.userType)
    for (const svc of matching) {
      await prisma.providerServiceConfig.upsert({
        where: {
          platformServiceId_providerUserId: {
            platformServiceId: svc.id,
            providerUserId: provider.id,
          },
        },
        update: {},
        create: {
          platformServiceId: svc.id,
          providerUserId: provider.id,
          priceOverride: null, // Use default price
          isActive: true,
        },
      })
      configCount++
    }
  }

  console.log(`  ✓ ${configCount} provider service configs created for ${providers.length} providers`)
}
