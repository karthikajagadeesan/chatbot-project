'use server'
import { createServer, createAdmin } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";
import type { Tables } from "@/type/database-type";

// ── Auth Actions (User) ────────────────────────────────────────────────────────


// ── Auth Actions (SuperAdmin) ──────────────────────────────────────────────────

export async function signInSuperAdmin({ email, password }: { email: string; password: string }): Promise<Response<any>> {
    try {
        const supabase = await createServer(cookies());

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        if (!data.user) {
            return { success: false, message: "Something went wrong. Please try again." };
        }

        const { data: superAdminData, error: superAdminError } = await (supabase
            .from("super_admins" as any)
            .select("*")
            .eq("auth_id", data.user.id)
            .maybeSingle() as any);

        if (superAdminError || !superAdminData) {
            await supabase.auth.signOut();
            return {
                success: false,
                code: Number(superAdminError?.code) || 0,
                message: superAdminError?.message || "Something went wrong",
            };
        }

        if (!superAdminData?.status) {
            await supabase.auth.signOut();
            return {
                success: false,
                message: "Your account is disabled. Contact support for more details.",
            };
        }

        return {
            success: true,
            message: "Signed in successfully",
            data: superAdminData,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        };
    }
}

export async function SignOut(): Promise<Response<string>> {
    const supabase = await createServer(cookies());
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, message: error.message || "Failed to sign out" };
    return { success: true, message: "Sign out successfully" };
}

// ── Session Getters ────────────────────────────────────────────────────────────

export async function getUserSession(): Promise<Response<Tables<'users'>>> {
    const supabase = await createServer(cookies());
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { success: false, message: error?.message || "Failed to get user" };

    const { data, error: userError } = await (supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .maybeSingle() as any);

    if (userError) return { success: false, message: userError.message || "Failed to get user profile" };
    return { success: true, data: data as Tables<'users'>, message: "Session retrieved successfully" };
}

export async function getSuperAdminSession(): Promise<Response<any>> {
    const supabase = await createServer(cookies());
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { success: false, message: error?.message || "Failed to get user" };
    const { data, error: superadminError } = await supabase.from("super_admins" as any).select("*").eq("auth_id", user.id).maybeSingle();
    if (superadminError) return { success: false, message: superadminError.message || "Failed to get superadmin profile" };
    return { success: true, data, message: "Session retrieved successfully" };
}
