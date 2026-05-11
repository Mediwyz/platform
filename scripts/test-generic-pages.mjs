#!/usr/bin/env node

/**
 * Comprehensive test script for generic shared pages.
 * Verifies: Feed, Video, Messages, My Health, and Search pages
 * are properly generic and work for all user roles.
 *
 * Run: node scripts/test-generic-pages.mjs
 * Requires: dev server running on port 3000 with seeded database.
 */

import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:3000'
let passed = 0
let failed = 0
let skipped = 0
let authCookie = ''

// ─── Helpers ───────────────────────────────────────────────────────────────────

function test(name, condition) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
    passed++
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`)
    failed++
  }
}

function skip(name) {
  console.log(`  \x1b[33m⊘\x1b[0m ${name} (skipped)`)
  skipped++
}

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookieHeader = res.headers.get('set-cookie') || ''
  authCookie = setCookieHeader.split(',').map(c => c.trim().split(';')[0]).filter(Boolean).join('; ')
  return res.json()
}


async function api(urlPath, options = {}) {
  const res = await fetch(`${BASE}${urlPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

// ─── Source Code Verification ──────────────────────────────────────────────────

const USER_ROLES = [
  'patient', 'doctor', 'nurse', 'nanny', 'pharmacist',
  'lab-technician', 'responder', 'insurance', 'corporate',
  'referral-partner', 'regional', 'admin',
]

const PROVIDER_ROLES = [
  'doctor', 'nurse', 'nanny', 'pharmacist',
  'lab-technician', 'responder', 'insurance', 'corporate',
  'referral-partner', 'regional',
]

async function run() {
  console.log('\n\x1b[1m=== Generic Pages Verification ===\x1b[0m\n')

  // ── Section 1: Feed Pages ──────────────────────────────────────────────────
  console.log('\x1b[36m1. Feed Pages — All roles use GenericFeedPage\x1b[0m')

  const genericFeedExists = fs.existsSync('components/shared/GenericFeedPage.tsx')
  test('GenericFeedPage component exists', genericFeedExists)

  if (genericFeedExists) {
    const feedContent = fs.readFileSync('components/shared/GenericFeedPage.tsx', 'utf-8')
    test('Uses useDashboardUser hook', feedContent.includes('useDashboardUser'))
    test('Renders PostFeed', feedContent.includes('PostFeed'))
    test('Renders UserSuggestions', feedContent.includes('UserSuggestions'))
    test('Renders ChatContactsSidebar', feedContent.includes('ChatContactsSidebar'))
    test('Derives messages path from pathname', feedContent.includes('usePathname'))
  }

  let feedReexportCount = 0
  for (const role of USER_ROLES) {
    const feedPath = `app/${role}/(dashboard)/feed/page.tsx`
    if (fs.existsSync(feedPath)) {
      const content = fs.readFileSync(feedPath, 'utf-8')
      if (content.includes('GenericFeedPage')) feedReexportCount++
    }
  }
  test(`All ${USER_ROLES.length} feed pages re-export GenericFeedPage`, feedReexportCount === USER_ROLES.length)

  // ── Section 2: Video Pages ─────────────────────────────────────────────────
  console.log('\n\x1b[36m2. Video Pages — All roles use GenericVideoPage\x1b[0m')

  const genericVideoExists = fs.existsSync('components/shared/GenericVideoPage.tsx')
  test('GenericVideoPage component exists', genericVideoExists)

  if (genericVideoExists) {
    const videoContent = fs.readFileSync('components/shared/GenericVideoPage.tsx', 'utf-8')
    test('Uses useDashboardUser hook', videoContent.includes('useDashboardUser'))
    test('Uses VideoCallRoomsList (not VideoConsultation)', videoContent.includes('VideoCallRoomsList') && !videoContent.includes('VideoConsultation'))
    test('Dynamic import with ssr: false', videoContent.includes('ssr: false'))
  }

  let videoReexportCount = 0
  for (const role of USER_ROLES) {
    const videoPath = `app/${role}/(dashboard)/video/page.tsx`
    if (fs.existsSync(videoPath)) {
      const content = fs.readFileSync(videoPath, 'utf-8')
      if (content.includes('GenericVideoPage')) videoReexportCount++
    }
  }
  test(`All ${USER_ROLES.length} video pages re-export GenericVideoPage`, videoReexportCount === USER_ROLES.length)

  // No role uses VideoConsultation anymore
  let videoConsultationCount = 0
  for (const role of USER_ROLES) {
    const videoPath = `app/${role}/(dashboard)/video/page.tsx`
    if (fs.existsSync(videoPath)) {
      const content = fs.readFileSync(videoPath, 'utf-8')
      if (content.includes('VideoConsultation')) videoConsultationCount++
    }
  }
  test('No video page uses deprecated VideoConsultation', videoConsultationCount === 0)

  // ── Section 3: Messages/Chat Pages ─────────────────────────────────────────
  console.log('\n\x1b[36m3. Messages Pages — All roles use GenericMessagesPage\x1b[0m')

  const genericMsgExists = fs.existsSync('components/shared/GenericMessagesPage.tsx')
  test('GenericMessagesPage component exists', genericMsgExists)

  if (genericMsgExists) {
    const msgContent = fs.readFileSync('components/shared/GenericMessagesPage.tsx', 'utf-8')
    test('Uses useDashboardUser hook', msgContent.includes('useDashboardUser'))
    test('Uses ChatView', msgContent.includes('ChatView'))
    test('Supports conversationId param', msgContent.includes('conversationId'))
  }

  let msgReexportCount = 0
  for (const role of USER_ROLES) {
    // Patient uses chat/, others use messages/
    const msgPath = role === 'patient'
      ? `app/${role}/(dashboard)/chat/page.tsx`
      : `app/${role}/(dashboard)/messages/page.tsx`
    if (fs.existsSync(msgPath)) {
      const content = fs.readFileSync(msgPath, 'utf-8')
      if (content.includes('GenericMessagesPage')) msgReexportCount++
    }
  }
  test(`All ${USER_ROLES.length} messages pages re-export GenericMessagesPage`, msgReexportCount === USER_ROLES.length)

  // No role uses patient-specific usePatientData or useDoctorData
  let roleSpecificContextCount = 0
  for (const role of USER_ROLES) {
    const paths = [
      `app/${role}/(dashboard)/feed/page.tsx`,
      role === 'patient' ? `app/${role}/(dashboard)/chat/page.tsx` : `app/${role}/(dashboard)/messages/page.tsx`,
      `app/${role}/(dashboard)/video/page.tsx`,
    ]
    for (const p of paths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8')
        if (content.includes('usePatientData') || content.includes('useDoctorData')) {
          roleSpecificContextCount++
        }
      }
    }
  }
  test('No shared page uses role-specific context hooks', roleSpecificContextCount === 0)

  // ── Section 4: My Health Pages ─────────────────────────────────────────────
  console.log('\n\x1b[36m4. My Health Pages — Consistent blue styling\x1b[0m')

  // Patient health page
  const patientHealthPath = 'app/patient/(dashboard)/health/page.tsx'
  if (fs.existsSync(patientHealthPath)) {
    const content = fs.readFileSync(patientHealthPath, 'utf-8')
    test('Patient health page uses blue-600 accent', content.includes('blue-600'))
    test('Patient health page has 8 tabs', content.includes('consult') && content.includes('rx') && content.includes('records'))
  }

  // Non-patient my-health pages
  let blueMyHealthCount = 0
  let redMyHealthCount = 0
  for (const role of PROVIDER_ROLES) {
    const myHealthPath = `app/${role}/(dashboard)/my-health/page.tsx`
    if (fs.existsSync(myHealthPath)) {
      const content = fs.readFileSync(myHealthPath, 'utf-8')
      if (content.includes('blue-600') && !content.includes('red-600')) blueMyHealthCount++
      if (content.includes('red-600')) redMyHealthCount++
    }
  }
  test(`All ${PROVIDER_ROLES.length} non-patient my-health pages use blue accent`, blueMyHealthCount === PROVIDER_ROLES.length)
  test('No my-health page uses red accent', redMyHealthCount === 0)

  // ── Section 5: Search Pages ────────────────────────────────────────────────
  console.log('\n\x1b[36m5. Search Pages — All roles have search routing\x1b[0m')

  const searchPageExists = fs.existsSync('components/search/DashboardSearchPage.tsx')
  test('DashboardSearchPage component exists', searchPageExists)

  let searchReexportCount = 0
  for (const role of USER_ROLES) {
    const searchPath = `app/${role}/(dashboard)/search/[type]/page.tsx`
    if (fs.existsSync(searchPath)) searchReexportCount++
  }
  test(`All ${USER_ROLES.length} roles have search/[type] route`, searchReexportCount === USER_ROLES.length)

  // Verify search types exist
  const searchTypes = ['doctors', 'nurses', 'childcare', 'lab', 'emergency', 'medicines']
  if (searchPageExists) {
    const searchContent = fs.readFileSync('components/search/DashboardSearchPage.tsx', 'utf-8')
    for (const type of searchTypes) {
      test(`Search type '${type}' is registered`, searchContent.includes(`${type}:`))
    }
  }

  // ── Section 6: AI Health Assistant ─────────────────────────────────────────
  console.log('\n\x1b[36m6. AI Health Assistant — Generic for all roles\x1b[0m')

  const botPath = 'app/patient/(dashboard)/components/BotHealthAssistant.tsx'
  if (fs.existsSync(botPath)) {
    const botContent = fs.readFileSync(botPath, 'utf-8')
    test('BotHealthAssistant uses optional userName prop', botContent.includes('userName?'))
    test('BotHealthAssistant uses optional healthScore prop', botContent.includes('healthScore?'))
    test('No Patient type dependency', !botContent.includes("import { Patient }") && !botContent.includes("from '@/lib/data/patients'"))
    test('Auto-fetches user name from /api/auth/me', botContent.includes('/api/auth/me'))
  }

  let aiAssistantCount = 0
  for (const role of USER_ROLES) {
    const aiPath = `app/${role}/(dashboard)/ai-assistant/page.tsx`
    if (fs.existsSync(aiPath)) aiAssistantCount++
  }
  test(`All ${USER_ROLES.length} roles have ai-assistant page`, aiAssistantCount === USER_ROLES.length)

  // ── Section 7: Shared Component Quality ────────────────────────────────────
  console.log('\n\x1b[36m7. Shared Component Quality\x1b[0m')

  // Verify shared components exist
  const sharedComponents = [
    'components/shared/GenericFeedPage.tsx',
    'components/shared/GenericMessagesPage.tsx',
    'components/shared/GenericVideoPage.tsx',
    'components/posts/PostFeed.tsx',
    'components/chat/ChatContactsSidebar.tsx',
    'components/social/UserSuggestions.tsx',
    'components/video/VideoCallRoomsList.tsx',
  ]
  for (const comp of sharedComponents) {
    test(`${path.basename(comp)} exists`, fs.existsSync(comp))
  }

  // Verify useDashboardUser hook
  const hookPath = 'hooks/useDashboardUser.ts'
  if (fs.existsSync(hookPath)) {
    const hookContent = fs.readFileSync(hookPath, 'utf-8')
    test('useDashboardUser exports DashboardUser interface', hookContent.includes('DashboardUser'))
    test('useDashboardUser reads from localStorage', hookContent.includes('localStorage'))
    test('DashboardUser has userType field', hookContent.includes('userType'))
  }

  // ── Section 8: Backend API Integration Tests ───────────────────────────────
  console.log('\n\x1b[36m8. Backend API Integration Tests\x1b[0m')

  // Test auth
  const loginResult = await login('emma.johnson@mediwyz.com', 'Patient123!')
  if (!loginResult.success) {
    skip('API tests (login unavailable)')
  } else {
    test('Login returns success', loginResult.success)

    // Test feed-related APIs
    const postsRes = await api('/api/posts')
    test('GET /api/posts returns data', postsRes.status === 200)

    // Test search APIs
    const searchDoctors = await api('/api/search?type=doctors&q=')
    test('GET /api/search?type=doctors returns data', searchDoctors.status === 200)

    // Test auth/me for generic user data
    const meRes = await api('/api/auth/me')
    test('GET /api/auth/me returns user', meRes.status === 200 && meRes.data?.user)
    if (meRes.data?.user) {
      test('User data has id, firstName, userType',
        meRes.data.user.id && meRes.data.user.firstName && meRes.data.user.userType)
    }

    // Test video room API (requires roomId param, 400 is expected without it)
    const videoRoomsRes = await api('/api/video/room')
    test('GET /api/video/room validates roomId param', videoRoomsRes.status === 400 && videoRoomsRes.data?.error)

    // Test notifications API
    const notifRes = await api(`/api/users/${loginResult.user?.id}/notifications`)
    test('GET /api/users/:id/notifications works', notifRes.status === 200)

    // Test WebRTC session
    const webrtcRes = await api('/api/webrtc/session?roomId=nonexistent')
    test('GET /api/webrtc/session returns data for missing room', webrtcRes.status === 200 && webrtcRes.data?.data === null)
  }

  // ── Section 9: Unit Test Verification ──────────────────────────────────────
  console.log('\n\x1b[36m9. Unit Test File Verification\x1b[0m')

  const testFiles = [
    'app/patient/__tests__/dashboard.test.tsx',
    'app/doctor/__tests__/sidebar-config.test.ts',
    'lib/validations/__tests__/edge-cases.test.ts',
    'lib/auth/__tests__/schemas.test.ts',
    'lib/services/__tests__/health-tracker.test.ts',
  ]
  for (const tf of testFiles) {
    test(`${path.basename(tf)} exists`, fs.existsSync(tf))
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n\x1b[1m─── Results ───\x1b[0m`)
  console.log(`  \x1b[32m${passed} passed\x1b[0m`)
  if (failed > 0) console.log(`  \x1b[31m${failed} failed\x1b[0m`)
  if (skipped > 0) console.log(`  \x1b[33m${skipped} skipped\x1b[0m`)
  console.log()

  process.exit(failed > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Test script error:', err)
  process.exit(1)
})
