'use server'

import { createClient } from "@/utils/supabase/server";
import type { Response, AgentDocument } from "@/type/general-type";

// Gemini Embedding
async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini embed error: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values as number[];
}

// URL Scraper
async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KnowledgeBot/1.0)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok)
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);

  const html = await res.text();

  const clean = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return clean;
}

// Text Chunker
function chunkText(text: string, chunkSize = 1000, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += chunkSize - overlap;
  }

  return chunks;
}

// Ingest URL
export async function ingestUrl(
  agentId: string,
  url: string
): Promise<Response<{ count: number }>> {
  try {
    const supabase = await createClient();

    const rawText = await scrapeUrl(url);
    if (!rawText || rawText.length < 50) {
      return { success: false, message: "Page content too short or empty." };
    }

    const chunks = chunkText(rawText);
    if (chunks.length === 0) {
      return { success: false, message: "Could not extract text chunks." };
    }

    const rows = await Promise.all(
      chunks.map(async (chunk, index) => {
        const embedding = await embedText(chunk);
        return {
          agent_id: agentId,
          content: chunk,
          embedding,
          metadata: { url, chunk_index: index },
        };
      })
    );

    const { error } = await supabase.from("chatbot_documents").insert(rows);
    if (error) throw new Error(error.message);

    return {
      success: true,
      message: "URL ingested successfully.",
      data: { count: rows.length },
    };
  } catch (err) {
    console.error("[ingestUrl] error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}

// Get Agent Documents
export async function getAgentDocuments(
  agentId: string
): Promise<AgentDocument[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("chatbot_documents")
      .select("id, agent_id, tenant_id, content, metadata, created_at")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []) as AgentDocument[];
  } catch (err) {
    console.error("[getAgentDocuments] error:", err);
    return [];
  }
}

// Delete Document
export async function deleteDocument(
  docId: string
): Promise<Response<null>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("chatbot_documents")
      .delete()
      .eq("id", docId);

    if (error) throw new Error(error.message);

    return { success: true, message: "Document deleted." };
  } catch (err) {
    console.error("[deleteDocument] error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unexpected error.",
    };
  }
}

// Search Similar Documents
export async function searchSimilarDocuments(
  agentId: string,
  query: string,
  topK = 5,
  threshold = 0.4
): Promise<AgentDocument[]> {
  try {
    const supabase = await createClient();

    const queryEmbedding = await embedText(query);

    const { data, error } = await supabase.rpc("match_chatbot_documents", {
      query_embedding: queryEmbedding,
      filter_agent_id: agentId,
      match_count: topK,
      match_threshold: threshold,
    });

    if (error) throw new Error(error.message);

    return (data ?? []) as AgentDocument[];
  } catch (err) {
    console.error("[searchSimilarDocuments] error:", err);
    return [];
  }
}