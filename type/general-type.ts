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