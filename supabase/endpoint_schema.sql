-- ─── Configure Page: Endpoint Configuration Schema ──────────────────────────
-- Run this in your Supabase SQL editor

-- Stores the base URL configurations entered by users
create table if not exists endpoint_configs (
    id          uuid primary key default gen_random_uuid(),
    base_url    text not null,
    full_url    text not null unique,          -- unique constraint used for upsert
    status      text not null default 'active', -- 'active' | 'disabled'
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Stores each endpoint discovered by scraping a config URL
create table if not exists scraped_endpoints (
    id            uuid primary key default gen_random_uuid(),
    config_id     uuid not null references endpoint_configs(id) on delete cascade,
    url           text not null,
    label         text not null,              -- pathname e.g. /users
    method        text not null default 'GET',
    status        text not null default 'FOUND', -- 'FOUND' | 'SCANNING' | 'ERROR'
    source_url    text,
    discovered_at timestamptz not null default now(),
    created_at    timestamptz not null default now(),
    unique (url, config_id)                   -- prevent duplicates per config
);

-- Index for fast lookups by config
create index if not exists idx_scraped_endpoints_config_id
    on scraped_endpoints(config_id);

-- Auto-update updated_at on endpoint_configs
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_endpoint_configs_updated_at on endpoint_configs;
create trigger set_endpoint_configs_updated_at
    before update on endpoint_configs
    for each row execute function update_updated_at_column();

-- RLS Policies (adjust based on your auth setup)
alter table endpoint_configs enable row level security;
alter table scraped_endpoints enable row level security;

-- Allow authenticated users to manage their own configs
-- (Replace with your own policy logic as needed)
create policy "Authenticated users can read endpoint_configs"
    on endpoint_configs for select
    to authenticated using (true);

create policy "Authenticated users can insert endpoint_configs"
    on endpoint_configs for insert
    to authenticated with check (true);

create policy "Authenticated users can update endpoint_configs"
    on endpoint_configs for update
    to authenticated using (true);

create policy "Authenticated users can delete endpoint_configs"
    on endpoint_configs for delete
    to authenticated using (true);

create policy "Authenticated users can read scraped_endpoints"
    on scraped_endpoints for select
    to authenticated using (true);

create policy "Authenticated users can insert scraped_endpoints"
    on scraped_endpoints for insert
    to authenticated with check (true);

create policy "Authenticated users can update scraped_endpoints"
    on scraped_endpoints for update
    to authenticated using (true);

create policy "Authenticated users can delete scraped_endpoints"
    on scraped_endpoints for delete
    to authenticated using (true);