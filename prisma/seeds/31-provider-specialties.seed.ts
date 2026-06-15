import { PrismaClient, UserType } from '@prisma/client'

export async function seedProviderSpecialties(prisma: PrismaClient) {
  console.log('  Seeding provider specialties...')

  // Emoji icons for specialties - applied during seeding
  const ICONS: Record<string, string> = {
    'General Practice': '🩺', 'Family Medicine': '👨‍👩‍👧‍👦', 'Internal Medicine': '🫀',
    'Cardiology': '❤️', 'Dermatology': '🧴', 'Endocrinology': '🦠',
    'Gastroenterology': '🫃', 'Geriatrics': '👴', 'Gynecology': '🤰',
    'Neurology': '🧠', 'Oncology': '🎗️', 'Ophthalmology': '👁️',
    'Orthopedics': '🦴', 'Pediatrics': '👶', 'Psychiatry': '🧘',
    'Psychology': '💭', 'Pulmonology': '🫁', 'Radiology': '📡',
    'Rheumatology': '🦵', 'Urology': '🏥', 'Anesthesiology': '💉',
    'Pathology': '🔬', 'Sports Medicine': '⚽', 'Preventive Medicine': '🛡️',
    'Sexual Health': '💕',
    'General Nursing': '💊', 'ICU / Critical Care': '🚨', 'Wound Care': '🩹',
    'Midwifery': '🤱', 'Pediatric Nursing': '👧', 'Geriatric Nursing': '🧓',
    'Mental Health Nursing': '🧠', 'Oncology Nursing': '🎗️',
    'Community Health': '🏘️', 'Home Care': '🏠',
    'Newborn Care': '👶', 'Toddler Care': '🧒', 'After-School': '📚',
    'Special Needs': '♿', 'Overnight Care': '🌙',
    'Elder Care': '👴', 'Disability Care': '♿', 'Post-Surgery Care': '🩹',
    'Dementia Care': '🧠', 'Palliative Care': '🕊️',
    'Orthopedic': '🦴', 'Neurological': '🧠', 'Sports': '🏃',
    'Pediatric': '👧', 'Geriatric': '🧓', 'Cardiopulmonary': '🫁',
    'General Dentistry': '🦷', 'Orthodontics': '😁', 'Periodontics': '🪥',
    'Endodontics': '🦷', 'Oral Surgery': '🏥', 'Pediatric Dentistry': '👧',
    'Cosmetic Dentistry': '✨',
    'General Eye Care': '👓', 'Contact Lenses': '🔵', 'Pediatric Eye Care': '👧',
    'Low Vision': '🔍', 'Sports Vision': '🥽',
    'Clinical Nutrition': '🥗', 'Sports Nutrition': '💪', 'Weight Management': '⚖️',
    'Pediatric Nutrition': '🍎', 'Diabetes Nutrition': '🩸', 'Prenatal Nutrition': '🤰',
    'Hematology': '🩸', 'Microbiology': '🦠', 'Clinical Chemistry': '🧪',
    'Immunology': '🛡️', 'Histology': '🔬', 'Molecular Biology': '🧬',
    'Clinical Pharmacy': '💊', 'Oncology Pharmacy': '🎗️', 'Geriatric Pharmacy': '💊',
    'Pediatric Pharmacy': '🧒', 'Hospital Pharmacy': '🏥',
    'Paramedic': '🚑', 'EMT-Basic': '🚑', 'EMT-Intermediate': '🚑',
    'Critical Care Transport': '🚁', 'Wilderness Rescue': '⛰️',
  }

  const specialties: { providerType: UserType; name: string; description?: string }[] = [
    // ── Doctor Specialties ──────────────────────────────────────────
    { providerType: UserType.DOCTOR, name: 'General Practice', description: 'Primary care and family medicine' },
    { providerType: UserType.DOCTOR, name: 'Family Medicine', description: 'Comprehensive family healthcare' },
    { providerType: UserType.DOCTOR, name: 'Internal Medicine', description: 'Adult internal diseases' },
    { providerType: UserType.DOCTOR, name: 'Cardiology', description: 'Heart and cardiovascular system' },
    { providerType: UserType.DOCTOR, name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
    { providerType: UserType.DOCTOR, name: 'Endocrinology', description: 'Hormones, diabetes, thyroid' },
    { providerType: UserType.DOCTOR, name: 'Gastroenterology', description: 'Digestive system disorders' },
    { providerType: UserType.DOCTOR, name: 'Gynecology', description: 'Women\'s reproductive health' },
    { providerType: UserType.DOCTOR, name: 'Neurology', description: 'Brain and nervous system' },
    { providerType: UserType.DOCTOR, name: 'Oncology', description: 'Cancer diagnosis and treatment' },
    { providerType: UserType.DOCTOR, name: 'Ophthalmology', description: 'Eye diseases and surgery' },
    { providerType: UserType.DOCTOR, name: 'Orthopedics', description: 'Bones, joints, and muscles' },
    { providerType: UserType.DOCTOR, name: 'Pediatrics', description: 'Children\'s health' },
    { providerType: UserType.DOCTOR, name: 'Psychiatry', description: 'Mental health medication management' },
    { providerType: UserType.DOCTOR, name: 'Psychology', description: 'Therapy and counseling' },
    { providerType: UserType.DOCTOR, name: 'Pulmonology', description: 'Lung and respiratory diseases' },
    { providerType: UserType.DOCTOR, name: 'Rheumatology', description: 'Autoimmune and joint diseases' },
    { providerType: UserType.DOCTOR, name: 'Urology', description: 'Urinary tract and male reproductive' },
    { providerType: UserType.DOCTOR, name: 'Sexual Health', description: 'Sexual and reproductive wellness' },
    { providerType: UserType.DOCTOR, name: 'Sports Medicine', description: 'Athletic injuries and performance' },
    { providerType: UserType.DOCTOR, name: 'Geriatrics', description: 'Elderly patient care' },
    { providerType: UserType.DOCTOR, name: 'Preventive Medicine', description: 'Disease prevention and screening' },
    { providerType: UserType.DOCTOR, name: 'Radiology', description: 'Medical imaging and diagnostics' },
    { providerType: UserType.DOCTOR, name: 'Pathology', description: 'Laboratory medicine' },
    { providerType: UserType.DOCTOR, name: 'Anesthesiology', description: 'Anesthesia and pain management' },

    // ── Nurse Specialties ───────────────────────────────────────────
    { providerType: UserType.NURSE, name: 'General Nursing', description: 'General patient care' },
    { providerType: UserType.NURSE, name: 'Wound Care', description: 'Wound management and dressing' },
    { providerType: UserType.NURSE, name: 'ICU / Critical Care', description: 'Intensive care nursing' },
    { providerType: UserType.NURSE, name: 'Pediatric Nursing', description: 'Children\'s nursing care' },
    { providerType: UserType.NURSE, name: 'Geriatric Nursing', description: 'Elderly patient nursing' },
    { providerType: UserType.NURSE, name: 'Mental Health Nursing', description: 'Psychiatric nursing care' },
    { providerType: UserType.NURSE, name: 'Midwifery', description: 'Pregnancy and childbirth care' },
    { providerType: UserType.NURSE, name: 'Oncology Nursing', description: 'Cancer patient nursing' },
    { providerType: UserType.NURSE, name: 'Community Health', description: 'Community-based health services' },
    { providerType: UserType.NURSE, name: 'Home Care', description: 'In-home nursing services' },

    // ── Nanny Specialties ───────────────────────────────────────────
    { providerType: UserType.NANNY, name: 'Newborn Care', description: '0-12 months' },
    { providerType: UserType.NANNY, name: 'Toddler Care', description: '1-3 years' },
    { providerType: UserType.NANNY, name: 'Special Needs', description: 'Children with disabilities' },
    { providerType: UserType.NANNY, name: 'After-School', description: 'School-age childcare' },
    { providerType: UserType.NANNY, name: 'Overnight Care', description: 'Night-time childcare' },

    // ── Caregiver Specialties ───────────────────────────────────────
    { providerType: UserType.CAREGIVER, name: 'Elder Care', description: 'Senior daily assistance' },
    { providerType: UserType.CAREGIVER, name: 'Disability Care', description: 'Physical/mental disability support' },
    { providerType: UserType.CAREGIVER, name: 'Post-Surgery Care', description: 'Recovery assistance after surgery' },
    { providerType: UserType.CAREGIVER, name: 'Dementia Care', description: 'Alzheimer\'s and dementia support' },
    { providerType: UserType.CAREGIVER, name: 'Palliative Care', description: 'End-of-life comfort care' },

    // ── Physiotherapist Specialties ──────────────────────────────────
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Orthopedic', description: 'Musculoskeletal rehabilitation' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Neurological', description: 'Stroke and brain injury rehab' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Sports', description: 'Athletic injury rehabilitation' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Pediatric', description: 'Children\'s physical therapy' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Geriatric', description: 'Elderly mobility and balance' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Cardiopulmonary', description: 'Heart and lung rehabilitation' },

    // ── Dentist Specialties ─────────────────────────────────────────
    { providerType: UserType.DENTIST, name: 'General Dentistry', description: 'Routine dental care' },
    { providerType: UserType.DENTIST, name: 'Orthodontics', description: 'Braces and teeth alignment' },
    { providerType: UserType.DENTIST, name: 'Periodontics', description: 'Gum disease treatment' },
    { providerType: UserType.DENTIST, name: 'Endodontics', description: 'Root canal treatment' },
    { providerType: UserType.DENTIST, name: 'Oral Surgery', description: 'Surgical dental procedures' },
    { providerType: UserType.DENTIST, name: 'Pediatric Dentistry', description: 'Children\'s dental care' },
    { providerType: UserType.DENTIST, name: 'Cosmetic Dentistry', description: 'Teeth whitening, veneers' },

    // ── Optometrist Specialties ─────────────────────────────────────
    { providerType: UserType.OPTOMETRIST, name: 'General Eye Care', description: 'Routine eye exams' },
    { providerType: UserType.OPTOMETRIST, name: 'Pediatric Eye Care', description: 'Children\'s vision' },
    { providerType: UserType.OPTOMETRIST, name: 'Contact Lenses', description: 'Fitting and management' },
    { providerType: UserType.OPTOMETRIST, name: 'Low Vision', description: 'Visual impairment aids' },
    { providerType: UserType.OPTOMETRIST, name: 'Sports Vision', description: 'Athletic visual performance' },

    // ── Nutritionist Specialties ────────────────────────────────────
    { providerType: UserType.NUTRITIONIST, name: 'Clinical Nutrition', description: 'Hospital and disease nutrition' },
    { providerType: UserType.NUTRITIONIST, name: 'Sports Nutrition', description: 'Athletic diet planning' },
    { providerType: UserType.NUTRITIONIST, name: 'Pediatric Nutrition', description: 'Children\'s dietary needs' },
    { providerType: UserType.NUTRITIONIST, name: 'Weight Management', description: 'Obesity and weight loss' },
    { providerType: UserType.NUTRITIONIST, name: 'Diabetes Nutrition', description: 'Diabetic diet management' },
    { providerType: UserType.NUTRITIONIST, name: 'Prenatal Nutrition', description: 'Pregnancy dietary needs' },

    // ── Lab Technician Specialties ──────────────────────────────────
    { providerType: UserType.LAB_TECHNICIAN, name: 'Hematology', description: 'Blood analysis' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Microbiology', description: 'Infection testing' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Clinical Chemistry', description: 'Chemical analysis' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Immunology', description: 'Immune system testing' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Histology', description: 'Tissue examination' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Molecular Biology', description: 'Genetic testing' },

    // ── Pharmacist Specialties ──────────────────────────────────────
    { providerType: UserType.PHARMACIST, name: 'Clinical Pharmacy', description: 'Hospital-based pharmacy' },
    { providerType: UserType.PHARMACIST, name: 'Oncology Pharmacy', description: 'Cancer medication' },
    { providerType: UserType.PHARMACIST, name: 'Geriatric Pharmacy', description: 'Elderly medication management' },
    { providerType: UserType.PHARMACIST, name: 'Pediatric Pharmacy', description: 'Children\'s medication' },
    { providerType: UserType.PHARMACIST, name: 'Hospital Pharmacy', description: 'Inpatient dispensing' },

    // ── Emergency Worker Specialties ────────────────────────────────
    { providerType: UserType.EMERGENCY_WORKER, name: 'Paramedic', description: 'Advanced life support' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'EMT-Basic', description: 'Basic emergency care' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'EMT-Intermediate', description: 'Intermediate emergency care' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Critical Care Transport', description: 'ICU-level patient transport' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Wilderness Rescue', description: 'Remote area emergency' },
  ]

  for (const spec of specialties) {
    const icon = ICONS[spec.name] || '🏥'
    await prisma.providerSpecialty.upsert({
      where: { providerType_name: { providerType: spec.providerType, name: spec.name } },
      update: { icon, description: spec.description || undefined },
      create: { ...spec, icon },
    })
  }

  console.log(`  ✓ ${specialties.length} provider specialties seeded`)
}
