import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'
import { productImage } from './_product-images'

/**
 * Seed 40 - Expanded provider data
 *
 * Adds:
 * - More specialties for underrepresented provider types
 * - More provider users (2-3 per type that only had 1)
 * - Many more inventory items including prescription medicines
 */

export async function seedExpandedSpecialties(prisma: PrismaClient) {
  console.log('  Seeding expanded specialties...')

  const specialties: { providerType: UserType; name: string; description?: string }[] = [
    // ── Additional Childcare/Nanny Specialties ────────────────────────
    { providerType: UserType.NANNY, name: 'Infant CPR & Safety', description: 'Emergency response for infants' },
    { providerType: UserType.NANNY, name: 'Montessori Care', description: 'Montessori-based childcare approach' },
    { providerType: UserType.NANNY, name: 'Multilingual Care', description: 'Bilingual/multilingual childcare' },
    { providerType: UserType.NANNY, name: 'Homework Assistance', description: 'Academic support for school-age children' },
    { providerType: UserType.NANNY, name: 'Sibling Care', description: 'Multiple children management' },

    // ── Additional Pharmacist Specialties ──────────────────────────────
    { providerType: UserType.PHARMACIST, name: 'Community Pharmacy', description: 'Retail pharmacy and patient counseling' },
    { providerType: UserType.PHARMACIST, name: 'Compounding Pharmacy', description: 'Custom medication preparation' },
    { providerType: UserType.PHARMACIST, name: 'Ambulatory Care', description: 'Outpatient pharmacy services' },
    { providerType: UserType.PHARMACIST, name: 'Nuclear Pharmacy', description: 'Radiopharmaceuticals preparation' },
    { providerType: UserType.PHARMACIST, name: 'Veterinary Pharmacy', description: 'Animal medication dispensing' },

    // ── Additional Lab Technician Specialties ─────────────────────────
    { providerType: UserType.LAB_TECHNICIAN, name: 'Cytology', description: 'Cell structure examination' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Toxicology', description: 'Poison and drug testing' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Blood Banking', description: 'Blood typing and crossmatching' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Urinalysis', description: 'Urine composition analysis' },
    { providerType: UserType.LAB_TECHNICIAN, name: 'Parasitology', description: 'Parasite detection and identification' },

    // ── Additional Emergency Specialties ──────────────────────────────
    { providerType: UserType.EMERGENCY_WORKER, name: 'Disaster Response', description: 'Mass casualty management' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Tactical Medicine', description: 'Law enforcement medical support' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Pediatric Emergency', description: 'Children emergency care' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Flight Paramedic', description: 'Helicopter medical transport' },
    { providerType: UserType.EMERGENCY_WORKER, name: 'Marine Rescue', description: 'Water-based emergency response' },

    // ── Additional Caregiver Specialties ──────────────────────────────
    { providerType: UserType.CAREGIVER, name: 'Respite Care', description: 'Temporary relief for primary caregivers' },
    { providerType: UserType.CAREGIVER, name: 'Hospice Care', description: 'End-of-life home support' },
    { providerType: UserType.CAREGIVER, name: 'Stroke Recovery', description: 'Post-stroke rehabilitation support' },
    { providerType: UserType.CAREGIVER, name: 'Mental Health Support', description: 'Behavioral and emotional care' },
    { providerType: UserType.CAREGIVER, name: 'Medication Management', description: 'Medication scheduling and monitoring' },

    // ── Additional Physiotherapist Specialties ────────────────────────
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Aquatic Therapy', description: 'Water-based rehabilitation' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Vestibular Rehab', description: 'Balance and dizziness treatment' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Pelvic Floor', description: 'Pelvic floor muscle therapy' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Hand Therapy', description: 'Hand and upper extremity rehab' },
    { providerType: UserType.PHYSIOTHERAPIST, name: 'Oncology Rehab', description: 'Cancer recovery rehabilitation' },

    // ── Additional Optometrist Specialties ────────────────────────────
    { providerType: UserType.OPTOMETRIST, name: 'Glaucoma Management', description: 'Glaucoma screening and treatment' },
    { providerType: UserType.OPTOMETRIST, name: 'Dry Eye Treatment', description: 'Chronic dry eye management' },
    { providerType: UserType.OPTOMETRIST, name: 'Myopia Control', description: 'Nearsightedness progression management' },
    { providerType: UserType.OPTOMETRIST, name: 'Ocular Disease', description: 'Eye disease diagnosis and referral' },
    { providerType: UserType.OPTOMETRIST, name: 'Vision Therapy', description: 'Binocular vision training' },

    // ── Additional Nutritionist Specialties ───────────────────────────
    { providerType: UserType.NUTRITIONIST, name: 'Eating Disorders', description: 'Anorexia, bulimia recovery nutrition' },
    { providerType: UserType.NUTRITIONIST, name: 'Renal Nutrition', description: 'Kidney disease dietary management' },
    { providerType: UserType.NUTRITIONIST, name: 'Oncology Nutrition', description: 'Cancer patient dietary support' },
    { providerType: UserType.NUTRITIONIST, name: 'Vegan/Vegetarian', description: 'Plant-based diet planning' },
    { providerType: UserType.NUTRITIONIST, name: 'Geriatric Nutrition', description: 'Elderly dietary needs' },
  ]

  let added = 0
  for (const spec of specialties) {
    const existing = await prisma.providerSpecialty.findFirst({
      where: { providerType: spec.providerType, name: spec.name },
    })
    if (!existing) {
      await prisma.providerSpecialty.create({ data: spec })
      added++
    }
  }

  console.log(`  ✓ ${added} new specialties added (${specialties.length} total in this batch)`)
}

export async function seedExpandedProviders(prisma: PrismaClient) {
  console.log('  Seeding expanded provider users...')

  const hash = (pw: string) => bcrypt.hash(pw, 10)

  const providers = [
    // Additional Physiotherapists
    {
      id: 'PHYSIO002', profileImage: '/images/physiotherapists/2.jpg',
      firstName: 'Priya', lastName: 'Naidoo',
      email: 'priya.physio@mediwyz.com', password: await hash('Physio123!'),
      phone: '+230 5789 8002', userType: UserType.PHYSIOTHERAPIST,
      dateOfBirth: new Date('1991-06-20'), gender: 'Female',
      address: 'Moka, Mauritius', regionId: 'REG-MU',
      profile: { create: { id: 'PTPROF002', licenseNumber: 'PT-MU-2020-002', experience: 5, specializations: ['Aquatic Therapy', 'Pelvic Floor'], clinicName: 'AquaPhysio Mauritius' } },
      profileKey: 'physiotherapistProfile',
    },
    // Additional Dentists
    {
      id: 'DENT002', profileImage: '/images/dentists/2.jpg',
      firstName: 'Ravi', lastName: 'Doorgakant',
      email: 'ravi.dentist@mediwyz.com', password: await hash('Dentist123!'),
      phone: '+230 5789 9002', userType: UserType.DENTIST,
      dateOfBirth: new Date('1982-11-03'), gender: 'Male',
      address: 'Vacoas, Mauritius', regionId: 'REG-MU',
      profile: { create: { id: 'DNPROF002', licenseNumber: 'DN-MU-2014-002', experience: 12, specializations: ['Orthodontics', 'Periodontics'], clinicName: 'Bright Smile Dental' } },
      profileKey: 'dentistProfile',
    },
    // Additional Optometrists
    {
      id: 'OPT002', profileImage: '/images/optometrists/2.jpg',
      firstName: 'Laila', lastName: 'Doobur',
      email: 'laila.eye@mediwyz.com', password: await hash('Optom123!'),
      phone: '+230 5789 9502', userType: UserType.OPTOMETRIST,
      dateOfBirth: new Date('1993-04-15'), gender: 'Female',
      address: 'Rose Hill, Mauritius', regionId: 'REG-MU',
      profile: { create: { id: 'OPPROF002', licenseNumber: 'OP-MU-2021-002', experience: 3, specializations: ['Glaucoma Management', 'Myopia Control'], clinicName: 'VisionPlus Optometry' } },
      profileKey: 'optometristProfile',
    },
    // Additional Nutritionists
    {
      id: 'NUTR002', profileImage: '/images/nutritionists/2.jpg',
      firstName: 'Arun', lastName: 'Doorgakant',
      email: 'arun.nutrition@mediwyz.com', password: await hash('Nutri123!'),
      phone: '+230 5789 9802', userType: UserType.NUTRITIONIST,
      dateOfBirth: new Date('1989-01-22'), gender: 'Male',
      address: 'Beau Bassin, Mauritius', regionId: 'REG-MU',
      profile: { create: { id: 'NTPROF002', experience: 7, specializations: ['Sports Nutrition', 'Renal Nutrition'], certifications: ['Registered Dietitian', 'Sports Nutrition Specialist'] } },
      profileKey: 'nutritionistProfile',
    },
  ]

  for (const p of providers) {
    const { profileKey, profile, ...userData } = p
    await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: { ...userData, verified: true, accountStatus: 'active', [profileKey]: profile },
    })
  }

  console.log(`  ✓ ${providers.length} additional provider users seeded`)
}

