'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Edit, 
  Save, 
  X, 
  Image as ImageIcon,
  Type,
  FormInput,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ContentField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormConfig {
  fields: ContentField[];
}

interface ServiceContent {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

interface ContentData {
  hero: {
    title: string;
    subtitle: string;
    slogan: string;
    backgroundImage: string;
    ctaText: string;
    ctaLink: string;
  };
  services: {
    song: ServiceContent;
    voice: ServiceContent;
    video: ServiceContent;
  };
  forms: {
    songRequest: FormConfig;
    voiceCloning: FormConfig;
    videoGeneration: FormConfig;
  };
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function ContentManagement({ adminKey }: AdminDashboardProps) {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content', {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }

      const data = await response.json();
      setContent(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [adminKey]);

  const handleEdit = (section: string, data: any) => {
    setEditingSection(section);
    setEditForm(data);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditForm({});
  };

  const handleSave = async (section: string) => {
    try {
      const response = await fetch('/api/admin/content/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          section,
          content: editForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      await fetchContent();
      setEditingSection(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update content');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading Content</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchContent}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center text-gray-500">
        No content data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600">Manage website visuals, slogans, and form fields</p>
        </div>
        <button
          onClick={fetchContent}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Hero Section</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(content.hero).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                {editingSection === 'hero' ? (
                  <input
                    type={key === 'backgroundImage' || key === 'ctaLink' ? 'url' : 'text'}
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{value}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            {editingSection === 'hero' ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSave('hero')}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEdit('hero', content.hero)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Hero</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Services Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Services Content</h3>
        </div>
        <div className="p-6">
          {Object.entries(content.services).map(([serviceKey, service]) => (
            <div key={serviceKey} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 capitalize">{serviceKey} Service</h4>
                {editingSection === `services_${serviceKey}` ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(`services_${serviceKey}`)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(`services_${serviceKey}`, service)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  {editingSection === `services_${serviceKey}` ? (
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{service.title}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  {editingSection === `services_${serviceKey}` ? (
                    <input
                      type="text"
                      value={editForm.icon || ''}
                      onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="🎵"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{service.icon}</span>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {editingSection === `services_${serviceKey}` ? (
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{service.description}</span>
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  {editingSection === `services_${serviceKey}` ? (
                    <textarea
                      value={editForm.features?.join('\n') || ''}
                      onChange={(e) => setEditForm({ ...editForm, features: e.target.value.split('\n').filter(f => f.trim()) })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <ul className="text-sm text-gray-600">
                        {service.features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Form Fields Configuration</h3>
        </div>
        <div className="p-6">
          {Object.entries(content.forms).map(([formKey, form]) => (
            <div key={formKey} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 capitalize">
                  {formKey.replace(/([A-Z])/g, ' $1').trim()} Form
                </h4>
                {editingSection === `forms_${formKey}` ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(`forms_${formKey}`)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(`forms_${formKey}`, form)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {form.fields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Field Name</label>
                        {editingSection === `forms_${formKey}` ? (
                          <input
                            type="text"
                            value={editForm.fields?.[index]?.name || ''}
                            onChange={(e) => {
                              const newFields = [...(editForm.fields || [])];
                              newFields[index] = { ...newFields[index], name: e.target.value };
                              setEditForm({ ...editForm, fields: newFields });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{field.name}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                        {editingSection === `forms_${formKey}` ? (
                          <input
                            type="text"
                            value={editForm.fields?.[index]?.label || ''}
                            onChange={(e) => {
                              const newFields = [...(editForm.fields || [])];
                              newFields[index] = { ...newFields[index], label: e.target.value };
                              setEditForm({ ...editForm, fields: newFields });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{field.label}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        {editingSection === `forms_${formKey}` ? (
                          <select
                            value={editForm.fields?.[index]?.type || ''}
                            onChange={(e) => {
                              const newFields = [...(editForm.fields || [])];
                              newFields[index] = { ...newFields[index], type: e.target.value };
                              setEditForm({ ...editForm, fields: newFields });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="text">Text</option>
                            <option value="email">Email</option>
                            <option value="tel">Phone</option>
                            <option value="select">Select</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                          </select>
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600 capitalize">{field.type}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Required</label>
                        {editingSection === `forms_${formKey}` ? (
                          <input
                            type="checkbox"
                            checked={editForm.fields?.[index]?.required || false}
                            onChange={(e) => {
                              const newFields = [...(editForm.fields || [])];
                              newFields[index] = { ...newFields[index], required: e.target.checked };
                              setEditForm({ ...editForm, fields: newFields });
                            }}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{field.required ? 'Yes' : 'No'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {field.type === 'select' && field.options && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                        {editingSection === `forms_${formKey}` ? (
                          <textarea
                            value={editForm.fields?.[index]?.options?.join('\n') || ''}
                            onChange={(e) => {
                              const newFields = [...(editForm.fields || [])];
                              newFields[index] = { ...newFields[index], options: e.target.value.split('\n').filter(o => o.trim()) };
                              setEditForm({ ...editForm, fields: newFields });
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{field.options.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
