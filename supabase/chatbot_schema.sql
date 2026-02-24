-- ============================================================
-- chatbot_schema.sql
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable pgvector for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── chatbot_agents ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_agents (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    name         TEXT NOT NULL,
    config       JSONB DEFAULT '{
        "primaryColor": "#3b82f6",
        "welcomeMessage": "Hello! How can I help you today?",
        "botName": "AI Assistant"
    }'::jsonb,
    allowed_domains TEXT[] DEFAULT '{}',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── chatbot_documents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chatbot_documents (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL,
    agent_id   UUID REFERENCES chatbot_agents(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    embedding  VECTOR(768),           -- Gemini text-embedding-004 dimension
    metadata   JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─── Indexes for performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chatbot_documents_agent_id
    ON chatbot_documents(agent_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_agents_tenant_id
    ON chatbot_agents(tenant_id);

-- IVFFlat index for fast approximate vector search
-- (Run after inserting at least a few rows for best results)
CREATE INDEX IF NOT EXISTS idx_chatbot_documents_embedding
    ON chatbot_documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE chatbot_agents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS tenant_isolation_chatbot_agents    ON chatbot_agents;
DROP POLICY IF EXISTS tenant_isolation_chatbot_documents ON chatbot_documents;

-- Service role (used by server actions) bypasses RLS automatically.
-- These policies apply to anon / authenticated roles only.
CREATE POLICY tenant_isolation_chatbot_agents
    ON chatbot_agents FOR ALL
    USING (auth.uid() = tenant_id);

CREATE POLICY tenant_isolation_chatbot_documents
    ON chatbot_documents FOR ALL
    USING (auth.uid() = tenant_id);

-- ─── RPC: Similarity Search ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_chatbot_documents(
    query_embedding  VECTOR(768),
    filter_agent_id  UUID,
    match_threshold  FLOAT,
    match_count      INT
)
RETURNS TABLE (
    id         UUID,
    content    TEXT,
    metadata   JSONB,
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
      AND d.embedding IS NOT NULL
      AND 1 - (d.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;