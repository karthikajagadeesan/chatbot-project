# ✅ EmbedChat — Agentic Todo Task List
### Mapped to your existing Next.js 14 / Supabase / RoleGateway project structure

> **Convention Rules (follow throughout):**
> - All routes use `RoleGateway` → `superadmin.tsx` + `user.tsx` per page
> - State via Zustand stores in `store/user/` or `store/superadmin/`
> - Server mutations via `app/actions/`
> - DB types always extended in `type/database-type.ts`
> - No raw `any` types — strict TypeScript throughout
> - UI components via `shadcn/ui` from `components/ui/`

---

## 🗄️ PHASE 0 — Database & Types Foundation

### 0.1 — Supabase Schema

- [ ] Create `supabase/chatbot_schema.sql` — full schema for:
  - `projects` table (id, user_id, name, target_url, status, agent_config JSONB, embed_token, created_at)
  - `scraped_endpoints` table (id, project_id, url, type, status, is_approved, requires_auth, auth_type)
  - `endpoint_credentials` table (id, project_id, endpoint_id, auth_type, vault_secret_id)
  - `content_chunks` table (id, project_id, endpoint_id, content TEXT, embedding VECTOR(1536), metadata JSONB)
  - `chat_sessions` table (id, project_id, session_id, created_at)
  - `chat_messages` table (id, session_id, project_id, role, content, created_at)
  - `usage_logs` table (id, project_id, user_id, event_type, count, period_start)
