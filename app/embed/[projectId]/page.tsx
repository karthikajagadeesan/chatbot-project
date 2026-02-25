import EmbedChatInterface from "./embed-client"
import { createServer } from "@/utils/supabase/server"
import { cookies } from "next/headers"

interface Props {
    params: {
        projectId: string
    }
}

export default async function EmbedRoute({ params }: Props) {
    const supabase = await createServer(cookies())

    // Ensure project exists and get config
    const { data: project } = await supabase
        .from("projects")
        .select("name, agent_config")
        .eq("id", params.projectId)
        .single()

    if (!project) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground p-4 text-center text-sm border shadow-xl rounded-xl">
                Chatbot unavailable or deleted.
            </div>
        )
    }

    const config = (project.agent_config as Record<string, any>) || {}
    const primaryColor = config.primary_color || "hsl(var(--primary))"
    const botName = config.bot_name || "AI Support"

    return (
        <EmbedChatInterface
            projectId={params.projectId}
            botName={botName}
            primaryColor={primaryColor}
        />
    )
}
