'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Shield, Zap, Music, CheckCircle } from 'lucide-react';
import { usePayment } from '@/lib/paymentContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { processPayment, isProcessing, paymentError, clearPaymentError } = usePayment();

  const handlePayment = async () => {
    const success = await processPayment();
    if (success) {
      onSuccess?.();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-wedding p-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-3xl flex items-center justify-center">
                <Music className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Unlock Your Song
            </h2>
            <p className="text-gray-600 text-lg">
              One payment = 3 tries (1 song + 2 regenerations)
            </p>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl p-6 mb-8 border-2 border-accent-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-600 mb-2">₺500</div>
              <p className="text-accent-700 font-medium">One-time payment</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">3 total generations</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Studio-quality vocals</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Any language support</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Fast delivery</span>
            </div>
          </div>

          {/* Important note */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
            <p className="text-blue-800 text-sm text-center">
              <strong>Note:</strong> Regenerations use the same prompt. You can change style/model each time.
            </p>
          </div>

          {/* Error message */}
          {paymentError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm mb-6"
            >
              {paymentError}
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="space-y-4">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-accent-400 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-wedding"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Pay & Generate</span>
                </div>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {/* Security badges */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
