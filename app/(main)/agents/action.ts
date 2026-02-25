'use server'

import { createClient } from "@supabase/supabase-js";
import type { Response, Agent, AgentConfig } from "@/type/general-type";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// GET ALL AGENTS
export async function getAgents(): Promise<Agent[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chatbot_agents")
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

// GET SINGLE AGENT
export async function getAgent(agentId: string): Promise<Agent | null> {
  try {
    if (!agentId) return null;
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chatbot_agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();

    if (error) {
      console.error("[getAgent]", error.message);
      return null;
    }
    return (data as Agent) ?? null;
  } catch (err) {
    console.error("[getAgent] exception:", err);
    return null;
  }
}

// CREATE AGENT
export async function createAgent(params: {
  name: string;
  tenant_id?: string;
  allowed_domains?: string[];
  config?: Partial<AgentConfig>;
}): Promise<Response<Agent>> {
  try {
    const { name, tenant_id, allowed_domains, config } = params;

    if (!name || !name.trim()) {
      return { success: false, message: "Agent name is required." };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chatbot_agents")
      .insert({
        name: name.trim(),
        tenant_id: tenant_id ?? DEFAULT_TENANT_ID,
        allowed_domains: allowed_domains ?? [],
        config: {
          primaryColor: "#3b82f6",
          welcomeMessage: "Hello! How can I help you today?",
          botName: "AI Assistant",
          ...(config ?? {}),
        },
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[createAgent]", error.message);
      return { success: false, message: error.message };
    }

    if (!data) {
      return { success: false, message: "No data returned after insert." };
    }

    return {
      success: true,
      message: "Agent created successfully.",
      data: data as Agent,
    };
  } catch (err) {
    console.error("[createAgent] exception:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}

// UPDATE AGENT
export async function updateAgent(
  agentId: string,
  updates: {
    name?: string;
    allowed_domains?: string[];
    config?: Partial<AgentConfig>;
  }
): Promise<Response<Agent>> {
  try {
    if (!agentId) return { success: false, message: "Agent ID required." };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chatbot_agents")
      .update(updates)
      .eq("id", agentId)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("[updateAgent]", error.message);
      return { success: false, message: error.message };
    }

    if (!data) {
      return { success: false, message: "Agent not found." };
    }

    return { success: true, message: "Agent updated.", data: data as Agent };
  } catch (err) {
    console.error("[updateAgent] exception:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}

// DELETE AGENT
export async function deleteAgent(agentId: string): Promise<Response<null>> {
  try {
    if (!agentId) return { success: false, message: "Agent ID required." };

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("chatbot_agents")
      .delete()
      .eq("id", agentId);

    if (error) {
      console.error("[deleteAgent]", error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: "Agent deleted.", data: null };
  } catch (err) {
    console.error("[deleteAgent] exception:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}