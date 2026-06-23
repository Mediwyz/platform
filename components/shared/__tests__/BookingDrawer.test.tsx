import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import React from 'react'
import { BookingDrawerProvider, useBookingDrawer } from '@/lib/contexts/booking-drawer-context'

// Bypass framer-motion animations - they depend on rAF/WAAPI which jsdom doesn't run
vi.mock('framer-motion', async () => {
  const R = await import('react')
  const MotionDiv = R.forwardRef(
    ({ children, ...props }: any, ref: any) =>
      R.createElement('div', { ref, ...props }, children)
  )
  MotionDiv.displayName = 'MotionDiv'
  return {
    AnimatePresence: ({ children }: any) => R.createElement(R.Fragment, null, children),
    motion: { div: MotionDiv },
  }
})

//  Helpers 

function renderWithProvider(ui: React.ReactNode) {
  return render(<BookingDrawerProvider>{ui}</BookingDrawerProvider>)
}

function DrawerTrigger({ opts, label = 'Open Drawer' }: {
  opts: Parameters<ReturnType<typeof useBookingDrawer>['openDrawer']>[0]
  label?: string
}) {
  const { openDrawer } = useBookingDrawer()
  return <button onClick={() => openDrawer(opts)}>{label}</button>
}

//  Mock data 

const MOCK_SERVICES = [
  { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', duration: 30, emoji: '' },
  { id: 'svc2', serviceName: 'Home Visit', category: 'Visit', defaultPrice: 800, providerType: 'DOCTOR', duration: 60, emoji: '' },
]

const MOCK_PROVIDERS = [
  { id: 'prov1', firstName: 'Marie', lastName: 'Dupont', name: 'Dr. Marie Dupont', userType: 'DOCTOR', profileImage: null, rating: 4.5, specializations: ['Cardiology'] },
  { id: 'prov2', firstName: 'Jean', lastName: 'Luc', name: 'Dr. Jean Luc', userType: 'DOCTOR', profileImage: null, rating: 4.0, specializations: ['General'] },
]

const MOCK_PROVIDER_SERVICES = [
  {
    id: 'svc1',
    serviceName: 'General Consultation',
    category: 'Consultation',
    price: 500,
    workflows: [
      { id: 'wf1', name: 'In-Person Consultation', serviceMode: 'office' },
      { id: 'wf2', name: 'Video Consultation', serviceMode: 'video' },
    ],
  },
]

const MOCK_SLOTS = [
  { time: '09:00', taken: false },
  { time: '09:30', taken: true },
  { time: '10:00', taken: false },
]

function mockFetchFor(url: string): Response {
  if (url.includes('/api/search/services')) {
    return new Response(JSON.stringify({ success: true, data: MOCK_SERVICES }), { status: 200 })
  }
  if (url.includes('/api/search/providers')) {
    return new Response(JSON.stringify({ success: true, data: MOCK_PROVIDERS }), { status: 200 })
  }
  if (url.includes('/api/providers/') && url.includes('/services')) {
    return new Response(JSON.stringify({ success: true, data: MOCK_PROVIDER_SERVICES }), { status: 200 })
  }
  if (url.includes('/api/bookings/available-slots')) {
    return new Response(JSON.stringify({ success: true, slots: MOCK_SLOTS }), { status: 200 })
  }
  if (url.includes('/api/bookings')) {
    return new Response(JSON.stringify({ success: true, booking: { id: 'bk1' }, workflowInstanceId: 'wf-inst-1' }), { status: 201 })
  }
  if (url.includes('/api/auth/login')) {
    return new Response(JSON.stringify({ success: true, user: { id: 'u1' } }), { status: 200 })
  }
  if (url.includes('/api/roles')) {
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
  }
  return new Response(JSON.stringify({ success: false, message: 'Not found' }), { status: 404 })
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(mockFetchFor(url))))
  Object.defineProperty(document, 'cookie', { value: '', writable: true, configurable: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

//  Context tests 

describe('BookingDrawerProvider', () => {
  it('starts closed', () => {
    let state: any
    function Inspector() { state = useBookingDrawer(); return null }
    renderWithProvider(<Inspector />)
    expect(state.isOpen).toBe(false)
  })

  it('opens with provided options', () => {
    const service = { id: 's1', serviceName: 'Test', category: 'Test', defaultPrice: 100, providerType: 'DOCTOR' }
    let state: any
    function Inspector() {
      state = useBookingDrawer()
      return <button onClick={() => state.openDrawer({ service })}>Open</button>
    }
    renderWithProvider(<Inspector />)
    fireEvent.click(screen.getByText('Open'))
    expect(state.isOpen).toBe(true)
    expect(state.options.service?.id).toBe('s1')
  })

  it('closes and clears options', () => {
    const service = { id: 's1', serviceName: 'Test', category: 'Test', defaultPrice: 100, providerType: 'DOCTOR' }
    let state: any
    function Inspector() {
      state = useBookingDrawer()
      return (
        <>
          <button onClick={() => state.openDrawer({ service })}>Open</button>
          <button onClick={state.closeDrawer}>Close</button>
        </>
      )
    }
    renderWithProvider(<Inspector />)
    fireEvent.click(screen.getByText('Open'))
    expect(state.isOpen).toBe(true)
    fireEvent.click(screen.getByText('Close'))
    expect(state.isOpen).toBe(false)
  })
})

//  Entry from service card 

describe('BookingDrawer - entry from service card', () => {
  it('starts at providers step and calls filtered provider fetch', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('Provider')).toBeInTheDocument())

    const calls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    expect(calls.some(u => u.includes('/api/search/providers') && u.includes('serviceId=svc1'))).toBe(true)
  })

  it('renders the provider list after fetch', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    expect(screen.getByText('Dr. Jean Luc')).toBeInTheDocument()
  })

  it('back button from providers returns to service step', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => expect(screen.getByText('Provider')).toBeInTheDocument())

    // Back button should be present (history: ['service', 'providers'])
    const backBtn = screen.getByLabelText('Go back')
    fireEvent.click(backBtn)

    await waitFor(() => expect(screen.getByText('Service')).toBeInTheDocument())
  })
})

