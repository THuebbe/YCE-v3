import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import FinancialManagementSection from '../FinancialManagementSection'

// Mock the Stripe Connect and payment actions
jest.mock('@/features/payments/actions', () => ({
  createStripeConnectAccount: jest.fn(),
  getStripeConnectStatus: jest.fn(),
  updatePricingConfiguration: jest.fn(),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock agency data
const mockAgency = {
  id: 'agency-123',
  name: 'Test Agency',
  slug: 'test-agency',
  stripeAccountId: null,
  stripeAccountStatus: null,
  stripeOnboardingUrl: null,
  stripeChargesEnabled: false,
  stripePayoutsEnabled: false,
  stripeDetailsSubmitted: false,
  subscriptionStatus: 'active',
  subscriptionStartDate: '2024-01-01',
  basePrice: 50,
  extraDayPrice: 10,
  lateFee: 25
}

const mockAgencyWithStripe = {
  ...mockAgency,
  stripeAccountId: 'acct_123',
  stripeAccountStatus: 'enabled',
  stripeChargesEnabled: true,
  stripePayoutsEnabled: true,
  stripeDetailsSubmitted: true
}

describe('Financial Management Section - Success Criteria Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  // Success Criterion 1: Payment Method Selection
  test('displays payment method selection options', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByText(/payment processing method/i)).toBeInTheDocument()
    expect(screen.getByText(/stripe connect/i)).toBeInTheDocument()
    expect(screen.getByText(/yardcard elite payment processing/i)).toBeInTheDocument()
  })

  // Success Criterion 2: Stripe Connect Integration
  test('shows Stripe Connect setup wizard when not connected', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByText(/set up stripe connect/i)).toBeInTheDocument()
    expect(screen.getByText(/direct payments to your bank account/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect with stripe/i })).toBeInTheDocument()
  })

  test('displays Stripe Connect status when connected', () => {
    render(<FinancialManagementSection agency={mockAgencyWithStripe} />)
    
    expect(screen.getByText(/stripe account connected/i)).toBeInTheDocument()
    expect(screen.getByText(/charges enabled/i)).toBeInTheDocument()
    expect(screen.getByText(/payouts enabled/i)).toBeInTheDocument()
  })

  // Success Criterion 3: YCE Payment Processing
  test('shows YCE payment processing option with service fees', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByText(/yardcard elite payment processing/i)).toBeInTheDocument()
    expect(screen.getByText(/service fee/i)).toBeInTheDocument()
    expect(screen.getByText(/we handle all payment processing/i)).toBeInTheDocument()
  })

  // Success Criterion 4: Subscription Display
  test('displays current subscription status and billing information', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByText(/subscription status/i)).toBeInTheDocument()
    expect(screen.getByText(/active/i)).toBeInTheDocument()
    expect(screen.getByText(/billing information/i)).toBeInTheDocument()
  })

  // Success Criterion 5: Pricing Configuration
  test('displays pricing configuration form', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByLabelText(/base price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/extra day price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/late fee/i)).toBeInTheDocument()
  })

  test('validates pricing configuration inputs', async () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    const basePriceInput = screen.getByLabelText(/base price/i)
    
    // Test invalid input
    fireEvent.change(basePriceInput, { target: { value: '-10' } })
    fireEvent.blur(basePriceInput)
    
    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument()
    })
  })

  // Success Criterion 6: Status Indicators
  test('shows clear visual indicators for setup completion', () => {
    render(<FinancialManagementSection agency={mockAgencyWithStripe} />)
    
    expect(screen.getByTestId('stripe-status-indicator')).toHaveClass('bg-green-500')
    expect(screen.getByText(/setup complete/i)).toBeInTheDocument()
  })

  // Success Criterion 7: Error Handling
  test('handles payment setup errors gracefully', async () => {
    const mockCreateStripeAccount = require('@/features/payments/actions').createStripeConnectAccount
    mockCreateStripeAccount.mockResolvedValue({
      success: false,
      error: 'Failed to create Stripe account'
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    const connectButton = screen.getByRole('button', { name: /connect with stripe/i })
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create stripe account/i)).toBeInTheDocument()
    })
  })

  // Success Criterion 8: Security Compliance
  test('does not display sensitive financial data in plain text', () => {
    const agencyWithBankInfo = {
      ...mockAgency,
      bankAccountNumber: '1234567890'
    }
    
    render(<FinancialManagementSection agency={agencyWithBankInfo} />)
    
    // Should not show full account number
    expect(screen.queryByText('1234567890')).not.toBeInTheDocument()
    // Should show masked version if displayed
    const maskedElements = screen.queryAllByText(/\*\*\*\*\*\*/i)
    expect(maskedElements.length).toBeGreaterThan(0)
  })
})

