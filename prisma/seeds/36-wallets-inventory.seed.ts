import { PrismaClient } from '@prisma/client'
import { productImage } from './_product-images'

export async function seedWallets(prisma: PrismaClient) {
  console.log('  Seeding wallets for users without one...')

  const usersWithoutWallet = await prisma.user.findMany({
    where: { wallet: null },
    select: { id: true },
  })

  if (usersWithoutWallet.length === 0) {
    console.log('  All users already have wallets — skipping')
    return
  }

  await prisma.userWallet.createMany({
    data: usersWithoutWallet.map((user) => ({
      userId: user.id,
      balance: Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000,
      currency: 'MUR',
      initialCredit: 4500,
    })),
    skipDuplicates: true,
  })

  console.log(`  Created ${usersWithoutWallet.length} wallets`)
}

export async function seedInventoryItems(prisma: PrismaClient) {
  console.log('  Seeding provider inventory items...')

  const randomQty = () => Math.floor(Math.random() * (100 - 20 + 1)) + 20

  const items: {
    providerUserId: string
    providerType: string
    name: string
    category: string
    description: string
    price: number
    currency: string
    quantity: number
    minStockAlert: number
    inStock: boolean
    isFeatured: boolean
    requiresPrescription: boolean
    unitOfMeasure: string
    strength?: string
    dosageForm?: string
  }[] = [
    // PHARM001 — Pharmacist
    {
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      name: 'Paracetamol 500mg',
      category: 'medication',
      description: 'Pain relief and fever reducer. 20 tablets per box.',
      price: 45,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'box',
      strength: '500mg',
      dosageForm: 'tablet',
    },
    {
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      name: 'Amoxicillin 250mg',
      category: 'medication',
      description: 'Broad-spectrum antibiotic. Prescription required.',
      price: 120,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: true,
      unitOfMeasure: 'box',
      strength: '250mg',
      dosageForm: 'capsule',
    },
    {
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      name: 'Vitamin C 1000mg',
      category: 'vitamins',
      description: 'Immune system support. 30 effervescent tablets.',
      price: 80,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'box',
      strength: '1000mg',
      dosageForm: 'tablet',
    },
    {
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      name: 'First Aid Kit',
      category: 'first_aid',
      description: 'Complete home first aid kit with bandages, antiseptic, and more.',
      price: 250,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'PHARM001',
      providerType: 'PHARMACIST',
      name: 'Blood Pressure Monitor',
      category: 'monitoring',
      description: 'Digital automatic upper arm blood pressure monitor.',
      price: 1500,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // DOC001 — Doctor
    {
      providerUserId: 'DOC001',
      providerType: 'DOCTOR',
      name: 'Stethoscope',
      category: 'medical_devices',
      description: 'Professional-grade dual-head stethoscope.',
      price: 2500,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'DOC001',
      providerType: 'DOCTOR',
      name: 'Surgical Gloves box',
      category: 'personal_care',
      description: 'Latex-free surgical gloves. 100 pieces per box.',
      price: 150,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'box',
    },
    {
      providerUserId: 'DOC001',
      providerType: 'DOCTOR',
      name: 'Pulse Oximeter',
      category: 'monitoring',
      description: 'Fingertip pulse oximeter for SpO2 and heart rate monitoring.',
      price: 800,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // NUR001 — Nurse
    {
      providerUserId: 'NUR001',
      providerType: 'NURSE',
      name: 'Wound Dressing Kit',
      category: 'first_aid',
      description: 'Sterile wound dressing kit with gauze, tape, and antiseptic.',
      price: 200,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'NUR001',
      providerType: 'NURSE',
      name: 'Blood Glucose Strips',
      category: 'monitoring',
      description: 'Compatible glucose test strips. 50 strips per box.',
      price: 350,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'box',
    },
    {
      providerUserId: 'NUR001',
      providerType: 'NURSE',
      name: 'Compression Bandage',
      category: 'first_aid',
      description: 'Elastic compression bandage for sprains and strains.',
      price: 120,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // DENT001 — Dentist
    {
      providerUserId: 'DENT001',
      providerType: 'DENTIST',
      name: 'Dental Mirror',
      category: 'medical_devices',
      description: 'Stainless steel dental inspection mirror.',
      price: 450,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'DENT001',
      providerType: 'DENTIST',
      name: 'Teeth Whitening Kit',
      category: 'dental_care',
      description: 'Professional at-home teeth whitening kit with LED light.',
      price: 1200,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'DENT001',
      providerType: 'DENTIST',
      name: 'Dental Floss Pack',
      category: 'dental_care',
      description: 'Mint-flavored dental floss, 50m per pack.',
      price: 85,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // OPT001 — Optometrist
    {
      providerUserId: 'OPT001',
      providerType: 'OPTOMETRIST',
      name: 'Reading Glasses +1.5',
      category: 'eyewear',
      description: 'Lightweight reading glasses with +1.5 diopter correction.',
      price: 800,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'pair',
    },
    {
      providerUserId: 'OPT001',
      providerType: 'OPTOMETRIST',
      name: 'Anti-Blue Light Glasses',
      category: 'eyewear',
      description: 'Blue light blocking glasses for screen protection.',
      price: 1500,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'pair',
    },
    {
      providerUserId: 'OPT001',
      providerType: 'OPTOMETRIST',
      name: 'Eye Drops',
      category: 'eye_care',
      description: 'Lubricating eye drops for dry eyes. 15ml bottle.',
      price: 180,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'bottle',
    },

    // NUTR001 — Nutritionist
    {
      providerUserId: 'NUTR001',
      providerType: 'NUTRITIONIST',
      name: 'Protein Powder',
      category: 'nutrition',
      description: 'Whey protein powder, vanilla flavor. 1kg tub.',
      price: 950,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'NUTR001',
      providerType: 'NUTRITIONIST',
      name: 'Multivitamin Complex',
      category: 'vitamins',
      description: 'Daily multivitamin with essential minerals. 60 tablets.',
      price: 450,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'bottle',
    },
    {
      providerUserId: 'NUTR001',
      providerType: 'NUTRITIONIST',
      name: 'Omega-3 Fish Oil',
      category: 'nutrition',
      description: 'High-strength omega-3 fish oil capsules. 90 softgels.',
      price: 600,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'bottle',
    },

    // PHYSIO001 — Physiotherapist
    {
      providerUserId: 'PHYSIO001',
      providerType: 'PHYSIOTHERAPIST',
      name: 'Resistance Bands Set',
      category: 'rehab_equipment',
      description: 'Set of 5 resistance bands with varying tension levels.',
      price: 550,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'PHYSIO001',
      providerType: 'PHYSIOTHERAPIST',
      name: 'Massage Ball',
      category: 'rehab_equipment',
      description: 'Deep tissue massage ball for trigger point therapy.',
      price: 250,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'PHYSIO001',
      providerType: 'PHYSIOTHERAPIST',
      name: 'Hot/Cold Pack',
      category: 'rehab_equipment',
      description: 'Reusable hot and cold therapy gel pack.',
      price: 180,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // CARE001 — Caregiver
    {
      providerUserId: 'CARE001',
      providerType: 'CAREGIVER',
      name: 'Adult Diapers Pack',
      category: 'personal_care',
      description: 'Ultra-absorbent adult diapers. 20 pieces per pack.',
      price: 450,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'CARE001',
      providerType: 'CAREGIVER',
      name: 'Bed Rail',
      category: 'medical_devices',
      description: 'Adjustable bed safety rail for fall prevention.',
      price: 2200,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'CARE001',
      providerType: 'CAREGIVER',
      name: 'Non-Slip Socks',
      category: 'personal_care',
      description: 'Anti-slip hospital-style socks for elderly care.',
      price: 120,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'pair',
    },

    // NAN001 — Nanny
    {
      providerUserId: 'NAN001',
      providerType: 'NANNY',
      name: 'Baby Thermometer',
      category: 'monitoring',
      description: 'Non-contact infrared baby thermometer.',
      price: 350,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'NAN001',
      providerType: 'NANNY',
      name: 'Diaper Cream',
      category: 'baby_care',
      description: 'Zinc oxide diaper rash cream. 100g tube.',
      price: 180,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'NAN001',
      providerType: 'NANNY',
      name: 'Baby Monitor',
      category: 'baby_care',
      description: 'Audio and video baby monitor with night vision.',
      price: 2500,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },

    // LAB001 — Lab Tech
    {
      providerUserId: 'LAB001',
      providerType: 'LAB_TECHNICIAN',
      name: 'Home Test Kit COVID',
      category: 'medical_devices',
      description: 'Rapid antigen self-test kit for COVID-19.',
      price: 250,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'LAB001',
      providerType: 'LAB_TECHNICIAN',
      name: 'Urine Test Strips',
      category: 'medical_devices',
      description: 'Multi-parameter urine analysis test strips. 50 per bottle.',
      price: 150,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'bottle',
    },

    // EMW001 — Emergency Worker
    {
      providerUserId: 'EMW001',
      providerType: 'EMERGENCY_WORKER',
      name: 'Emergency Blanket',
      category: 'first_aid',
      description: 'Mylar thermal emergency blanket for shock prevention.',
      price: 120,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: true,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
    {
      providerUserId: 'EMW001',
      providerType: 'EMERGENCY_WORKER',
      name: 'Neck Brace',
      category: 'medical_devices',
      description: 'Adjustable cervical collar for neck immobilization.',
      price: 800,
      currency: 'MUR',
      quantity: randomQty(),
      minStockAlert: 5,
      inStock: true,
      isFeatured: false,
      requiresPrescription: false,
      unitOfMeasure: 'unit',
    },
  ]

  // Verify providers exist before inserting
  const providerIds = [...new Set(items.map((i) => i.providerUserId))]
  const existingProviders = await prisma.user.findMany({
    where: { id: { in: providerIds } },
    select: { id: true },
  })
  const existingIds = new Set(existingProviders.map((p) => p.id))

  const validItems = items.filter((item) => existingIds.has(item.providerUserId))

  if (validItems.length === 0) {
    console.log('  No matching providers found — skipping inventory items')
    return
  }

  // Assign product images based on category
  const categoryImageCounter: Record<string, number> = {}
  const categoryImageMax: Record<string, number> = {
    medication: 6, vitamins: 6, first_aid: 4, personal_care: 4,
    dental_care: 4, baby_care: 4, medical_devices: 4, monitoring: 4,
    eyewear: 4, nutrition: 4, eye_care: 4, rehab_equipment: 4, other: 4,
  }

  function getProductImage(category: string): string | null {
    const folder = category === 'eye_care' ? 'eyewear' : category === 'rehab_equipment' ? 'medical_devices' : category
    const max = categoryImageMax[folder] || 4
    const count = (categoryImageCounter[folder] || 0) + 1
    categoryImageCounter[folder] = count
    const idx = ((count - 1) % max) + 1
    return `/images/products/${folder}/${idx}.jpg`
  }

  // Delete existing items for these providers to avoid duplicates
  await prisma.providerInventoryItem.deleteMany({
    where: { providerUserId: { in: [...existingIds] } },
  })

  await prisma.providerInventoryItem.createMany({
    data: validItems.map((item) => ({
      providerUserId: item.providerUserId,
      providerType: item.providerType,
      name: item.name,
      category: item.category,
      description: item.description,
      imageUrl: productImage(item.name, getProductImage(item.category)),
      price: item.price,
      currency: item.currency,
      quantity: item.quantity,
      minStockAlert: item.minStockAlert,
      inStock: item.inStock,
      isFeatured: item.isFeatured,
      requiresPrescription: item.requiresPrescription,
      unitOfMeasure: item.unitOfMeasure,
      strength: item.strength || null,
      dosageForm: item.dosageForm || null,
    })),
  })

  console.log(`  Created ${validItems.length} inventory items for ${existingIds.size} providers`)
}
