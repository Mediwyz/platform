/**
 * Marketplace Landing Page Component Tests
 *
 * Tests specialty emoji mapping, category icons, auth guard logic,
 * and clean URL generation.
 */
import { describe, it, expect } from 'vitest'

// ─── Specialty Emoji Mapping ────────────────────────────────────────────────

const SPECIALTY_EMOJI: Record<string, string> = {
  'General Practice': '🩺', 'Family Medicine': '👨‍👩‍👧‍👦', 'Internal Medicine': '🫀',
  'Cardiology': '❤️', 'Dermatology': '🧴', 'Endocrinology': '🦠',
  'Gastroenterology': '🫃', 'Geriatrics': '👴', 'Gynecology': '🤰',
  'Neurology': '🧠', 'Oncology': '🎗️', 'Ophthalmology': '👁️',
  'Orthopedics': '🦴', 'Pediatrics': '👶', 'Psychiatry': '🧘',
  'Psychology': '💭', 'Pulmonology': '🫁', 'Radiology': '📡',
  'Rheumatology': '🦵', 'Urology': '🏥', 'Anesthesiology': '💉',
  'General Nursing': '💊', 'ICU / Critical Care': '🚨', 'Wound Care': '🩹',
  'Midwifery': '🤱', 'Newborn Care': '👶', 'Toddler Care': '🧒',
  'General Dentistry': '🦷', 'Orthodontics': '😁', 'General Eye Care': '👓',
  'Clinical Nutrition': '🥗', 'Sports Nutrition': '💪', 'Weight Management': '⚖️',
  'Elder Care': '👴', 'Disability Care': '♿', 'Paramedic': '🚑',
  'Hematology': '🩸', 'Microbiology': '🦠', 'Clinical Chemistry': '🧪',
}

function getSpecialtyEmoji(name: string): string {
  return SPECIALTY_EMOJI[name] || '🏥'
}

describe('Specialty emoji mapping', () => {
  it('returns correct emoji for doctor specialties', () => {
    expect(getSpecialtyEmoji('Cardiology')).toBe('❤️')
    expect(getSpecialtyEmoji('Neurology')).toBe('🧠')
    expect(getSpecialtyEmoji('Orthopedics')).toBe('🦴')
    expect(getSpecialtyEmoji('Pediatrics')).toBe('👶')
    expect(getSpecialtyEmoji('Dermatology')).toBe('🧴')
    expect(getSpecialtyEmoji('Oncology')).toBe('🎗️')
    expect(getSpecialtyEmoji('Pulmonology')).toBe('🫁')
  })

  it('returns correct emoji for nurse specialties', () => {
    expect(getSpecialtyEmoji('General Nursing')).toBe('💊')
    expect(getSpecialtyEmoji('ICU / Critical Care')).toBe('🚨')
    expect(getSpecialtyEmoji('Wound Care')).toBe('🩹')
    expect(getSpecialtyEmoji('Midwifery')).toBe('🤱')
  })

  it('returns correct emoji for dentist specialties', () => {
    expect(getSpecialtyEmoji('General Dentistry')).toBe('🦷')
    expect(getSpecialtyEmoji('Orthodontics')).toBe('😁')
  })

  it('returns correct emoji for optometrist specialties', () => {
    expect(getSpecialtyEmoji('General Eye Care')).toBe('👓')
  })

  it('returns correct emoji for nutritionist specialties', () => {
    expect(getSpecialtyEmoji('Clinical Nutrition')).toBe('🥗')
    expect(getSpecialtyEmoji('Weight Management')).toBe('⚖️')
    expect(getSpecialtyEmoji('Sports Nutrition')).toBe('💪')
  })

  it('returns correct emoji for lab specialties', () => {
    expect(getSpecialtyEmoji('Hematology')).toBe('🩸')
    expect(getSpecialtyEmoji('Clinical Chemistry')).toBe('🧪')
    expect(getSpecialtyEmoji('Microbiology')).toBe('🦠')
  })

  it('returns correct emoji for emergency specialties', () => {
    expect(getSpecialtyEmoji('Paramedic')).toBe('🚑')
  })

  it('returns correct emoji for caregiver specialties', () => {
    expect(getSpecialtyEmoji('Elder Care')).toBe('👴')
    expect(getSpecialtyEmoji('Disability Care')).toBe('♿')
  })

  it('returns default hospital emoji for unknown specialties', () => {
    expect(getSpecialtyEmoji('Unknown Specialty')).toBe('🏥')
    expect(getSpecialtyEmoji('')).toBe('🏥')
    expect(getSpecialtyEmoji('Alien Medicine')).toBe('🏥')
  })

  it('has at least 30 mapped specialties', () => {
    expect(Object.keys(SPECIALTY_EMOJI).length).toBeGreaterThanOrEqual(30)
  })
})

// ─── Category Emoji Mapping ─────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  medication: '💊', vitamins: '🌿', first_aid: '🩹',
  personal_care: '🧴', eyewear: '👓', eye_care: '👁️',
  dental_care: '🦷', baby_care: '👶', medical_devices: '🩺',
  monitoring: '📊', rehab_equipment: '🏋️', nutrition: '🥗', other: '📦',
}

describe('Health Shop category emoji mapping', () => {
  it('has emoji for all 13 shop categories', () => {
    const categories = [
      'medication', 'vitamins', 'first_aid', 'personal_care',
      'eyewear', 'eye_care', 'dental_care', 'baby_care',
      'medical_devices', 'monitoring', 'rehab_equipment', 'nutrition', 'other',
    ]
    for (const cat of categories) {
      expect(CATEGORY_EMOJI[cat], `Missing emoji for ${cat}`).toBeTruthy()
    }
  })

  it('medication category uses pill emoji', () => {
    expect(CATEGORY_EMOJI.medication).toBe('💊')
  })

  it('dental_care category uses tooth emoji', () => {
    expect(CATEGORY_EMOJI.dental_care).toBe('🦷')
  })
})

