'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage, ApiEndpoint } from '@/types';

export default function EmbedChatbot({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [companyName, setCompanyName] = useState('TechFlow Support');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();
    fetchEndpoints();
  }, [userId]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: `Welcome to ${companyName}. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('company_name')
        .eq('id', userId)
        .single();

      if (data) {
        setCompanyName(data.company_name || 'Support');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const { data, error } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('user_id', userId);

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
      const intent = detectIntent(input);
      
      if (intent) {
        const loadingMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Fetching ${intent}...`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, loadingMessage]);

        const data = await fetchDataFromEndpoint(intent);

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
            content: `I'm sorry, I couldn't fetch the ${intent} information. Please try again later.`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        const genericResponse: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'I understand you have a question. Could you please be more specific? You can ask me about products, services, or company information.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, genericResponse]);
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
        
        if (Array.isArray(data)) {
          return (
            <div className="space-y-3">
              <p className="text-sm mb-3">Here are the available products:</p>
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
    <div className="fixed bottom-5 right-5 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[360px] h-[600px] bg-dark-200 rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-dark-100 px-6 py-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold">{companyName}</h3>
                <p className="text-xs text-green-400">● Online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-dark-100 border border-gray-800'
                  }`}
                >
                  {renderMessage(message)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
                <div className="bg-dark-100 border border-gray-800 rounded-xl px-4 py-2">
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

          {/* Input */}
          <div className="px-6 py-4 border-t border-gray-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-dark-100 border border-gray-700 focus:border-primary text-white px-4 py-2 rounded-lg outline-none text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary hover:bg-blue-600 rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110"
      >
        <span className="text-2xl">{isOpen ? '✕' : '💬'}</span>
      </button>
    </div>
  );
}
