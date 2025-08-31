'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './authContext';

interface PaymentContextType {
  isPaymentModalOpen: boolean;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  processPayment: () => Promise<boolean>;
  isProcessing: boolean;
  paymentError: string | null;
  clearPaymentError: () => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { user, refreshCredits } = useAuth();

  const openPaymentModal = () => {
    setIsPaymentModalOpen(true);
    setPaymentError(null);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPaymentError(null);
  };

  const processPayment = async (): Promise<boolean> => {
    if (!user) {
      setPaymentError('User not authenticated');
      return false;
    }

    try {
      setIsProcessing(true);
      setPaymentError(null);

      // Mock payment processing - replace with actual payment gateway integration
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const success = Math.random() > 0.1; // 90% success rate for demo

      if (success) {
        // Update user credits and tries
        // In real implementation, this would be done via API call
        const updatedUser = {
          ...user,
          credits: user.credits + 1,
          triesLeft: 3
        };
        
        localStorage.setItem('melodiUser', JSON.stringify(updatedUser));
        
        // Refresh credits in auth context
        await refreshCredits();
        
        closePaymentModal();
        return true;
      } else {
        setPaymentError('Payment failed. Please try again.');
        return false;
      }
    } catch (error) {
      setPaymentError('An unexpected error occurred. Please try again.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearPaymentError = () => {
    setPaymentError(null);
  };

  const value: PaymentContextType = {
    isPaymentModalOpen,
    openPaymentModal,
    closePaymentModal,
    processPayment,
    isProcessing,
    paymentError,
    clearPaymentError,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};
