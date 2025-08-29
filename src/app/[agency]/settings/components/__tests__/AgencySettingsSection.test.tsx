import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { jest } from '@jest/globals'
import AgencySettingsSection from '../AgencySettingsSection'

// Mock fetch for API calls
global.fetch = jest.fn()

// Mock agency data
const mockAgency = {
  id: 'agency-123',
  name: 'Test Agency',
  slug: 'test-agency',
  address: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TC',
    zip: '12345'
  },
  phone: '(555) 123-4567',
  email: 'test@agency.com',
  settings: {}
}

const mockAgencyWithSettings = {
  ...mockAgency,
  settings: {
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '10:00', close: '16:00', isOpen: true },
      sunday: { open: '12:00', close: '16:00', isOpen: false },
      timeZone: 'America/New_York'
    },
    deliveryWindows: {
      morningWindow: { start: '08:00', end: '12:00', enabled: true },
      afternoonWindow: { start: '12:00', end: '17:00', enabled: true },
      eveningWindow: { start: '17:00', end: '20:00', enabled: true },
      customWindows: []
    },
    bookingRules: {
      minimumLeadTimeHours: 48,
      maximumRentalDays: 14,
      minimumRentalDays: 1,
      allowSameDayBooking: false
    },
    blackoutDates: [],
    customerExperience: {
      welcomeMessage: 'Welcome to Test Agency!',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      supportEmail: 'support@agency.com',
      supportPhone: '(555) 123-4567'
    },
    notifications: {
      sendBookingConfirmation: true,
      sendReminders: true,
      reminderDaysBefore: [3, 1],
      sendDeploymentNotification: true,
      sendPickupReminder: true,
      allowSMSNotifications: false
    }
  }
}

describe('Agency Settings Section - Success Criteria Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  // Success Criterion 1: Operating Hours
  test('displays operating hours configuration interface', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/operating hours/i)).toBeInTheDocument()
    expect(screen.getByText(/monday/i)).toBeInTheDocument()
    expect(screen.getByText(/tuesday/i)).toBeInTheDocument()
    expect(screen.getByText(/sunday/i)).toBeInTheDocument()
  })

  test('allows configuring different hours for each day', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const mondayOpenInput = screen.getByTestId('monday-open-time')
    const mondayCloseInput = screen.getByTestId('monday-close-time')
    
    fireEvent.change(mondayOpenInput, { target: { value: '08:00' } })
    fireEvent.change(mondayCloseInput, { target: { value: '18:00' } })
    
    expect((mondayOpenInput as HTMLInputElement).value).toBe('08:00')
    expect((mondayCloseInput as HTMLInputElement).value).toBe('18:00')
  })

  test('validates time format for operating hours', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const mondayOpenInput = screen.getByTestId('monday-open-time')
    fireEvent.change(mondayOpenInput, { target: { value: 'invalid-time' } })
    fireEvent.blur(mondayOpenInput)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid time format/i)).toBeInTheDocument()
    })
  })

  // Success Criterion 2: Blackout Dates
  test('shows blackout dates management interface', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/blackout dates/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add blackout date/i })).toBeInTheDocument()
  })

  test('allows adding blackout dates', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const addButton = screen.getByRole('button', { name: /add blackout date/i })
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('blackout-date-form')).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reason/i)).toBeInTheDocument()
    })
  })

  test('validates blackout date ranges', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const addButton = screen.getByRole('button', { name: /add blackout date/i })
    fireEvent.click(addButton)
    
    const dateInput = screen.getByLabelText(/date/i)
    fireEvent.change(dateInput, { target: { value: '2023-01-01' } }) // Past date
    fireEvent.blur(dateInput)
    
    await waitFor(() => {
      expect(screen.getByText(/cannot be in the past/i)).toBeInTheDocument()
    })
  })

  // Success Criterion 3: Booking Policies
  test('displays booking policies configuration', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/booking policies/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/minimum lead time/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/maximum rental duration/i)).toBeInTheDocument()
  })

  test('updates booking lead time settings', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const leadTimeInput = screen.getByLabelText(/minimum lead time/i) as HTMLInputElement
    fireEvent.change(leadTimeInput, { target: { value: '72' } })
    
    expect(leadTimeInput.value).toBe('72')
  })

  // Success Criterion 4: Service Areas
  test('shows service area configuration', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/service area/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/service radius/i)).toBeInTheDocument()
  })

  // Success Criterion 5: Customer Experience
  test('displays customer experience customization', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/customer experience/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/welcome message/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/primary color/i)).toBeInTheDocument()
  })

  test('validates color format for branding', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const colorInput = screen.getByLabelText(/primary color/i)
    fireEvent.change(colorInput, { target: { value: 'invalid-color' } })
    fireEvent.blur(colorInput)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid color format/i)).toBeInTheDocument()
    })
  })

  // Success Criterion 6: Notification Settings
  test('shows notification preferences configuration', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    expect(screen.getByText(/notification settings/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/booking confirmation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/send reminders/i)).toBeInTheDocument()
  })

  // Success Criterion 7: Business Rules
  test('configures delivery windows properly', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const morningWindowCheckbox = screen.getByLabelText(/morning window/i)
    const afternoonWindowCheckbox = screen.getByLabelText(/afternoon window/i)
    
    fireEvent.click(morningWindowCheckbox)
    fireEvent.click(afternoonWindowCheckbox)
    
    expect(morningWindowCheckbox).toBeChecked()
    expect(afternoonWindowCheckbox).toBeChecked()
  })

  // Success Criterion 8: Settings Validation
  test('validates all configuration changes before saving', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/please fix validation errors/i)).toBeInTheDocument()
    })
  })
})

