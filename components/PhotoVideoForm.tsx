'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Video, Upload, FileImage, FileVideo, Shield, CheckCircle, Play, User, Mail, Wand2, Clock, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

interface PhotoVideoFormData {
  name: string;
  email: string;
  mediaFiles: File[];
  animationPrompt: string;
  videoScenario: string;
  style: string;
  duration: string;
  consent: boolean;
  additionalNotes: string;
}

export default function PhotoVideoForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<PhotoVideoFormData>({
    name: '',
    email: '',
    mediaFiles: [],
    animationPrompt: '',
    videoScenario: '',
    style: '',
    duration: '',
    consent: false,
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormData(prev => ({ ...prev, mediaFiles: [...prev.mediaFiles, ...files] }));
      
      // Create previews for new files
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        setMediaPreviews(prev => [...prev, url]);
      });
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
    
    // Revoke object URL to free memory
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      alert(t('photoVideoForm.consentAlert'));
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would integrate with your backend API
    console.log('Photo/Video request submitted:', formData);
    
    setIsSubmitting(false);
    // Reset form or show success message
  };

  const styles = [
    t('photoVideoForm.styles.cinematic'),
    t('photoVideoForm.styles.romantic'),
    t('photoVideoForm.styles.adventure'),
    t('photoVideoForm.styles.fantasy'),
    t('photoVideoForm.styles.documentary'),
    t('photoVideoForm.styles.artistic'),
    t('photoVideoForm.styles.modern'),
    t('photoVideoForm.styles.vintage'),
    t('photoVideoForm.styles.minimalist'),
    t('photoVideoForm.styles.dynamic')
  ];

  const durations = [
    t('photoVideoForm.durations.short'),
    t('photoVideoForm.durations.medium'),
    t('photoVideoForm.durations.long'),
    t('photoVideoForm.durations.mediumLong'),
    t('photoVideoForm.durations.longer')
  ];

  return (
    <section id="video-request" className="py-20 bg-dark-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-gradient">{t('photoVideoForm.bringYourPhotos')}</span>
          </h2>
          <p className="text-xl text-dark-300 max-w-2xl mx-auto">
            {t('photoVideoForm.turnYourPhotosIntoMovingVideos')}
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
                  <span>{t('photoVideoForm.fullName')}</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('photoVideoForm.enterYourFullName')}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Mail size={20} className="text-primary-500" />
                  <span>{t('photoVideoForm.email')}</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder={t('photoVideoForm.yourEmailExample')}
                />
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-4">
              <label className="flex items-center space-x-2 text-white font-medium">
                <Image size={20} className="text-primary-500" />
                <span>{t('photoVideoForm.photosVideos')}</span>
              </label>
              
              <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors duration-300">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                
                {formData.mediaFiles.length === 0 ? (
                  <div className="space-y-4">
                    <Upload size={48} className="mx-auto text-dark-400" />
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        {t('photoVideoForm.uploadYourPhotosVideos')}
                      </p>
                      <p className="text-dark-400 mb-4">
                        {t('photoVideoForm.supportedFormats')}
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        {t('photoVideoForm.chooseFiles')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.mediaFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden bg-dark-700 border border-dark-600">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={mediaPreviews[index]}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play size={32} className="text-dark-400" />
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                          >
                            ×
                          </button>
                          
                          <p className="text-xs text-dark-400 mt-1 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex space-x-3 justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary"
                      >
                        {t('photoVideoForm.addMoreFiles')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-dark-400">
                <strong>{t('photoVideoForm.requirements')}:</strong> {t('photoVideoForm.highQualityImagesVideos')}
              </p>
            </div>

            {/* Animation & Video Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Wand2 size={20} className="text-primary-500" />
                  <span>{t('photoVideoForm.animationStyle')}</span>
                </label>
                <select
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">{t('photoVideoForm.chooseAstyle')}</option>
                  {styles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-white font-medium">
                  <Clock size={20} className="text-primary-500" />
                  <span>{t('photoVideoForm.desiredDuration')}</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">{t('photoVideoForm.selectDuration')}</option>
                  {durations.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Animation Prompt */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white font-medium">
                <Sparkles size={20} className="text-primary-500" />
                <span>{t('photoVideoForm.animationPrompt')}</span>
              </label>
              <textarea
                name="animationPrompt"
                value={formData.animationPrompt}
                onChange={handleInputChange}
                required
                rows={3}
                className="input-field resize-none"
                placeholder={t('photoVideoForm.describeHowYouWantYourPhotosToMove')}
              />
            </div>

            {/* Video Scenario */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white font-medium">
                <Video size={20} className="text-primary-500" />
                <span>{t('photoVideoForm.videoScenario')}</span>
              </label>
              <textarea
                name="videoScenario"
                value={formData.videoScenario}
                onChange={handleInputChange}
                rows={3}
                className="input-field resize-none"
                placeholder={t('photoVideoForm.describeTheOverallVideoConcept')}
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-white font-medium">
                <FileText size={20} className="text-primary-500" />
                <span>{t('photoVideoForm.additionalNotes')}</span>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
                className="input-field resize-none"
                placeholder={t('photoVideoForm.anySpecificRequirements')}
              />
            </div>

            {/* GDPR Consent */}
            <div className="space-y-4 p-6 bg-dark-700 rounded-lg border border-dark-600">
              <div className="flex items-start space-x-3">
                <Shield size={24} className="text-primary-500 mt-1 flex-shrink-0" />
                <div className="space-y-3">
                  <h4 className="font-medium text-white">{t('photoVideoForm.dataPrivacyConsent')}</h4>
                  <p className="text-dark-300 text-sm leading-relaxed">
                    {t('photoVideoForm.consentDescription')}
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
                      {t('photoVideoForm.consentCheckboxText')}
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
                    <span>{t('photoVideoForm.processingYourRequest')}</span>
                  </div>
                ) : (
                  t('photoVideoForm.createMyVideo')
                )}
              </button>
              <p className="text-sm text-dark-400 mt-3">
                {t('photoVideoForm.reviewYourRequest')}
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