export async function seedExpandedInventory(prisma: PrismaClient) {
  console.log('  Seeding expanded inventory items...')

  const randomQty = () => Math.floor(Math.random() * (150 - 20 + 1)) + 20

  const items = [
    // ── Prescription Medications (PHARM001) ───────────────────────────
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Metformin 500mg', category: 'medication', description: 'Type 2 diabetes management. 60 tablets per box.', price: 180, quantity: randomQty(), requiresPrescription: true, isFeatured: true, unitOfMeasure: 'box', strength: '500mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Omeprazole 20mg', category: 'medication', description: 'Acid reflux and stomach ulcer treatment. 30 capsules.', price: 95, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '20mg', dosageForm: 'capsule' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Amlodipine 5mg', category: 'medication', description: 'High blood pressure medication. 30 tablets.', price: 120, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '5mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Atorvastatin 20mg', category: 'medication', description: 'Cholesterol-lowering statin. 30 tablets.', price: 250, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '20mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Losartan 50mg', category: 'medication', description: 'Blood pressure and kidney protection. 30 tablets.', price: 160, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '50mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Ciprofloxacin 500mg', category: 'medication', description: 'Antibiotic for bacterial infections. 10 tablets.', price: 200, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '500mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Prednisone 5mg', category: 'medication', description: 'Anti-inflammatory corticosteroid. 30 tablets.', price: 85, quantity: randomQty(), requiresPrescription: true, isFeatured: false, unitOfMeasure: 'box', strength: '5mg', dosageForm: 'tablet' },

    // ── OTC Medications (PHARM002) ────────────────────────────────────
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Ibuprofen 400mg', category: 'medication', description: 'Pain relief and anti-inflammatory. 20 tablets.', price: 55, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'box', strength: '400mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Cetirizine 10mg', category: 'medication', description: 'Allergy relief antihistamine. 30 tablets.', price: 60, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'box', strength: '10mg', dosageForm: 'tablet' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Loperamide 2mg', category: 'medication', description: 'Anti-diarrhea medication. 12 capsules.', price: 40, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'box', strength: '2mg', dosageForm: 'capsule' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Antacid Tablets', category: 'medication', description: 'Fast-acting heartburn relief. 50 chewable tablets.', price: 65, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle', dosageForm: 'chewable' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Cough Syrup', category: 'medication', description: 'Dry and wet cough relief. 100ml bottle.', price: 75, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle', strength: '100ml', dosageForm: 'syrup' },

    // ── Vitamins & Supplements (PHARM001 + NUTR001) ───────────────────
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Vitamin D3 1000IU', category: 'vitamins', description: 'Bone health and immunity. 90 softgels.', price: 180, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'bottle', strength: '1000IU' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Iron Supplement 65mg', category: 'vitamins', description: 'For iron deficiency. 60 tablets.', price: 120, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle', strength: '65mg' },
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Zinc 50mg', category: 'vitamins', description: 'Immune support supplement. 60 tablets.', price: 90, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle', strength: '50mg' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Calcium + Vitamin D', category: 'vitamins', description: 'Bone health formula. 60 tablets.', price: 150, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Magnesium 400mg', category: 'vitamins', description: 'Muscle and nerve support. 60 capsules.', price: 130, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle', strength: '400mg' },
    { providerUserId: 'NUTR001', providerType: 'NUTRITIONIST', name: 'Probiotic 50B CFU', category: 'vitamins', description: 'Gut health probiotic. 30 capsules.', price: 350, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'bottle', strength: '50 Billion CFU' },
    { providerUserId: 'NUTR001', providerType: 'NUTRITIONIST', name: 'Collagen Peptides', category: 'vitamins', description: 'Skin and joint health. 300g powder.', price: 550, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'tub', strength: '300g' },
    { providerUserId: 'NUTR001', providerType: 'NUTRITIONIST', name: 'B-Complex Vitamins', category: 'vitamins', description: 'Energy and metabolism support. 60 tablets.', price: 180, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },

    // ── Baby Care (NAN001) ────────────────────────────────────────────
    { providerUserId: 'NAN001', providerType: 'NANNY', name: 'Baby Shampoo', category: 'baby_care', description: 'Tear-free gentle baby shampoo. 250ml.', price: 120, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },
    { providerUserId: 'NAN001', providerType: 'NANNY', name: 'Baby Wipes Pack', category: 'baby_care', description: 'Alcohol-free wet wipes. 80 sheets.', price: 80, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'pack' },
    { providerUserId: 'NAN001', providerType: 'NANNY', name: 'Baby Sunscreen SPF50', category: 'baby_care', description: 'Sensitive skin sunscreen. 100ml.', price: 200, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'tube' },

    // ── Dental Care (DENT001) ─────────────────────────────────────────
    { providerUserId: 'DENT001', providerType: 'DENTIST', name: 'Fluoride Mouthwash', category: 'dental_care', description: 'Cavity prevention mouthwash. 500ml.', price: 150, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },
    { providerUserId: 'DENT001', providerType: 'DENTIST', name: 'Orthodontic Wax', category: 'dental_care', description: 'Relief for braces irritation. 5 strips.', price: 60, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'pack' },
    { providerUserId: 'DENT001', providerType: 'DENTIST', name: 'Electric Toothbrush', category: 'dental_care', description: 'Rechargeable sonic toothbrush with 3 modes.', price: 1800, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'unit' },

    // ── Eye Care (OPT001) ─────────────────────────────────────────────
    { providerUserId: 'OPT001', providerType: 'OPTOMETRIST', name: 'Contact Lens Solution', category: 'eye_care', description: 'Multi-purpose disinfecting solution. 360ml.', price: 220, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },
    { providerUserId: 'OPT001', providerType: 'OPTOMETRIST', name: 'Reading Glasses +2.0', category: 'eyewear', description: 'Lightweight reading glasses. Multiple styles.', price: 600, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'pair' },
    { providerUserId: 'OPT001', providerType: 'OPTOMETRIST', name: 'Eye Vitamin Formula', category: 'vitamins', description: 'Lutein + Zeaxanthin for eye health. 60 capsules.', price: 380, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },

    // ── Monitoring & Medical Devices ──────────────────────────────────
    { providerUserId: 'PHARM001', providerType: 'PHARMACIST', name: 'Digital Thermometer', category: 'monitoring', description: 'Fast-read digital thermometer. Fever alert.', price: 250, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'unit' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Glucose Meter Kit', category: 'monitoring', description: 'Blood glucose monitoring system with 25 test strips.', price: 800, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'kit' },
    { providerUserId: 'LAB001', providerType: 'LAB_TECHNICIAN', name: 'Pregnancy Test Kit', category: 'medical_devices', description: 'Rapid home pregnancy test. 2 tests per kit.', price: 120, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'kit' },

    // ── Personal Care ─────────────────────────────────────────────────
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'Hand Sanitizer 500ml', category: 'personal_care', description: '70% alcohol hand sanitizer with pump.', price: 95, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'bottle' },
    { providerUserId: 'PHARM002', providerType: 'PHARMACIST', name: 'N95 Face Masks', category: 'personal_care', description: 'Medical-grade N95 masks. 10 per box.', price: 180, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'box' },
    { providerUserId: 'CARE001', providerType: 'CAREGIVER', name: 'Wheelchair Cushion', category: 'personal_care', description: 'Pressure relief wheelchair cushion.', price: 650, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'unit' },

    // ── Nutrition Products ────────────────────────────────────────────
    { providerUserId: 'NUTR001', providerType: 'NUTRITIONIST', name: 'Meal Replacement Shake', category: 'nutrition', description: 'High protein meal replacement. 900g tub.', price: 780, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'tub' },
    { providerUserId: 'NUTR001', providerType: 'NUTRITIONIST', name: 'Fiber Supplement', category: 'nutrition', description: 'Psyllium husk fiber. 200g powder.', price: 220, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'tub' },

    // ── Rehab Equipment (PHYSIO001) ───────────────────────────────────
    { providerUserId: 'PHYSIO001', providerType: 'PHYSIOTHERAPIST', name: 'Foam Roller', category: 'rehab_equipment', description: 'High-density foam roller for muscle recovery. 60cm.', price: 350, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'unit' },
    { providerUserId: 'PHYSIO001', providerType: 'PHYSIOTHERAPIST', name: 'TENS Machine', category: 'rehab_equipment', description: 'Transcutaneous electrical nerve stimulation device.', price: 1200, quantity: randomQty(), requiresPrescription: false, isFeatured: true, unitOfMeasure: 'unit' },
    { providerUserId: 'PHYSIO001', providerType: 'PHYSIOTHERAPIST', name: 'Exercise Ball 65cm', category: 'rehab_equipment', description: 'Anti-burst stability ball for rehabilitation.', price: 450, quantity: randomQty(), requiresPrescription: false, isFeatured: false, unitOfMeasure: 'unit' },
  ]

  // Verify providers exist
  const providerIds = [...new Set(items.map(i => i.providerUserId))]
  const existing = await prisma.user.findMany({
    where: { id: { in: providerIds } },
    select: { id: true },
  })
  const existingIds = new Set(existing.map(p => p.id))
  const validItems = items.filter(i => existingIds.has(i.providerUserId))

  if (validItems.length === 0) {
    console.log('  No matching providers found - skipping expanded inventory')
    return
  }

  // Category-based image assignment
  const catCounter: Record<string, number> = {}
  const catMax: Record<string, number> = {
    medication: 6, vitamins: 6, first_aid: 4, personal_care: 4,
    dental_care: 4, baby_care: 4, medical_devices: 4, monitoring: 4,
    eyewear: 4, nutrition: 4, eye_care: 4, rehab_equipment: 4,
  }

  function getImg(category: string): string {
    const folder = category === 'eye_care' ? 'eyewear' : category === 'rehab_equipment' ? 'medical_devices' : category
    const max = catMax[folder] || 4
    const count = (catCounter[folder] || 0) + 1
    catCounter[folder] = count
    return `/images/products/${folder}/${((count - 1) % max) + 1}.jpg`
  }

  await prisma.providerInventoryItem.createMany({
    data: validItems.map(item => ({
      providerUserId: item.providerUserId,
      providerType: item.providerType,
      name: item.name,
      category: item.category,
      description: item.description,
      imageUrl: productImage(item.name, getImg(item.category)),
      price: item.price,
      currency: 'MUR',
      quantity: item.quantity,
      minStockAlert: 5,
      inStock: true,
      isFeatured: item.isFeatured,
      requiresPrescription: item.requiresPrescription,
      unitOfMeasure: item.unitOfMeasure,
      strength: item.strength || null,
      dosageForm: item.dosageForm || null,
    })),
    skipDuplicates: true,
  })

  console.log(`  ✓ ${validItems.length} expanded inventory items seeded`)
}
