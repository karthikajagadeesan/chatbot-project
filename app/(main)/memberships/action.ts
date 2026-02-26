'use server'

import { createServer } from "@/utils/supabase"
import { cookies } from "next/headers"
import { Tables } from "@/type/database-type";


//--------superadmin---------//

export async function fetchSuperadminAppSettings() {
    const supabase = await createServer(cookies());
    const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();
    if (error) throw new Error(error.message) || "Failed to fetch app settings"
    return data
}

export async function updateSuperadminAppSettings(data: Tables<"app_settings">) {
    const supabase = await createServer(cookies());
    const { error } = await supabase.from("app_settings").update(data).eq("id", data.id);
    if (error) throw new Error(error.message) || "Failed to update app settings"
    return { success: true }
}


