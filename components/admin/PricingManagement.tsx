'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface Addon {
  price: number;
  description: string;
}

interface ServicePricing {
  basePrice: number;
  currency: string;
  features: string[];
  addons: {
    [key: string]: Addon;
  };
}

interface PricingData {
  song: ServicePricing;
  voice: ServicePricing;
  video: ServicePricing;
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function PricingManagement({ adminKey }: AdminDashboardProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServicePricing>>({});
  const [editingAddon, setEditingAddon] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState<{ name: string; price: number; description: string }>({
    name: '',
    price: 0,
    description: ''
  });

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing', {
        headers: {
          'x-admin-key': adminKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      const data = await response.json();
      setPricing(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [adminKey]);

  const handleEdit = (serviceKey: string) => {
    const service = pricing?.[serviceKey as keyof PricingData];
    if (service) {
      setEditingService(serviceKey);
      setEditForm({
        basePrice: service.basePrice,
        currency: service.currency,
        features: [...service.features],
        addons: { ...service.addons }
      });
    }
  };

  const handleCancel = () => {
    setEditingService(null);
    setEditForm({});
    setEditingAddon(null);
    setAddonForm({ name: '', price: 0, description: '' });
  };

  const handleSave = async (serviceKey: string) => {
    try {
      const response = await fetch('/api/admin/pricing/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          service: serviceKey,
          pricing: editForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing');
      }

      await fetchPricing();
      setEditingService(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing');
    }
  };

  const handleAddAddon = (serviceKey: string) => {
    if (!addonForm.name || addonForm.price <= 0 || !addonForm.description) {
      return;
    }

    const newAddons = { ...editForm.addons };
    newAddons[addonForm.name] = {
      price: addonForm.price,
      description: addonForm.description
    };

    setEditForm({ ...editForm, addons: newAddons });
    setAddonForm({ name: '', price: 0, description: '' });
  };

  const handleRemoveAddon = (serviceKey: string, addonName: string) => {
    const newAddons = { ...editForm.addons };
    delete newAddons[addonName];
    setEditForm({ ...editForm, addons: newAddons });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(editForm.features || [])];
    newFeatures[index] = value;
    setEditForm({ ...editForm, features: newFeatures });
  };

  const handleAddFeature = () => {
    setEditForm({ ...editForm, features: [...(editForm.features || []), ''] });
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = (editForm.features || []).filter((_: string, i: number) => i !== index);
    setEditForm({ ...editForm, features: newFeatures });
  };

  const formatPrice = (price: number, currency: string) => {
    try {
      // Map TL to TRY (Turkish Lira ISO code)
      const currencyCode = currency === 'TL' ? 'TRY' : currency.toUpperCase();
      
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      return `${price} ${currency}`;
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Pricing</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchPricing}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="text-center text-gray-500">
        No pricing data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pricing Management</h2>
          <p className="text-gray-600">Set pricing for each service and manage add-ons</p>
        </div>
        <button
          onClick={fetchPricing}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Services Pricing */}
      {Object.entries(pricing).map(([serviceKey, service]) => (
        <div key={serviceKey} className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 capitalize">{serviceKey} Service Pricing</h3>
              {editingService === serviceKey ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSave(serviceKey)}
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
                  onClick={() => handleEdit(serviceKey)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                {editingService === serviceKey ? (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.basePrice || 0}
                      onChange={(e) => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={editForm.currency || 'USD'}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(service.basePrice, service.currency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                {editingService === serviceKey ? (
                  <div className="space-y-2">
                    {editForm.features?.map((feature: string, index: number) => (
                      <div key={index} className="flex space-x-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Feature description"
                        />
                        <button
                          onClick={() => handleRemoveFeature(index)}
                          className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddFeature}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Feature</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {service.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add-ons */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Add-ons</h4>
                {editingService === serviceKey && (
                  <button
                    onClick={() => setEditingAddon(serviceKey)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Add-on</span>
                  </button>
                )}
              </div>

              {editingService === serviceKey && editingAddon === serviceKey && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={addonForm.name}
                        onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add-on name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={addonForm.price}
                        onChange={(e) => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <input
                        type="text"
                        value={addonForm.description}
                        onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add-on description"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleAddAddon(serviceKey)}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => setEditingAddon(null)}
                      className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(editingService === serviceKey ? (editForm.addons || {}) : service.addons).map(([addonName, addon]) => {
                  const typedAddon = addon as Addon;
                  return (
                    <div key={addonName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{addonName}</h5>
                        {editingService === serviceKey && (
                          <button
                            onClick={() => handleRemoveAddon(serviceKey, addonName)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-blue-600 mb-2">
                        {formatPrice(typedAddon.price, editingService === serviceKey ? editForm.currency : service.currency)}
                      </div>
                      <p className="text-sm text-gray-600">{typedAddon.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Pricing Summary */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Pricing Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(pricing).map(([serviceKey, service]) => (
              <div key={serviceKey} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 capitalize mb-2">{serviceKey}</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {formatPrice(service.basePrice, service.currency)}
                </div>
                <div className="text-sm text-gray-500">
                  {Object.keys(service.addons).length} add-ons available
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
