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

    try {
      console.log('🔍 Loading payment methods for agency:', agencyId);

      const response = await fetch(`/api/agency/${agencyId}/payment-methods`);
      const data: PaymentMethodsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load payment methods');
      }

      if (!data.data) {
        throw new Error('No payment methods data received');
      }

      const { availablePaymentMethods, defaultPaymentMethod } = data.data;

      setState({
        availablePaymentMethods,
        isLoading: false,
        error: null,
        defaultPaymentMethod,
      });

      console.log('✅ Payment methods loaded successfully:', {
        count: availablePaymentMethods.length,
        methods: availablePaymentMethods.map(m => ({ id: m.id, processor: m.processor })),
        default: defaultPaymentMethod,
      });

    } catch (error) {
      console.error('❌ Error loading payment methods:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load payment methods';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Provide fallback payment methods in case of error
      const fallbackMethods: AvailablePaymentMethod[] = [{
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Visa, Mastercard, American Express',
        icon: 'CreditCard',
        processor: 'platform',
        processorConfig: {
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
        }
      }];

      setState(prev => ({
        ...prev,
        availablePaymentMethods: fallbackMethods,
        defaultPaymentMethod: 'card',
      }));

      console.log('🔄 Using fallback payment methods due to error');
    }
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