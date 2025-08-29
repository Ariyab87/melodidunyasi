'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Edit,
  Save,
  X,
  Key,
  Globe,
  Gauge
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface Service {
  name: string;
  status: string;
  apiKey: string;
  baseUrl: string;
  rateLimit: string;
}

interface ServicesData {
  suno: Service;
  kits: Service;
  runway: Service;
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function ServicesManagement({ adminKey }: AdminDashboardProps) {
  const [services, setServices] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/services`, {
        headers: {
          'x-admin-key': adminKey,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [adminKey]);

  const handleEdit = (serviceKey: string) => {
    const service = services?.[serviceKey as keyof ServicesData];
    if (service) {
      setEditingService(serviceKey);
      setEditForm({
        apiKey: service.apiKey,
        baseUrl: service.baseUrl,
        rateLimit: service.rateLimit,
      });
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setEditForm({});
  };

  const handleSave = async (serviceKey: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/services/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          service: serviceKey,
          config: editForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service');
      }

      // Refresh services data
      await fetchServices();
      setEditingService(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service');
    }
  };

  const handleToggleService = async (serviceKey: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/admin/services/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          service: serviceKey,
          enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle service');
      }

      // Refresh services data
      await fetchServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle service');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Services</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchServices}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!services) {
    return (
      <div className="text-center text-gray-500">
        No services data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
          <p className="text-gray-600">Configure and monitor AI service integrations</p>
        </div>
        <button
          onClick={fetchServices}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(services).map(([serviceKey, service]) => (
          <div key={serviceKey} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              {/* Service Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Server className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                      </div>
                      <span className="text-sm text-gray-500 capitalize">{service.status}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">API:</span>
                      <button
                        onClick={() => handleToggleService(serviceKey, !service.enabled)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                          service.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {service.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>
                {editingService === serviceKey ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSave(serviceKey)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(serviceKey)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Service Configuration */}
              <div className="space-y-4">
                {/* API Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Key className="w-4 h-4" />
                      <span>API Key</span>
                    </div>
                  </label>
                  {editingService === serviceKey ? (
                    <input
                      type="password"
                      value={editForm.apiKey || ''}
                      onChange={(e) => setEditForm({ ...editForm, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter API key"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <code className="text-sm text-gray-600">{service.apiKey}</code>
                    </div>
                  )}
                </div>

                {/* Base URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Base URL</span>
                    </div>
                  </label>
                  {editingService === serviceKey ? (
                    <input
                      type="url"
                      value={editForm.baseUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, baseUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter base URL"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <code className="text-sm text-gray-600">{service.baseUrl}</code>
                    </div>
                  )}
                </div>

                {/* Rate Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4" />
                      <span>Rate Limit</span>
                    </div>
                  </label>
                  {editingService === serviceKey ? (
                    <input
                      type="text"
                      value={editForm.rateLimit || ''}
                      onChange={(e) => setEditForm({ ...editForm, rateLimit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter rate limit"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{service.rateLimit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Actions */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex space-x-3">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Test Connection
                  </button>
                  <button
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Health Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Service Health Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(services).map(([serviceKey, service]) => (
              <div key={serviceKey} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                  service.status === 'Active' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {getStatusIcon(service.status)}
                </div>
                <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                <p className={`text-sm font-medium ${
                  service.status === 'Active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {service.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Last checked: {new Date().toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