- [ ] Create `supabase/endpoint_schema.sql` — endpoint discovery + credential tables
- [ ] Create `supabase/billing_schema.sql`:
  - `subscriptions` table (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
- [ ] Enable `pgvector` extension in Supabase dashboard
- [ ] Create vector similarity search function in SQL:
  ```sql
  CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding VECTOR(1536),
    project_id UUID,
    match_count INT DEFAULT 5
  ) RETURNS TABLE(...)
  ```
- [ ] Set Row Level Security (RLS) policies on ALL tables:
  - `projects`: user can only read/write their own
  - `content_chunks`: scoped to project owner
  - `chat_messages`: scoped to project owner
  - `subscriptions`: user can only read their own

### 0.2 — TypeScript Types

- [ ] Regenerate `type/database-type.ts` after schema push (`supabase gen types typescript`)
- [ ] Add to `type/general-type.ts`:
  ```ts
  export type PlanTier = 'free' | 'pro' | 'enterprise'
  export type ProjectStatus = 'pending' | 'scraping' | 'ready' | 'error'
  export type EndpointType = 'page' | 'rest_api' | 'graphql' | 'sitemap'
  export type AuthType = 'api_key' | 'bearer' | 'basic' | 'oauth2'
  export type AgentProvider = 'openai' | 'anthropic' | 'gemini'
  export type AgentTone = 'friendly' | 'professional' | 'technical' | 'casual'
  export interface AgentConfig {
    persona_name: string
    tone: AgentTone
    language: string
    fallback_message: string
    restricted_topics: string[]
    system_prompt_extra: string
    max_response_length: 'short' | 'medium' | 'long'
    show_sources: boolean
    greeting_message: string
    provider: AgentProvider
    model: string
    use_managed_key: boolean
  }
  ```

---

## 🔐 PHASE 1 — Auth & Role Setup

### 1.1 — Auth Routes (`app/(auth)/`)

- [ ] Verify sign-in page at `app/(auth)/sign-in/page.tsx`
- [ ] Verify sign-up page at `app/(auth)/sign-up/page.tsx`
- [ ] Add post-signup redirect logic:
  - New users → `user.yourdomain.com/onboarding`
  - Superadmin → `superadmin.yourdomain.com/dashboard`
- [ ] Add `app/actions/auth-actions.ts`:
  - `signInAction()`
  - `signUpAction()`
  - `signOutAction()`

### 1.2 — RoleGateway: Onboarding

- [ ] Create `app/(main)/onboarding/page.tsx`:
  ```tsx
  <RoleGateway user={<UserOnboarding />} />
  ```
- [ ] Create `app/(main)/onboarding/user.tsx` — multi-step onboarding:
  - Step 1: Profile name
  - Step 2: Create first project (enter website URL)
  - Step 3: Choose plan (Free / Pro / Enterprise)
- [ ] Create `store/user/onboarding-store.ts` — track step progress

---

## 📁 PHASE 2 — Projects Module

### 2.1 — Projects List Page

- [ ] Create `app/(main)/projects/page.tsx`:
  ```tsx
  <RoleGateway
    superadmin={<SuperAdminProjects />}
    user={<UserProjects />}
  />
  ```
- [ ] Create `app/(main)/projects/user.tsx` — project cards grid with status badge, embed button, settings link
- [ ] Create `app/(main)/projects/superadmin.tsx` — all projects across all users, with user info column
- [ ] Create `components/agents/project-card.tsx` — reusable project card component
- [ ] Create `app/actions/project-actions.ts`:
  - `createProjectAction(name, targetUrl)`
  - `deleteProjectAction(projectId)`
  - `updateProjectAction(projectId, data)`
  - `getProjectsAction()`

### 2.2 — Project Detail Page

- [ ] Create `app/(main)/projects/[id]/page.tsx`:
  ```tsx
  <RoleGateway
    superadmin={<SuperAdminProjectDetail />}
    user={<UserProjectDetail />}
  />
  ```
- [ ] Create `app/(main)/projects/[id]/user.tsx` — tabs: Overview, Scraping, Agent, Analytics, Embed
- [ ] Create `app/(main)/projects/[id]/superadmin.tsx` — same tabs + user info + override controls
- [ ] Create `store/user/project-store.ts`:
  - `currentProject`, `setCurrentProject()`
  - `projects[]`, `setProjects()`

---

## 🕷️ PHASE 3 — Scraper & Endpoint Discovery

### 3.1 — Scraping API

- [ ] Install deps: `playwright`, `cheerio`, `@extractus/article-extractor`
- [ ] Create `lib/scraper/crawler.ts`:
  - `crawlUrl(url: string, depth: number)` → returns `DiscoveredEndpoint[]`
  - Internal link follower (BFS up to depth 3)
  - Detect API patterns: `/api/*`, `/swagger.json`, `/openapi.yaml`, `/graphql`
- [ ] Create `lib/scraper/extractor.ts`:
  - `extractPageContent(url: string)` → clean text (strip nav/footer/ads)
  - `extractApiContent(url: string, credentials?)` → fetch JSON, flatten to text
- [ ] Create `app/api/scrape/discover/route.ts`:
  - `POST { projectId, url }` → runs crawler → returns endpoint list
- [ ] Create `app/api/scrape/run/route.ts`:
  - `POST { projectId, endpointIds }` → runs full scrape + embed pipeline
  - Uses SSE (`text/event-stream`) to stream progress updates

### 3.2 — Endpoint Discovery UI

- [ ] Create `app/(main)/projects/[id]/scraping/page.tsx`:
  ```tsx
  <RoleGateway user={<UserScrapingPage />} superadmin={<SuperAdminScrapingPage />} />
  ```
- [ ] Create `app/(main)/projects/[id]/scraping/user.tsx`:
  - Input field for URL + "Discover" button
  - Loading state while crawling
  - Endpoint checklist (select all / deselect / remove per item)
  - Type badges: `PAGE`, `REST API`, `GraphQL`
  - Credential modal (if API endpoint detected)
  - "Start Scraping" button with progress bar (SSE)
- [ ] Create `components/agents/endpoint-checklist.tsx` — reusable checklist UI
- [ ] Create `components/agents/credential-modal.tsx` — form for API key / bearer / basic auth / oauth2
- [ ] Create `app/actions/scraping-actions.ts`:
  - `saveApprovedEndpointsAction(projectId, endpoints)`
  - `saveCredentialsAction(projectId, endpointId, credentials)` — stores via Supabase Vault
  - `triggerScrapeAction(projectId)`
- [ ] Create `store/user/scraping-store.ts`:
  - `discoveredEndpoints[]`, `approvedEndpoints[]`
  - `scrapingProgress`, `scrapingStatus`
  - `setEndpointApproved()`, `removeEndpoint()`

### 3.3 — Embedding Pipeline

- [ ] Install deps: `openai`, `ai`, `@ai-sdk/openai`
- [ ] Create `lib/embeddings/chunker.ts`:
  - `chunkText(text: string, maxTokens: number, overlap: number)` → `string[]`
- [ ] Create `lib/embeddings/embedder.ts`:
  - `embedChunks(chunks: string[], projectId: string, endpointId: string)` → inserts to `content_chunks`
  - Uses `text-embedding-3-small`
- [ ] Create `lib/embeddings/retriever.ts`:
  - `retrieveRelevantChunks(query: string, projectId: string, topK: number)` → calls `match_chunks` RPC

---

## 🤖 PHASE 4 — AI Agent Configuration

### 4.1 — Agent Config UI

- [ ] Create `app/(main)/projects/[id]/agent/page.tsx`:
  ```tsx
  <RoleGateway user={<UserAgentConfig />} superadmin={<SuperAdminAgentConfig />} />
  ```
- [ ] Create `app/(main)/projects/[id]/agent/user.tsx` with sections:
  - **Provider Section:** Radio: "Use my own API key" | "Use managed plan (Pro/Enterprise)"
    - If BYOK: dropdown (OpenAI / Anthropic / Gemini) + API key input + model selector
    - If managed: show plan requirement notice if on Free
  - **Behavior Section:** Form fields for `AgentConfig` (persona name, tone, language, fallback message, restricted topics, system prompt extra, max response length, show sources, greeting message)
  - **Test Chat:** Inline chat box to test agent before going live
- [ ] Create `components/agents/agent-behavior-form.tsx` — reusable behavior config form
- [ ] Create `components/agents/test-chat-panel.tsx` — in-dashboard chat test UI
- [ ] Create `app/actions/agent-actions.ts`:
  - `saveAgentConfigAction(projectId, agentConfig)`
  - `saveProviderKeyAction(projectId, provider, apiKey)` → encrypt via Vault
- [ ] Create `store/user/agent-store.ts`:
  - `agentConfig`, `setAgentConfig()`
  - `selectedProvider`, `apiKeyInput`

### 4.2 — Vercel AI SDK RAG Chat API

- [ ] Install deps: `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`
- [ ] Create `lib/ai/model-factory.ts`:
  ```ts
  export function getModel(provider: AgentProvider, apiKey: string, model: string)
  // returns openai('gpt-4o') | anthropic('claude-3-5-sonnet') | google('gemini-1.5-pro')
  ```
- [ ] Create `lib/ai/prompt-builder.ts`:
  - `buildSystemPrompt(agentConfig: AgentConfig, chunks: string[])` → full system prompt string
- [ ] Create `app/api/chat/[projectId]/route.ts`:
  - `POST { messages, sessionId }`
  - Validate project + check usage quota
  - Embed user message → retrieve top-K chunks
  - Build system prompt
  - `streamText()` via Vercel AI SDK
  - Log message to `chat_messages`
  - Increment `usage_logs`
  - Return streaming response

---

## 💳 PHASE 5 — Subscription & Billing

### 5.1 — Stripe Setup

- [ ] Install: `stripe`, `@stripe/stripe-js`
- [ ] Create Stripe products + prices in dashboard (Free / Pro $29 / Enterprise $99)
- [ ] Add to `.env.local`:
  ```
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_PRO_PRICE_ID=
  STRIPE_ENTERPRISE_PRICE_ID=
  ```
- [ ] Create `lib/stripe/client.ts` — Stripe SDK instance
- [ ] Create `lib/stripe/plans.ts` — plan limits config:
  ```ts
  export const PLAN_LIMITS = {
    free:       { projects: 1, pages: 20,  messages: 500 },
    pro:        { projects: 5, pages: 200, messages: 10000 },
    enterprise: { projects: Infinity, pages: Infinity, messages: Infinity }
  }
  ```

### 5.2 — Billing API Routes

- [ ] Create `app/api/billing/checkout/route.ts` — create Stripe Checkout session
- [ ] Create `app/api/billing/portal/route.ts` — create Stripe Customer Portal session
- [ ] Create `app/api/webhooks/stripe/route.ts`:
  - Handle: `checkout.session.completed`
  - Handle: `customer.subscription.updated`
  - Handle: `customer.subscription.deleted`
  - Sync → update `subscriptions` + `users.plan` in Supabase

### 5.3 — Billing UI

- [ ] Create `app/(main)/settings/billing/page.tsx`:
  ```tsx
  <RoleGateway user={<UserBillingPage />} superadmin={<SuperAdminBillingPage />} />
  ```
- [ ] Create `app/(main)/settings/billing/user.tsx`:
  - Current plan badge
  - Usage meter (messages used / limit)
  - Plan comparison table
  - Upgrade button → Stripe Checkout
  - Manage subscription → Stripe Portal
- [ ] Create `app/(main)/settings/billing/superadmin.tsx`:
  - All users' subscriptions table
  - Revenue stats
  - Manual plan override
- [ ] Create `app/actions/billing-actions.ts`:
  - `createCheckoutSessionAction(planId)`
  - `createPortalSessionAction()`
- [ ] Create `store/user/billing-store.ts`:
  - `currentPlan`, `usageStats`, `subscriptionStatus`
- [ ] Add `helpers/plan-gate.tsx` — server component (similar to RoleGateway) that blocks features by plan:
  ```tsx
  <PlanGate required="pro" fallback={<UpgradePrompt />}>
    <ManagedAIOption />
  </PlanGate>
  ```

---

## 🔌 PHASE 6 — Embeddable Widget

### 6.1 — Widget Source

- [ ] Create `widget-src/` directory at root
- [ ] Create `widget-src/index.ts` — entry point
- [ ] Create `widget-src/ui.ts` — Shadow DOM chat popup (vanilla JS + CSS)
  - Floating button (bottom-right)
  - Chat panel with message list
  - Input box + send button
  - Streaming response handler (fetch + ReadableStream)
  - "Powered by EmbedChat" badge (conditionally shown)
- [ ] Create `widget-src/config.ts` — reads `data-project-id` from script tag
- [ ] Create `widget-src/api.ts` — calls `/api/chat/[projectId]` with streaming
- [ ] Configure `package.json` build script to bundle → `public/widget.js` (esbuild or tsup)

### 6.2 — Embed Route (in-app preview)

- [ ] Verify `app/embed/[agentId]/page.tsx` exists — full-page chat for iframe preview
- [ ] Style embed page to be standalone (no sidebar/header)
- [ ] Test embed page renders correctly in sandboxed iframe

### 6.3 — Embed Code Generator UI

- [ ] Create `components/agents/embed-code-panel.tsx`:
  - Shows the `<script>` tag with the project's `embed_token`
  - Copy to clipboard button
  - Integration guides: WordPress / Next.js / Webflow / Shopify tabs
  - Live preview button (opens embed page in modal)
- [ ] Add to `app/(main)/projects/[id]/user.tsx` "Embed" tab

---

## 📊 PHASE 7 — Analytics & Management

### 7.1 — Analytics Page

- [ ] Create `app/(main)/projects/[id]/analytics/page.tsx`:
  ```tsx
  <RoleGateway user={<UserAnalytics />} superadmin={<SuperAdminAnalytics />} />
  ```
- [ ] Create `app/(main)/projects/[id]/analytics/user.tsx`:
  - Messages per day chart (recharts or shadcn charts)
  - Top 10 questions asked
  - Unanswered / fallback triggered count
  - Last scraped timestamp per endpoint
- [ ] Create `app/api/analytics/[projectId]/route.ts` — aggregate from `chat_messages` + `usage_logs`

### 7.2 — Content Management

- [ ] Create `app/(main)/projects/[id]/content/page.tsx`:
  ```tsx
  <RoleGateway user={<UserContent />} superadmin={<SuperAdminContent />} />
  ```
- [ ] Create `app/(main)/projects/[id]/content/user.tsx`:
  - Table of scraped chunks (source URL, preview, scraped_at)
  - Search across chunks
  - Delete individual chunk
  - Re-scrape endpoint button
- [ ] Create `app/actions/content-actions.ts`:
  - `deleteChunkAction(chunkId)`
  - `rescrapeEndpointAction(endpointId)`

### 7.3 — SuperAdmin Dashboard

- [ ] Create `app/(main)/dashboard/superadmin.tsx`:
  - Total users, total projects, total messages (platform-wide)
  - New signups chart
  - Revenue summary (from Stripe)
  - Recent activity feed
- [ ] Create `app/(main)/dashboard/user.tsx`:
  - Projects list with quick stats
  - Usage meter
  - Quick action: "Create new project"

---

## 🔒 PHASE 8 — Security & Middleware

- [ ] Create `middleware.ts` at root:
  - Subdomain detection → set header for RoleGateway
  - Auth check → redirect to sign-in if unauthenticated
  - Plan enforcement → block routes if plan insufficient
- [ ] Add usage quota check in `app/api/chat/[projectId]/route.ts`:
  - Fetch current period message count from `usage_logs`
  - Compare against `PLAN_LIMITS[plan].messages`
  - Return 429 with upgrade prompt if exceeded
- [ ] Add CORS policy to `app/api/chat/[projectId]/route.ts`:
  - Allow only domains registered per project
- [ ] Verify Supabase Vault usage for all credentials:
  - `endpoint_credentials` — never store raw, always use Vault secret ID
  - Provider API keys — same pattern
- [ ] Verify all Stripe webhook handlers check `stripe.webhooks.constructEvent()` signature

---

## 🧪 PHASE 9 — Hooks & Utilities

- [ ] Create `hooks/use-project.ts` — fetch + subscribe to current project
- [ ] Create `hooks/use-scraping-progress.ts` — SSE listener for scraping status
- [ ] Create `hooks/use-chat.ts` — manage chat state for test panel + widget
- [ ] Create `hooks/use-plan.ts` — return current plan + limit helpers
- [ ] Create `utils/embed-token.ts` — generate + verify signed embed tokens (JWT)
- [ ] Create `utils/usage-tracker.ts` — increment usage_logs helper
- [ ] Create `helpers/plan-gate.tsx` — server component for plan-based rendering (as noted in Phase 5)

---

## 📦 PHASE 10 — Environment & Deployment

- [ ] Add all required env vars to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  OPENAI_API_KEY=               # for managed plan + embeddings
  ANTHROPIC_API_KEY=            # for managed plan
  GOOGLE_AI_API_KEY=            # for managed plan
  STRIPE_SECRET_KEY=
  STRIPE_WEBHOOK_SECRET=
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_PRO_PRICE_ID=
  STRIPE_ENTERPRISE_PRICE_ID=
  WIDGET_EMBED_BASE_URL=        # https://yourdomain.com
  EMBED_JWT_SECRET=             # for signing embed tokens
  ```
- [ ] Configure Vercel project:
  - Add all env vars
  - Add wildcard subdomain: `*.yourdomain.com`
  - Set `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL`
- [ ] Set up Stripe webhook endpoint pointing to `/api/webhooks/stripe`
- [ ] Run `supabase db push` to apply all schema migrations
- [ ] Build + bundle `widget-src/` → verify `public/widget.js` is generated

---

## ✅ Launch Checklist

- [ ] RLS policies tested for all tables (no cross-user data leaks)
- [ ] Widget tested on WordPress, Webflow, plain HTML
- [ ] Stripe subscription lifecycle tested (create, upgrade, cancel, webhook)
- [ ] Usage limits enforced correctly per plan
- [ ] Embedding + RAG pipeline tested end-to-end
- [ ] Mobile responsive for all dashboard pages
- [ ] SuperAdmin subdomain access completely hidden from user bundle (via RoleGateway)
- [ ] PlanGate blocks managed AI on Free plan
- [ ] All credentials encrypted — none stored in plaintext

---

*Task version 1.0 — Mapped to existing project structure*