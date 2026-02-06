  -- Create users table
  CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
  );

  -- Create api_endpoints table
  CREATE TABLE IF NOT EXISTS public.api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    endpoint_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    endpoint_type TEXT NOT NULL CHECK (endpoint_type IN ('products', 'about', 'services', 'other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
  );

  -- Create chat_logs table (optional)
  CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
  );

  -- Enable Row Level Security
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

  -- Create policies for users table
  CREATE POLICY "Users can view their own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

  CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

  -- Create policies for api_endpoints table
  CREATE POLICY "Users can view their own endpoints"
    ON public.api_endpoints
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own endpoints"
    ON public.api_endpoints
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update their own endpoints"
    ON public.api_endpoints
    FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own endpoints"
    ON public.api_endpoints
    FOR DELETE
    USING (auth.uid() = user_id);

  -- Create policies for chat_logs table
  CREATE POLICY "Users can view their own chat logs"
    ON public.chat_logs
    FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can create their own chat logs"
    ON public.chat_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Create indexes for better performance
  CREATE INDEX idx_api_endpoints_user_id ON public.api_endpoints(user_id);
  CREATE INDEX idx_chat_logs_user_id ON public.chat_logs(user_id);
  CREATE INDEX idx_api_endpoints_type ON public.api_endpoints(endpoint_type);

  -- Function to automatically create user profile on signup
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, email, company_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company')
    );
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Trigger to call handle_new_user function
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
