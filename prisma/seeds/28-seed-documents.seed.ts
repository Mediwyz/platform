import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

// All known Mauritius user IDs and their initials
const mauritiusUsers = [
  // Doctors
  { id: 'DOC001', initials: 'SJ', color: '#4A90D9' },
  { id: 'DOC002', initials: 'RP', color: '#D94A4A' },
  { id: 'DOC003', initials: 'MD', color: '#4AD97A' },
  // Nurses
  { id: 'NUR001', initials: 'PR', color: '#D9A04A' },
  { id: 'NUR002', initials: 'SL', color: '#9B4AD9' },
  // Nannies
  { id: 'NAN001', initials: 'AB', color: '#4AD9D9' },
  { id: 'NAN002', initials: 'CM', color: '#D94A9B' },
  // Patients
  { id: 'PAT001', initials: 'EJ', color: '#6B8E23' },
  { id: 'PAT002', initials: 'JP', color: '#8B4513' },
  { id: 'PAT003', initials: 'AK', color: '#2E8B57' },
  { id: 'PAT004', initials: 'VD', color: '#4682B4' },
  { id: 'PAT005', initials: 'NS', color: '#9932CC' },
  // Pharmacists
  { id: 'PHARM001', initials: 'RD', color: '#DC143C' },
  { id: 'PHARM002', initials: 'AD', color: '#FF6347' },
  // Lab Technicians
  { id: 'LAB001', initials: 'DA', color: '#20B2AA' },
  { id: 'LAB002', initials: 'PD', color: '#778899' },
  // Emergency Workers
  { id: 'EMW001', initials: 'JL', color: '#FF4500' },
  { id: 'EMW002', initials: 'FJ', color: '#FF8C00' },
  // Insurance Reps
  { id: 'INS001', initials: 'VD', color: '#6A5ACD' },
  { id: 'INS002', initials: 'MG', color: '#3CB371' },
  // Corporate Admin
  { id: 'CORP001', initials: 'AD', color: '#1E90FF' },
  // Referral Partner
  { id: 'REF001', initials: 'SL', color: '#FF69B4' },
  // Regional Admins
  { id: 'RADM000', initials: 'HD', color: '#556B2F' },
  { id: 'RADM001', initials: 'VD', color: '#8B0000' },
  { id: 'RADM002', initials: 'TR', color: '#2F4F4F' },
  { id: 'RADM003', initials: 'JM', color: '#191970' },
]

// Professional user IDs that need document records (doctors, nurses, pharmacists, lab techs)
const professionalMauritiusIds = [
  'DOC001', 'DOC002', 'DOC003',
  'NUR001', 'NUR002',
  'PHARM001', 'PHARM002',
  'LAB001', 'LAB002',
]

