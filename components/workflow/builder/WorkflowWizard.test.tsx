import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'
import React from 'react'
import WorkflowWizard from './WorkflowWizard'
import type { WorkflowWizardProps } from './WorkflowWizard'

// ── Mock framer-motion (jsdom has no rAF/WAAPI) ───────────────────────────────
vi.mock('framer-motion', async () => {
  const R = await import('react')
  const MotionDiv = R.forwardRef(
    ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { custom?: unknown; variants?: unknown; initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }, ref: React.Ref<HTMLDivElement>) =>
      R.createElement('div', { ref, ...props }, children)
  )
  MotionDiv.displayName = 'MotionDiv'
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      R.createElement(R.Fragment, null, children),
    motion: { div: MotionDiv },
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWizard(props: Partial<WorkflowWizardProps> = {}) {
  const onComplete = vi.fn()
  const onCancel = vi.fn()

  const result = render(
    <WorkflowWizard
      onComplete={onComplete}
      onCancel={onCancel}
      {...props}
    />
  )
  return { ...result, onComplete, onCancel }
}

const MOCK_GENERATED = {
  name: 'Home Visit - Urgent',
  slug: 'home-visit-urgent',
  description: 'Home visit workflow with urgent urgency',
  serviceMode: 'home',
  providerType: 'NURSE',
  paymentTiming: 'ON_ACCEPTANCE',
  steps: [
    { order: 1, statusCode: 'pending', label: 'Pending' },
    { order: 2, statusCode: 'confirmed', label: 'Confirmed' },
    { order: 3, statusCode: 'completed', label: 'Completed' },
  ],
  transitions: [{ from: 'pending', to: 'confirmed', action: 'accept', allowedRoles: ['provider'] }],
  serviceConfig: {},
  suggestedAxes: {},
}

function mockFetch(response: { success: boolean; data?: unknown; message?: string }) {
  return vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(response), { status: 200 }))
  )
}

// ── Navigate through all steps helper ────────────────────────────────────────
// Renders the wizard and drives it to the given step number (1–8).

