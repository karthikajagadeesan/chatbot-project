'use server'

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { Response, Agent } from "@/type/general-type";

// ── Admin Supabase client ─────────────────────────────────────────────────────

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SECRET_KEY;

    if (!url || !secretKey) {
        throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }

    return createClient(url, secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// ── GET AGENT ─────────────────────────────────────────────────────────────────

export async function getAgent(agentId: string): Promise<Agent | null> {
    try {
        if (!agentId) return null;

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("agents")
            .select("*")
            .eq("id", agentId)
            .single();

        if (error) {
            console.error("[getAgent]", error.message);
            return null;
        }

        return data as Agent;
    } catch (err) {
        console.error("[getAgent] exception:", err);
        return null;
    }
}

// ── LIST AGENTS ───────────────────────────────────────────────────────────────

export async function getAgents(): Promise<Agent[]> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("agents")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[getAgents]", error.message);
            return [];
        }

        return (data ?? []) as Agent[];
    } catch (err) {
        console.error("[getAgents] exception:", err);
        return [];
    }
}

// ── CREATE AGENT ──────────────────────────────────────────────────────────────

export async function createAgent(payload: {
    name: string;
    config?: Record<string, any>;
    allowed_domains?: string[];
}): Promise<Response<Agent>> {
    try {
        if (!payload.name?.trim()) {
            return { success: false, message: "Agent name is required." };
        }

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("agents")
            .insert({
                name: payload.name.trim(),
                config: payload.config ?? {
                    primaryColor: "#3b82f6",
                    botName: "AI Assistant",
                    welcomeMessage: "Hello! How can I help you today?",
                },
                allowed_domains: payload.allowed_domains ?? [],
            })
            .select()
            .single();

        if (error) {
            console.error("[createAgent]", error.message);
            return { success: false, message: error.message };
        }

        revalidatePath("/agents");
        return { success: true, message: "Agent created successfully.", data: data as Agent };
    } catch (err) {
        console.error("[createAgent] exception:", err);
        return { success: false, message: err instanceof Error ? err.message : "Unexpected error." };
    }
}

// ── UPDATE AGENT ──────────────────────────────────────────────────────────────
// Handles ALL updates: branding (name, colors, botName, welcomeMessage),
// allowed domains, and any future config keys.
// Live Preview on the configure page updates only when this is called (on Save).

export async function updateAgent(
    agentId: string,
    payload: {
        name?: string;
        allowed_domains?: string[];
        config?: {
            primaryColor?: string;
            botName?: string;
            welcomeMessage?: string;
            [key: string]: any;
        };
    }
): Promise<Response<Agent>> {
    try {
        if (!agentId) return { success: false, message: "Agent ID is required." };

        const supabase = createAdminClient();

        // Fetch existing agent so we can deep-merge config (preserve unrelated keys)
        const { data: existing, error: fetchError } = await supabase
            .from("agents")
            .select("config")
            .eq("id", agentId)
            .single();

        if (fetchError) {
            return { success: false, message: fetchError.message };
        }

        // Deep-merge: incoming config overrides matching keys, preserves the rest
        const mergedConfig = {
            ...(existing?.config ?? {}),
            ...(payload.config ?? {}),
        };

        const updatePayload: Record<string, any> = {
            config: mergedConfig,
            updated_at: new Date().toISOString(),
        };

        if (payload.name !== undefined) {
            if (!payload.name.trim()) {
                return { success: false, message: "Agent name cannot be empty." };
            }
            updatePayload.name = payload.name.trim();
        }

        if (payload.allowed_domains !== undefined) {
            updatePayload.allowed_domains = payload.allowed_domains;
        }

        const { data, error } = await supabase
            .from("agents")
            .update(updatePayload)
            .eq("id", agentId)
            .select()
            .single();

        if (error) {
            console.error("[updateAgent]", error.message);
            return { success: false, message: error.message };
        }

        // Revalidate SSR caches for the configure page and the embed (fullscreen) page
        revalidatePath(`/agents/${agentId}`);
        revalidatePath(`/embed/${agentId}`);

        return { success: true, message: "Agent updated successfully.", data: data as Agent };
    } catch (err) {
        console.error("[updateAgent] exception:", err);
        return { success: false, message: err instanceof Error ? err.message : "Unexpected error." };
    }
}

// ── UPDATE BRANDING ONLY (convenience wrapper) ────────────────────────────────
// Use when you only want to update visual/brand fields without touching
// domains or other top-level fields.

export async function updateAgentBranding(
    agentId: string,
    branding: {
        primaryColor?: string;
        botName?: string;
        welcomeMessage?: string;
    }
): Promise<Response<Agent>> {
    return updateAgent(agentId, { config: branding });
}

// ── UPDATE AGENT COLOR ────────────────────────────────────────────────────────
// Convenience: update only the primary color and immediately reflect in preview.

export async function updateAgentColor(
    agentId: string,
    primaryColor: string
): Promise<Response<Agent>> {
    return updateAgent(agentId, { config: { primaryColor } });
}

// ── DELETE AGENT ──────────────────────────────────────────────────────────────

export async function deleteAgent(agentId: string): Promise<Response<null>> {
    try {
        if (!agentId) return { success: false, message: "Agent ID is required." };

        const supabase = createAdminClient();

        // Delete associated documents first to avoid orphaned rows
        await supabase
            .from("chatbot_documents")
            .delete()
            .eq("agent_id", agentId);

        const { error } = await supabase
            .from("agents")
            .delete()
            .eq("id", agentId);

        if (error) {
            console.error("[deleteAgent]", error.message);
            return { success: false, message: error.message };
        }

        revalidatePath("/agents");
        return { success: true, message: "Agent deleted successfully.", data: null };
    } catch (err) {
        console.error("[deleteAgent] exception:", err);
        return { success: false, message: err instanceof Error ? err.message : "Unexpected error." };
    }
}