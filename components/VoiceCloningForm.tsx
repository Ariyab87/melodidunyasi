'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload, FileAudio, Shield, CheckCircle, Mail, Target, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

interface VoiceCloningFormData {
  name: string;
  email: string;
  audioFile: File | null;
  consent: boolean;
  purpose: string;
  additionalNotes: string;
}

export default function VoiceCloningForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<VoiceCloningFormData>({
    name: '',
    email: '',
    audioFile: null,
    consent: false,
    purpose: '',
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, audioFile: file }));
      
      // Create audio preview
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      alert(t('voiceForm.consentAlert'));
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would integrate with your backend API
    console.log('Voice cloning request submitted:', formData);
    
    setIsSubmitting(false);
    // Reset form or show success message
  };

  const purposes = [
    t('voiceForm.purposes.personal'),
    t('voiceForm.purposes.podcast'),
    t('voiceForm.purposes.audiobook'),
    t('voiceForm.purposes.voiceActing'),
    t('voiceForm.purposes.assistant'),
    t('voiceForm.purposes.other')
  ];

  return (
    <section id="voice-cloning" className="py-20 bg-dark-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-gradient">{t('voiceForm.title')}</span>
          </h2>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            {t('voiceForm.subtitle')}
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
                  <Mic size={20} className="text-primary-500" />
                  <span>{t('voiceForm.nameLabel')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('voiceForm.namePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Mail size={20} className="text-primary-500" />
                  <span>{t('voiceForm.emailLabel')}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('voiceForm.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Purpose Selection */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white font-medium">
                <Target size={20} className="text-primary-500" />
                <span>{t('voiceForm.purposeLabel')}</span>
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                className="input-field"
              >
                <option value="">{t('voiceForm.selectPurpose')}</option>
                {purposes.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>

            {/* Audio Upload */}
            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-white font-medium">
                <FileAudio size={20} className="text-primary-500" />
                <span>{t('voiceForm.audioSampleLabel')}</span>
              </label>
              
              <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors duration-300">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                
                {!formData.audioFile ? (
                  <div className="space-y-4">
                    <Upload size={48} className="mx-auto text-dark-400" />
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        {t('voiceForm.uploadAudioPrompt')}
                      </p>
                      <p className="text-dark-400 mb-4">
                        {t('voiceForm.supportedFormats')}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        {t('voiceForm.chooseAudioFile')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CheckCircle size={48} className="mx-auto text-primary-500" />
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        {formData.audioFile.name}
                      </p>
                      <p className="text-dark-400 mb-4">
                        {(formData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      
                      {/* Audio Preview */}
                      {audioPreview && (
                        <audio controls className="w-full max-w-md mx-auto">
                          <source src={audioPreview} type={formData.audioFile.type} />
                          {t('voiceForm.audioNotSupported')}
                        </audio>
                      )}
                      
                      <div className="flex space-x-3 justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-secondary"
                        >
                          {t('voiceForm.changeFile')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, audioFile: null }));
                            setAudioPreview(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
                        >
                          {t('voiceForm.removeFile')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-dark-400">
                <strong>{t('voiceForm.requirements')}</strong> {t('voiceForm.requirementsDescription')}
              </p>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white font-medium">
                <FileText size={20} className="text-primary-500" />
                <span>{t('voiceForm.additionalNotesLabel')}</span>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field resize-none"
                placeholder={t('voiceForm.additionalNotesPlaceholder')}
              />
            </div>

            {/* GDPR Consent */}
            <div className="space-y-4 p-6 bg-dark-700 rounded-lg border border-dark-600">
              <div className="flex items-start space-x-3">
                <Shield size={24} className="text-primary-500 mt-1 flex-shrink-0" />
                <div className="space-y-3">
                  <h4 className="font-medium text-white">{t('voiceForm.dataPrivacyTitle')}</h4>
                  <p className="text-dark-300 text-sm leading-relaxed">
                    {t('voiceForm.dataPrivacyDescription')}
                  </p>
                  
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consent"
                      checked={formData.consent}
                      onChange={handleInputChange}
                      required
                      className="mt-1 w-4 h-4 text-primary-600 bg-dark-600 border-dark-500 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-sm text-white">
                      {t('voiceForm.gdprConsent')} *
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting || !formData.consent}
                className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('voiceForm.processingMessage')}</span>
                  </div>
                ) : (
                  t('voiceForm.startVoiceCloning')
                )}
              </button>
              <p className="text-sm text-dark-400 mt-3">
                {t('voiceForm.responseTime')}
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
