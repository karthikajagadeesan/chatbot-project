'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import { ApiEndpoint } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeUsers: 0,
  });
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  useEffect(() => {
    checkUser();
    fetchEndpoints();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
      
      // Fetch user stats
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (data) {
        setStats({
          totalChats: Math.floor(Math.random() * 15000) + 10000,
          activeUsers: Math.floor(Math.random() * 500) + 400,
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
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

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const handleTriggerCrawl = () => {
    router.push('/account');
  };

  const getEmbedCode = () => {
    const userId = user?.id || 'your-user-id';
    return `<iframe 
  src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/embed/${userId}" 
  width="360"
  height="600"
  style="position:fixed;bottom:20px;right:20px;border:none;z-index:9999;">
</iframe>`;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    alert('Embed code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Top Navigation */}
    <nav className="bg-dark-200 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            🤖
          </div>
          <span className="text-lg font-bold">Chatbot</span>
        </div>

        {/* Right: Nav links */}
        <div className="flex items-center gap-6">
          
          {/* Home */}
          <Link
            href="/"
            className="text-sm font-semibold hover:text-primary transition"
          >
            Home
          </Link>

          {/* My Account */}
          <Link
            href="/account"
            className="text-sm font-semibold hover:text-primary transition"
          >
            My Account
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition text-sm font-semibold"
            title="Logout"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your AI chatbot configuration</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Chats</p>
                <p className="text-3xl font-bold">{stats.totalChats.toLocaleString()}</p>
                <p className="text-green-400 text-sm mt-1">↑ +12%</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                💬
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Users</p>
                <p className="text-3xl font-bold">{stats.activeUsers}</p>
                <p className="text-green-400 text-sm mt-1">↑ +5.2%</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>
        </div>

        {/* Active Chatbot Configuration */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold mb-4">Active Chatbot Configuration</h2>
          <p className="text-gray-400 mb-6">
            Manage how your AI Assistant behaves on your site.
          </p>

          <div className="bg-dark-100 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <p className="text-gray-400 mb-2">LLM-7483-uk</p>
            
            <div className="flex justify-center gap-4 mt-6">
              <Link
                href="/dashboard/endpoints"
                className="btn-secondary px-6 py-2"
              >
                Configure Endpoints
              </Link>
              {/* <Link
                href="/account"
                className="btn-primary px-6 py-2"
              >
                View Account
              </Link> */}
            </div>
          </div>
        </div>

        {/* AI Assistant Preview */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">AI Assistant Preview</h2>
            <Link
              href="/dashboard/chat"
              className="text-primary hover:underline text-sm"
            >
              Edit →
            </Link>
          </div>

          <div className="bg-dark-100 rounded-xl p-6">
            <div className="bg-dark-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <p className="font-medium">TechFlow Support</p>
                  <p className="text-xs text-gray-400">AI Assistant</p>
                </div>
              </div>
              
              <div className="bg-dark-300 rounded-lg p-3 mb-3">
                <p className="text-sm text-gray-300">
                  Welcome to TechFlow. How can I help you today?
                </p>
              </div>

              <button className="w-full text-left px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
                <p className="text-sm">I have a question about my order</p>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Preview of your chatbot as it appears to users
            </p>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Embed Code</h2>
          <p className="text-gray-400 mb-6">
            Copy this code and paste it before the closing &lt;/body&gt; tag.
          </p>

          <div className="bg-dark-100 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <span className="text-2xl">ℹ️</span>
              <div>
                <p className="font-medium mb-1">Where to Embed?</p>
                <p className="text-sm text-gray-400">
                  Paste the embed code just before closing &lt;/body&gt; tag for optimal performance.
                </p>
              </div>
            </div>

            <div className="bg-dark-300 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto mb-4">
              <pre>{getEmbedCode()}</pre>
            </div>

            <button
              onClick={copyEmbedCode}
              className="btn-primary w-full"
            >
              Copy Embed Code
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-200 border-t border-gray-800 md:hidden">
          <div className="flex justify-around py-4">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
              <span className="text-xl">🏠</span>
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/dashboard/endpoints" className="flex flex-col items-center gap-1 text-gray-400">
              <span className="text-xl">🔗</span>
              <span className="text-xs">Endpoints</span>
            </Link>
            <Link href="/account" className="flex flex-col items-center gap-1 text-gray-400">
              <span className="text-xl">👤</span>
              <span className="text-xs">Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
