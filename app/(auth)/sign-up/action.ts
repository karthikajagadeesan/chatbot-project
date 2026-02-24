'use server'
import { createServer } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import { cookies } from "next/headers";
import type { Tables } from "@/type/database-type";

export async function signUpUser({
    first_name,
    last_name,
    phone_no,
    email,
    password,
}: {
    first_name: string;
    last_name: string;
    phone_no: string;
    email: string;
    password: string;
}): Promise<Response<Tables<'users'>>> {
    try {
        const supabase = await createServer(cookies());

        // 1. Create auth user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name,
                    last_name,
                    phone_no,
                },
            },
        });

        if (error || !data.user) {
            throw new Error(error?.message || "Failed to create account");
        }

        // 2. Insert profile row into users table
        const { data: userData, error: userError } = await supabase
            .from("users")
            .insert({
                auth_id: data.user.id,
                first_name,
                last_name,
                phone_no,
                email,
            })
            .select("*")
            .maybeSingle();

        if (userError || !userData) {
            // Rollback: remove the auth user if the DB insert fails
            await supabase.auth.admin.deleteUser(data.user.id);
            return {
                success: false,
                message: userError?.message || "Failed to save user profile",
            };
        }

        return {
            success: true,
            message: "Account created successfully",
            data: userData,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Something went wrong",
        };
    }
}