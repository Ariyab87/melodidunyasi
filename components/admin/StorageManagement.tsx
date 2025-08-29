'use client';

import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Music, 
  Video, 
  Image,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface StorageDirectory {
  path: string;
  size: number;
  fileCount: number;
  lastModified: string | null;
}

interface StorageInfo {
  directories: {
    audio: StorageDirectory;
    video: StorageDirectory;
    image: StorageDirectory;
    temp: StorageDirectory;
  };
  total: {
    size: number;
    fileCount: number;
  };
}

interface AdminDashboardProps {
  adminKey: string;
}

export default function StorageManagement({ adminKey }: AdminDashboardProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupType, setCleanupType] = useState<'temp' | 'all'>('temp');
  const [olderThan, setOlderThan] = useState<number>(24 * 60 * 60 * 1000); // 24 hours

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/storage`, {
        headers: {
          'x-admin-key': adminKey,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch storage information');
      }

      const data = await response.json();
      setStorageInfo(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, [adminKey]);

  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const response = await fetch(`${API_BASE}/admin/storage/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          type: cleanupType,
          olderThan: cleanupType === 'temp' ? olderThan : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform cleanup');
      }

      const data = await response.json();
      alert(`Cleanup completed: ${data.data.cleanedFiles} files removed, ${data.data.freedSpace} freed`);
      
      // Refresh storage info
      await fetchStorageInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getDirectoryIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'temp':
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getDirectoryColor = (type: string) => {
    switch (type) {
      case 'audio':
        return 'bg-blue-100 text-blue-600';
      case 'video':
        return 'bg-purple-100 text-purple-600';
      case 'image':
        return 'bg-green-100 text-green-600';
      case 'temp':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
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
            <h3 className="text-lg font-medium text-red-800">Error Loading Storage Info</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchStorageInfo}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!storageInfo) {
    return (
      <div className="text-center text-gray-500">
        No storage information available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storage Management</h2>
          <p className="text-gray-600">Monitor and manage file storage across all directories</p>
        </div>
        <button
          onClick={fetchStorageInfo}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(storageInfo.total.size)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <HardDrive className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Files</p>
              <p className="text-2xl font-bold text-gray-900">
                {storageInfo.total.fileCount.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Directories</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
              <p className="text-sm text-gray-500">audio, video, image, temp</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Details */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Directory Details</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(storageInfo.directories).map(([type, directory]) => (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getDirectoryColor(type)}`}>
                      {getDirectoryIcon(type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">{type}</h4>
                      <p className="text-sm text-gray-500">{directory.path}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{formatBytes(directory.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Files:</span>
                    <span className="font-medium">{directory.fileCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Modified:</span>
                    <span className="font-medium">{formatDate(directory.lastModified)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cleanup Operations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Storage Cleanup</h3>
          <p className="text-sm text-gray-600">Remove temporary files and free up storage space</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cleanup Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cleanup Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="temp"
                    checked={cleanupType === 'temp'}
                    onChange={(e) => setCleanupType(e.target.value as 'temp' | 'all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Temporary files only</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value="all"
                    checked={cleanupType === 'all'}
                    onChange={(e) => setCleanupType(e.target.value as 'temp' | 'all')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">All old files</span>
                </label>
              </div>
            </div>

            {/* Cleanup Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Cleanup Options
              </label>
              {cleanupType === 'temp' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Remove files older than:
                  </label>
                  <select
                    value={olderThan}
                    onChange={(e) => setOlderThan(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={60 * 60 * 1000}>1 hour</option>
                    <option value={6 * 60 * 60 * 1000}>6 hours</option>
                    <option value={24 * 60 * 60 * 1000}>24 hours</option>
                    <option value={7 * 24 * 60 * 60 * 1000}>7 days</option>
                    <option value={30 * 24 * 60 * 60 * 1000}>30 days</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Cleanup Actions */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>⚠️ This action cannot be undone. Please review your selection carefully.</p>
              </div>
              <button
                onClick={handleCleanup}
                disabled={cleanupLoading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                {cleanupLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{cleanupLoading ? 'Cleaning...' : 'Start Cleanup'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Storage Recommendations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Regularly clean temporary files to free up space</li>
              <li>• Monitor video and audio file sizes as they consume the most storage</li>
              <li>• Consider implementing automatic cleanup for files older than 30 days</li>
              <li>• Backup important user-generated content before cleanup operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
