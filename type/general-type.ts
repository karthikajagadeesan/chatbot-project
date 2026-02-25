export type Subdomain = "superadmin" | "user";

export type Response<T> = {
    success: boolean;
    message?: string;
    data?: T;
    code?: number;
};

export type AgentConfig = {
    primaryColor: string;
    welcomeMessage: string;
    botName: string;
    [key: string]: any;
};

export type Agent = {
    id: string;
    tenant_id: string;
    name: string;
    config: AgentConfig;
    allowed_domains: string[];
    created_at: string;
};

export type AgentDocument = {
    id: string;
    agent_id: string;
    tenant_id: string;
    content: string;
    embedding: number[] | null;
    metadata: {
        url?: string;
        title?: string;
        chunk_index?: number;
        [key: string]: any;
    };
    created_at: string;
};

// ── Chat / Embed types ────────────────────────────────────────────────────────

export type ChatMessage = {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
};

export type PreviewConfig = {
    primaryColor?: string;
    botName?: string;
    welcomeMessage?: string;
};

export type EmbedChatPageProps = {
    agentId?: string;
    isPreview?: boolean;
    previewConfig?: PreviewConfig;
};

export type MessageTimesMap = Record<string, string>;

// ── Phase 0 Types (EmbedChat) ──────────────────────────────────────────────────

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type ProjectStatus = 'pending' | 'scraping' | 'ready' | 'error';
export type EndpointType = 'page' | 'rest_api' | 'graphql' | 'sitemap';
export type AuthType = 'api_key' | 'bearer' | 'basic' | 'oauth2';
export type AgentProvider = 'openai' | 'anthropic' | 'gemini' | 'groq';
export type AgentTone = 'friendly' | 'professional' | 'technical' | 'casual';

export interface FullAgentConfig {
    persona_name: string;
    tone: AgentTone;
    language: string;
    fallback_message: string;
    restricted_topics: string[];
    system_prompt_extra: string;
    max_response_length: 'short' | 'medium' | 'long';
    show_sources: boolean;
    greeting_message: string;
    provider: AgentProvider;
    model: string;
    use_managed_key: boolean;
}

export interface ProjectAgentConfig {
    id: string;
    project_id: string;
    name: string;
    provider: AgentProvider;
    model: string;
    openai_api_key: string | null;
    gemini_api_key: string | null;
    anthropic_api_key: string | null;
    groq_api_key: string | null;
    embedding_api_key: string | null;
    base_prompt: string;
    created_at: string;
    updated_at: string;
}