async function navigateToStep(targetStep: number) {
  const { onComplete, onCancel } = renderWizard()

  // Step 1 → 2: pick Home Visit
  if (targetStep >= 2) {
    fireEvent.click(screen.getByText('Home Visit'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())
  }

  // Step 2 → 3: recurrence has default, just advance
  if (targetStep >= 3) {
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Does this service require a biological sample?')).toBeInTheDocument())
  }

  // Step 3 → 4: pick No Sample
  if (targetStep >= 4) {
    fireEvent.click(screen.getByText('No Sample'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Who delivers the service?')).toBeInTheDocument())
  }

  // Step 4 → 5: pick Single Provider
  if (targetStep >= 5) {
    fireEvent.click(screen.getByText('Single Provider'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What is the booking urgency?')).toBeInTheDocument())
  }

  // Step 5 → 6: pick Scheduled
  if (targetStep >= 6) {
    fireEvent.click(screen.getByText('Scheduled'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What does this service produce?')).toBeInTheDocument())
  }

  // Step 6 → 7: outputType defaults to 'none', Next always enabled
  if (targetStep >= 7) {
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Access & payment settings')).toBeInTheDocument())
  }

  // Step 7 → 8: all payment settings have defaults, Next always enabled
  if (targetStep >= 8) {
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument())
  }

  return { onComplete, onCancel }
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch({ success: true, data: MOCK_GENERATED }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WorkflowWizard', () => {
  // ── Step 1: Location ────────────────────────────────────────────────────────

  it('1. renders step 1 on mount - all 5 location cards visible', () => {
    renderWizard()
    expect(screen.getByText('Where does the service take place?')).toBeInTheDocument()
    expect(screen.getByText('Home Visit')).toBeInTheDocument()
    expect(screen.getByText('Office Visit')).toBeInTheDocument()
    expect(screen.getByText('Video Call')).toBeInTheDocument()
    expect(screen.getByText('Audio Call')).toBeInTheDocument()
    expect(screen.getByText('Async / Remote')).toBeInTheDocument()
  })

  it('2. Next button disabled until selection on step 1', () => {
    renderWizard()
    const nextBtn = screen.getByText('Next →')
    expect(nextBtn).toBeDisabled()
    expect(screen.getByText('Where does the service take place?')).toBeInTheDocument()
  })

  it('3. step 1 → 2 navigation after selecting Video Call', async () => {
    renderWizard()

    expect(screen.getByText('Next →')).toBeDisabled()
    fireEvent.click(screen.getByText('Video Call'))
    expect(screen.getByText('Next →')).not.toBeDisabled()

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())
  })

  it('3b. progress bar shows "Step 1 of 8"', () => {
    renderWizard()
    expect(screen.getByText('Step 1 of 8')).toBeInTheDocument()
  })

  // ── Step 2: Recurrence ─────────────────────────────────────────────────────

  it('4. recurrence toggle - default is One-time, clicking Recurring shows frequency options', async () => {
    renderWizard()

    fireEvent.click(screen.getByText('Home Visit'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())

    expect(screen.queryByText('Frequency')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Recurring'))
    await waitFor(() => expect(screen.getByText('Frequency')).toBeInTheDocument())
  })

  it('4b. step 2 Next is always enabled (recurrence has defaults)', async () => {
    await navigateToStep(2)
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  // ── Step 3: Sample ─────────────────────────────────────────────────────────

  it('5. Back navigation - on step 2, clicking Back returns to step 1 with selection preserved', async () => {
    renderWizard()

    fireEvent.click(screen.getByText('Home Visit'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('← Back'))
    await waitFor(() => expect(screen.getByText('Where does the service take place?')).toBeInTheDocument())

    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('5b. step 3 - all 4 sample options visible', async () => {
    await navigateToStep(3)
    expect(screen.getByText('Does this service require a biological sample?')).toBeInTheDocument()
    expect(screen.getByText('No Sample')).toBeInTheDocument()
    expect(screen.getByText('Home Collection')).toBeInTheDocument()
    expect(screen.getByText('Office Collection')).toBeInTheDocument()
    expect(screen.getByText('Self-collection Kit')).toBeInTheDocument()
  })

  // ── Step 4: Care Model ─────────────────────────────────────────────────────

  it('5c. step 4 - all 4 care model options visible', async () => {
    await navigateToStep(4)
    expect(screen.getByText('Who delivers the service?')).toBeInTheDocument()
    expect(screen.getByText('Single Provider')).toBeInTheDocument()
    expect(screen.getByText('Delegated Visit')).toBeInTheDocument()
    expect(screen.getByText('Multi-provider')).toBeInTheDocument()
    expect(screen.getByText('Group Session')).toBeInTheDocument()
  })

  // ── Step 5: Urgency ────────────────────────────────────────────────────────

  it('5d. step 5 - all 3 urgency options visible', async () => {
    await navigateToStep(5)
    expect(screen.getByText('What is the booking urgency?')).toBeInTheDocument()
    expect(screen.getByText('Scheduled')).toBeInTheDocument()
    expect(screen.getByText('Urgent / Same-day')).toBeInTheDocument()
    expect(screen.getByText('Emergency')).toBeInTheDocument()
  })

  // ── Step 6: Output Type ────────────────────────────────────────────────────

  it('6. full navigation to step 6 - output type page shows 8 options', async () => {
    await navigateToStep(6)
    expect(screen.getByText('What does this service produce?')).toBeInTheDocument()
    expect(screen.getByText('General Consultation')).toBeInTheDocument()
    expect(screen.getByText('Exam Report')).toBeInTheDocument()
    expect(screen.getByText('Lab Results')).toBeInTheDocument()
    expect(screen.getByText('Prescription')).toBeInTheDocument()
    expect(screen.getByText('Eye Prescription')).toBeInTheDocument()
    expect(screen.getByText('Care Notes')).toBeInTheDocument()
    expect(screen.getByText('Exercise Plan')).toBeInTheDocument()
    expect(screen.getByText('Meal Plan')).toBeInTheDocument()
  })

  it('6b. step 6 Next is always enabled - outputType defaults to "none"', async () => {
    await navigateToStep(6)
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('6c. clicking an output card selects it and Next remains enabled', async () => {
    await navigateToStep(6)

    fireEvent.click(screen.getByText('Prescription'))
    expect(screen.getByText('Next →')).not.toBeDisabled()

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Access & payment settings')).toBeInTheDocument())
  })

  it('6d. selecting Lab Results navigates to step 7', async () => {
    await navigateToStep(6)
    fireEvent.click(screen.getByText('Lab Results'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Access & payment settings')).toBeInTheDocument())
  })

  // ── Step 7: Payment & Access ───────────────────────────────────────────────

  it('7. step 7 - access restriction toggles and payment radio visible', async () => {
    await navigateToStep(7)
    expect(screen.getByText('Access & payment settings')).toBeInTheDocument()
    expect(screen.getByText('Requires existing prescription')).toBeInTheDocument()
    expect(screen.getByText('Health Shop / product order')).toBeInTheDocument()
    expect(screen.getByText('Auto-detect')).toBeInTheDocument()
    expect(screen.getByText('Charge on acceptance')).toBeInTheDocument()
    expect(screen.getByText('Charge on completion')).toBeInTheDocument()
  })

  it('7b. step 7 Next is always enabled - all settings have defaults', async () => {
    await navigateToStep(7)
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  it('7c. toggling "Requires existing prescription" and advancing to review', async () => {
    await navigateToStep(7)

    // Two checkboxes on this step: prescription (first) and health shop (second)
    const checkboxes = screen.getAllByRole('checkbox', { hidden: true })
    fireEvent.click(checkboxes[0].closest('label')!)
    fireEvent.click(screen.getByText('Next →'))

    await waitFor(() => expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument())
  })

  it('7d. selecting "Charge on completion" radio stays visible on step 7', async () => {
    await navigateToStep(7)
    fireEvent.click(screen.getByText('Charge on completion'))
    expect(screen.getByText('Next →')).not.toBeDisabled()
  })

  // ── Step 8: Review ─────────────────────────────────────────────────────────

  it('8. full navigation to review - all 8 steps traversed', async () => {
    await navigateToStep(8)
    expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument()
  })

  it('9. API call on review - fetch called with correct payload', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true, data: MOCK_GENERATED }), { status: 200 }))
    )
    vi.stubGlobal('fetch', fetchSpy)

    await navigateToStep(8)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(
      '/api/workflow/templates/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    ))

    const rawCalls = fetchSpy.mock.calls as unknown as Array<[string, RequestInit]>
    const body = JSON.parse(rawCalls[0][1].body as string)
    expect(body.location).toBe('home')
    expect(body.sample).toBe('none')
    expect(body.careModel).toBe('single')
    expect(body.urgency).toBe('scheduled')
    expect(body.recurrenceType).toBe('once')
    expect(body.outputType).toBe('none')
    expect(body.requiresPrescription).toBe(false)
    expect(body.isHealthShop).toBe(false)
    // paymentTimingOverride 'auto' is omitted from the body
    expect(body.paymentTimingOverride).toBeUndefined()
  })

  it('9b. API payload includes paymentTimingOverride when set to ON_COMPLETION', async () => {
    // Render fresh to control the payment timing selection
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: true, data: MOCK_GENERATED }), { status: 200 }))
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { onComplete, onCancel } = renderWizard()

    // Navigate to step 7
    fireEvent.click(screen.getByText('Home Visit'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Does this service require a biological sample?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('No Sample'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Who delivers the service?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Single Provider'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What is the booking urgency?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Scheduled'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What does this service produce?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Access & payment settings')).toBeInTheDocument())

    // Select ON_COMPLETION
    fireEvent.click(screen.getByText('Charge on completion'))

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument())

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    const rawCalls = fetchSpy.mock.calls as unknown as Array<[string, RequestInit]>
    const body = JSON.parse(rawCalls[0][1].body as string)
    expect(body.paymentTimingOverride).toBe('ON_COMPLETION')

    void onComplete
    void onCancel
  })

  it('10. loading state - "Generating template..." shown while fetch pending', async () => {
    let resolveGenerate!: (v: Response) => void
    const slowFetch = vi.fn(
      () => new Promise<Response>(resolve => { resolveGenerate = resolve })
    )
    vi.stubGlobal('fetch', slowFetch)

    await navigateToStep(8)

    await waitFor(() => expect(screen.getByText('Generating template...')).toBeInTheDocument())

    act(() => {
      resolveGenerate(new Response(JSON.stringify({ success: true, data: MOCK_GENERATED }), { status: 200 }))
    })
  })

  it('11. error state - when fetch fails, error banner and Retry button shown', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ success: false, message: 'Server error' }), { status: 500 }))
    ))

    await navigateToStep(8)

    await waitFor(() => expect(screen.getByText('Could not generate template. Please try again.')).toBeInTheDocument())
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('12. onComplete called when Build Template clicked with valid generated data', async () => {
    const { onComplete } = await navigateToStep(8)

    await waitFor(() => expect(screen.getByText('Home Visit - Urgent')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Build Template →'))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Home Visit - Urgent',
        slug: 'home-visit-urgent',
        serviceMode: 'home',
        steps: expect.arrayContaining([
          expect.objectContaining({ statusCode: 'pending' }),
        ]),
      })
    )
  })

  it('13. onCancel called when cancel button clicked', () => {
    const { onCancel } = renderWizard()
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  // ── Review step - summary grid content ────────────────────────────────────

  it('14. review step shows summary items for all axes', async () => {
    await navigateToStep(8)
    await waitFor(() => expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument())

    expect(screen.getByText('Location')).toBeInTheDocument()
    expect(screen.getByText('Home Visit')).toBeInTheDocument()
    expect(screen.getByText('Recurrence')).toBeInTheDocument()
    expect(screen.getByText('One-time')).toBeInTheDocument()
    expect(screen.getByText('Sample')).toBeInTheDocument()
    expect(screen.getByText('Urgency')).toBeInTheDocument()
    expect(screen.getByText('Output')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
    expect(screen.getByText('Auto-detect')).toBeInTheDocument()
  })

  it('15. review step shows Health Shop badge when isHealthShop is toggled', async () => {
    vi.stubGlobal('fetch', mockFetch({ success: true, data: MOCK_GENERATED }))

    // Navigate to step 7 and toggle Health Shop
    const { onComplete, onCancel } = renderWizard()

    fireEvent.click(screen.getByText('Home Visit'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('How often does this service repeat?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Does this service require a biological sample?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('No Sample'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Who delivers the service?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Single Provider'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What is the booking urgency?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Scheduled'))
    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('What does this service produce?')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Access & payment settings')).toBeInTheDocument())

    // Toggle Health Shop (second checkbox)
    const checkboxes = screen.getAllByRole('checkbox', { hidden: true })
    fireEvent.click(checkboxes[1].closest('label')!)

    fireEvent.click(screen.getByText('Next →'))
    await waitFor(() => expect(screen.getByText('Review your workflow configuration')).toBeInTheDocument())

    expect(screen.getByText('Health Shop order')).toBeInTheDocument()

    void onComplete
    void onCancel
  })

  // ── Generated template steps display ──────────────────────────────────────

  it('16. generated template steps are shown as pills on the review screen', async () => {
    await navigateToStep(8)

    await waitFor(() => {
      expect(screen.getByText('3 steps')).toBeInTheDocument()
    })

    expect(screen.getByText(/1\. Pending/)).toBeInTheDocument()
    expect(screen.getByText(/2\. Confirmed/)).toBeInTheDocument()
    expect(screen.getByText(/3\. Completed/)).toBeInTheDocument()
  })
})
