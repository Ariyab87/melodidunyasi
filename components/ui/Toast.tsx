'use client';

import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ 
  message, 
  type = 'error', 
  onClose, 
  duration = 5000 
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <div className="w-5 h-5 bg-green-500 rounded-full" />;
      case 'warning':
        return <div className="w-5 h-5 bg-yellow-500 rounded-full" />;
      case 'error':
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg shadow-lg p-4 ${getToastStyles()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