describe('Financial Management Section - Component Behavior', () => {
  test('renders correctly with required props', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    expect(screen.getByRole('region', { name: /financial management/i })).toBeInTheDocument()
  })

  test('handles user interactions for payment method switching', async () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    const stripeOption = screen.getByLabelText(/stripe connect/i)
    const yceOption = screen.getByLabelText(/yardcard elite/i)
    
    fireEvent.click(yceOption)
    expect(yceOption).toBeChecked()
    
    fireEvent.click(stripeOption)
    expect(stripeOption).toBeChecked()
  })

  test('manages state properly for form inputs', async () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    const basePriceInput = screen.getByLabelText(/base price/i) as HTMLInputElement
    
    fireEvent.change(basePriceInput, { target: { value: '75' } })
    expect(basePriceInput.value).toBe('75')
  })

  test('calculates service fees correctly', () => {
    render(<FinancialManagementSection agency={mockAgency} />)
    
    // Select YCE payment processing
    fireEvent.click(screen.getByLabelText(/yardcard elite/i))
    
    // Should show service fee calculation
    expect(screen.getByText(/service fee calculation/i)).toBeInTheDocument()
  })
})

describe('Financial Management Section - API Integration', () => {
  test('loads financial settings from API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          basePrice: 50,
          extraDayPrice: 10,
          lateFee: 25,
          paymentMethod: 'stripe_connect'
        }
      })
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/agency/financial-settings?agencyId=${mockAgency.id}`)
    })
  })

  test('saves pricing changes successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    const basePriceInput = screen.getByLabelText(/base price/i)
    const saveButton = screen.getByRole('button', { name: /save pricing/i })
    
    fireEvent.change(basePriceInput, { target: { value: '60' } })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/agency/financial-settings?agencyId=${mockAgency.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            basePrice: 60,
            extraDayPrice: 10,
            lateFee: 25
          })
        })
      )
    })
  })

  test('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false, error: 'Database connection failed' })
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load financial settings/i)).toBeInTheDocument()
    })
  })

  test('initiates Stripe Connect onboarding flow', async () => {
    const mockCreateStripeAccount = require('@/features/payments/actions').createStripeConnectAccount
    mockCreateStripeAccount.mockResolvedValue({
      success: true,
      onboardingUrl: 'https://connect.stripe.com/onboarding/123',
      accountId: 'acct_123'
    })

    // Mock window.location.href
    delete (window as any).location
    window.location = { href: '' } as any

    render(<FinancialManagementSection agency={mockAgency} />)
    
    const connectButton = screen.getByRole('button', { name: /connect with stripe/i })
    fireEvent.click(connectButton)
    
    await waitFor(() => {
      expect(mockCreateStripeAccount).toHaveBeenCalled()
      expect(window.location.href).toBe('https://connect.stripe.com/onboarding/123')
    })
  })
})

describe('Financial Management Section - Error Handling', () => {
  test('handles network failure scenarios', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<FinancialManagementSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument()
    })
  })

  test('handles validation error scenarios', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Validation failed',
        details: [{ field: 'basePrice', message: 'Must be greater than 0' }]
      })
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    const saveButton = screen.getByRole('button', { name: /save pricing/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/must be greater than 0/i)).toBeInTheDocument()
    })
  })

  test('handles permission error scenarios', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Insufficient permissions'
      })
    })

    render(<FinancialManagementSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
    })
  })
})