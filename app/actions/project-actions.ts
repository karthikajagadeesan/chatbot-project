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
