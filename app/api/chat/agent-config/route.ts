import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.SUPABASE_SECRET_KEY!;
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

/**
 * GET /api/chat/agent-config?agentId=xxx
 *
 * Returns { primaryColor, botName, welcomeMessage } for the widget.
 * Called every 10 s by the widget so branding changes reflect without reload.
 * Response is intentionally not cached (no-store) so fresh data is returned.
 */
export async function GET(req: NextRequest) {
    const agentId = req.nextUrl.searchParams.get("agentId");
    if (!agentId) {
        return NextResponse.json({}, { status: 400 });
    }

    const supabase = createAdminClient();

    // Try chatbot_agents first (used by the embed page & chat API)
    const { data: agentRow } = await (supabase.from("chatbot_agents" as any) as any)
        .select("config")
        .eq("id", agentId)
        .maybeSingle();

    if (agentRow?.config) {
        return NextResponse.json(agentRow.config, {
            headers: { "Cache-Control": "no-store" },
        });
    }

    // Fallback: agents table (used by the admin agents/action.ts)
    const { data: adminRow } = await (supabase.from("agents" as any) as any)
        .select("config")
        .eq("id", agentId)
        .maybeSingle();

    return NextResponse.json(adminRow?.config ?? {}, {
        headers: { "Cache-Control": "no-store" },
    });
}