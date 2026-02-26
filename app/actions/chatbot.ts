"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const agentSchema = z.object({
    name: z.string().min(1, "Name is required"),
    allowed_domains: z.array(z.string()).optional().default([]),
    config: z.record(z.string(), z.any()).optional().default({
        primaryColor: "#3b82f6",
        welcomeMessage: "Hello! How can I help you today?",
        botName: "AI Assistant"
    }),
});

export async function createAgent(formData: z.infer<typeof agentSchema>) {
    const supabase = await createClient();
    const { data: userData, error: userError } = await (supabase.auth as any).getUser();

    if (userError || !userData?.user) {
        return { success: false, message: "Unauthorized" };
    }

    const { data, error } = await (supabase
        .from("chatbot_agents" as any) as any)
        .insert({
            name: formData.name,
            tenant_id: userData.user.id,
            allowed_domains: formData.allowed_domains,
            config: formData.config,
        })
        .select()
        .single();

    if (error) {
        console.error("Error creating agent:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/agents");
    return { success: true, data };
}

export async function updateAgent(id: string, formData: Partial<z.infer<typeof agentSchema>>) {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from("chatbot_agents" as any) as any)
        .update(formData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating agent:", error);
        return { success: false, message: error.message };
    }

    revalidatePath(`/agents/${id}`);
    revalidatePath("/agents");
    return { success: true, data };
}

export async function deleteAgent(id: string) {
    const supabase = await createClient();

    const { error } = await (supabase
        .from("chatbot_agents" as any) as any)
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting agent:", error);
        return { success: false, message: error.message };
    }

    revalidatePath("/agents");
    return { success: true };
}

export async function getAgents() {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from("chatbot_agents" as any) as any)
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching agents:", error);
        return [];
    }

    return data;
}

export async function getAgent(id: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from("chatbot_agents" as any) as any)
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching agent:", error);
        return null;
    }

    return data;
}
