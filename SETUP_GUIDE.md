# 🚀 Quick Start Setup Guide

This guide will help you get NexusAI Chatbot up and running in under 10 minutes.

## Step 1: Prerequisites Check ✅

Make sure you have:
- [ ] Node.js 18 or higher installed
- [ ] A code editor (VS Code recommended)
- [ ] Git installed
- [ ] A Supabase account (free tier works!)
- [ ] An OpenAI API key

## Step 2: Create Supabase Project 🗄️

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: nexusai-chatbot
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for project to initialize (2-3 minutes)

## Step 3: Set Up Database 📊

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run**
6. Wait for success message

## Step 4: Get Your API Keys 🔑

### Supabase Keys:
1. In Supabase, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon/public key** (looks like: eyJhbGc...)

### OpenAI Key:
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Log in or sign up
3. Click **Create new secret key**
4. Give it a name (e.g., "nexusai-chatbot")
5. Copy the key (starts with sk-...)
6. **Save it somewhere safe** - you can't see it again!

## Step 5: Clone and Install 💻

```bash
# Clone the project (or extract the ZIP)
cd nexusai-chatbot

# Install dependencies
npm install
```

## Step 6: Configure Environment Variables 🔧

1. In the project root, create a file named `.env.local`
2. Add these lines (replace with your actual keys):
 
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
OPENAI_API_KEY=sk-your_openai_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Important**: 
- Don't add quotes around the values
- Replace ALL placeholder text with your actual keys
- Save the file

## Step 7: Start the Development Server 🎬

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

## Step 8: Test the Application 🧪

1. Open your browser to `http://localhost:3000`
2. You should see the landing page
3. Click **"Try for Free"**
4. Create an account with:
   - Full Name: Test User
   - Work Email: test@company.com
   - Company Name: Test Company
   - Password: test123456
5. You'll be redirected to the dashboard!

## Step 9: Configure Your First Endpoint 🔗

1. In the dashboard, click **"Configure Endpoints"**
2. Click **"Add New Endpoint"**
3. Fill in:
   - **Endpoint Name**: products
   - **Endpoint URL**: https://fakestoreapi.com/products
   - **Type**: products
4. Click **"Add Endpoint"**
5. Success! Your endpoint is configured

## Step 10: Test the Chatbot 💬

1. Go back to the dashboard
2. Click **"AI Assistant Preview"** or the **Edit** link
3. Try typing: "Show me products" or "I want to see products"
4. The chatbot should fetch and display products!

## Common Issues & Solutions 🔧

### "Invalid API Key" Error
- Double-check your OpenAI API key
- Make sure it starts with `sk-`
- Verify you have credits in your OpenAI account

### "Cannot connect to Supabase" Error
- Verify your Supabase URL is correct
- Check that the anon key is copied completely
- Ensure your Supabase project is active

### Database Errors
- Re-run the `supabase-schema.sql` script
- Check that all tables were created (users, api_endpoints, chat_logs)
- Verify RLS policies are enabled

### Chatbot Not Responding
- Check browser console for errors (F12)
- Verify endpoint URLs are accessible
- Try refreshing the page

### Port 3000 Already in Use
```bash
# Use a different port
npm run dev -- -p 3001
```

## Next Steps 🎯

Now that your chatbot is running:

1. ✅ Customize the appearance in `tailwind.config.js`
2. ✅ Add more endpoints for your business needs
3. ✅ Test the embed code on a local HTML file
4. ✅ Deploy to Vercel for production use

## Need Help? 🆘

- Check the main README.md for detailed documentation
- Review the code comments for explanations
- Open an issue on GitHub

---

**Congratulations! 🎉** You now have a fully functional AI chatbot platform!
