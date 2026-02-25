'use server'

import { createServer } from "@/utils/supabase";
import type { Response, AgentProvider } from "@/type/general-type";
import { cookies } from "next/headers";
import { embedMany } from "ai";
import { openai as openaiProvider, createOpenAI } from "@ai-sdk/openai";
import { google as googleProvider, createGoogleGenerativeAI } from "@ai-sdk/google";
import * as cheerio from "cheerio";

// Max chars per chunk roughly mapping to 500-1000 tokens depending on content
const CHUNK_SIZE = 4000;
const OVERLAP_SIZE = 300;

/**
 * Splits raw text into slightly overlapping chunks
 */
function chunkText(text: string): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
        i += CHUNK_SIZE - OVERLAP_SIZE;
    }
    return chunks;
}

/**
 * Strips HTML to get clean textual context
 */
async function fetchAndCleanHTML(url: string): Promise<string> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) return "";

        const contentType = res.headers.get("content-type") || "";

        if (contentType.includes("application/json") || contentType.includes("text/json")) {
            const data = await res.json();
            return JSON.stringify(data);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Remove script, style, nav, footer, header to focus on main content
        $("script, style, nav, footer, header, noscript, iframe").remove();

        let cleanText = $("body").text();
        cleanText = cleanText.replace(/\s+/g, ' ').trim();

        return cleanText;
    } catch {
        return "";
    }
}

/**
 * Returns the correct embedding model based on the project's saved provider + API key.
 * Groq/Anthropic have no embedding API — those users must provide a separate embedding key.
 */
function getEmbeddingModel(agentConfig: Record<string, any>) {
    const provider: AgentProvider = agentConfig.provider || "openai";
    // Read the key specific to the active provider (with fallback to legacy api_key)
    const userApiKey: string | undefined =
        agentConfig[`${provider}_api_key`] || agentConfig.api_key || undefined;
    // Separate optional key specifically for embeddings (used by Groq/Anthropic users)
    const embeddingKey: string | undefined = agentConfig.embedding_api_key || undefined;

    // Gemini — use user's key or env key
    if (provider === "gemini") {
        const apiKey = userApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        const sdk = apiKey ? createGoogleGenerativeAI({ apiKey }) : googleProvider;
        const embedFn = sdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof sdk.textEmbeddingModel>;
        return embedFn("gemini-embedding-001", { outputDimensionality: 1536 });
    }

    // Groq or Anthropic — check the dedicated embedding_api_key first
    if (provider === "groq" || provider === "anthropic") {
        if (embeddingKey) {
            // Google key (starts with AIza)
            if (embeddingKey.startsWith("AIza")) {
                const sdk = createGoogleGenerativeAI({ apiKey: embeddingKey });
                const embedFn = sdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof sdk.textEmbeddingModel>;
                return embedFn("gemini-embedding-001", { outputDimensionality: 1536 });
            }
            // OpenAI key (starts with sk-)
            const sdk = createOpenAI({ apiKey: embeddingKey });
            return sdk.embedding("text-embedding-3-small");
        }
        // Fall back to env keys
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            const sdk = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
            const embedFn = sdk.textEmbeddingModel as (model: string, settings: object) => ReturnType<typeof sdk.textEmbeddingModel>;
            return embedFn("gemini-embedding-001", { outputDimensionality: 1536 });
        }
        // Fall through to OpenAI env
    }

    // OpenAI (or last resort) — use user's key or env key
    const sdk = userApiKey && provider === "openai"
        ? createOpenAI({ apiKey: userApiKey })
        : openaiProvider;
    return sdk.embedding("text-embedding-3-small");
}

/** Truncates embedding to TARGET_DIMS to match the Supabase pgvector column.
 *  Google Matryoshka models preserve quality when truncated. */
const TARGET_DIMS = 1536
function normalizeEmbedding(embedding: number[]): number[] {
    return embedding.length > TARGET_DIMS ? embedding.slice(0, TARGET_DIMS) : embedding
}

/**
 * Ingest all approved, un-ingested endpoints for a given project
 */
