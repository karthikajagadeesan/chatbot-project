'use server'

import { createServer } from "@/utils/supabase"
import { cookies } from "next/headers"

//--------superadmin---------//

export async function fetchSuperadminAppSettings() {
    const supabase = await createServer(cookies());
    const { data, error } = await supabase.from("app_settings").select("*").maybeSingle();
    console.log(error)
    if (error) throw new Error(error.message) || "Failed to fetch app settings"
    return data
}

export async function updateSuperadminAppSettings(data: any) {
    const supabase = await createServer(cookies());
    const { error } = await supabase.from("app_settings").update(data).eq("id", data.id);
    if (error) throw new Error(error.message) || "Failed to update app settings"
    return { success: true }
}

//--------user---------//

export async function fetchUserProfile() {
    const supabase = await createServer(cookies());

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Failed to fetch user");

    const meta = user.user_metadata ?? {};

    return {
        full_name:     meta.full_name     ?? "",
        email:         user.email         ?? "",
        behavior_type: meta.behavior_type ?? "friendly",
        custom_prompt: meta.custom_prompt ?? "",
        avatar_url:    meta.avatar_url    ?? "",
    };
}

export async function updateUserProfile(payload: {
    full_name:     string;
    email:         string;
    behavior_type: string;
    custom_prompt: string;
    avatar_url?:   string;
}) {
    const supabase = await createServer(cookies());

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
        data: {
            full_name:     payload.full_name,
            behavior_type: payload.behavior_type,
            custom_prompt: payload.custom_prompt,
            ...(payload.avatar_url !== undefined && { avatar_url: payload.avatar_url }),
        },
    };

    if (payload.email && payload.email !== user.email) {
        updates.email = payload.email;
    }

    const { error } = await supabase.auth.updateUser(updates);
    if (error) throw new Error(error.message || "Failed to update profile");

    return { success: true };
}

// ── Photo upload ──────────────────────────────────────────────────────────────
// Uploads a base64-encoded file to the "avatars" storage bucket and returns
// the public URL. The file is stored as  avatars/<userId>/avatar.<ext>
// so each upload overwrites the previous one (no orphaned files).
export async function uploadProfilePhoto(payload: {
    base64:    string;   // pure base64 string, no data-URL prefix
    mimeType:  string;   // e.g. "image/jpeg"
    extension: string;   // e.g. "jpg"
}) {
    const supabase = await createServer(cookies());

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Decode base64 → Buffer
    const buffer = Buffer.from(payload.base64, "base64");

    const filePath = `${user.id}/avatar.${payload.extension}`;

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, buffer, {
            contentType: payload.mimeType,
            upsert: true,          // overwrite if file already exists
        });

    if (uploadError) throw new Error(uploadError.message || "Failed to upload photo");

    // Get a permanent public URL
    const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) throw new Error("Failed to get public URL");

    // Bust CDN cache by appending a timestamp query param
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    // Persist the URL into user metadata
    const { error: metaError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
    });
    if (metaError) throw new Error(metaError.message || "Failed to save avatar URL");

    return { success: true, avatarUrl };
}

// ── Photo remove ──────────────────────────────────────────────────────────────
export async function removeProfilePhoto() {
    const supabase = await createServer(cookies());

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const meta = user.user_metadata ?? {};

    // Try to delete every common extension variant so nothing is left behind
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    const paths = extensions.map((ext) => `${user.id}/avatar.${ext}`);

    // Ignore errors here — the file might not exist for some extensions
    await supabase.storage.from("avatars").remove(paths);

    // Clear avatar_url from metadata
    if (meta.avatar_url) {
        const { error: metaError } = await supabase.auth.updateUser({
            data: { avatar_url: "" },
        });
        if (metaError) throw new Error(metaError.message || "Failed to remove avatar");
    }

    return { success: true };
}