'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { ChatMessage, ApiEndpoint } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const userRef = useRef<any>(null); // ← Ref keeps userId accessible immediately in async handlers
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to TechFlow. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
    fetchEndpoints();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);
    userRef.current = currentUser; // ← Sync ref immediately on load
  };

  const fetchEndpoints = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setEndpoints(data || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // ← Use ref first (sync), fallback to live fetch if ref not yet set
    let currentUserId = userRef.current?.id ?? null;
    if (!currentUserId) {
      const freshUser = await getCurrentUser();
      if (freshUser) {
        userRef.current = freshUser;
        setUser(freshUser);
        currentUserId = freshUser.id;
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          userMessage: input,
          userId: currentUserId, // ← Now always correctly populated
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const message = data.message || data.content || 'No response received';

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.content.startsWith('[') || message.content.startsWith('{')) {
      try {
        const data = JSON.parse(message.content);
        if (Array.isArray(data)) {
          return (
            <div className="space-y-3">
              <p className="text-sm mb-3 text-gray-300">Here are the products:</p>
              <div className="grid grid-cols-2 gap-3">
                {data.slice(0, 4).map((product: any) => (
                  <div
                    key={product.id}
                    className="bg-[#1a1f2e] rounded-xl overflow-hidden border border-[#2a3144] hover:border-[#4f8ef7] transition-colors"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-xs mb-1 line-clamp-2 text-gray-200">
                        {product.title}
                      </h4>
                      <p className="text-[#4f8ef7] font-bold text-sm">${product.price}</p>
                      <button className="w-full mt-2 bg-[#4f8ef7] hover:bg-[#3a7de0] text-white text-xs py-1.5 rounded-lg transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      } catch {
        // fall through
      }
    }

    return <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d1117' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3144; border-radius: 2px; }
        
        .msg-in { animation: slideIn 0.25s ease-out; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dot-pulse span {
          display: inline-block;
          width: 5px; height: 5px;
          background: #4f8ef7;
          border-radius: 50%;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .dot-pulse span:nth-child(2) { animation-delay: 0.2s; }
        .dot-pulse span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        .input-glow:focus {
          box-shadow: 0 0 0 2px rgba(79, 142, 247, 0.25);
        }

        .send-btn:not(:disabled):hover {
          box-shadow: 0 4px 20px rgba(79, 142, 247, 0.4);
          transform: translateY(-1px);
        }
        .send-btn { transition: all 0.2s ease; }

        .gemini-badge {
          background: linear-gradient(135deg, #4285f4 0%, #9b72cb 50%, #d96570 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Header */}
      <div
        className="border-b px-6 py-4 flex-shrink-0"
        style={{ background: '#0d1117', borderColor: '#1e2535' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg transition-colors text-gray-400 hover:text-white"
              style={{ background: '#1a1f2e' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)' }}
              >
                ✦
              </div>
              <div>
                <h1 className="text-sm font-600 text-white">AI Assistant</h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span className="text-xs text-gray-500">Powered by <span className="gemini-badge font-medium">Gemini</span></span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono text-xs px-2.5 py-1 rounded-md text-gray-500" style={{ background: '#1a1f2e' }}>
              {messages.length - 1} msgs
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`msg-in flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)' }}
                >
                  ✦
                </div>
              )}

              <div className="max-w-xl">
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'rounded-tr-sm text-white'
                      : 'rounded-tl-sm'
                  }`}
                  style={
                    message.role === 'user'
                      ? { background: '#1d4ed8' }
                      : { background: '#151b2a', border: '1px solid #1e2535', color: '#e2e8f0' }
                  }
                >
                  {renderMessage(message)}
                </div>
                <p className={`text-xs text-gray-600 mt-1.5 mono ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.role === 'user' && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs mt-0.5 text-gray-400"
                  style={{ background: '#1a1f2e', border: '1px solid #2a3144' }}
                >
                  {user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="msg-in flex gap-3 justify-start">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)' }}
              >
                ✦
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-tl-sm"
                style={{ background: '#151b2a', border: '1px solid #1e2535' }}
              >
                <div className="dot-pulse flex gap-1.5 items-center h-4">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        className="border-t px-4 py-4 flex-shrink-0"
        style={{ background: '#0d1117', borderColor: '#1e2535' }}
      >
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: '#151b2a', border: '1px solid #2a3144' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none py-1.5 px-1 input-glow"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="send-btn w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: input.trim() && !loading ? '#1d4ed8' : '#1a1f2e' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-700 mt-2 mono">
            gemini-1.5-flash · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}