// Multi-country user configs (matches seed 27 assignments)
const countryConfigs = [
  {
    code: 'MG',
    names: [
      { first: 'Tiana', last: 'Rasoamanarivo' },
      { first: 'Ravo', last: 'Andriamihaja' },
      { first: 'Haingo', last: 'Rakotoarisoa' },
      { first: 'Faly', last: 'Randrianasolo' },
      { first: 'Nomena', last: 'Razafindrakoto' },
      { first: 'Miora', last: 'Ratsimbazafy' },
      { first: 'Mamy', last: 'Rakotonirina' },
      { first: 'Hery', last: 'Rakotondrazaka' },
      { first: 'Lalaina', last: 'Andrianaivo' },
      { first: 'Voahangy', last: 'Ramanantsoa' },
    ],
  },
  {
    code: 'KE',
    names: [
      { first: 'Wanjiru', last: 'Kamau' },
      { first: 'Odhiambo', last: 'Otieno' },
      { first: 'Njeri', last: 'Muthoni' },
      { first: 'Kariuki', last: 'Ngugi' },
      { first: 'Achieng', last: 'Ouma' },
      { first: 'Wambui', last: 'Gitonga' },
      { first: 'Kipchoge', last: 'Korir' },
      { first: 'Mutiso', last: 'Musyoka' },
      { first: 'Nyambura', last: 'Wainaina' },
      { first: 'Chebet', last: 'Rotich' },
    ],
  },
  {
    code: 'TG',
    names: [
      { first: 'Kofi', last: 'Agbeko' },
      { first: 'Ama', last: 'Mensah' },
      { first: 'Yao', last: 'Dossou' },
      { first: 'Adjoa', last: 'Amegah' },
      { first: 'Kwame', last: 'Koudjo' },
      { first: 'Akua', last: 'Afi' },
      { first: 'Kodjo', last: 'Lawson' },
      { first: 'Abla', last: 'Togbe' },
      { first: 'Komlan', last: 'Akakpo' },
      { first: 'Afi', last: 'Agbenou' },
    ],
  },
  {
    code: 'BJ',
    names: [
      { first: 'Dossou', last: 'Ahouandjinou' },
      { first: 'Gbaguidi', last: 'Amoussou' },
      { first: 'Hounton', last: 'Sossa' },
      { first: 'Agossou', last: 'Kiki' },
      { first: 'Adjovi', last: 'Hounsa' },
      { first: 'Sessinou', last: 'Gandonou' },
      { first: 'Codjo', last: 'Houngbedji' },
      { first: 'Fifame', last: 'Adjibi' },
      { first: 'Gbenou', last: 'Tossou' },
      { first: 'Ayaba', last: 'Dah' },
    ],
  },
  {
    code: 'RW',
    names: [
      { first: 'Uwimana', last: 'Mugisha' },
      { first: 'Habimana', last: 'Niyonzima' },
      { first: 'Ingabire', last: 'Mutesi' },
      { first: 'Ndayisaba', last: 'Hakizimana' },
      { first: 'Uwase', last: 'Mukamana' },
      { first: 'Irakoze', last: 'Nsengimana' },
      { first: 'Ntwari', last: 'Bizimana' },
      { first: 'Iradukunda', last: 'Uwitonze' },
      { first: 'Ishimwe', last: 'Rugamba' },
      { first: 'Umutesi', last: 'Ingabire' },
    ],
  },
]

// Type assignments matching seed 27 (indices 0-9)
const typeIdPrefixes = ['PAT', 'PAT', 'DOC', 'DOC', 'NUR', 'NAN', 'PHARM', 'LAB', 'EMW', 'INS']
// Professional indices (doctors, nurses, pharmacists, lab techs)
const professionalIndices = [2, 3, 4, 6, 7]

