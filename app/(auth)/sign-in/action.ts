'use server'
import { createServer } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";
import type { Tables } from "@/type/database-type";

export async function signInAdmin({ email, password }: { email: string; password: string }): Promise<Response<Tables<'users'>>> {
    try {
        const supabase = await createServer(cookies());

        // Step 1: Authenticate with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Provide clear messages for common auth errors
            if (error.message.toLowerCase().includes("email not confirmed")) {
                return {
                    success: false,
                    message: "Please confirm your email before signing in. Check your inbox.",
                };
            }
            if (error.message.toLowerCase().includes("invalid login credentials")) {
                return {
                    success: false,
                    message: "Invalid email or password. Please try again.",
                };
            }
            return {
                success: false,
                message: error.message,
            };
        }

        if (!data.user) {
            return {
                success: false,
                message: "Something went wrong. Please try again.",
            };
        }

        // Step 2: Fetch user profile from users table
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("auth_id", data.user.id)
            .maybeSingle();

        if (userError) {
            await supabase.auth.signOut();
            return {
                success: false,
                message: userError.message || "Failed to load user profile.",
            };
        }

        if (!userData) {
            await supabase.auth.signOut();
            return {
                success: false,
                message: "No user profile found. Please sign up first.",
            };
        }

        return {
            success: true,
            message: "Signed in successfully",
            data: userData,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        };
    }
}

export async function signInSuperAdmin({ email, password }: { email: string; password: string }): Promise<Response<any>> {
    try {
        const supabase = await createServer(cookies());

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return {
                success: false,
                message: error.message,
            };
        }

        if (!data.user) {
            return {
                success: false,
                message: "Something went wrong. Please try again.",
            };
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

        if (!superAdminData.status) {
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