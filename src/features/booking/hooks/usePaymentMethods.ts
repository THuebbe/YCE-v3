import { useState, useCallback } from 'react';
import { 
  PaymentMethodsState, 
  PaymentMethodsResponse, 
  AvailablePaymentMethod 
} from '../types';

export function usePaymentMethods() {
  const [state, setState] = useState<PaymentMethodsState>({
    availablePaymentMethods: [],
    isLoading: false,
    error: null,
    defaultPaymentMethod: null,
  });

  const loadPaymentMethods = useCallback(async (agencyId: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // A couple of quick retries: one dropped request shouldn't end the booking
    let lastError = 'Failed to load payment methods';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, 800 * attempt));
      try {
        const response = await fetch(`/api/agency/${agencyId}/payment-methods`);
        const data: PaymentMethodsResponse = await response.json();
        if (!data.success || !data.data) throw new Error(data.error || 'Failed to load payment methods');
        const { availablePaymentMethods, defaultPaymentMethod } = data.data;
        setState({ availablePaymentMethods, isLoading: false, error: null, defaultPaymentMethod });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : lastError;
        console.warn(`Loading payment methods failed (attempt ${attempt + 1}):`, lastError);
      }
    }
    // No made-up fallback: a stand-in "card" method would show the no-charge
    // demo form even for agencies that take real card payments
    setState(prev => ({ ...prev, isLoading: false, error: lastError }));
  }, []);

  const getPaymentMethodById = useCallback((id: string) => {
    return state.availablePaymentMethods.find(method => method.id === id);
  }, [state.availablePaymentMethods]);

  const isPaymentMethodAvailable = useCallback((id: string) => {
    return state.availablePaymentMethods.some(method => method.id === id);
  }, [state.availablePaymentMethods]);

  const getPaymentMethodsByProcessor = useCallback((processor: string) => {
    return state.availablePaymentMethods.filter(method => method.processor === processor);
  }, [state.availablePaymentMethods]);

  return {
    ...state,
    loadPaymentMethods,
    getPaymentMethodById,
    isPaymentMethodAvailable,
    getPaymentMethodsByProcessor,
  };
}