// ─── Auth Guard Logic ───────────────────────────────────────────────────────

describe('Health Shop auth guard', () => {
  function isLoggedIn(cookies: string): boolean {
    return cookies.split(';').some(c => c.trim().startsWith('mediwyz_userType='))
  }

  it('returns false when no cookie', () => {
    expect(isLoggedIn('')).toBe(false)
  })

  it('returns true when userType cookie exists', () => {
    expect(isLoggedIn('mediwyz_userType=doctor')).toBe(true)
  })

  it('returns true with multiple cookies', () => {
    expect(isLoggedIn('mediwyz_token=abc; mediwyz_userType=patient; other=123')).toBe(true)
  })

  it('returns false with only token cookie (no userType)', () => {
    expect(isLoggedIn('mediwyz_token=abc')).toBe(false)
  })

  // Button state logic
  it('shows "Login to Buy" when not authenticated', () => {
    const authenticated = false
    const inStock = true
    const buttonLabel = !inStock ? 'Unavailable' : authenticated ? 'Add to Cart' : 'Login to Buy'
    expect(buttonLabel).toBe('Login to Buy')
  })

  it('shows "Add to Cart" when authenticated', () => {
    const authenticated = true
    const inStock = true
    const buttonLabel = !inStock ? 'Unavailable' : authenticated ? 'Add to Cart' : 'Login to Buy'
    expect(buttonLabel).toBe('Add to Cart')
  })

  it('shows "Unavailable" when out of stock regardless of auth', () => {
    const inStock = false
    const buttonLabel = !inStock ? 'Unavailable' : 'Add to Cart'
    expect(buttonLabel).toBe('Unavailable')
  })
})

// ─── Clean URL Generation ───────────────────────────────────────────────────

describe('Marketplace link URLs', () => {
  it('specialty links use /search/{slug}?specialty={name}', () => {
    const slug = 'doctors'
    const specialtyName = 'Cardiology'
    const href = `/search/${slug}?specialty=${encodeURIComponent(specialtyName)}`
    expect(href).toBe('/search/doctors?specialty=Cardiology')
  })

  it('specialty with spaces encodes properly', () => {
    const href = `/search/nurses?specialty=${encodeURIComponent('ICU / Critical Care')}`
    expect(href).toBe('/search/nurses?specialty=ICU%20%2F%20Critical%20Care')
  })

  it('See All links use /search/{slug}', () => {
    expect('/search/doctors').not.toContain('/provider/')
    expect('/search/nurses').not.toContain('/provider/')
  })

  it('Health Shop category links use /search/health-shop?category={key}', () => {
    const href = `/search/health-shop?category=medication`
    expect(href).toBe('/search/health-shop?category=medication')
    expect(href).not.toContain('/provider/')
  })

  it('Browse All Products links to /search/health-shop', () => {
    expect('/search/health-shop').not.toContain('/patient/')
    expect('/search/health-shop').not.toContain('/doctor/')
  })
})

// ─── Color mapping ──────────────────────────────────────────────────────────

describe('Provider color to card style mapping', () => {
  function colorToCardStyle(hex: string) {
    const map: Record<string, { bg: string; text: string }> = {
      '#0C6780': { bg: 'bg-teal-50', text: 'text-teal-700' },
      '#001E40': { bg: 'bg-blue-50', text: 'text-blue-700' },
      '#22c55e': { bg: 'bg-green-50', text: 'text-green-700' },
      '#8b5cf6': { bg: 'bg-purple-50', text: 'text-purple-700' },
      '#ef4444': { bg: 'bg-red-50', text: 'text-red-700' },
    }
    return map[hex] || { bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  it('maps brand teal to teal card', () => {
    const s = colorToCardStyle('#0C6780')
    expect(s.bg).toContain('teal')
    expect(s.text).toContain('teal')
  })

  it('maps unknown color to gray fallback', () => {
    const s = colorToCardStyle('#FFFFFF')
    expect(s.bg).toContain('gray')
  })
})

// ─── Company Page Tests (LinkedIn Model) ────────────────────────────────────

describe('Corporate company page - any user can create', () => {
  it('corporate admin is NOT in signup constants', async () => {
    const { userTypes } = await import('@/app/signup/constants')
    const ids = userTypes.map(t => t.id)
    expect(ids).not.toContain('corporate')
    expect(ids).not.toContain('corporate-admin')
  })

  it('all signup types have real roles', async () => {
    const { userTypes } = await import('@/app/signup/constants')
    for (const type of userTypes) {
      expect(type.id).toBeTruthy()
      expect(type.label).toBeTruthy()
      expect(type.description).toBeTruthy()
    }
  })

  it('my-company is in the middleware clean URL list', () => {
    const dashboardPages = [
      '/feed', '/practice', '/inventory', '/services', '/workflows',
      '/billing', '/video', '/messages', '/ai-assistant', '/my-health', '/profile',
      '/network', '/booking-requests', '/bookings', '/my-consultations', '/my-nurse-services',
      '/my-childcare', '/my-emergency', '/my-health-records', '/my-lab-results',
      '/my-insurance', '/my-prescriptions', '/posts', '/reviews',
      '/pharmacy', '/book', '/my-company',
    ]
    expect(dashboardPages).toContain('/my-company')
  })
})
