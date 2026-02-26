-- ─── Migration: Add scraped_content column ───────────────────────────────────
-- Run this in Supabase SQL editor AFTER the base endpoint_schema.sql

-- Add full scraped content column (JSONB) for chatbot knowledge base
alter table scraped_endpoints
    add column if not exists scraped_content jsonb default null;

-- Index for fast NOT NULL lookups (chatbot context queries)
create index if not exists idx_scraped_endpoints_has_content
    on scraped_endpoints(config_id)
    where scraped_content is not null;

-- Add method column if missing
alter table scraped_endpoints
    add column if not exists method text not null default 'GET';