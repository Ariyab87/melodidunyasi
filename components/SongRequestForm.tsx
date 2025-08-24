'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Music, Heart, Calendar, User, FileText, Clock, Star, Mail, Phone, Users, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { useSunoGuard } from '@/lib/useSunoGuard';
import { useSunoStatus } from '@/lib/sunoStatusContext';
import Toast from '@/components/ui/Toast';

interface SongRequestFormData {
  name: string;
  email: string;
  phone: string;
  songStyle: string;
  mood: string;
  specialOccasion: string;
  namesToInclude: string;
  story: string;
  tempo: string;
  notes: string;
  instrumental: boolean;
}

export default function SongRequestForm() {
  const { t } = useLanguage();
  const { canGenerate, checkBeforeGenerate, showToast, toastMessage, clearToast } = useSunoGuard();
  const { status } = useSunoStatus();
  
  const [formData, setFormData] = useState<SongRequestFormData>({
    name: '',
    email: '',
    phone: '',
    songStyle: '',
    mood: '',
    specialOccasion: '',
    namesToInclude: '',
    story: '',
    tempo: '',
    notes: '',
    instrumental: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [songId, setSongId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
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
      const response = await fetch('/api/song', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          status: 'pending'
        }),
      });

      if (response.status === 429) {
        setErrorMessage('You\'re submitting too quickly. Please wait a few seconds and try again.');
        setSubmitStatus('error');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSongId(result.id); // Use the backend-provided ID
        setSubmitStatus('success');
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          songStyle: '',
          mood: '',
          specialOccasion: '',
          namesToInclude: '',
          story: '',
          tempo: '',
          notes: '',
          instrumental: false
        });
        
        // Navigate to song status page with the backend-provided ID
        if (result.id) {
          window.location.href = `/song-status/${result.id}`;
        }
      } else {
        throw new Error(result.error || 'Failed to submit song request');
      }
    } catch (error) {
      console.error('Error submitting song request:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setSubmitStatus('error');
    }
  };

  const songStyles = [
    'Pop', 'Rock', 'Jazz', 'Classical', 'Country', 'Hip Hop', 'Electronic', 'Folk', 'R&B', 'Blues'
  ];

  const moods = [
    'Romantic', 'Happy', 'Melancholic', 'Energetic', 'Peaceful', 'Nostalgic', 'Uplifting', 'Intimate'
  ];

  const occasions = [
    'Wedding', 'Anniversary', 'Proposal', 'Birthday', 'Valentine\'s Day', 'Graduation', 'Engagement', 'Other'
  ];

  const tempos = [
    'Slow (60-80 BPM)', 'Medium (80-120 BPM)', 'Fast (120-160 BPM)', 'Very Fast (160+ BPM)'
  ];

  return (
    <section id="song-request" className="py-20 bg-dark-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-gradient">{t('songForm.title')}</span>
          </h2>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            {t('songForm.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="card space-y-8">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <User size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.fullName')} *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('songForm.placeholders.fullName')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Mail size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.email')} *</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('songForm.placeholders.email')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Phone size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.phone')}</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={t('songForm.placeholders.phone')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Calendar size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.specialOccasion')} *</span>
                </label>
                <select
                  name="specialOccasion"
                  value={formData.specialOccasion}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">{t('songForm.placeholders.selectOccasion')}</option>
                  {occasions.map(occasion => (
                    <option key={occasion} value={occasion}>{occasion}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Song Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Music size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.songStyle')} *</span>
                </label>
                <select
                  name="songStyle"
                  value={formData.songStyle}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">{t('songForm.placeholders.chooseStyle')}</option>
                  {songStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Heart size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.mood')} *</span>
                </label>
                <select
                  name="mood"
                  value={formData.mood}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                >
                  <option value="">{t('songForm.placeholders.selectMood')}</option>
                  {moods.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Clock size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.tempo')}</span>
                </label>
                <select
                  name="tempo"
                  value={formData.tempo}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">{t('songForm.placeholders.chooseTempo')}</option>
                  {tempos.map(tempo => (
                    <option key={tempo} value={tempo}>{tempo}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Music size={20} className="text-primary-500" />
                  <span>Instrumental Only</span>
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="instrumental"
                      checked={formData.instrumental}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-primary-600 bg-dark-600 border-dark-500 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-dark-300 text-sm">Create instrumental version (no vocals)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Users size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.namesToInclude')}</span>
                </label>
                <input
                  type="text"
                  name="namesToInclude"
                  value={formData.namesToInclude}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder={t('songForm.placeholders.namesToInclude')}
                />
              </div>
            </div>

            {/* Story and Notes */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <FileText size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.yourStory')} *</span>
                </label>
                <textarea
                  name="story"
                  value={formData.story}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="input-field resize-none"
                  placeholder={t('songForm.placeholders.yourStory')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Star size={20} className="text-primary-500" />
                  <span>{t('songForm.fields.additionalNotes')}</span>
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder={t('songForm.placeholders.additionalNotes')}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              {/* Success Message */}
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                    <CheckCircle size={24} />
                    <span className="font-semibold">Song Request Submitted Successfully!</span>
                  </div>
                  <p className="text-green-300 text-sm">
                    Your song request has been received. We'll start processing it immediately.
                  </p>
                  {songId && (
                    <p className="text-green-300 text-sm mt-2">
                      <strong>Request ID:</strong> {songId}
                    </p>
                  )}
                  <div className="mt-4">
                    <a
                      href={`/song-status/${songId}`}
                      className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors duration-200"
                    >
                      <span>Check Song Status</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"
                >
                  <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                    <AlertTriangle size={24} />
                    <span className="font-semibold">Submission Failed</span>
                  </div>
                  <p className="text-red-300 text-sm">{errorMessage}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitStatus === 'submitting' || !canGenerate}
                className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitStatus === 'submitting' ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Your Song...</span>
                  </div>
                ) : (
                  t('songForm.submitButton.createSong')
                )}
              </button>
              <p className="text-sm text-dark-400 mt-3">
                {t('songForm.submitButton.reviewTime')}
              </p>
              
              {/* Suno Status Indicator */}
              {!canGenerate && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-red-400">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">
                      {status?.code === 'REGION_BLOCK' 
                        ? 'Suno unavailable from server region. Try again later or switch region.'
                        : 'Suno API is currently unavailable. Please try again later.'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </motion.div>
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
    </section>
  );
}
