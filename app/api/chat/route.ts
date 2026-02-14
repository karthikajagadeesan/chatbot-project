import { google } from "@ai-sdk/google";
import { streamText, embed } from "ai";
import { createClient } from "@/utils/supabase/server";

export const runtime = "edge";

export async function POST(req: Request) {
    try {
        const { messages, agentId } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        const supabase = await createClient();

        // 1. Fetch Agent configuration
        const { data: agent, error: agentError } = await (supabase
            .from("chatbot_agents" as any) as any)
            .select("*")
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            return new Response("Agent not found", { status: 404 });
        }

        // Security: Check allowed domains
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");
        const allowedDomains = (agent as any).allowed_domains || [];

        if (allowedDomains.length > 0 && origin) {
            const isAllowed = allowedDomains.some((d: string) => origin.includes(d) || (referer && referer.includes(d)));
            if (!isAllowed) {
                return new Response("Unauthorized domain", { status: 403 });
            }
        }

        // 2. Generate embedding for the user query
        const { embedding } = await embed({
            model: google.textEmbeddingModel("text-embedding-004"),
            value: lastMessage,
        });

        // 3. Search for relevant context using match_chatbot_documents RPC
        const { data: documents, error: searchError } = await (supabase.rpc as any)(
            "match_chatbot_documents",
            {
                query_embedding: embedding,
                filter_agent_id: agentId,
                match_threshold: 0.5,
                match_count: 5,
            }
        );

        if (searchError) {
            console.error("Search Error:", searchError);
        }

        const context = (documents as any[])
            ?.map((doc: any) => doc.content)
            .join("\n\n---\n\n") || "No relevant context found.";

        // 4. Stream response from Gemini
        const result = streamText({
            model: google("gemini-1.5-flash"),
            system: `You are ${(agent as any).config?.botName || "AI Assistant"}. 
      Use the following context to answer the user's questions. 
      If you don't know the answer based on the context, say that you don't know, but try to be helpful. 
      Context:
      ${context}`,
            messages,
        });

        return (result as any).toDataStreamResponse();
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
