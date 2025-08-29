'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  RefreshCw, 
  Filter, 
  Search,
  Clock,
  User,
  Server,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Eye,
  Download,
  Shield
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface UserDetails {
  name: string;
  email: string;
  phone: string;
  gdprConsent: boolean;
  gdprConsentDate: string;
}

interface ServiceDetails {
  service: string;
  prompt?: string;
  style?: string;
  mood?: string;
  purpose?: string;
  quality?: string;
}

interface Order {
  id: string;
  userId: string;
  type: string;
  status: string;
  price: number;
  createdAt: string;
  completedAt?: string;
  userDetails: UserDetails;
  serviceDetails: ServiceDetails;
}

interface OrderData {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

interface GdpLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  userDetails: {
    name: string;
    email: string;
    ipAddress: string;
  };
  consentDetails?: {
    marketing: boolean;
    analytics: boolean;
    necessary: boolean;
  };
  deletionDetails?: {
    reason: string;
    dataTypes: string[];
  };
}

interface GdpLogsData {
  logs: GdpLog[];
  total: number;
  limit: number;
  offset: number;
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function OrderTracking({ adminKey }: AdminDashboardProps) {
  const [orders, setOrders] = useState<OrderData | null>(null);
  const [gdprLogs, setGdprLogs] = useState<GdpLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'gdpr'>('orders');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
      });

              const response = await fetch(`${API_BASE}/orders?${params}`, {
        headers: {
          'x-admin-key': adminKey,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchGdprLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

              const response = await fetch(`${API_BASE}/gdpr-logs?${params}`, {
        headers: {
          'x-admin-key': adminKey,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch GDPR logs');
      }

      const data = await response.json();
      setGdprLogs(data.data);
    } catch (err) {
      console.error('Failed to fetch GDPR logs:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else {
      fetchGdprLogs();
    }
  }, [adminKey, pagination, filters, activeTab]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Play className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'song':
        return <FileText className="w-4 h-4" />;
      case 'voice':
        return <User className="w-4 h-4" />;
      case 'video':
        return <Play className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const exportOrders = () => {
    if (!orders?.orders) return;
    
    const csvContent = [
      'Order ID,User ID,Type,Status,Price,Created At,Completed At,User Name,User Email,User Phone,GDPR Consent,GDPR Consent Date',
      ...orders.orders.map(order => 
        `"${order.id}","${order.userId}","${order.type}","${order.status}","${order.price}","${order.createdAt}","${order.completedAt || ''}","${order.userDetails.name}","${order.userDetails.email}","${order.userDetails.phone}","${order.userDetails.gdprConsent}","${order.userDetails.gdprConsentDate}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportGdprLogs = () => {
    if (!gdprLogs?.logs) return;
    
    const csvContent = [
      'Log ID,User ID,Action,Timestamp,User Name,User Email,IP Address,Consent Details,Deletion Details',
      ...gdprLogs.logs.map(log => 
        `"${log.id}","${log.userId}","${log.action}","${log.timestamp}","${log.userDetails.name}","${log.userDetails.email}","${log.userDetails.ipAddress}","${JSON.stringify(log.consentDetails || '')}","${JSON.stringify(log.deletionDetails || '')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gdpr-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Orders</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchOrders}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
          <p className="text-gray-600">Monitor orders, user details, and GDPR compliance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={activeTab === 'orders' ? exportOrders : exportGdprLogs}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Export {activeTab === 'orders' ? 'Orders' : 'GDPR Logs'}</span>
          </button>
          <button
            onClick={activeTab === 'orders' ? fetchOrders : fetchGdprLogs}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('gdpr')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'gdpr'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            GDPR Logs
          </button>
        </nav>
      </div>

      {activeTab === 'orders' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search orders..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="song">Song</option>
                  <option value="voice">Voice</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                <span className="text-sm text-gray-500">
                  {orders?.total || 0} total orders
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders?.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(order.type)}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.id}</div>
                            <div className="text-sm text-gray-500 capitalize">{order.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{order.userDetails.name}</div>
                          <div className="text-gray-500">{order.userDetails.email}</div>
                          <div className="text-gray-500">{order.userDetails.phone}</div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Shield className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              GDPR: {order.userDetails.gdprConsent ? 'Consented' : 'Not Consented'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 capitalize">{order.serviceDetails.service}</div>
                          {order.serviceDetails.prompt && (
                            <div className="text-gray-500 text-xs truncate max-w-xs" title={order.serviceDetails.prompt}>
                              {order.serviceDetails.prompt}
                            </div>
                          )}
                          {order.serviceDetails.style && (
                            <div className="text-gray-500 text-xs">Style: {order.serviceDetails.style}</div>
                          )}
                          {order.serviceDetails.mood && (
                            <div className="text-gray-500 text-xs">Mood: {order.serviceDetails.mood}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <span className="text-sm text-gray-900 capitalize">{order.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </div>
                        {order.completedAt && (
                          <div className="text-xs text-green-600">
                            Completed: {formatDate(order.completedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {orders && orders.total > pagination.limit && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, orders.total)} of {orders.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={pagination.offset + pagination.limit >= orders.total}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'gdpr' && (
        <>
          {/* GDPR Logs Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">GDPR Compliance Logs</h3>
                <span className="text-sm text-gray-500">
                  {gdprLogs?.total || 0} total logs
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Log ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gdprLogs?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{log.userDetails.name}</div>
                          <div className="text-gray-500">{log.userDetails.email}</div>
                          <div className="text-gray-500 text-xs">IP: {log.userDetails.ipAddress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 capitalize">
                            {log.action.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {log.consentDetails && (
                            <div>
                              <div className="font-medium">Consent Details:</div>
                              <div>Marketing: {log.consentDetails.marketing ? 'Yes' : 'No'}</div>
                              <div>Analytics: {log.consentDetails.analytics ? 'Yes' : 'No'}</div>
                              <div>Necessary: {log.consentDetails.necessary ? 'Yes' : 'No'}</div>
                            </div>
                          )}
                          {log.deletionDetails && (
                            <div>
                              <div className="font-medium">Deletion Request:</div>
                              <div>Reason: {log.deletionDetails.reason}</div>
                              <div>Data Types: {log.deletionDetails.dataTypes.join(', ')}</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {gdprLogs && gdprLogs.total > pagination.limit && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, gdprLogs.total)} of {gdprLogs.total} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={pagination.offset + pagination.limit >= gdprLogs.total}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders?.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {orders?.orders.filter(o => o.status === 'completed').length || 0}
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
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600">
                {orders?.orders.filter(o => o.status === 'processing').length || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">GDPR Logs</p>
              <p className="text-2xl font-bold text-purple-600">
                {gdprLogs?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
