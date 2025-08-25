'use client';

import { useState } from 'react';
import { useSunoGuard } from '@/lib/useSunoGuard';
import { useSunoStatus } from '@/lib/sunoStatusContext';
import { Music, Play, AlertTriangle } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import { API_BASE } from '@/lib/api';

interface SongGenerationFormData {
  prompt: string;
  style: string;
  duration: number;
  userEmail: string;
  debugSmall: boolean;
}

export default function SongGenerationForm() {
  const { canGenerate, checkBeforeGenerate, showToast, toastMessage, clearToast } = useSunoGuard();
  const { status } = useSunoStatus();
  
  const [formData, setFormData] = useState<SongGenerationFormData>({
    prompt: '',
    style: 'pop',
    duration: 30,
    userEmail: 'admin@example.com',
    debugSmall: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [songId, setSongId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check Suno status before proceeding
    const canProceed = await checkBeforeGenerate();
    if (!canProceed) {
      return; // Toast message is already shown by the guard
    }

    setSubmitStatus('submitting');
    setErrorMessage('');
    
    try {
      // Send form data to backend API
      const response = await fetch(`${API_BASE}/api/song/simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSongId(result.songId);
        setSubmitStatus('success');
        showToast('Song generation started successfully!');
        // Reset form after successful submission
        setFormData({
          prompt: '',
          style: 'pop',
          duration: 30,
          userEmail: 'admin@example.com',
          debugSmall: false
        });
      } else {
        throw new Error(result.error || 'Failed to submit song request');
      }
    } catch (error) {
      console.error('Error submitting song request:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSubmitStatus('error');
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const songStyles = [
    'pop', 'rock', 'jazz', 'classical', 'electronic', 'folk', 'country', 'hip-hop', 'r&b', 'blues'
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <Music className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Admin Song Generation</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Generate songs directly from the admin panel. Suno API status is automatically checked.
        </p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prompt */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Song Prompt *
            </label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the song you want to generate..."
            />
          </div>

          {/* Style and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                id="style"
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {songStyles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="10"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User Email */}
          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
              User Email
            </label>
            <input
              type="email"
              id="userEmail"
              name="userEmail"
              value={formData.userEmail}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          {/* Debug Small Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="debugSmall"
              name="debugSmall"
              checked={formData.debugSmall}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="debugSmall" className="ml-2 block text-sm text-gray-700">
              Debug Small (10s test generation)
            </label>
          </div>

          {/* Status Display */}
          {submitStatus === 'success' && songId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Play className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Song Generation Started</p>
                  <p className="text-sm text-green-600">Song ID: {songId}</p>
                </div>
              </div>
            </div>
          )}

          {submitStatus === 'error' && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Generation Failed</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!canGenerate || isSubmitting}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                canGenerate
                  ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Music className="w-4 h-4" />
                  <span>Generate Song</span>
                </>
              )}
            </button>

            {!canGenerate && (
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {status?.code === 'REGION_BLOCK' 
                    ? 'Suno unavailable from server region. Try again later or switch region.'
                    : 'Suno API is currently unavailable'
                  }
                </span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={clearToast}
          duration={5000}
        />
      )}
    </div>
  );
}
