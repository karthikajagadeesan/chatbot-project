'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { ApiEndpoint, Product } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [endpointData, setEndpointData] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    email: '',
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEndpoints();
    }
  }, [user]);

  useEffect(() => {
    if (endpoints.length > 0) {
      fetchAllEndpointData();
    }
  }, [endpoints]);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);

      // Fetch user profile
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      setUserProfile(data);
      setEditForm({
        companyName: data?.company_name || '',
        email: currentUser.email || '',
      });
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEndpoints(data || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    }
  };

  const fetchAllEndpointData = async () => {
    setFetchingData(true);
    const data: { [key: string]: any } = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.endpoint_url);
        if (response.ok) {
          const json = await response.json();
          data[endpoint.endpoint_type] = json;
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint.endpoint_name}:`, error);
      }
    }

    setEndpointData(data);
    setFetchingData(false);
  };

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          company_name: editForm.companyName,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUserProfile({ ...userProfile, company_name: editForm.companyName });
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update profile');
    }
  };

  const renderProducts = () => {
    const products = endpointData.products;
    if (!products) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400">No products endpoint configured</p>
        </div>
      );
    }

    const productList = Array.isArray(products) ? products : [products];

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productList.slice(0, 6).map((product: Product, index: number) => (
          <div
            key={product.id || index}
            className="bg-dark-200 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all"
          >
            <div className="h-48 bg-dark-100 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-5xl">📦</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold mb-2 line-clamp-2">{product.title}</h3>
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  ${product.price}
                </span>
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <span>⭐</span>
                    <span className="text-sm">{product.rating.rate}</span>
                  </div>
                )}
              </div>
              <button className="w-full mt-4 bg-primary hover:bg-blue-600 text-white py-2 rounded-lg transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((order) => (
          <div key={order} className="bg-dark-200 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold">Order #{12340 + order}</h3>
                <p className="text-sm text-gray-400">Placed on Jan {15 + order}, 2024</p>
              </div>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">
                Delivered
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-dark-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div className="flex-1">
                <p className="font-medium">Product Package #{order}</p>
                <p className="text-sm text-gray-400">Quantity: {order}</p>
              </div>
              <p className="text-lg font-bold">${99.99 * order}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderApiLogs = () => {
    return (
      <div className="bg-dark-200 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium">Endpoint</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <tr key={endpoint.id} className="border-t border-gray-800">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">{endpoint.endpoint_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">
                      200 OK
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {index}m ago
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Header */}
      <div className="bg-dark-200 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <span>←</span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My Account</h1>
              <p className="text-sm text-gray-400">Manage your profile and data</p>
            </div>
          </div>
          {/* <button className="p-2 hover:bg-dark-100 rounded-lg transition-colors">
            <span className="text-xl">⚙️</span>
          </button> */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="card mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center text-3xl">
                {userProfile?.company_name?.charAt(0) || '👤'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userProfile?.company_name || 'User'}</h2>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="btn-primary px-4 py-2"
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {editMode && (
            <div className="bg-dark-100 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  className="input-field"
                  disabled
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                className="btn-primary w-full py-3"
              >
                Save Changes
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">1.2k</p>
              <p className="text-sm text-gray-400 mt-1">Total Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">98.8%</p>
              <p className="text-sm text-gray-400 mt-1">Response Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">145ms</p>
              <p className="text-sm text-gray-400 mt-1">Avg Latency</p>
            </div>
          </div>
        </div>

        {/* Inventory Preview */}
        <div className="card">
          <h2 className="text-xl font-bold mb-6">Inventory Preview</h2>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('api-logs')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'api-logs'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              API Logs
            </button>
          </div>

          {/* Refresh Button */}
          {fetchingData ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Fetching data from endpoints...</p>
            </div>
          ) : (
            <>
              {activeTab === 'products' && renderProducts()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'api-logs' && renderApiLogs()}
            </>
          )}

          {!fetchingData && (
            <button
              onClick={fetchAllEndpointData}
              className="w-full mt-6 btn-secondary py-3 flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
