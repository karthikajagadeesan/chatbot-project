import EmbedChatInterface from "./embed-client"
import { createAdmin } from "@/utils/supabase/admin"
import { cookies, headers } from "next/headers"

interface Props {
    params: Promise<{ projectId: string }>
}

/** Extract the hostname from any URL string — returns null on parse failure */
function hostname(url: string): string | null {
    try { return new URL(url).hostname } catch { return null }
}



export default async function EmbedRoute({ params }: Props) {
    const { projectId } = await params

    // Use admin client so this public embed route works regardless of RLS policies
    const supabase = await createAdmin(cookies())

    const { data: project } = await supabase
        .from("projects")
        .select("name, agent_config, target_url, status")
        .eq("id", projectId)
        .single()

    if (!project) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground p-4 text-center text-sm">
                Chatbot unavailable or deleted.
            </div>
        )
    }

    // ── Status-based origin restrictions ────────────────────────────────────
    const headerStore = await headers()
    const referer = headerStore.get("referer") ?? headerStore.get("referrer") ?? null
    const refererHost = hostname(referer ?? "")
    const status = project.status?.toLowerCase() || "pending"

    // Internal domains: app domain and localhost
    const internalHosts = new Set<string>()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl) {
        const h = hostname(appUrl)
        if (h) internalHosts.add(h)
    }
    internalHosts.add("localhost")
    internalHosts.add("127.0.0.1")

    const isInternal = referer ? [...internalHosts].some(h => refererHost === h || refererHost?.endsWith(`.${h}`)) : true

    // External domains: target_url
    const externalHosts = new Set<string>()
    if (project.target_url) {
        const h = hostname(project.target_url)
        if (h) externalHosts.add(h)
    }

    const isAuthorizedExternal = refererHost && [...externalHosts].some(h => refererHost === h || refererHost.endsWith(`.${h}`))

    // Restriction Logic:
    // 1. If Pending/Draft: Only allow internal
    // 2. If Live: Allow internal OR authorized external

    let isAllowed = false
    let reason = "Unauthorised Domain"
    let detail = "This chatbot is not authorised to run on this domain."

    if (status === "live") {
        if (isInternal || isAuthorizedExternal) {
            isAllowed = true
        } else {
            detail = `Update your project's Target URL to enable embedding on ${refererHost || "this domain"}.`
        }
    } else {
        // Pending or Draft
        if (isInternal) {
            isAllowed = true
        } else {
            reason = status === "draft" ? "Chatbot in Draft Mode" : "Configuration Required"
            detail = status === "draft"
                ? "This chatbot is currently in draft mode and cannot be embedded on external sites."
                : "Please complete your chatbot configuration to enable embedding on your domain."
        }
    }

    if (!isAllowed) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground p-4 text-center text-sm">
                <div className="max-w-xs space-y-2">
                    <p className="text-base font-semibold text-foreground">{reason}</p>
                    <p className="text-xs leading-relaxed">{detail}</p>
                </div>
            </div>
        )
    }
    // ────────────────────────────────────────────────────────────────────────

    const config = (project.agent_config as Record<string, string> | null) ?? {}
    const primaryColor = config.primary_color || "#6366f1"
    const botName = config.bot_name || "AI Support"
    const welcomeMessage = config.welcome_message || `Hi there! I'm ${botName}. How can I help you today?`
    const inputPlaceholder = config.input_placeholder || "Type your message..."
    const poweredByText = config.powered_by_text || "Powered by EmbedChat"

    return (
        <EmbedChatInterface
            projectId={projectId}
            botName={botName}
            primaryColor={primaryColor}
            welcomeMessage={welcomeMessage}
            inputPlaceholder={inputPlaceholder}
            poweredByText={poweredByText}
        />
    )
}
