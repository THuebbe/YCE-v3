export const clerkTheme = {
  variables: {
    colorPrimary: '#3B82F6', // Primary blue
    colorPrimaryText: '#FFFFFF',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#111827',
    colorText: '#111827',
    colorTextSecondary: '#6B7280',
    colorTextOnPrimaryBackground: '#FFFFFF',
    colorDanger: '#EF4444',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorNeutral: '#6B7280',
    borderRadius: '0.5rem',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  elements: {
    // Form elements
    formButtonPrimary: {
      backgroundColor: '#3B82F6',
      borderColor: '#3B82F6',
      color: '#FFFFFF',
      '&:hover': {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
      },
      '&:focus': {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
      },
      fontWeight: 500,
      fontSize: '14px',
      borderRadius: '0.5rem',
      padding: '8px 16px',
      transition: 'all 0.2s ease-in-out',
    },
    
    formButtonSecondary: {
      backgroundColor: 'transparent',
      borderColor: '#D1D5DB',
      color: '#374151',
      '&:hover': {
        backgroundColor: '#F9FAFB',
        borderColor: '#9CA3AF',
      },
      fontWeight: 500,
      fontSize: '14px',
      borderRadius: '0.5rem',
      padding: '8px 16px',
      transition: 'all 0.2s ease-in-out',
    },

    formFieldInput: {
      backgroundColor: '#FFFFFF',
      borderColor: '#D1D5DB',
      color: '#111827',
      '&:focus': {
        borderColor: '#3B82F6',
        boxShadow: '0 0 0 1px #3B82F6',
      },
      '&::placeholder': {
        color: '#9CA3AF',
      },
      fontSize: '14px',
      borderRadius: '0.5rem',
      padding: '10px 12px',
      fontFamily: 'Inter, system-ui, sans-serif',
    },

    formFieldLabel: {
      color: '#374151',
      fontSize: '14px',
      fontWeight: 500,
      marginBottom: '4px',
    },

    // Card elements
    card: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderRadius: '0.75rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      padding: '32px',
    },

    cardBox: {
      borderRadius: '0.75rem',
    },

    // Header elements
    headerTitle: {
      color: '#111827',
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: '32px',
      marginBottom: '8px',
    },

    headerSubtitle: {
      color: '#6B7280',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },

    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: '#FFFFFF',
      borderColor: '#D1D5DB',
      color: '#374151',
      '&:hover': {
        backgroundColor: '#F9FAFB',
        borderColor: '#9CA3AF',
      },
      fontWeight: 500,
      fontSize: '14px',
      borderRadius: '0.5rem',
      padding: '10px 16px',
      transition: 'all 0.2s ease-in-out',
    },

    socialButtonsBlockButtonText: {
      color: '#374151',
      fontSize: '14px',
      fontWeight: 500,
    },

    // Footer elements
    footerActionLink: {
      color: '#3B82F6',
      '&:hover': {
        color: '#2563EB',
      },
      fontSize: '14px',
      fontWeight: 500,
      textDecoration: 'none',
    },

    footerActionText: {
      color: '#6B7280',
      fontSize: '14px',
    },

    // Loading elements
    spinner: {
      color: '#3B82F6',
      width: '20px',
      height: '20px',
    },

    // Alert elements
    alertText: {
      color: '#EF4444',
      fontSize: '14px',
      fontWeight: 500,
    },

    // Navbar elements (for organization components)
    navbar: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },

    navbarButton: {
      color: '#6B7280',
      '&:hover': {
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
      },
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '0.5rem',
      padding: '8px 12px',
      transition: 'all 0.2s ease-in-out',
    },

    navbarButtonActive: {
      color: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fontSize: '14px',
      fontWeight: 600,
      borderRadius: '0.5rem',
      padding: '8px 12px',
    },

    // Avatar elements
    avatarBox: {
      borderRadius: '50%',
      width: '32px',
      height: '32px',
    },

    avatarImage: {
      borderRadius: '50%',
    },

    // Badge elements
    badge: {
      backgroundColor: '#EFF6FF',
      color: '#1D4ED8',
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '0.375rem',
      padding: '2px 6px',
    },

    // Popover elements
    popoverBox: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },

    // Menu elements
    menuButton: {
      color: '#6B7280',
      '&:hover': {
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
      },
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '0.375rem',
      padding: '8px 12px',
      transition: 'all 0.2s ease-in-out',
    },

    menuItem: {
      color: '#374151',
      '&:hover': {
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
      },
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '0.375rem',
      padding: '8px 12px',
      transition: 'all 0.2s ease-in-out',
    },
  },
}