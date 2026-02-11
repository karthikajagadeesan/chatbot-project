'use server'
import { createServer } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";
import type { Tables } from "@/type/database-type";

export async function signInAdmin({ email, password }: { email: string, password: string }): Promise<Response<Tables<'users'>>> {
    try {
        const supabase = await createServer(cookies());
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.user) throw new Error(error?.message || "Something went wrong");
        else {
            const { data: adminData, error: adminError } = await supabase.from("users").select("*").eq("auth_id", data.user.id).maybeSingle();
            if (adminError || !adminData) {
                await supabase.auth.signOut();
                return {
                    success: false,
                    code: Number(adminError?.code) || 0,
                    message: adminError?.message || "Something went wrong",
                };
            }
            else {

                return {
                    success: true,
                    message: "Signed in successfully",
                    data: adminData,
                };
            }
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        };
    }

}

export async function signInSuperAdmin({ email, password }: { email: string, password: string }): Promise<Response<Tables<'super_admins'>>> {
    try {
        const supabase = await createServer(cookies());
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.user) throw new Error(error?.message || "Something went wrong");
        else {
            const { data: superAdminData, error: superAdminError } = await supabase.from("super_admins").select("*").eq("auth_id", data.user.id).maybeSingle();
            if (superAdminError || !superAdminData) {
                await supabase.auth.signOut();
                return {
                    success: false,
                    code: Number(superAdminError?.code) || 0,
                    message: superAdminError?.message || "Something went wrong",
                };
            }
            else if (!superAdminData.status) {
                await supabase.auth.signOut();
                return {
                    success: false,
                    message: "Your account is disabled. Contact support for more details.",
                };
            }
            else {

                return {
                    success: true,
                    message: "Signed in successfully",
                    data: superAdminData,
                };
            }
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        };
    }

}