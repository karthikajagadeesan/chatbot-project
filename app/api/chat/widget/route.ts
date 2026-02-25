import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

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
 * POST /api/chat/widget
 *
 * Powers the floating chatbot widget on ALL pages.
 *
 * - configure page  → useScrapedContext:true  → answers from scraped_endpoints
 * - agent page       → agentId provided       → answers from chatbot_documents
 *
 * Supports both GOOGLE_GENERATIVE_AI_API_KEY and GEMINI_API_KEY env var names.
 */
export async function POST(req: Request) {
    try {
        // ── Resolve API key (support both env var names) ─────────────────────
        const apiKey =
            process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
            process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    error:
                        "Google Generative AI API key is missing. " +
                        "Add GOOGLE_GENERATIVE_AI_API_KEY=your_key to .env.local",
                }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const { messages, agentId, useScrapedContext } = (await req.json()) as {
            messages: { role: string; content: string }[];
            agentId?: string;
            useScrapedContext?: boolean;
        };

        const supabase = createAdminClient();
        let systemPrompt = "";

        // ── Branch A: scraped endpoint context (configure page) ──────────────
        if (useScrapedContext || !agentId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: endpoints } = await (supabase.from("scraped_endpoints") as any)
                .select("url, label, scraped_content")
                .not("scraped_content", "is", null)
                .limit(20);

            let context = "No scraped endpoint data is available yet. Ask the user to save and scrape an endpoint first.";

            if (endpoints && endpoints.length > 0) {
                const parts: string[] = [
                    "=== SCRAPED ENDPOINT KNOWLEDGE BASE ===",
                    `Total endpoints: ${endpoints.length}`,
                    "",
                ];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                for (const ep of endpoints as any[]) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const sc = ep.scraped_content as any;
                    if (!sc) continue;
                    parts.push(`--- ${ep.label || ep.url} ---`);
                    const ct = String(sc.content_type ?? "");
                    if (ct === "openapi" || ct === "openapi_path") {
                        if (sc.title)         parts.push(`API Title: ${sc.title}`);
                        if (sc.description)   parts.push(`Description: ${sc.description}`);
                        if (sc.paths?.length) parts.push(`Paths: ${(sc.paths as string[]).join(", ")}`);
                        if (sc.methods?.length) parts.push(`Methods: ${(sc.methods as string[]).join(", ")}`);
                        if (sc.operations)    parts.push(`Operations:\n${JSON.stringify(sc.operations, null, 2).slice(0, 800)}`);
                    } else if (ct === "json") {
                        parts.push(`Keys: ${(sc.keys ?? []).join(", ")}`);
                        if (sc.raw_data) parts.push(`Data:\n${JSON.stringify(sc.raw_data, null, 2).slice(0, 1000)}`);
                    } else {
                        if (sc.page_title)         parts.push(`Page: ${sc.page_title}`);
                        if (sc.meta_description)   parts.push(`Meta: ${sc.meta_description}`);
                        if (sc.headings?.length)   parts.push(`Headings: ${(sc.headings as string[]).slice(0, 10).join(" | ")}`);
                        if (sc.body_text)          parts.push(`Content:\n${String(sc.body_text).slice(0, 2000)}`);
                        if (sc.api_paths_found?.length) parts.push(`API Paths: ${(sc.api_paths_found as string[]).join(", ")}`);
                    }
                    parts.push("");
                }
                context = parts.join("\n");
            }

            systemPrompt = `You are a helpful AI assistant for an API configuration tool.
Answer questions based ONLY on the scraped endpoint data provided below.
If the answer is not in the context, say: "I don't have that information in the scraped data."
Keep answers concise and technical.

${context}`;

        } else {
            // ── Branch B: chatbot_documents RAG (agent page) ──────────────────
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: agentRow } = await (supabase.from("chatbot_agents" as any) as any)
                .select("config")
                .eq("id", agentId)
                .maybeSingle();

            const botName = agentRow?.config?.botName ?? "AI Assistant";

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: docs } = await (supabase.from("chatbot_documents" as any) as any)
                .select("content")
                .eq("agent_id", agentId)
                .limit(10);

            const knowledge = (docs ?? [])
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((d: any) => d.content as string)
                .join("\n\n---\n\n") || "No documents in knowledge base yet.";

            systemPrompt = `You are ${botName}. Answer user questions using only the knowledge base below.
If you don't know, say so honestly. Be concise and helpful.

Knowledge Base:
${knowledge}`;
        }

        // ── Stream Gemini response (pass apiKey explicitly) ───────────────────
        const result = streamText({
            // The google() provider reads GOOGLE_GENERATIVE_AI_API_KEY automatically.
            // We also spread the apiKey explicitly so GEMINI_API_KEY works as fallback.
            model: google("gemini-1.5-flash", { apiKey } as Parameters<typeof google>[1]),
            system: systemPrompt,
            messages: messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (result as any).toDataStreamResponse();
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[/api/chat/widget]", message);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}