describe('Agency Settings Section - Component Behavior', () => {
  test('renders correctly with existing settings', () => {
    render(<AgencySettingsSection agency={mockAgencyWithSettings} />)
    
    expect(screen.getByDisplayValue('Welcome to Test Agency!')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#3B82F6')).toBeInTheDocument()
    expect(screen.getByDisplayValue('48')).toBeInTheDocument()
  })

  test('handles tabbed navigation between setting categories', () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const operatingHoursTab = screen.getByRole('tab', { name: /operating hours/i })
    const blackoutDatesTab = screen.getByRole('tab', { name: /blackout dates/i })
    const policiesTab = screen.getByRole('tab', { name: /policies/i })
    
    fireEvent.click(blackoutDatesTab)
    expect(blackoutDatesTab).toHaveAttribute('aria-selected', 'true')
    
    fireEvent.click(policiesTab)
    expect(policiesTab).toHaveAttribute('aria-selected', 'true')
    
    fireEvent.click(operatingHoursTab)
    expect(operatingHoursTab).toHaveAttribute('aria-selected', 'true')
  })

  test('manages state properly across different tabs', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    // Make changes in operating hours tab
    const mondayOpenInput = screen.getByTestId('monday-open-time')
    fireEvent.change(mondayOpenInput, { target: { value: '08:00' } })
    
    // Switch to policies tab
    const policiesTab = screen.getByRole('tab', { name: /policies/i })
    fireEvent.click(policiesTab)
    
    const leadTimeInput = screen.getByLabelText(/minimum lead time/i)
    fireEvent.change(leadTimeInput, { target: { value: '72' } })
    
    // Switch back to operating hours
    const operatingHoursTab = screen.getByRole('tab', { name: /operating hours/i })
    fireEvent.click(operatingHoursTab)
    
    // Verify changes were preserved
    expect((mondayOpenInput as HTMLInputElement).value).toBe('08:00')
  })
})

describe('Agency Settings Section - API Integration', () => {
  test('loads current settings from API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAgencyWithSettings.settings
      })
    })

    render(<AgencySettingsSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/agency/settings?agencyId=${mockAgency.id}`)
    })
  })

  test('saves settings configuration successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    render(<AgencySettingsSection agency={mockAgencyWithSettings} />)
    
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/agency/settings?agencyId=${mockAgency.id}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('operatingHours')
        })
      )
    })
  })

  test('handles settings save errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Validation failed',
        details: [{ field: 'operatingHours.monday.open', message: 'Invalid time format' }]
      })
    })

    render(<AgencySettingsSection agency={mockAgency} />)
    
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid time format/i)).toBeInTheDocument()
    })
  })
})

describe('Agency Settings Section - Error Handling', () => {
  test('handles network failure scenarios', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    render(<AgencySettingsSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument()
    })
  })

  test('handles validation error scenarios', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    // Set invalid time
    const mondayOpenInput = screen.getByTestId('monday-open-time')
    fireEvent.change(mondayOpenInput, { target: { value: '25:00' } })
    fireEvent.blur(mondayOpenInput)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid time/i)).toBeInTheDocument()
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

    render(<AgencySettingsSection agency={mockAgency} />)
    
    await waitFor(() => {
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
    })
  })
})

describe('Agency Settings Section - Advanced Features', () => {
  test('handles recurring blackout date patterns', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const addButton = screen.getByRole('button', { name: /add blackout date/i })
    fireEvent.click(addButton)
    
    const recurringCheckbox = screen.getByLabelText(/recurring/i)
    fireEvent.click(recurringCheckbox)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/interval/i)).toBeInTheDocument()
    })
  })

  test('calculates delivery time windows correctly', () => {
    render(<AgencySettingsSection agency={mockAgencyWithSettings} />)
    
    // Should show delivery windows based on settings
    expect(screen.getByText(/morning.*8:00.*12:00/i)).toBeInTheDocument()
    expect(screen.getByText(/afternoon.*12:00.*17:00/i)).toBeInTheDocument()
    expect(screen.getByText(/evening.*17:00.*20:00/i)).toBeInTheDocument()
  })

  test('supports custom delivery windows', async () => {
    render(<AgencySettingsSection agency={mockAgency} />)
    
    const addCustomWindowButton = screen.getByRole('button', { name: /add custom window/i })
    fireEvent.click(addCustomWindowButton)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/window name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end time/i)).toBeInTheDocument()
    })
  })
})