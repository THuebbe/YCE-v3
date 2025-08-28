import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgencyProfile } from '../AgencyProfile'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('next/navigation')
jest.mock('../../../../lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' ')
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
})

// Mock window.open
window.open = jest.fn()

// Type definitions
interface AgencyProfileData {
  agencyName: string
  businessName: string
  contactEmail: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  agencySlug: string
  bookingUrl: string
}

const mockAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('Agency Profile Section', () => {
  const mockAgencyData: AgencyProfileData = {
    agencyName: 'Elite Landscaping',
    businessName: 'Elite Landscaping LLC',
    contactEmail: 'contact@elitelandscaping.com',
    phone: '+1 (555) 123-4567',
    address: {
      street: '123 Main Street',
      city: 'Denver',
      state: 'Colorado',
      postalCode: '80202',
      country: 'United States'
    },
    agencySlug: 'elite-landscaping',
    bookingUrl: 'https://yourdomain.com/elite-landscaping/booking'
  }

  const mockPush = jest.fn()

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock Clerk auth
    mockAuth.mockReturnValue({
      isSignedIn: true,
      userId: 'user_123',
      sessionId: 'session_123',
      getToken: jest.fn().mockResolvedValue('token_123'),
      isLoaded: true,
      orgId: 'org_123',
      orgRole: 'admin'
    } as any)

    // Mock Next.js router
    mockRouter.mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    } as any)

    // Mock fetch globally
    global.fetch = jest.fn()
    
    // Clear clipboard mock
    ;(navigator.clipboard.writeText as jest.Mock).mockClear()
    ;(window.open as jest.Mock).mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    test('renders current agency information correctly', async () => {
      // Mock successful API response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Elite Landscaping LLC')).toBeInTheDocument()
        expect(screen.getByDisplayValue('contact@elitelandscaping.com')).toBeInTheDocument()
        expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeInTheDocument()
        expect(screen.getByDisplayValue('123 Main Street')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Denver')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Colorado')).toBeInTheDocument()
        expect(screen.getByDisplayValue('80202')).toBeInTheDocument()
        expect(screen.getByDisplayValue('United States')).toBeInTheDocument()
      })
    })

    test('displays booking link with correct agency slug', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)

      await waitFor(() => {
        expect(screen.getByText('https://yourdomain.com/elite-landscaping/booking')).toBeInTheDocument()
      })
    })

    test('shows loading state initially', () => {
      ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<AgencyProfile />)

      expect(screen.getByText('Loading agency profile...')).toBeInTheDocument()
    })

    test('shows error state when API fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<AgencyProfile />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load agency profile. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('validates required agency name field', async () => {
      const user = userEvent.setup()
      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')

      await user.clear(agencyNameInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Agency name is required')).toBeInTheDocument()
      })
    })

    test('validates agency name length constraints', async () => {
      const user = userEvent.setup()
      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')

      // Test minimum length
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'A')
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Agency name must be at least 2 characters')).toBeInTheDocument()
      })

      // Test maximum length (over 100 characters)
      const longName = 'A'.repeat(101)
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, longName)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Agency name must be less than 100 characters')).toBeInTheDocument()
      })
    })

    test('validates required business name field', async () => {
      const user = userEvent.setup()
      const businessNameInput = screen.getByDisplayValue('Elite Landscaping LLC')

      await user.clear(businessNameInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Business name is required')).toBeInTheDocument()
      })
    })

    test('validates email format', async () => {
      const user = userEvent.setup()
      const emailInput = screen.getByDisplayValue('contact@elitelandscaping.com')

      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      })
    })

    test('validates phone number format', async () => {
      const user = userEvent.setup()
      const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567')

      await user.clear(phoneInput)
      await user.type(phoneInput, '123abc')
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument()
      })
    })

    test('validates required address fields', async () => {
      const user = userEvent.setup()

      // Test street address
      const streetInput = screen.getByDisplayValue('123 Main Street')
      await user.clear(streetInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Street address is required')).toBeInTheDocument()
      })

      // Test city
      const cityInput = screen.getByDisplayValue('Denver')
      await user.clear(cityInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('City is required')).toBeInTheDocument()
      })

      // Test state
      const stateInput = screen.getByDisplayValue('Colorado')
      await user.clear(stateInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('State is required')).toBeInTheDocument()
      })

      // Test postal code
      const postalCodeInput = screen.getByDisplayValue('80202')
      await user.clear(postalCodeInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Postal code is required')).toBeInTheDocument()
      })

      // Test country
      const countryInput = screen.getByDisplayValue('United States')
      await user.clear(countryInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Country is required')).toBeInTheDocument()
      })
    })

    test('accepts valid phone number formats', async () => {
      const user = userEvent.setup()
      const phoneInput = screen.getByDisplayValue('+1 (555) 123-4567')

      const validFormats = [
        '+1 555 123 4567',
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '5551234567'
      ]

      for (const format of validFormats) {
        await user.clear(phoneInput)
        await user.type(phoneInput, format)
        
        // Should not show validation error
        expect(screen.queryByText('Please enter a valid phone number')).not.toBeInTheDocument()
      }
    })
  })

  describe('Save Functionality', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('shows loading state while saving', async () => {
      const user = userEvent.setup()

      // Mock save API call with delay
      ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      )

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Agency Name')
      
      await user.click(screen.getByText('Save Changes'))

      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })

    test('shows success message on successful save', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Agency Name')
      
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
      })
    })

    test('sends correct data to API', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Agency Name')
      
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/agency/profile',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...mockAgencyData,
              agencyName: 'Updated Agency Name'
            })
          })
        )
      })
    })

    test('shows error message on save failure', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' })
      })

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Agency Name')
      
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument()
      })
    })

    test('handles network errors gracefully', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Agency Name')
      
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('copy to clipboard functionality works', async () => {
      const user = userEvent.setup()
      ;(navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined)

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://yourdomain.com/elite-landscaping/booking'
      )

      await waitFor(() => {
        expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
      })
    })

    test('copy to clipboard handles errors', async () => {
      const user = userEvent.setup()
      ;(navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Copy failed'))

      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to copy. Please select and copy manually.')).toBeInTheDocument()
      })
    })

    test('test link opens correct URL in new tab', async () => {
      const user = userEvent.setup()

      const testLinkButton = screen.getByRole('button', { name: /test link/i })
      await user.click(testLinkButton)

      expect(window.open).toHaveBeenCalledWith(
        'https://yourdomain.com/elite-landscaping/booking',
        '_blank',
        'noopener,noreferrer'
      )
    })

    test('form fields are properly controlled', async () => {
      const user = userEvent.setup()

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'New Agency Name')

      expect(agencyNameInput).toHaveValue('New Agency Name')
    })
  })

  describe('Permission Checks', () => {
    test('redirects unauthorized users', async () => {
      mockAuth.mockReturnValueOnce({
        isSignedIn: false,
        userId: null,
        sessionId: null,
        getToken: jest.fn(),
        isLoaded: true,
        orgId: null,
        orgRole: null
      } as any)

      render(<AgencyProfile />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/sign-in')
      })
    })

    test('shows access denied for insufficient permissions', async () => {
      mockAuth.mockReturnValueOnce({
        isSignedIn: true,
        userId: 'user_123',
        sessionId: 'session_123',
        getToken: jest.fn().mockResolvedValue('token_123'),
        isLoaded: true,
        orgId: 'org_123',
        orgRole: 'basic_member'
      } as any)

      render(<AgencyProfile />)

      await waitFor(() => {
        expect(screen.getByText('You do not have permission to access agency settings.')).toBeInTheDocument()
      })
    })

    test('allows admin and owner roles', async () => {
      const roles = ['admin', 'org:admin', 'owner']
      
      for (const role of roles) {
        mockAuth.mockReturnValueOnce({
          isSignedIn: true,
          userId: 'user_123',
          sessionId: 'session_123',
          getToken: jest.fn().mockResolvedValue('token_123'),
          isLoaded: true,
          orgId: 'org_123',
          orgRole: role
        } as any)

        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAgencyData)
        })

        const { unmount } = render(<AgencyProfile />)

        await waitFor(() => {
          expect(screen.queryByText('You do not have permission to access agency settings.')).not.toBeInTheDocument()
        })

        unmount()
      }
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('form inputs have proper labels', () => {
      expect(screen.getByLabelText('Agency Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Business Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Contact Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Street Address')).toBeInTheDocument()
      expect(screen.getByLabelText('City')).toBeInTheDocument()
      expect(screen.getByLabelText('State/Province')).toBeInTheDocument()
      expect(screen.getByLabelText('Postal Code')).toBeInTheDocument()
      expect(screen.getByLabelText('Country')).toBeInTheDocument()
    })

    test('error messages are announced to screen readers', async () => {
      const user = userEvent.setup()
      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')

      await user.clear(agencyNameInput)
      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        const errorMessage = screen.getByText('Agency name is required')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    test('form has proper aria-describedby relationships', () => {
      const agencyNameInput = screen.getByLabelText('Agency Name')
      expect(agencyNameInput).toHaveAttribute('aria-describedby')
    })

    test('buttons have accessible names', () => {
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /test link/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    test('keyboard navigation works properly', async () => {
      const user = userEvent.setup()

      // Tab through form elements
      await user.tab()
      expect(screen.getByLabelText('Agency Name')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Business Name')).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText('Contact Email')).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    const resizeWindow = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: height,
      })
      window.dispatchEvent(new Event('resize'))
    }

    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('mobile layout stacks form fields vertically', () => {
      resizeWindow(375, 667) // iPhone SE dimensions

      const formContainer = screen.getByTestId('agency-profile-form')
      expect(formContainer).toHaveClass('flex-col', 'space-y-4')
    })

    test('desktop layout uses grid for address fields', () => {
      resizeWindow(1024, 768) // Desktop dimensions

      const addressGrid = screen.getByTestId('address-grid')
      expect(addressGrid).toHaveClass('grid', 'md:grid-cols-2', 'gap-4')
    })

    test('booking link section is responsive', () => {
      // Test mobile
      resizeWindow(375, 667)
      const bookingSection = screen.getByTestId('booking-link-section')
      expect(bookingSection).toHaveClass('flex-col', 'space-y-3')

      // Test desktop
      resizeWindow(1024, 768)
      expect(bookingSection).toHaveClass('md:flex-row', 'md:items-center', 'md:space-x-4')
    })

    test('buttons are touch-friendly on mobile', () => {
      resizeWindow(375, 667)

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      const copyButton = screen.getByRole('button', { name: /copy/i })

      // Check minimum touch target size (44px)
      expect(saveButton).toHaveClass('h-11') // 44px
      expect(copyButton).toHaveClass('h-11')
    })
  })

  describe('Error Boundary Integration', () => {
    test('catches and displays component errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const ErrorBoundaryWrapper = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>
        } catch (error) {
          return <div>Something went wrong. Please refresh the page.</div>
        }
      }

      render(
        <ErrorBoundaryWrapper>
          <ThrowError />
        </ErrorBoundaryWrapper>
      )

      expect(screen.getByText('Something went wrong. Please refresh the page.')).toBeInTheDocument()
    })
  })

  describe('Integration with Form State', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAgencyData)
      })

      render(<AgencyProfile />)
      await waitFor(() => {
        expect(screen.getByDisplayValue('Elite Landscaping')).toBeInTheDocument()
      })
    })

    test('tracks form dirty state', async () => {
      const user = userEvent.setup()

      // Form should not be dirty initially
      expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()

      // Make a change
      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Name')

      // Form should be dirty
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
    })

    test('clears dirty state after successful save', async () => {
      const user = userEvent.setup()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Name')

      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()
      })
    })

    test('prevents navigation with unsaved changes', async () => {
      const user = userEvent.setup()

      // Mock window.beforeunload event
      const beforeUnloadSpy = jest.spyOn(window, 'addEventListener')

      const agencyNameInput = screen.getByDisplayValue('Elite Landscaping')
      await user.clear(agencyNameInput)
      await user.type(agencyNameInput, 'Updated Name')

      // Simulate navigation attempt
      const beforeUnloadEvent = new Event('beforeunload')
      Object.defineProperty(beforeUnloadEvent, 'returnValue', {
        writable: true,
        value: ''
      })

      window.dispatchEvent(beforeUnloadEvent)

      expect(beforeUnloadEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?')
    })
  })
})