/**
 * Seed 61 - User GPS Coordinates (Mauritius)
 *
 * Assigns real lat/lng positions across Mauritius to every seeded provider
 * and member. Coordinates reflect realistic practice locations in their
 * stated city/address. Safe to re-run - uses update with upsert semantics.
 *
 * Mauritius bounding box: lat -20.52…-19.97, lng 57.30…57.80
 */

import { PrismaClient } from '@prisma/client'

const COORDS: Record<string, { lat: number; lng: number }> = {
  // ── Doctors ─────────────────────────────────────────────────────────────
  DOC001: { lat: -20.1609, lng: 57.4977 }, // Port Louis, Royal Road clinic
  DOC002: { lat: -20.2342, lng: 57.4617 }, // Rose Hill main street
  DOC003: { lat: -20.3173, lng: 57.5259 }, // Curepipe medical centre
  // ── Nurses ──────────────────────────────────────────────────────────────
  NUR001: { lat: -20.2648, lng: 57.4759 }, // Quatre Bornes
  NUR002: { lat: -20.2985, lng: 57.4786 }, // Vacoas
  // ── Nannies ─────────────────────────────────────────────────────────────
  NAN001: { lat: -20.2267, lng: 57.4684 }, // Beau Bassin
  NAN002: { lat: -20.1880, lng: 57.4760 }, // Phoenix
  // ── Patients / Members ──────────────────────────────────────────────────
  PAT001: { lat: -20.1721, lng: 57.5080 }, // Port Louis residential
  PAT002: { lat: -20.2450, lng: 57.4950 }, // Ebène area
  PAT003: { lat: -20.3060, lng: 57.5200 }, // Curepipe north
  PAT004: { lat: -20.0130, lng: 57.5820 }, // Grand Baie
  PAT005: { lat: -20.4072, lng: 57.7020 }, // Mahébourg
  // ── Pharmacists ─────────────────────────────────────────────────────────
  PHARM001: { lat: -20.1598, lng: 57.5002 }, // Port Louis Pope Hennessy St
  PHARM002: { lat: -20.2710, lng: 57.4700 }, // Quatre Bornes pharmacy
  // ── Lab Technicians ─────────────────────────────────────────────────────
  LAB001: { lat: -20.1644, lng: 57.4960 }, // Port Louis lab
  LAB002: { lat: -20.2455, lng: 57.4836 }, // Ebène Cybercity
  // ── Emergency Workers / Ambulance ────────────────────────────────────────
  INS001: { lat: -20.3095, lng: 57.5016 }, // Floréal (insurance)
  INS002: { lat: -20.2366, lng: 57.5056 }, // Moka (insurance)
  // ── Corporate / Referral ────────────────────────────────────────────────
  CORP001: { lat: -20.2455, lng: 57.4836 }, // Ebène Cybercity (corporate HQ)
  REF001:  { lat: -20.1609, lng: 57.4977 }, // Port Louis
  // ── Caregivers ──────────────────────────────────────────────────────────
  CARE001: { lat: -20.3960, lng: 57.6060 }, // Rose Belle
  CARE002: { lat: -20.2080, lng: 57.4600 }, // Beau Bassin north
  // ── Physiotherapists ────────────────────────────────────────────────────
  PHYSIO001: { lat: -20.2460, lng: 57.4840 }, // Ebène
  PHYSIO002: { lat: -20.1650, lng: 57.5010 }, // Port Louis physio centre
  // ── Dentists ────────────────────────────────────────────────────────────
  DENT001: { lat: -20.2340, lng: 57.4620 }, // Rose Hill dental
  DENT002: { lat: -20.3180, lng: 57.5260 }, // Curepipe dental
  // ── Optometrists ────────────────────────────────────────────────────────
  OPT001: { lat: -20.1620, lng: 57.4995 }, // Port Louis optical
  OPT002: { lat: -20.2660, lng: 57.4755 }, // Quatre Bornes optical
  // ── Nutritionists ───────────────────────────────────────────────────────
  NUTR001: { lat: -20.3050, lng: 57.4980 }, // Floréal wellness
  NUTR002: { lat: -20.2350, lng: 57.4630 }, // Rose Hill wellness
  // ── Expanded providers from seed 42 ─────────────────────────────────────
  'OPT-MU-001': { lat: -20.1590, lng: 57.4965 }, // ClearVision Optics, Port Louis
  'OPT-MU-002': { lat: -20.0140, lng: 57.5815 }, // Island Eye Care, Grand Baie
  'NUT-MU-001': { lat: -20.2480, lng: 57.4850 }, // Ebène nutrition clinic
  'NUT-MU-002': { lat: -20.3020, lng: 57.5090 }, // Curepipe nutrition
}

export async function seedUserCoordinates(prisma: PrismaClient) {
  let updated = 0
  let skipped = 0

  for (const [id, { lat, lng }] of Object.entries(COORDS)) {
    try {
      const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
      if (!user) { skipped++; continue }

      await prisma.user.update({
        where: { id },
        data: { latitude: lat, longitude: lng },
      })
      updated++
    } catch {
      skipped++
    }
  }

  console.log(`  ✓ Seed 61: ${updated} users geo-tagged, ${skipped} skipped (not found)`)
}
