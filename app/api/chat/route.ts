import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

// ─── Fetch scraped endpoint knowledge from DB ─────────────────────────────────
async function getScrapedContext(): Promise<string> {
    try {
        const sb = getAdminClient();
        const { data } = await sb
            .from("scraped_endpoints" as any)
            .select("url, label, scraped_content")
            .not("scraped_content", "is", null)
            .limit(20) as any;

        if (!data?.length) return "";

        const lines: string[] = ["=== KNOWLEDGE BASE ===", ""];
        for (const row of data) {
            const sc = row.scraped_content;
            if (!sc) continue;
            lines.push(`[${row.label}] ${row.url}`);
            const ct: string = sc.content_type ?? "";
            if (ct === "openapi" || ct === "openapi_path") {
                if (sc.title)           lines.push(`Title: ${sc.title}`);
                if (sc.description)     lines.push(`Desc: ${sc.description}`);
                if (sc.paths?.length)   lines.push(`Paths: ${sc.paths.join(", ")}`);
                if (sc.operations)      lines.push(`Ops: ${JSON.stringify(sc.operations).slice(0, 600)}`);
            } else if (ct === "json") {
                if (sc.raw_data)        lines.push(`Data: ${JSON.stringify(sc.raw_data).slice(0, 1000)}`);
            } else {
                if (sc.page_title)      lines.push(`Title: ${sc.page_title}`);
                if (sc.body_text)       lines.push(`Content: ${sc.body_text.slice(0, 1500)}`);
                if (sc.headings?.length) lines.push(`Headings: ${sc.headings.slice(0, 8).join(" | ")}`);
            }
            lines.push("");
        }
        return lines.join("\n");
    } catch {
        return "";
    }
}

// ─── Fetch RAG context from chatbot_documents ─────────────────────────────────
async function getAgentContext(agentId: string, query: string): Promise<string> {
    try {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

        const embedRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: query }] },
                }),
            }
        );
        if (!embedRes.ok) return "";

        const embedJson = await embedRes.json();
        const embedding: number[] = embedJson?.embedding?.values ?? [];
        if (!embedding.length) return "";

        const sb = getAdminClient();
        const { data } = await (sb.rpc as any)("match_chatbot_documents", {
            query_embedding: embedding,
            filter_agent_id: agentId,
            match_threshold: 0.5,
            match_count: 5,
        });

        if (!data?.length) return "";
        return (data as any[]).map((d: any) => d.content).join("\n\n---\n\n");
    } catch {
        return "";
    }
}

// ─── Call Gemini and stream back tokens ───────────────────────────────────────
// Uses the Google REST API directly — zero dependency on the `ai` npm package.
// Emits tokens in Vercel AI data-stream format so chatbot-widget can parse them.
async function geminiStream(
    systemPrompt: string,
    messages: { role: string; content: string }[]
): Promise<Response> {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not set" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    // Filter out empty messages and convert roles
    const contents = messages
        .filter((m) => m.content?.trim())
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

    // Gemini requires alternating user/model turns — deduplicate consecutive same roles
    const normalized: { role: string; parts: { text: string }[] }[] = [];
    for (const turn of contents) {
        const last = normalized[normalized.length - 1];
        if (last && last.role === turn.role) {
            // Merge consecutive same-role messages
            last.parts[0].text += "\n" + turn.parts[0].text;
        } else {
            normalized.push({ ...turn, parts: [{ text: turn.parts[0].text }] });
        }
    }

    // Must start with a user turn
    if (!normalized.length || normalized[0].role !== "user") {
        normalized.unshift({ role: "user", parts: [{ text: "Hello" }] });
    }

    const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: normalized,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    let geminiRes: Response;
    try {
        geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            }
        );
    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: `Failed to reach Gemini: ${e.message}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!geminiRes.ok) {
        const txt = await geminiRes.text().catch(() => "");
        return new Response(
            JSON.stringify({ error: `Gemini ${geminiRes.status}: ${txt.slice(0, 300)}` }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const reader = geminiRes.body!.getReader();
            let buf = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buf += decoder.decode(value, { stream: true });

                    const lines = buf.split("\n");
                    buf = lines.pop() ?? "";          // keep incomplete last line

                    for (const line of lines) {
                        if (!line.startsWith("data:")) continue;
                        const raw = line.replace(/^data:\s*/, "").trim();
                        if (!raw || raw === "[DONE]") continue;
                        try {
                            const chunk = JSON.parse(raw);
                            const token: string =
                                chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                            if (token) {
                                // Vercel AI data-stream protocol: "0:<json-string>\n"
                                controller.enqueue(encoder.encode(`0:${JSON.stringify(token)}\n`));
                            }
                        } catch { /* skip malformed */ }
                    }
                }
                // flush remaining buffer
                if (buf.startsWith("data:")) {
                    const raw = buf.replace(/^data:\s*/, "").trim();
                    if (raw && raw !== "[DONE]") {
                        try {
                            const chunk = JSON.parse(raw);
                            const token: string =
                                chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
                            if (token) controller.enqueue(encoder.encode(`0:${JSON.stringify(token)}\n`));
                        } catch { /* skip */ }
                    }
                }
            } catch (err) {
                controller.error(err);
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Vercel-AI-Data-Stream": "v1",
            "Cache-Control": "no-cache, no-transform",
            "Transfer-Encoding": "chunked",
        },
    });
}

// ─── POST /api/chat/widget ────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, useScrapedContext } = body;
        const messages: { role: string; content: string }[] = body.messages ?? [];

        if (!messages.length) {
            return new Response(JSON.stringify({ error: "No messages" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Only include user messages in the conversation (strip prior error/system messages)
        const cleanMessages = messages.filter(
            (m) => (m.role === "user" || m.role === "assistant") && m.content?.trim()
        );

        const lastUserMsg = [...cleanMessages].reverse().find((m) => m.role === "user")?.content ?? "";

        let context = "";
        let botName = "AI Assistant";

        if (useScrapedContext) {
            // Configure page: use scraped endpoint data
            context = await getScrapedContext();
            const systemPrompt = context
                ? `You are a helpful AI assistant with access to the following scraped endpoint knowledge base. Answer questions based ONLY on this data. If information is not present, say so clearly.\n\n${context}`
                : `You are a helpful AI assistant. No data has been scraped yet. Ask the user to save and scrape an endpoint first.`;
            return geminiStream(systemPrompt, cleanMessages);
        }

        if (agentId) {
            // Agent page: use RAG from chatbot_documents
            const sb = getAdminClient();
            const { data: agent } = await sb
                .from("chatbot_agents" as any)
                .select("config")
                .eq("id", agentId)
                .maybeSingle() as any;

            botName = agent?.config?.botName ?? "AI Assistant";
            context = await getAgentContext(agentId, lastUserMsg);
        }

        const systemPrompt = context
            ? `You are ${botName}. Use the following context to answer the user. If the answer is not in the context, say you don't know.\n\nContext:\n${context}`
            : `You are ${botName}. Be helpful and friendly.`;

        return geminiStream(systemPrompt, cleanMessages);

    } catch (err: any) {
        console.error("[/api/chat/widget]", err);
        return new Response(
            JSON.stringify({ error: err?.message ?? "Internal error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}