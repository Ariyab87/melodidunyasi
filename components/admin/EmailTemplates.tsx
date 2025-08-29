'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Edit, 
  Save, 
  X, 
  RefreshCw,
  AlertTriangle,
  Eye,
  Copy,
  CheckCircle
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
  variables: string[];
  enabled: boolean;
}

interface TemplatesData {
  [key: string]: EmailTemplate;
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function EmailTemplates({ adminKey }: AdminDashboardProps) {
  const [templates, setTemplates] = useState<TemplatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
              const response = await fetch(`${API_BASE}/email-templates`, {
        headers: {
          'x-admin-key': adminKey,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email templates');
      }

      const data = await response.json();
      setTemplates(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [adminKey]);

  const handleEdit = (templateKey: string) => {
    const template = templates?.[templateKey];
    if (template) {
      setEditingTemplate(templateKey);
      setEditForm({
        name: template.name,
        subject: template.subject,
        body: template.body,
        variables: [...template.variables],
        enabled: template.enabled
      });
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setEditForm({});
    setPreviewTemplate(null);
  };

  const handleSave = async (templateKey: string) => {
    try {
              const response = await fetch(`${API_BASE}/email-templates/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          template: templateKey,
          content: editForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      await fetchTemplates();
      setEditingTemplate(null);
      setEditForm({});
      setPreviewTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const handlePreview = (templateKey: string) => {
    setPreviewTemplate(templateKey);
  };

  const handleCopyTemplate = (templateKey: string) => {
    const template = templates?.[templateKey];
    if (template) {
      const templateText = `Subject: ${template.subject}\n\n${template.body}`;
      navigator.clipboard.writeText(templateText);
      setCopied(templateKey);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const generatePreview = (template: EmailTemplate) => {
    let preview = template.body;
    
    // Replace variables with sample values
    template.variables.forEach(variable => {
      const cleanVar = variable.replace(/[{}]/g, '');
      let sampleValue = '';
      
      switch (cleanVar) {
        case 'userName':
          sampleValue = 'John Doe';
          break;
        case 'userEmail':
          sampleValue = 'john@example.com';
          break;
        case 'orderType':
          sampleValue = 'Custom Song';
          break;
        case 'orderId':
          sampleValue = 'ORD_12345';
          break;
        case 'price':
          sampleValue = '$29.99';
          break;
        case 'status':
          sampleValue = 'Processing';
          break;
        case 'downloadLink':
          sampleValue = 'https://example.com/download/123';
          break;
        case 'resetLink':
          sampleValue = 'https://example.com/reset-password?token=abc123';
          break;
        default:
          sampleValue = `[${cleanVar}]`;
      }
      
      preview = preview.replace(new RegExp(variable, 'g'), sampleValue);
    });
    
    return preview;
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Templates</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchTemplates}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!templates) {
    return (
      <div className="text-center text-gray-500">
        No email templates available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Template Management</h2>
          <p className="text-gray-600">Manage email templates for various system notifications</p>
        </div>
        <button
          onClick={fetchTemplates}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(templates).map(([templateKey, template]) => (
          <div key={templateKey} className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.enabled ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                      }`}>
                        {template.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(templateKey)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopyTemplate(templateKey)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    title="Copy Template"
                  >
                    {copied === templateKey ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {editingTemplate === templateKey ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(templateKey)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        title="Save"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(templateKey)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {editingTemplate === templateKey ? (
                <div className="space-y-4">
                  {/* Template Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={editForm.subject || ''}
                      onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                    <textarea
                      value={editForm.body || ''}
                      onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="Enter email body content..."
                    />
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {editForm.variables?.map((variable, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-2">
                            {variable}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Use these variables in your template. They will be replaced with actual values when sending emails.
                      </p>
                    </div>
                  </div>

                  {/* Enabled Status */}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.enabled || false}
                        onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable this template</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Subject Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-900">{template.subject}</span>
                    </div>
                  </div>

                  {/* Body Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">{template.body}</pre>
                    </div>
                  </div>

                  {/* Variables */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Variables</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {template.variables.map((variable, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-2">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Preview: {templates[previewTemplate]?.name}
              </h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Subject Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-900">
                      {generatePreview(templates[previewTemplate]).split('\n')[0]}
                    </span>
                  </div>
                </div>

                {/* Body Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Body (with sample data)</label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                      {generatePreview(templates[previewTemplate])}
                    </pre>
                  </div>
                </div>

                {/* Variables Used */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variables Used</label>
                  <div className="px-3 py-2 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      {templates[previewTemplate]?.variables.map((variable, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2 mb-2">
                          {variable}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(templates).length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Enabled</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(templates).filter(t => t.enabled).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-red-600">
                {Object.values(templates).filter(t => !t.enabled).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Variables</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(templates).reduce((acc, t) => acc + t.variables.length, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
