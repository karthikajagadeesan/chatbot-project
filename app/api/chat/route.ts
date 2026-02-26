import { openai as openaiProvider, createOpenAI } from "@ai-sdk/openai"
import { google as googleProvider, createGoogleGenerativeAI } from "@ai-sdk/google"
import { anthropic as anthropicProvider, createAnthropic } from "@ai-sdk/anthropic"
import { createGroq } from "@ai-sdk/groq"
import { streamText, embed, convertToModelMessages } from "ai"
import { createServer } from "@/utils/supabase/server"
import { cookies } from "next/headers"
import type { AgentProvider } from "@/type/general-type"

export const maxDuration = 60

export async function POST(req: Request) {
    try {
        const { messages, projectId } = await req.json()

        if (!projectId) {
            return new Response("Missing projectId", { status: 400 })
        }

        const supabase = await createServer(cookies())

        // 1. Fetch project to get active_agent_config_id and target_url
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, active_agent_config_id, target_url")
            .eq("id", projectId)
            .single()

        if (projectError || !project) {
            return new Response("Project not found", { status: 404 })
        }

        // ── Domain allowlist: only our app + project's target_url may call this ──
        const origin = req.headers.get("origin") ?? ""
        if (origin) {
            const allowedHosts = new Set<string>(["localhost", "127.0.0.1"])
            const appUrl = process.env.NEXT_PUBLIC_APP_URL
            if (appUrl) {
                try { allowedHosts.add(new URL(appUrl).hostname) } catch { /* ignore */ }
            }
            if (project.target_url) {
                try { allowedHosts.add(new URL(project.target_url).hostname) } catch { /* ignore */ }
            }
            const requestHost = new URL(origin).hostname
            const isAllowed = [...allowedHosts].some(
                h => requestHost === h || requestHost.endsWith(`.${h}`)
            )
            if (!isAllowed) {
                return new Response("Domain not authorised for this project", { status: 403 })
            }
        }
        // ────────────────────────────────────────────────────────────────────

        // 2. Fetch active agent config row
        type AgentConfigRow = {
            id: string; provider: string; model: string; base_prompt: string | null;
            openai_api_key: string | null; gemini_api_key: string | null;
            anthropic_api_key: string | null; groq_api_key: string | null;
            embedding_api_key: string | null;
        }
        let agentConfigRow: AgentConfigRow | null = null
        if (project.active_agent_config_id) {
            const { data } = await supabase
                .from("agent_configs")
                .select("id, provider, model, base_prompt, openai_api_key, gemini_api_key, anthropic_api_key, groq_api_key, embedding_api_key")
                .eq("id", project.active_agent_config_id)
                .single()
            agentConfigRow = data as AgentConfigRow | null
        }

        const basePrompt = agentConfigRow?.base_prompt || "You are a helpful A.I. assistant. Answer strictly using the provided context."
        const provider: AgentProvider = (agentConfigRow?.provider as AgentProvider) || "openai"
        const modelStr: string = agentConfigRow?.model || "gpt-4o-mini"
        const userApiKey: string | undefined = (agentConfigRow?.[`${provider}_api_key` as keyof AgentConfigRow] as string) || undefined
        const embeddingApiKey: string | undefined = agentConfigRow?.embedding_api_key || undefined

        // 2. Build the AI language model (BYOK: use user's key if provided, else platform key)
        let aiModel;
        if (provider === "openai") {
            const sdk = userApiKey ? createOpenAI({ apiKey: userApiKey }) : openaiProvider
            aiModel = sdk(modelStr)
        } else if (provider === "gemini") {
            const sdk = userApiKey ? createGoogleGenerativeAI({ apiKey: userApiKey }) : googleProvider
            aiModel = sdk(modelStr)
        } else if (provider === "anthropic") {
            const sdk = userApiKey ? createAnthropic({ apiKey: userApiKey }) : anthropicProvider
            aiModel = sdk(modelStr)
        } else if (provider === "groq") {
            const sdk = createGroq({ apiKey: userApiKey || process.env.GROQ_API_KEY || "" })
            aiModel = sdk(modelStr)
        } else {
            aiModel = openaiProvider("gpt-4o-mini")
        }

        // 3. Extract user query for RAG embedding
        const lastMessage = messages[messages.length - 1]
        let userQuery = ""
        if (typeof lastMessage?.content === "string") {
            userQuery = lastMessage.content
        } else if (Array.isArray(lastMessage?.parts)) {
            userQuery = lastMessage.parts
                .filter((p: any) => p.type === "text")
                .map((p: any) => p.text)
                .join(" ")
        } else if (typeof lastMessage?.text === "string") {
            userQuery = lastMessage.text
        } else {
            userQuery = JSON.stringify(lastMessage)
        }

        // 4. Generate embedding — uses same provider logic as ingest-actions for consistency
        let embedding: number[] = []
        try {
            let embeddingModel;
            if (provider === "gemini") {
                // Gemini — use user's main key or platform env key
                const googleSdk = userApiKey
                    ? createGoogleGenerativeAI({ apiKey: userApiKey })
                    : googleProvider
                const embedFn = googleSdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof googleSdk.textEmbeddingModel>
                embeddingModel = embedFn("gemini-embedding-001", { outputDimensionality: 1536 })
            } else if (provider === "groq" || provider === "anthropic") {
                // Groq/Anthropic: check dedicated embedding_api_key first
                if (embeddingApiKey) {
                    if (embeddingApiKey.startsWith("AIza")) {
                        // Google key
                        const sdk = createGoogleGenerativeAI({ apiKey: embeddingApiKey })
                        const embedFn = sdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof sdk.textEmbeddingModel>
                        embeddingModel = embedFn("gemini-embedding-001", { outputDimensionality: 1536 })
                    } else {
                        // OpenAI key
                        const sdk = createOpenAI({ apiKey: embeddingApiKey })
                        embeddingModel = sdk.embedding("text-embedding-3-small")
                    }
                } else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
                    // Fall back to platform Google key
                    const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
                    const embedFn = sdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof sdk.textEmbeddingModel>
                    embeddingModel = embedFn("gemini-embedding-001", { outputDimensionality: 1536 })
                } else {
                    // Last resort: platform OpenAI key
                    embeddingModel = openaiProvider.embedding("text-embedding-3-small")
                }
            } else {
                // OpenAI: use user's key or platform key
                const openaiSdk = userApiKey ? createOpenAI({ apiKey: userApiKey }) : openaiProvider
                embeddingModel = openaiSdk.embedding("text-embedding-3-small")
            }

            if (embeddingModel) {
                const result = await embed({ model: embeddingModel, value: userQuery })
                // Normalize to 1536 dims — Gemini returns 3072; truncation preserves quality (Matryoshka)
                embedding = result.embedding.length > 1536 ? result.embedding.slice(0, 1536) : result.embedding
            }
        } catch {
            // Embedding failed — continue without RAG context
        }

        // 5. Search vector store (only if embedding succeeded)
        let chunks: { content: string; endpoint_id: string | null }[] = []
        if (embedding.length > 0) {
            // Fetch approved endpoint IDs for this project first
            const { data: approvedEndpoints } = await supabase
                .from("scraped_endpoints")
                .select("id")
                .eq("project_id", projectId)
                .eq("is_approved", true)

            const approvedIds = new Set((approvedEndpoints ?? []).map((e) => e.id))

            const { data } = await supabase.rpc("match_chunks", {
                query_embedding: JSON.stringify(embedding),
                match_count: 10, // fetch more so filtering still yields ~5 good results
                match_project_id: projectId,
            })

            // Only keep chunks from approved endpoints
            // Chunks with null endpoint_id are manually added content — always allowed
            chunks = (data ?? []).filter(
                (c: { endpoint_id: string | null }) =>
                    c.endpoint_id === null || approvedIds.has(c.endpoint_id)
            ).slice(0, 5)
        }

        // 6. Build system prompt with retrieved context
        const contextStr = chunks.length > 0
            ? chunks.map((c: any) => c.content).join("\n\n---\n\n")
            : "No relevant context found in the knowledge base."

        const systemPrompt = `${basePrompt}

CONTEXT INFORMATION:
==================
${contextStr}
==================

INSTRUCTIONS:
- Use the CONTEXT INFORMATION above to answer the user's question.
- Do not say "Based on the provided context...". Just answer directly.
- If the answer is not in the context, say you don't have that information.`

        // 7. Convert UIMessage[] → ModelMessage[] (required by ai@6)
        const modelMessages = await convertToModelMessages(messages)

        // 8. Stream response
        try {
            const result = streamText({
                model: aiModel,
                system: systemPrompt,
                messages: modelMessages,
            })
            return result.toUIMessageStreamResponse()
        } catch (streamErr: any) {
            const msg = streamErr?.message || "AI provider error"
            if (streamErr?.statusCode === 429 || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                return new Response("API quota exceeded. Please check your provider billing.", { status: 429 })
            }
            return new Response(msg, { status: 500 })
        }
    } catch (error: any) {
        console.error("[CHAT API] Error:", error?.message)
        return new Response(error.message || "An unexpected error occurred", { status: 500 })
    }
}
