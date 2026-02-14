"use server";

import { createClient } from "@/utils/supabase/server";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import * as cheerio from "cheerio";
import { revalidatePath } from "next/cache";

export async function ingestUrl(agentId: string, url: string) {
    try {
        const supabase = await createClient();
        const { data: userData } = await (supabase.auth as any).getUser();
        if (!userData?.user) return { success: false, message: "Unauthorized" };

        // 1. Fetch and Scrape URL
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script tags, styles, etc.
        $("script, style, nav, footer, header").remove();
        const text = $("body").text().replace(/\s+/g, " ").trim();

        // 2. Chunk text
        const chunks = chunkText(text, 1000);

        if (chunks.length === 0) {
            return { success: false, message: "No content found on URL" };
        }

        // 3. Generate Embeddings using Gemini
        const { embeddings } = await embedMany({
            model: google.textEmbeddingModel("text-embedding-004"),
            values: chunks,
        });

        // 4. Batch Insert into Supabase
        const documents = chunks.map((content, i) => ({
            agent_id: agentId,
            tenant_id: userData.user.id,
            content,
            embedding: embeddings[i],
            metadata: { url, timestamp: new Date().toISOString() },
        }));

        const { error } = await (supabase.from("chatbot_documents" as any) as any).insert(documents);

        if (error) {
            console.error("DB Insert Error:", error);
            return { success: false, message: error.message };
        }

        revalidatePath(`/agents/${agentId}/ingest`);
        return { success: true, count: chunks.length };
    } catch (error: any) {
        console.error("Ingestion Error:", error);
        return { success: false, message: error.message };
    }
}

export async function getAgentDocuments(agentId: string) {
    const supabase = await createClient();
    const { data, error } = await (supabase
        .from("chatbot_documents" as any) as any)
        .select("id, content, metadata, created_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

    if (error) return [];
    return data;
}

export async function deleteDocument(docId: string) {
    const supabase = await createClient();
    const { error } = await (supabase
        .from("chatbot_documents" as any) as any)
        .delete()
        .eq("id", docId);

    return { success: !error };
}

function chunkText(text: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}
