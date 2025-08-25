'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Server, 
  HardDrive, 
  FileText, 
  Settings, 
  Activity,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Music
} from 'lucide-react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import ServicesManagement from '@/components/admin/ServicesManagement';
import StorageManagement from '@/components/admin/StorageManagement';
import RequestMonitoring from '@/components/admin/RequestMonitoring';
import SystemLogs from '@/components/admin/SystemLogs';
import ContentManagement from '@/components/admin/ContentManagement';
import OrderTracking from '@/components/admin/OrderTracking';
import PricingManagement from '@/components/admin/PricingManagement';
import EmailTemplates from '@/components/admin/EmailTemplates';
import SunoStatusBanner from '@/components/admin/SunoStatusBanner';
import { SunoStatusProvider } from '@/lib/sunoStatusContext';
import SongGenerationForm from '@/components/admin/SongGenerationForm';
import { API_BASE } from '@/lib/api';

type AdminTab = 'dashboard' | 'services' | 'storage' | 'requests' | 'logs' | 'content' | 'orders' | 'pricing' | 'email' | 'song-generation';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAuth = async () => {
    if (!adminKey.trim()) return;
    
    setIsLoading(true);
    setAuthError('');
    
    try {
      // Test the admin key by making a request to the dashboard endpoint
      const response = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: {
          'x-admin-key': adminKey.trim(),
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminKey', adminKey.trim());
      } else {
        setAuthError('Invalid admin key. Please try again.');
      }
    } catch (error) {
      setAuthError('Connection error. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('adminKey');
    if (savedKey) {
      setAdminKey(savedKey);
      // Validate the saved key on page load
      handleAuth();
    }
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'requests', label: 'Requests', icon: FileText },
    { id: 'logs', label: 'System Logs', icon: Activity },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: FileText },
    { id: 'email', label: 'Email', icon: FileText },
    { id: 'song-generation', label: 'Song Generation', icon: Music },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-300">Enter your admin key to continue</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            
            {authError && (
              <div className="text-red-400 text-sm text-center">
                {authError}
              </div>
            )}
            
            <button
              onClick={handleAuth}
              disabled={!adminKey.trim() || isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SunoStatusProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Settings className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Admin Access
                </span>
                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    localStorage.removeItem('adminKey');
                    setAdminKey('');
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Suno Status Banner */}
        <SunoStatusBanner />

        {/* Navigation Tabs */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && <AdminDashboard adminKey={adminKey} />}
          {activeTab === 'services' && <ServicesManagement adminKey={adminKey} />}
          {activeTab === 'storage' && <StorageManagement adminKey={adminKey} />}
          {activeTab === 'requests' && <RequestMonitoring adminKey={adminKey} />}
          {activeTab === 'logs' && <SystemLogs adminKey={adminKey} />}
          {activeTab === 'content' && <ContentManagement adminKey={adminKey} />}
          {activeTab === 'orders' && <OrderTracking adminKey={adminKey} />}
          {activeTab === 'pricing' && <PricingManagement adminKey={adminKey} />}
          {activeTab === 'email' && <EmailTemplates adminKey={adminKey} />}
          {activeTab === 'song-generation' && <SongGenerationForm />}
        </main>
      </div>
    </SunoStatusProvider>
  );
}