//  Entry from provider card 

describe('BookingDrawer - entry from provider card', () => {
  it('starts at service step and fetches provider services', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const provider = { id: 'prov1', name: 'Dr. Marie Dupont', userType: 'DOCTOR' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ provider }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('Service')).toBeInTheDocument())

    const calls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    expect(calls.some(u => u.includes('/api/providers/prov1/services'))).toBe(true)
  })

  it('renders the services list for the provider', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const provider = { id: 'prov1', name: 'Dr. Marie Dupont', userType: 'DOCTOR' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ provider }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('General Consultation')).toBeInTheDocument())
  })
})

//  Entry from hero widget 

describe('BookingDrawer - entry from hero widget (role + date + time)', () => {
  it('starts at service step and fetches services for the role', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const role = { code: 'DOCTOR', label: 'Doctors', singularLabel: 'Doctor', slug: 'doctors', color: '#0C6780' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ role, date: '2026-06-01', time: '09:00', timeLabel: '9:00 AM' }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('Service')).toBeInTheDocument())

    const calls = vi.mocked(fetch).mock.calls.map(([url]) => url as string)
    expect(calls.some(u => u.includes('/api/search/services') && u.includes('providerType=DOCTOR'))).toBe(true)
  })
})

//  Workflow step 

describe('BookingDrawer - workflow step', () => {
  it('shows workflow options when provider has multiple workflows', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dr. Marie Dupont'))

    await waitFor(() => expect(screen.getByText('Appointment type')).toBeInTheDocument())
    expect(screen.getByText('In-Person')).toBeInTheDocument()
    expect(screen.getByText('Video Call')).toBeInTheDocument()
  })
})

//  Slot step 

