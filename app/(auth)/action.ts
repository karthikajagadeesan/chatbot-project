'use server'
import { createServer } from "@/utils/supabase"
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";

export async function SignOut(): Promise<Response<string>> {
    const supabase = await createServer(cookies());
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, message: error.message || "Failed to sign out" }
    return { success: true, message: "Sign out successfully" }
}

export async function getAdminSession() {
    const supabase = await createServer(cookies());
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { success: false, message: error?.message || "Failed to get user" }
    const { data, error: adminError } = await supabase.from("users").select("*").eq("auth_id", user.id).maybeSingle();
    if (adminError) return { success: false, message: adminError.message || "Failed to get admin" }
    return { success: true, data, message: "Session retrieved successfully" }
}

export async function getSuperAdminSession() {
    const supabase = await createServer(cookies());
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { success: false, message: error?.message || "Failed to get user" }
    const { data, error: superadminError } = await supabase.from("super_admins").select("*").eq("auth_id", user.id).maybeSingle();
    if (superadminError) return { success: false, message: superadminError.message || "Failed to get superadmin" }
    return { success: true, data, message: "Session retrieved successfully" }
}
