import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'

/**
 * Seed #42 — Expanded Providers & Health Shop Inventory
 * Adds more providers for newer roles + rich inventory for each provider type.
 */
export async function seedExpandedProvidersInventory(prismaArg?: PrismaClient) {
  const prisma = prismaArg || new PrismaClient()
  const hash = await bcrypt.hash('Provider123!', 10)
  const regionMU = await prisma.region.findFirst({ where: { countryCode: 'MU' } })

  // ─── New Providers (3 per newer role) ──────────────────────────────────

  const newProviders = [
    // Dentists
    { id: 'DENT-MU-001', firstName: 'Anil', lastName: 'Doorgakant', email: 'anil.doorgakant@mediwyz.com', type: UserType.DENTIST, profile: { licenseNumber: 'DN-MU-001', experience: 8, specializations: ['Orthodontics', 'Cosmetic Dentistry'], clinicName: 'GrinMore Dental' } },
    { id: 'DENT-MU-002', firstName: 'Marie', lastName: 'Collet', email: 'marie.collet@mediwyz.com', type: UserType.DENTIST, profile: { licenseNumber: 'DN-MU-002', experience: 12, specializations: ['Pediatric Dentistry', 'Endodontics'], clinicName: 'ToothFairy Family Dental' } },
    { id: 'DENT-MU-003', firstName: 'Raj', lastName: 'Seetaram', email: 'raj.seetaram@mediwyz.com', type: UserType.DENTIST, profile: { licenseNumber: 'DN-MU-003', experience: 5, specializations: ['General Dentistry', 'Oral Surgery'], clinicName: 'Harbour Smile Dental' } },
    // Optometrists
    { id: 'OPT-MU-001', firstName: 'Leena', lastName: 'Dorasami', email: 'leena.dorasami@mediwyz.com', type: UserType.OPTOMETRIST, profile: { licenseNumber: 'OP-MU-001', experience: 10, specializations: ['Contact Lenses', 'Pediatric Optometry'], clinicName: 'FourEyes Optics' } },
    { id: 'OPT-MU-002', firstName: 'Nicolas', lastName: 'Bégué', email: 'nicolas.begue@mediwyz.com', type: UserType.OPTOMETRIST, profile: { licenseNumber: 'OP-MU-002', experience: 7, specializations: ['Low Vision', 'Glaucoma Screening'], clinicName: 'TropicEye Care' } },
    // Nutritionists
    { id: 'NUT-MU-001', firstName: 'Kavita', lastName: 'Guddhoo', email: 'kavita.guddhoo@mediwyz.com', type: UserType.NUTRITIONIST, profile: { experience: 9, specializations: ['Diabetes Nutrition', 'Sports Nutrition', 'Weight Management'], certifications: ['Certified Nutritionist MU'] } },
    { id: 'NUT-MU-002', firstName: 'Fabien', lastName: 'Laval', email: 'fabien.laval@mediwyz.com', type: UserType.NUTRITIONIST, profile: { experience: 6, specializations: ['Pediatric Nutrition', 'Vegan Diet Planning'], certifications: ['Sports Nutrition Cert'] } },
    // Physiotherapists
    { id: 'PHY-MU-001', firstName: 'Ashvin', lastName: 'Doobary', email: 'ashvin.doobary@mediwyz.com', type: UserType.PHYSIOTHERAPIST, profile: { licenseNumber: 'PT-MU-001', experience: 11, specializations: ['Sports Rehab', 'Post-Surgery Recovery'], clinicName: 'FlexAppeal Physio' } },
    { id: 'PHY-MU-002', firstName: 'Nathalie', lastName: 'Figaro', email: 'nathalie.figaro@mediwyz.com', type: UserType.PHYSIOTHERAPIST, profile: { licenseNumber: 'PT-MU-002', experience: 5, specializations: ['Geriatric Physiotherapy', 'Hydrotherapy'], clinicName: 'StretchRight Physio' } },
    // Caregivers
    { id: 'CARE-MU-001', firstName: 'Deepa', lastName: 'Ramnauth', email: 'deepa.ramnauth@mediwyz.com', type: UserType.CAREGIVER, profile: { experience: 15, specializations: ['Elderly Care', 'Post-Op Care', 'Dementia Care'], certifications: ['Certified Caregiver', 'First Aid Level 3'] } },
    { id: 'CARE-MU-002', firstName: 'Thierry', lastName: 'Curé', email: 'thierry.cure@mediwyz.com', type: UserType.CAREGIVER, profile: { experience: 8, specializations: ['Palliative Care', 'Disability Support'], certifications: ['Palliative Care Cert'] } },
  ]

  for (const p of newProviders) {
    const exists = await prisma.user.findUnique({ where: { email: p.email } })
    if (exists) continue

    const user = await prisma.user.create({
      data: {
        id: p.id, firstName: p.firstName, lastName: p.lastName, email: p.email,
        password: hash, phone: '+230-5' + Math.floor(Math.random() * 9000000 + 1000000),
        userType: p.type, accountStatus: 'active', verified: true,
        address: 'Mauritius', gender: Math.random() > 0.5 ? 'Male' : 'Female',
        regionId: regionMU?.id,
      },
    })

    // Create type-specific profile
    if (p.type === UserType.DENTIST) {
      await prisma.dentistProfile.create({ data: { userId: user.id, ...p.profile as any } })
    } else if (p.type === UserType.OPTOMETRIST) {
      await prisma.optometristProfile.create({ data: { userId: user.id, ...p.profile as any } })
    } else if (p.type === UserType.NUTRITIONIST) {
      await prisma.nutritionistProfile.create({ data: { userId: user.id, ...p.profile as any } })
    } else if (p.type === UserType.PHYSIOTHERAPIST) {
      await prisma.physiotherapistProfile.create({ data: { userId: user.id, ...p.profile as any } })
    } else if (p.type === UserType.CAREGIVER) {
      await prisma.caregiverProfile.create({ data: { userId: user.id, ...p.profile as any } })
    }

    // Create wallet
    await prisma.userWallet.create({ data: { userId: user.id, balance: 5000, currency: 'MUR', initialCredit: 5000 } }).catch(() => {})

    console.log(`  Created ${p.type} ${p.firstName} ${p.lastName}`)
  }

  // ─── Health Shop Inventory (per provider type) ─────────────────────────

  const inventoryItems = [
    // Dentist items
    { providerUserId: 'DENT-MU-001', providerType: UserType.DENTIST, items: [
      { name: 'Teeth Whitening Kit', genericName: 'Carbamide Peroxide 16%', category: 'Dental Care', price: 1500, quantity: 25, description: 'Professional take-home whitening kit with custom trays', requiresPrescription: false },
      { name: 'Dental Night Guard', genericName: 'Custom Occlusal Splint', category: 'Dental Appliances', price: 2500, quantity: 15, description: 'Custom-fit night guard for teeth grinding (bruxism)', requiresPrescription: false },
      { name: 'Orthodontic Retainer', genericName: 'Clear Aligner Retainer', category: 'Dental Appliances', price: 3000, quantity: 10, description: 'Clear retainer for post-orthodontic maintenance', requiresPrescription: true },
      { name: 'Sensitive Toothpaste (Rx)', genericName: 'Potassium Nitrate 5%', category: 'Dental Care', price: 450, quantity: 50, description: 'Prescription-strength sensitivity relief toothpaste', requiresPrescription: true },
      { name: 'Antibacterial Mouthwash', genericName: 'Chlorhexidine Gluconate', category: 'Dental Care', price: 350, quantity: 60, description: 'Professional-grade antibacterial mouthwash', requiresPrescription: false },
    ]},
    { providerUserId: 'DENT-MU-002', providerType: UserType.DENTIST, items: [
      { name: 'Kids Fluoride Treatment', genericName: 'Sodium Fluoride Varnish', category: 'Pediatric Dental', price: 800, quantity: 40, description: 'Professional fluoride treatment for children', requiresPrescription: false },
      { name: 'Dental Floss Set', genericName: 'Waxed Dental Floss', category: 'Dental Care', price: 150, quantity: 100, description: 'Premium dental floss with mint flavoring', requiresPrescription: false },
    ]},
    // Optometrist items
    { providerUserId: 'OPT-MU-001', providerType: UserType.OPTOMETRIST, items: [
      { name: 'Daily Contact Lenses (30pk)', genericName: 'Silicone Hydrogel', category: 'Contact Lenses', price: 1200, quantity: 50, description: 'Daily disposable soft contact lenses for myopia', requiresPrescription: true },
      { name: 'Blue Light Blocking Glasses', genericName: 'Digital Eye Strain Glasses', category: 'Eyewear', price: 2000, quantity: 30, description: 'Anti-blue light glasses for computer users', requiresPrescription: false },
      { name: 'Prescription Sunglasses', genericName: 'Polarized Rx Sunglasses', category: 'Eyewear', price: 3500, quantity: 20, description: 'Custom prescription polarized sunglasses', requiresPrescription: true },
      { name: 'Eye Drops (Dry Eye)', genericName: 'Hyaluronic Acid 0.2%', category: 'Eye Care', price: 350, quantity: 80, description: 'Preservative-free lubricant eye drops', requiresPrescription: false },
      { name: 'Lens Cleaning Kit', genericName: 'Multi-Purpose Solution', category: 'Eye Care', price: 250, quantity: 100, description: 'Complete contact lens cleaning and storage kit', requiresPrescription: false },
    ]},
    { providerUserId: 'OPT-MU-002', providerType: UserType.OPTOMETRIST, items: [
      { name: 'Progressive Reading Glasses', genericName: 'Varifocal Lenses', category: 'Eyewear', price: 4500, quantity: 15, description: 'Premium progressive lenses for presbyopia', requiresPrescription: true },
      { name: 'Children\'s Glasses Frame', genericName: 'Flexible Kids Frame', category: 'Eyewear', price: 1800, quantity: 25, description: 'Durable, flexible frames for children', requiresPrescription: true },
    ]},
    // Nutritionist items
    { providerUserId: 'NUT-MU-001', providerType: UserType.NUTRITIONIST, items: [
      { name: 'Meal Plan Guide (Diabetes)', genericName: 'Diabetic Meal Planning Book', category: 'Nutrition Guides', price: 800, quantity: 50, description: 'Comprehensive 12-week diabetic meal plan with local Mauritian recipes', requiresPrescription: false },
      { name: 'Protein Supplement (Whey)', genericName: 'Whey Protein Isolate', category: 'Supplements', price: 1500, quantity: 30, description: 'Premium whey protein isolate 900g — vanilla', requiresPrescription: false },
      { name: 'Multivitamin Complex', genericName: 'Adult Complete Multivitamin', category: 'Supplements', price: 600, quantity: 80, description: 'Daily multivitamin with iron, zinc, and B-complex', requiresPrescription: false },
      { name: 'Omega-3 Fish Oil', genericName: 'EPA/DHA 1000mg', category: 'Supplements', price: 700, quantity: 60, description: 'High-potency omega-3 fatty acids for heart health', requiresPrescription: false },
      { name: 'Probiotic Capsules', genericName: 'Lactobacillus Multi-Strain', category: 'Supplements', price: 550, quantity: 45, description: '10 billion CFU probiotic for digestive health', requiresPrescription: false },
    ]},
    { providerUserId: 'NUT-MU-002', providerType: UserType.NUTRITIONIST, items: [
      { name: 'Weight Management Shake', genericName: 'Meal Replacement Shake', category: 'Supplements', price: 1200, quantity: 40, description: 'Low-calorie high-protein meal replacement — chocolate', requiresPrescription: false },
      { name: 'Vitamin D3 Drops', genericName: 'Cholecalciferol 1000 IU', category: 'Supplements', price: 400, quantity: 70, description: 'Liquid vitamin D3 for bone health', requiresPrescription: false },
      { name: 'Collagen Powder', genericName: 'Hydrolyzed Marine Collagen', category: 'Supplements', price: 900, quantity: 35, description: 'Marine collagen peptides for skin and joints', requiresPrescription: false },
    ]},
    // Physiotherapist items
    { providerUserId: 'PHY-MU-001', providerType: UserType.PHYSIOTHERAPIST, items: [
      { name: 'Resistance Band Set', genericName: 'Therapy Resistance Bands', category: 'Rehab Equipment', price: 600, quantity: 40, description: 'Set of 5 resistance bands (light to heavy) for physiotherapy exercises', requiresPrescription: false },
      { name: 'Foam Roller', genericName: 'High-Density Foam Roller', category: 'Rehab Equipment', price: 800, quantity: 30, description: '45cm high-density foam roller for myofascial release', requiresPrescription: false },
      { name: 'TENS Unit', genericName: 'Transcutaneous Electrical Nerve Stimulation', category: 'Medical Devices', price: 3500, quantity: 10, description: 'Portable TENS machine for pain management', requiresPrescription: true },
      { name: 'Knee Support Brace', genericName: 'Neoprene Knee Stabilizer', category: 'Orthopedic Supports', price: 1200, quantity: 25, description: 'Adjustable knee brace with lateral stabilizers', requiresPrescription: false },
      { name: 'Ice/Heat Pack', genericName: 'Reusable Therapy Pack', category: 'Rehab Equipment', price: 300, quantity: 50, description: 'Dual-purpose gel pack for hot/cold therapy', requiresPrescription: false },
    ]},
    { providerUserId: 'PHY-MU-002', providerType: UserType.PHYSIOTHERAPIST, items: [
      { name: 'Wrist Splint', genericName: 'Carpal Tunnel Wrist Brace', category: 'Orthopedic Supports', price: 700, quantity: 20, description: 'Adjustable wrist splint for carpal tunnel syndrome', requiresPrescription: false },
      { name: 'Posture Corrector', genericName: 'Back Posture Support', category: 'Orthopedic Supports', price: 900, quantity: 25, description: 'Adjustable posture corrector for upper back support', requiresPrescription: false },
    ]},
    // Caregiver items
    { providerUserId: 'CARE-MU-001', providerType: UserType.CAREGIVER, items: [
      { name: 'Blood Pressure Monitor', genericName: 'Digital BP Monitor', category: 'Home Medical', price: 2000, quantity: 15, description: 'Automatic upper-arm blood pressure monitor with memory', requiresPrescription: false },
      { name: 'Pulse Oximeter', genericName: 'Fingertip SpO2 Monitor', category: 'Home Medical', price: 800, quantity: 30, description: 'Portable pulse oximeter for oxygen saturation monitoring', requiresPrescription: false },
      { name: 'Walking Aid (Foldable)', genericName: 'Aluminum Walking Frame', category: 'Mobility Aids', price: 1500, quantity: 10, description: 'Lightweight foldable walking frame for elderly care', requiresPrescription: false },
      { name: 'Adult Incontinence Pads', genericName: 'Absorbent Pads (20pk)', category: 'Personal Care', price: 450, quantity: 60, description: 'High-absorbency incontinence pads for adults', requiresPrescription: false },
      { name: 'Pill Organizer (Weekly)', genericName: '7-Day Pill Box', category: 'Personal Care', price: 200, quantity: 50, description: 'Weekly pill organizer with AM/PM compartments', requiresPrescription: false },
    ]},
  ]

  for (const provider of inventoryItems) {
    const exists = await prisma.user.findUnique({ where: { id: provider.providerUserId } })
    if (!exists) continue

    for (const item of provider.items) {
      const existing = await prisma.providerInventoryItem.findFirst({
        where: { providerUserId: provider.providerUserId, name: item.name },
      })
      if (existing) continue

      await prisma.providerInventoryItem.create({
        data: {
          providerUserId: provider.providerUserId,
          providerType: provider.providerType,
          name: item.name,
          genericName: item.genericName,
          description: item.description,
          category: item.category,
          price: item.price,
          currency: 'MUR',
          quantity: item.quantity,
          unitOfMeasure: 'unit',
          minStockAlert: 5,
          requiresPrescription: item.requiresPrescription,
          inStock: true,
          isActive: true,
          isFeatured: Math.random() > 0.7,
        },
      })
    }
    console.log(`  Added ${provider.items.length} items for ${provider.providerType} ${provider.providerUserId}`)
  }

  console.log('Seed #42 complete: expanded providers + health shop inventory')
}
