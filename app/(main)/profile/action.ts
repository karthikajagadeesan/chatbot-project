'use server'

import { createServer } from "@/utils/supabase"
import { cookies } from "next/headers"
import type { TablesUpdate } from "@/type/database-type"

export interface ProfileFormValues {
    first_name: string
    last_name: string
    phone_no?: string
}

export async function updateUserProfile(values: ProfileFormValues) {
    try {
        if (!values.first_name?.trim()) {
            return { success: false, error: "First name is required" }
        }
        if (!values.last_name?.trim()) {
            return { success: false, error: "Last name is required" }
        }

        const supabase = await createServer(cookies())
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
            return { success: false, error: "Not authenticated" }
        }

        const payload: TablesUpdate<'users'> = {
            first_name: values.first_name.trim(),
            last_name: values.last_name.trim(),
            phone_no: values.phone_no?.trim() || null,
            updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
            .from("users")
            .update(payload)
            .eq("auth_id", authUser.id)

        if (error) throw new Error(error.message)

        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile"
        return { success: false, error: message }
    }
}