export async function ingestProjectAction(projectId: string): Promise<Response<{ processed: number, skipped: number }>> {
    try {
        const supabase = await createServer(cookies());

        // 0. Fetch project then active agent config (two clean queries — avoids FK ambiguity)
        const { data: project, error: projectFetchError } = await supabase
            .from("projects")
            .select("id, active_agent_config_id")
            .eq("id", projectId)
            .single();

        if (projectFetchError || !project) {
            return { success: false, message: "Could not fetch project configuration." };
        }

        type AgentConfigRow = {
            id: string; provider: string;
            openai_api_key: string | null; gemini_api_key: string | null;
            anthropic_api_key: string | null; groq_api_key: string | null;
            embedding_api_key: string | null;
        }
        let agentConfigRow: AgentConfigRow | null = null
        if (project.active_agent_config_id) {
            const { data } = await supabase
                .from("agent_configs")
                .select("id, provider, openai_api_key, gemini_api_key, anthropic_api_key, groq_api_key, embedding_api_key")
                .eq("id", project.active_agent_config_id)
                .single();
            agentConfigRow = data as AgentConfigRow | null;
        }

        if (!agentConfigRow) {
            return { success: false, message: "No active agent configuration found. Please set an active agent config in AI Agent Details." };
        }

        const agentConfig: Record<string, string | null> = {
            provider: agentConfigRow.provider,
            [`${agentConfigRow.provider}_api_key`]: agentConfigRow[`${agentConfigRow.provider}_api_key` as keyof AgentConfigRow] as string | null,
            embedding_api_key: agentConfigRow.embedding_api_key,
        };
        const embeddingModel = getEmbeddingModel(agentConfig);

        // 1. Fetch relevant endpoints
        const { data: endpoints, error: fetchError } = await supabase
            .from("scraped_endpoints")
            .select("*")
            .eq("project_id", projectId)
            .eq("is_approved", true)
            .in("status", ["FOUND", "ERROR"]);

        if (fetchError || !endpoints) {
            return { success: false, message: "Could not fetch endpoints." };
        }

        if (endpoints.length === 0) {
            return { success: true, message: "No new approved endpoints to ingest.", data: { processed: 0, skipped: 0 } };
        }

        let processedCount = 0;
        let skippedCount = 0;

        for (const endpoint of endpoints) {
            // 2. Fetch & Clean Content
            const content = await fetchAndCleanHTML(endpoint.url);

            if (!content || content.length < 50) {
                await supabase.from("scraped_endpoints").update({ status: "SKIPPED_EMPTY" }).eq("id", endpoint.id);
                skippedCount++;
                continue;
            }

            // 3. Chunk
            const chunks = chunkText(content);

            // 4. Create Embeddings using the project's configured provider + key
            const { embeddings } = await embedMany({
                model: embeddingModel,
                values: chunks,
            });

            // Normalize to 1536 dims (Gemini returns 3072 by default)
            const normalizedEmbeddings = embeddings.map(normalizeEmbedding);

            // 5. Save to `content_chunks`
            const recordsToInsert = chunks.map((chunk, i) => ({
                project_id: projectId,
                endpoint_id: endpoint.id,
                content: chunk,
                embedding: `[${normalizedEmbeddings[i].join(',')}]`,
                metadata: {
                    source_url: endpoint.url,
                    chunk_index: i,
                    total_chunks: chunks.length
                }
            }));

            await supabase.from("content_chunks").delete().eq("endpoint_id", endpoint.id);

            const { error: insertError } = await supabase.from("content_chunks").insert(recordsToInsert);

            if (insertError) {
                console.error("Embedding Insert Error:", insertError);
                await supabase.from("scraped_endpoints").update({ status: "ERROR" }).eq("id", endpoint.id);
                skippedCount++;
            } else {
                await supabase.from("scraped_endpoints").update({ status: "INGESTED" }).eq("id", endpoint.id);
                processedCount++;
            }
        }

        return {
            success: true,
            message: `Ingestion complete. Processed ${processedCount}, Skipped/Failed ${skippedCount}.`,
            data: { processed: processedCount, skipped: skippedCount }
        };

    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Ingestion Pipeline Exception" };
    }
}
