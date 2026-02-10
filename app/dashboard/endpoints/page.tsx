'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { ApiEndpoint } from '@/types';

export default function EndpointsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCrawlModal, setShowCrawlModal] = useState(false);
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    type: 'products' as 'products' | 'about' | 'services' | 'other',
  });

  useEffect(() => {
    checkUser();
    fetchEndpoints();
  }, []);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);
  };

  const fetchEndpoints = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndpoints(data || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    }
  };

  const handleAddEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error('No user found');

      const { data, error } = await supabase
        .from('api_endpoints')
        .insert({
          user_id: currentUser.id,
          endpoint_name: newEndpoint.name,
          endpoint_url: newEndpoint.url,
          endpoint_type: newEndpoint.type,
        })
        .select()
        .single();

      if (error) throw error;

      setEndpoints(prev => [data, ...prev]);
      setShowAddModal(false);
      setNewEndpoint({ name: '', url: '', type: 'products' });
    } catch (error: any) {
      alert(error.message || 'Failed to add endpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;

    try {
      const { error } = await supabase
        .from('api_endpoints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEndpoints(prev => prev.filter(ep => ep.id !== id));
    } catch (error: any) {
      alert(error.message || 'Failed to delete endpoint');
    }
  };

  const handleTriggerCrawl = () => {
    if (endpoints.length === 1) {
      // If only 1 endpoint, trigger directly
      router.push('/account');
    } else {
      // If 2+ endpoints, show selection modal
      setShowCrawlModal(true);
      setSelectedEndpoints(endpoints.map(ep => ep.id)); // Select all by default
    }
  };

  const handleConfirmCrawl = () => {
    if (selectedEndpoints.length === 0) {
      alert('Please select at least one endpoint');
      return;
    }
    
    // Pass selected endpoint IDs to account page via query params
    const endpointIds = selectedEndpoints.join(',');
    router.push(`/account?endpoints=${endpointIds}`);
  };

  const toggleEndpointSelection = (id: string) => {
    setSelectedEndpoints(prev => 
      prev.includes(id) 
        ? prev.filter(epId => epId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEndpoints.length === endpoints.length) {
      setSelectedEndpoints([]);
    } else {
      setSelectedEndpoints(endpoints.map(ep => ep.id));
    }
  };

  const getEndpointIcon = (type: string) => {
    switch (type) {
      case 'products':
        return '📦';
      case 'about':
        return 'ℹ️';
      case 'services':
        return '⚙️';
      default:
        return '🔗';
    }
  };

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <div className="bg-dark-200 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <span>←</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">API Endpoints</h1>
              <p className="text-sm text-gray-400">Configure your data sources</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Training Data Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-2">Training Data</h2>
          <p className="text-gray-400 mb-6">
            Your chatbot is built to dynamically use your configured endpoints, interpret user intent, and provide relevant results.
          </p>
          
          <div className="bg-dark-100 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-300">
              💡 The AI will automatically detect user intent (like "show me products") and fetch data from your configured endpoints to provide accurate responses.
            </p>
          </div>
        </div>

        {/* Configured Endpoints */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Configured Endpoints</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary px-4 py-2 flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add New Endpoint</span>
            </button>
          </div>

          {endpoints.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-lg font-medium mb-2">No endpoints configured</h3>
              <p className="text-gray-400 mb-6">
                Add your first endpoint to start training your chatbot
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Add Endpoint
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="bg-dark-100 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        {getEndpointIcon(endpoint.endpoint_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold">/{endpoint.endpoint_name}</h3>
                          <button className="text-gray-400 hover:text-white">
                            <span>✏️</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-2 break-all">
                          {endpoint.endpoint_url}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-dark-200 rounded border border-gray-700">
                            {endpoint.endpoint_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEndpoint(endpoint.id)}
                      className="text-red-400 hover:text-red-300 p-2"
                    >
                      <span className="text-xl">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Crawl Button */}
        {endpoints.length > 0 && (
          <div className="card">
            <button
              onClick={handleTriggerCrawl}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Trigger Manual Crawl</span>
            </button>
            <p className="text-sm text-gray-400 text-center mt-3">
              {endpoints.length === 1 
                ? 'This will fetch and display data from your configured endpoint'
                : 'Select which endpoints to crawl and fetch data from'}
            </p>
          </div>
        )}
      </div>

      {/* Add Endpoint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-dark-200 rounded-2xl p-8 w-full max-w-md border border-gray-800">
            <h2 className="text-2xl font-bold mb-6">Add New Endpoint</h2>

            <form onSubmit={handleAddEndpoint} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Endpoint Name</label>
                <input
                  type="text"
                  value={newEndpoint.name}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, name: e.target.value })}
                  placeholder="e.g., products"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Endpoint URL</label>
                <input
                  type="url"
                  value={newEndpoint.url}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                  placeholder="https://api.example.com/products"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newEndpoint.type}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, type: e.target.value as any })}
                  className="input-field"
                >
                  <option value="products">Products</option>
                  <option value="about">About</option>
                  <option value="services">Services</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn-secondary py-3"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Select Endpoints Modal */}
      {showCrawlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-dark-200 rounded-2xl p-8 w-full max-w-md border border-gray-800">
            <h2 className="text-2xl font-bold mb-2">Select Endpoints to Crawl</h2>
            <p className="text-sm text-gray-400 mb-6">
              Choose which endpoints you want to fetch data from
            </p>

            <div className="space-y-3 mb-6">
              {/* Select All Option */}
              <div className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg border border-gray-700">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedEndpoints.length === endpoints.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-600 bg-dark-300 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="select-all" className="flex-1 cursor-pointer font-medium">
                  Select All Endpoints
                </label>
              </div>

              {/* Individual Endpoints */}
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={endpoint.id}
                    checked={selectedEndpoints.includes(endpoint.id)}
                    onChange={() => toggleEndpointSelection(endpoint.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-dark-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor={endpoint.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getEndpointIcon(endpoint.endpoint_type)}</span>
                      <div>
                        <div className="font-medium">/{endpoint.endpoint_name}</div>
                        <div className="text-xs text-gray-400">{endpoint.endpoint_type}</div>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCrawlModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCrawl}
                className="flex-1 btn-primary py-3"
                disabled={selectedEndpoints.length === 0}
              >
                Crawl Selected ({selectedEndpoints.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}