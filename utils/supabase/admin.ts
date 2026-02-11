import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/type/database-type";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

export const createAdmin = async (cookieStore: ReturnType<typeof cookies>) => {
    const cookieStoreResolved = await cookieStore;
    return createServerClient<Database>(supabaseUrl!, supabaseKey!, {
        cookies: {
            getAll() {
                return cookieStoreResolved.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStoreResolved.set(name, value, options),
                    );
                } catch {
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have middleware refreshing
                    // user sessions.
                }
            },
        },
    });
};
