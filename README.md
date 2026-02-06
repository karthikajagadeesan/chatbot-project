# NexusAI - AI Chatbot SaaS Platform

A production-ready, reusable AI Chatbot platform built with Next.js 14, TypeScript, Tailwind CSS, Supabase, and OpenAI. This SaaS application allows companies to embed an intelligent chatbot on their websites that can understand user intent and fetch data from configured API endpoints.

## 🚀 Features

- **🔐 Authentication**: Secure email/password authentication with Supabase
- **💬 AI-Powered Chatbot**: Intelligent conversation using OpenAI GPT
- **🔗 Dynamic API Integration**: Configure custom endpoints for products, services, and more
- **📊 Dashboard**: Real-time analytics and chatbot management
- **🎨 Beautiful UI**: Modern, responsive design matching the provided mockups
- **🔧 Endpoint Configuration**: Easy-to-use interface for managing API endpoints
- **👤 Account Management**: User profile and data visualization
- **📱 Embeddable Widget**: iframe-based chatbot that works on any website
- **🎯 Intent Detection**: Automatically detects user intent and fetches relevant data
- **📦 Product Display**: Rich product cards within the chat interface

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-3.5-turbo
- **Styling**: Tailwind CSS with custom dark theme

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API key
- Git installed

## 🏗️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nexusai-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase-schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### For End Users (Companies)

1. **Sign Up**
   - Click "Try for Free" on the landing page
   - Fill in your details (name, email, company name, password)
   - You'll be redirected to the dashboard

2. **Configure API Endpoints**
   - Go to Dashboard → API Endpoints
   - Click "Add New Endpoint"
   - Enter:
     - Endpoint Name (e.g., "products")
     - Endpoint URL (e.g., "https://fakestoreapi.com/products")
     - Type (products, about, services, or other)
   - Click "Add Endpoint"

3. **Test Your Chatbot**
   - Click "AI Assistant Preview" on the dashboard
   - Try asking: "Show me products" or "I want to see products"
   - The chatbot will fetch and display data from your configured endpoint

4. **Embed on Your Website**
   - Copy the embed code from the dashboard
   - Paste it before the closing `</body>` tag on your website
   - The chatbot will appear as a floating icon on your site

5. **View Account Data**
   - Click "Trigger Manual Crawl" or navigate to Account page
   - See all products and data fetched from your endpoints
   - Edit your profile information

### Key Features Explained

#### Intent Detection
The AI automatically detects what users are looking for:
- Keywords like "product", "show", "see" → fetches products
- Keywords like "about", "company", "who" → fetches about info
- Keywords like "service", "offer" → fetches services

#### Dynamic Data Display
When the chatbot fetches products, it displays them as interactive cards with:
- Product image
- Title and description
- Price
- "View Details" button

#### Endpoint Management
- Add unlimited endpoints
- Edit or delete existing endpoints
- Trigger manual data refresh
- View API logs

## 🗂️ Project Structure

```
nexusai-chatbot/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # AI chat endpoint
│   │   └── endpoints/
│   │       └── route.ts          # Endpoint CRUD operations
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx         # Login page
│   │   └── signup/
│   │       └── page.tsx         # Sign up page
│   ├── dashboard/
│   │   ├── chat/
│   │   │   └── page.tsx         # AI chat interface
│   │   ├── endpoints/
│   │   │   └── page.tsx         # Endpoint configuration
│   │   └── page.tsx             # Main dashboard
│   ├── account/
│   │   └── page.tsx             # User account & data view
│   ├── embed/
│   │   └── [userId]/
│   │       └── page.tsx         # Embeddable chatbot widget
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── lib/
│   └── supabase.ts              # Supabase client
├── types/
│   └── index.ts                 # TypeScript types
├── supabase-schema.sql          # Database schema
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🎨 Design System

### Colors
- **Primary**: `#4F7CFF` (Blue)
- **Dark Backgrounds**: 
  - `#0F1219` (Darkest)
  - `#141824` (Medium)
  - `#1A1D29` (Lightest)

### Components
- Cards with rounded corners and borders
- Gradient backgrounds for hero sections
- Smooth hover transitions
- Emoji icons for visual appeal

## 🔒 Security Features

- Row Level Security (RLS) enabled on all tables
- User data isolated per account
- Secure authentication with Supabase
- Environment variables for sensitive data
- API key protection

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📊 Database Tables

### users
- `id` (UUID, primary key)
- `email` (TEXT, unique)
- `company_name` (TEXT)
- `created_at` (TIMESTAMP)

### api_endpoints
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `endpoint_name` (TEXT)
- `endpoint_url` (TEXT)
- `endpoint_type` (TEXT)
- `created_at` (TIMESTAMP)

### chat_logs (optional)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `message` (TEXT)
- `response` (TEXT)
- `timestamp` (TIMESTAMP)

## 🐛 Troubleshooting

### Chatbot not appearing on embedded site
- Ensure the iframe code is pasted correctly
- Check that the user ID in the iframe URL is correct
- Verify CORS settings if needed

### Data not fetching
- Verify endpoint URLs are accessible
- Check API endpoint configuration
- Look at browser console for errors

### Authentication issues
- Verify Supabase credentials
- Check that the database schema is set up correctly
- Ensure RLS policies are enabled

## 📝 License

MIT License - feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and Supabase
