'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { ChatMessage, ApiEndpoint } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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

  const detectIntent = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('product') || lowerMessage.includes('show') || lowerMessage.includes('see')) {
      return 'products';
    }
    if (lowerMessage.includes('about') || lowerMessage.includes('company') || lowerMessage.includes('who')) {
      return 'about';
    }
    if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
      return 'services';
    }
    
    return null;
  };

  const fetchDataFromEndpoint = async (intent: string) => {
    const endpoint = endpoints.find(ep => ep.endpoint_type === intent);
    
    if (!endpoint) {
      return null;
    }

    try {
      const response = await fetch(endpoint.endpoint_url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching from endpoint:', error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

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
      // Detect intent
      const intent = detectIntent(input);
      
      if (intent) {
        // Show loading message
        const loadingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Fetching ${intent}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);

        // Fetch data from configured endpoint
        const data = await fetchDataFromEndpoint(intent);

        // Remove loading message
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));

        if (data) {
          const responseMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: JSON.stringify(data),
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, responseMessage]);
        } else {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `I'm sorry, I couldn't fetch the ${intent} data. Please make sure you have configured the endpoint in the dashboard.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Call AI API for general conversation
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            userMessage: input,
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        const { message } = await response.json();

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
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
        
        // If it's an array of products
        if (Array.isArray(data)) {
          return (
            <div className="space-y-3">
              <p className="text-sm mb-3">Here are the products:</p>
              <div className="grid grid-cols-2 gap-3">
                {data.slice(0, 4).map((product: any) => (
                  <div
                    key={product.id}
                    className="bg-dark-300 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">
                        {product.title}
                      </h4>
                      <p className="text-primary font-bold text-sm">
                        ${product.price}
                      </p>
                      <button className="w-full mt-2 bg-primary text-white text-xs py-2 rounded-lg hover:bg-blue-600 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      } catch (error) {
        // If parsing fails, show as text
      }
    }
    
    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>;
  };

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col">
      {/* Header */}
      <div className="bg-dark-200 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <span>←</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold">AI Assistant</h1>
              <p className="text-sm text-gray-400">Test your chatbot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Today</span>
            <button className="p-2 hover:bg-dark-100 rounded-lg transition-colors">
              <span className="text-xl">⋮</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🤖</span>
                </div>
              )}
              
              <div
                className={`max-w-2xl rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-dark-200 border border-gray-800'
                }`}
              >
                {renderMessage(message)}
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">👤</span>
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🤖</span>
              </div>
              <div className="bg-dark-200 border border-gray-800 rounded-2xl px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-dark-200 border-t border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <button
              type="button"
              className="p-3 hover:bg-dark-100 rounded-lg transition-colors"
            >
              <span className="text-xl">🎤</span>
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-dark-100 border border-gray-700 focus:border-primary text-white px-4 py-3 rounded-lg outline-none transition-all"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">→</span>
            </button>
          </form>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Powered by <span className="text-primary">Chatbot</span>
          </p>
        </div>
      </div>
    </div>
  );
}
