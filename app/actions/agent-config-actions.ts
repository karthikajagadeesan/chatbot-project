'use server'

import { createServer } from "@/utils/supabase";
import { cookies } from "next/headers";
import type { Response, ProjectAgentConfig } from "@/type/general-type";

/** List all agent configs for a project */
export async function getAgentConfigsAction(projectId: string): Promise<Response<ProjectAgentConfig[]>> {
    try {
        const supabase = await createServer(cookies());
        const { data, error } = await supabase
            .from("agent_configs")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: true });
        if (error) return { success: false, message: error.message };
        return { success: true, data: data as ProjectAgentConfig[] };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}

/** Create a new agent config for a project */
export async function createAgentConfigAction(
    projectId: string,
    payload: Partial<Omit<ProjectAgentConfig, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<Response<ProjectAgentConfig>> {
    try {
        const supabase = await createServer(cookies());
        const { data, error } = await supabase
            .from("agent_configs")
            .insert({ project_id: projectId, ...payload })
            .select("*")
            .single();
        if (error) return { success: false, message: error.message };
        return { success: true, data: data as ProjectAgentConfig };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}

/** Update an existing agent config */
export async function updateAgentConfigAction(
    configId: string,
    payload: Partial<Omit<ProjectAgentConfig, 'id' | 'project_id' | 'created_at' | 'updated_at'>>
): Promise<Response<ProjectAgentConfig>> {
    try {
        const supabase = await createServer(cookies());
        const { data, error } = await supabase
            .from("agent_configs")
            .update(payload)
            .eq("id", configId)
            .select("*")
            .single();
        if (error) return { success: false, message: error.message };
        return { success: true, data: data as ProjectAgentConfig };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}

/** Delete an agent config */
export async function deleteAgentConfigAction(configId: string): Promise<Response<null>> {
    try {
        const supabase = await createServer(cookies());
        const { error } = await supabase
            .from("agent_configs")
            .delete()
            .eq("id", configId);
        if (error) return { success: false, message: error.message };
        return { success: true, data: null };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}

/** Set the active agent config for a project */
export async function setActiveAgentConfigAction(
    projectId: string,
    configId: string
): Promise<Response<null>> {
    try {
        const supabase = await createServer(cookies());
        const { error } = await supabase
            .from("projects")
            .update({ active_agent_config_id: configId })
            .eq("id", projectId);
        if (error) return { success: false, message: error.message };
        return { success: true, data: null };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}

/** Get the active agent config for a project (used by chat + ingest routes) */
export async function getActiveAgentConfigAction(projectId: string): Promise<Response<ProjectAgentConfig | null>> {
    try {
        const supabase = await createServer(cookies());
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("active_agent_config_id")
            .eq("id", projectId)
            .single();
        if (projectError || !project) return { success: false, message: "Project not found" };
        if (!project.active_agent_config_id) return { success: true, data: null };

        const { data, error } = await supabase
            .from("agent_configs")
            .select("*")
            .eq("id", project.active_agent_config_id)
            .single();
        if (error) return { success: false, message: error.message };
        return { success: true, data: data as ProjectAgentConfig };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : "Unknown error" };
    }
}