describe('BookingDrawer - slot step', () => {
  it('shows date strip and loads time slots after selecting a workflow', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    // Pre-fill date so the slot step shows slots without a separate date-click
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service, date: '2026-05-10' }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dr. Marie Dupont'))
    await waitFor(() => expect(screen.getByText('In-Person')).toBeInTheDocument())
    fireEvent.click(screen.getByText('In-Person'))

    await waitFor(() => expect(screen.getByText('Date & time')).toBeInTheDocument())
    // Slots loaded automatically (date pre-filled)
    await waitFor(() => expect(screen.getByText('9:00 AM')).toBeInTheDocument())
  })
})

//  Auth step 

describe('BookingDrawer - auth step', () => {
  it('shows auth step when not logged in after selecting a slot', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service, date: '2026-05-10' }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dr. Marie Dupont'))
    await waitFor(() => expect(screen.getByText('In-Person')).toBeInTheDocument())
    fireEvent.click(screen.getByText('In-Person'))
    await waitFor(() => expect(screen.getByText('Date & time')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('9:00 AM')).toBeInTheDocument())
    fireEvent.click(screen.getByText('9:00 AM'))
    fireEvent.click(screen.getByText('Continue'))

    await waitFor(() => expect(screen.getByText('Sign in to complete booking')).toBeInTheDocument())
  })

  it('shows inline auth error on wrong credentials', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if ((url as string).includes('/api/auth/login')) {
        return Promise.resolve(new Response(JSON.stringify({ success: false, message: 'Invalid credentials' }), { status: 401 }))
      }
      return Promise.resolve(mockFetchFor(url as string))
    }))

    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR', emoji: '' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service, date: '2026-05-10' }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dr. Marie Dupont'))
    await waitFor(() => expect(screen.getByText('In-Person')).toBeInTheDocument())
    fireEvent.click(screen.getByText('In-Person'))
    await waitFor(() => expect(screen.getByText('Date & time')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('9:00 AM')).toBeInTheDocument())
    fireEvent.click(screen.getByText('9:00 AM'))
    fireEvent.click(screen.getByText('Continue'))
    await waitFor(() => expect(screen.getByText('Sign in to complete booking')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'bad@test.com' } })
    fireEvent.change(screen.getByPlaceholderText(''), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByText('Sign in & confirm booking'))

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
  })
})

//  Close 

describe('BookingDrawer - close', () => {
  it('X button closes the drawer', async () => {
    const { default: BookingDrawer } = await import('../BookingDrawer')
    const service = { id: 'svc1', serviceName: 'General Consultation', category: 'Consultation', defaultPrice: 500, providerType: 'DOCTOR' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ service }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))
    await waitFor(() => screen.getByLabelText('Close'))

    fireEvent.click(screen.getByLabelText('Close'))

    await waitFor(() => expect(screen.queryByLabelText('Close')).not.toBeInTheDocument())
  })
})

//  Hero widget pre-filled - skip slot step 

describe('BookingDrawer - hero widget pre-filled date/time skips slot step', () => {
  it('goes to confirm directly after workflow selection when date+time are pre-filled and user is logged in', async () => {
    Object.defineProperty(document, 'cookie', {
      value: 'mediwyz_userType=doctor; mediwyz_user_id=u1',
      writable: true,
      configurable: true,
    })

    const { default: BookingDrawer } = await import('../BookingDrawer')
    const role = { code: 'DOCTOR', label: 'Doctors', singularLabel: 'Doctor', slug: 'doctors', color: '#0C6780' }

    renderWithProvider(
      <>
        <DrawerTrigger opts={{ role, date: '2026-06-15', time: '10:00', timeLabel: '10:00 AM' }} />
        <BookingDrawer />
      </>
    )

    fireEvent.click(screen.getByText('Open Drawer'))

    await waitFor(() => expect(screen.getByText('General Consultation')).toBeInTheDocument())
    fireEvent.click(screen.getByText('General Consultation'))

    await waitFor(() => expect(screen.getByText('Dr. Marie Dupont')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Dr. Marie Dupont'))

    await waitFor(() => expect(screen.getByText('In-Person')).toBeInTheDocument())
    fireEvent.click(screen.getByText('In-Person'))

    // slot pre-filled + user logged in  skip to confirm
    await waitFor(() => {
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Confirm Booking')).toBeInTheDocument()
    })
  })
})
