-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create agents table
CREATE TABLE IF NOT EXISTS chatbot_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    config JSONB DEFAULT '{
      "primaryColor": "#3b82f6",
      "welcomeMessage": "Hello! How can I help you today?",
      "botName": "AI Assistant"
    }'::jsonb,
    allowed_domains TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS chatbot_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agent_id UUID REFERENCES chatbot_agents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE chatbot_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_documents ENABLE ROW LEVEL SECURITY;

-- Note: Ensure tenant_id corresponds to auth.uid() in your Supabase setup
CREATE POLICY tenant_isolation_chatbot_agents ON chatbot_agents
    FOR ALL USING (auth.uid() = tenant_id);

CREATE POLICY tenant_isolation_chatbot_documents ON chatbot_documents
    FOR ALL USING (auth.uid() = tenant_id);

-- RPC for similarity search
CREATE OR REPLACE FUNCTION match_chatbot_documents(
    query_embedding VECTOR(768),
    filter_agent_id UUID,
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM chatbot_documents d
    WHERE d.agent_id = filter_agent_id
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