function generateSvg(initials: string, color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="95" fill="${color}" stroke="#fff" stroke-width="3"/>
  <text x="100" y="115" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
</svg>`
}

function generatePlaceholderDocument(userName: string, docType: string): string {
  return `Placeholder ${docType} document for ${userName}.\nThis is a seed-generated placeholder file for development purposes.\nGenerated at: ${new Date().toISOString()}`
}

export async function seedDocumentsAndFiles(prisma: PrismaClient) {
  const publicDir = path.resolve(process.cwd(), 'public')
  const profilesDir = path.join(publicDir, 'uploads', 'seed', 'profiles')
  const documentsDir = path.join(publicDir, 'uploads', 'seed', 'documents')

  // Create directories
  await mkdir(profilesDir, { recursive: true })
  await mkdir(documentsDir, { recursive: true })

  // ── 1. Mauritius users: set profileImage + generate SVG files ──────────────

  for (const user of mauritiusUsers) {
    const svgPath = path.join(profilesDir, `${user.id}.svg`)
    const svgContent = generateSvg(user.initials, user.color)
    await writeFile(svgPath, svgContent, 'utf-8')

    await prisma.user.update({
      where: { id: user.id },
      data: { profileImage: `/uploads/seed/profiles/${user.id}.svg` },
    })
  }

  console.log(`  Generated ${mauritiusUsers.length} profile SVGs for Mauritius users`)

  // ── 2. Multi-country users: set profileImage + generate SVG files ──────────

  let multiCountryCount = 0

  for (const country of countryConfigs) {
    const counters: Record<string, number> = {}

    for (let i = 0; i < typeIdPrefixes.length; i++) {
      const prefix = typeIdPrefixes[i]
      counters[prefix] = (counters[prefix] || 0) + 1
      const num = counters[prefix].toString().padStart(3, '0')
      const userId = `${country.code}-${prefix}${num}`
      const person = country.names[i]
      const initials = `${person.first[0]}${person.last[0]}`
      const color = `hsl(${(i * 36 + parseInt(country.code, 36)) % 360}, 60%, 45%)`

      const svgPath = path.join(profilesDir, `${userId}.svg`)
      const svgContent = generateSvg(initials, color)
      await writeFile(svgPath, svgContent, 'utf-8')

      await prisma.user.update({
        where: { id: userId },
        data: { profileImage: `/uploads/seed/profiles/${userId}.svg` },
      })

      multiCountryCount++
    }
  }

  console.log(`  Generated ${multiCountryCount} profile SVGs for multi-country users`)

  // ── 3. Document records for Mauritius professional users ───────────────────

  const docRecords: { userId: string; name: string; type: string; url: string }[] = []

  for (const userId of professionalMauritiusIds) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } })
    const userName = user ? `${user.firstName} ${user.lastName}` : userId

    // National ID document
    const idUrl = `/uploads/seed/documents/${userId}-national-id.pdf`
    const idFilePath = path.join(documentsDir, `${userId}-national-id.pdf`)
    await writeFile(idFilePath, generatePlaceholderDocument(userName, 'National ID'), 'utf-8')
    docRecords.push({ userId, name: 'National ID', type: 'id_proof', url: idUrl })

    // Professional License document
    const licenseUrl = `/uploads/seed/documents/${userId}-license.pdf`
    const licenseFilePath = path.join(documentsDir, `${userId}-license.pdf`)
    await writeFile(licenseFilePath, generatePlaceholderDocument(userName, 'Professional License'), 'utf-8')
    docRecords.push({ userId, name: 'Professional License', type: 'license', url: licenseUrl })
  }

  console.log(`  Generated ${docRecords.length} placeholder document files for Mauritius professionals`)

  // ── 4. Document records for multi-country professional users ───────────────

  for (const country of countryConfigs) {
    const counters: Record<string, number> = {}

    for (let i = 0; i < typeIdPrefixes.length; i++) {
      const prefix = typeIdPrefixes[i]
      counters[prefix] = (counters[prefix] || 0) + 1
      const num = counters[prefix].toString().padStart(3, '0')

      if (!professionalIndices.includes(i)) continue

      const userId = `${country.code}-${prefix}${num}`
      const person = country.names[i]
      const userName = `${person.first} ${person.last}`

      // National ID document
      const idUrl = `/uploads/seed/documents/${userId}-national-id.pdf`
      const idFilePath = path.join(documentsDir, `${userId}-national-id.pdf`)
      await writeFile(idFilePath, generatePlaceholderDocument(userName, 'National ID'), 'utf-8')
      docRecords.push({ userId, name: 'National ID', type: 'id_proof', url: idUrl })

      // Professional License document
      const licenseUrl = `/uploads/seed/documents/${userId}-license.pdf`
      const licenseFilePath = path.join(documentsDir, `${userId}-license.pdf`)
      await writeFile(licenseFilePath, generatePlaceholderDocument(userName, 'Professional License'), 'utf-8')
      docRecords.push({ userId, name: 'Professional License', type: 'license', url: licenseUrl })
    }
  }

  // Insert document records into DB
  for (const doc of docRecords) {
    await prisma.document.create({ data: doc })
  }

  console.log(`  Created ${docRecords.length} document records in database`)
  console.log(`  Seed documents and files complete`)
}
