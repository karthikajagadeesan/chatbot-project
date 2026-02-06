export interface User {
  id: string;
  email: string;
  company_name: string;
  created_at: string;
}

export interface ApiEndpoint {
  id: string;
  user_id: string;
  endpoint_name: string;
  endpoint_url: string;
  endpoint_type: 'products' | 'about' | 'services' | 'other';
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
}

export interface ChatbotConfig {
  userId: string;
  companyName: string;
  primaryColor: string;
  welcomeMessage: string;
  chatTitle: string;
  showLogo: boolean;
}
