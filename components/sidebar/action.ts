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