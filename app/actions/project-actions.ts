'use server'
import { createServer } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";
import type { Tables } from "@/type/database-type";

// ── Project Actions ────────────────────────────────────────────────────────────

export async function createProjectAction({ name, targetUrl }: { name: string; targetUrl: string }): Promise<Response<Tables<'projects'>>> {
    try {
        const supabase = await createServer(cookies());
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: "Unauthorized. Please log in." };
        }

        const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).single();

        if (!userData) {
            return { success: false, message: "User profile not found." };
        }

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                target_url: targetUrl,
                user_id: userData.id,
            })
            .select('*')
            .single();

        if (error) {
            return { success: false, message: error.message || "Failed to create project" };
        }

        return { success: true, message: "Project created successfully", data };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

export async function getProjectsAction(): Promise<Response<Tables<'projects'>[]>> {
    try {
        const supabase = await createServer(cookies());
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: "Unauthorized. Please log in." };
        }

        const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).single();

        if (!userData) {
            return { success: false, message: "User profile not found." };
        }

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, message: error.message || "Failed to fetch projects" };
        }

        return { success: true, message: "Projects retrieved successfully", data };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

export async function getSuperAdminProjectsAction(): Promise<Response<Tables<'projects'>[]>> {
    try {
        const supabase = await createServer(cookies());
        // For SuperAdmin, we might verify their role first, but for now we fetch all
        // RLS should ideally be bypassed via service_role OR Superadmin has special RLS bypass.
        // If the query fails due to RLS, it means the logged-in user isn't allowed to see all.
        const { data, error } = await supabase
            .from('projects')
            .select('*, users(first_name, last_name, email)')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, message: error.message || "Failed to fetch all projects" };
        }

        return { success: true, message: "All projects retrieved successfully", data };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

export async function deleteProjectAction(projectId: string): Promise<Response<null>> {
    try {
        const supabase = await createServer(cookies());
        // RLS will ensure they only delete their own
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) {
            return { success: false, message: error.message || "Failed to delete project" };
        }

        return { success: true, message: "Project deleted successfully", data: null };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

export async function updateProjectAction(projectId: string, updates: Partial<Tables<'projects'>>): Promise<Response<Tables<'projects'>>> {
    try {
        const supabase = await createServer(cookies());
        // RLS will ensure they only update their own
        const { data, error } = await supabase
            .from('projects')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', projectId)
            .select('*')
            .single();

        if (error) {
            return { success: false, message: error.message || "Failed to update project" };
        }

        return { success: true, message: "Project updated successfully", data };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

export async function checkProjectCompletenessAction(projectId: string): Promise<Response<{ isComplete: boolean; missing: string[] }>> {
    try {
        const supabase = await createServer(cookies());

        // 1. Check for active agent config
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('active_agent_config_id')
            .eq('id', projectId)
            .single();

        if (projectError) throw new Error(projectError.message);

        // 2. Check for knowledge base content (processed chunks)
        const { count: chunkCount, error: countError } = await supabase
            .from('content_chunks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        if (countError) throw new Error(countError.message);

        // 3. Check for scraped endpoints (to see if they just need to train)
        const { count: endpointCount, error: endpointError } = await supabase
            .from('scraped_endpoints')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        if (endpointError) throw new Error(endpointError.message);

        const missing = [];
        if (!project.active_agent_config_id) missing.push("Agent Configuration");

        if (!chunkCount || chunkCount === 0) {
            if (endpointCount && endpointCount > 0) {
                missing.push("Knowledge Base Training (Train Agent)");
            } else {
                missing.push("Knowledge Base Content (Scan Website)");
            }
        }

        return {
            success: true,
            message: "Completeness check performed",
            data: {
                isComplete: missing.length === 0,
                missing
            }
        };
    } catch (error: any) {
        return { success: false, message: error.message || "An unexpected error occurred" };
    }
}

