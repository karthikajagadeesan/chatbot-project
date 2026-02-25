'use server'

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/type/database-type";
import type { Response } from "@/type/general-type";

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey =
        process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secretKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables."
        );
    }

    return createClient<Database>(url, secretKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export type EndpointStatus = "FOUND" | "SCANNING" | "ERROR";

export type EndpointConfig = Database["public"]["Tables"]["endpoint_configs"]["Row"];
export type ScrapedEndpoint = Database["public"]["Tables"]["scraped_endpoints"]["Row"];

// Internal insert shape — scraped_content holds the full payload for chatbot access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScrapedEndpointInsert = Database["public"]["Tables"]["scraped_endpoints"]["Insert"] & { scraped_content?: any };

// ─── Scraped content shape (stored in DB, used by chatbot) ───────────────────

interface HtmlScrapedContent {
    source_url: string;
    page_title: string | null;
    meta_description: string | null;
    total_links_found: number;
    links_sample: string[];
    api_paths_found: string[];
    form_actions: string[];
    external_scripts: string[];
    content_type: string;
    scraped_at: string;
}

interface JsonScrapedContent {
    source_url: string;
    content_type: "json" | "openapi";
    scraped_at: string;
    // OpenAPI fields
    spec_version?: string | unknown;
    title?: string | unknown;
    description?: string | unknown;
    version?: string | unknown;
    total_paths?: number;
    paths?: string[];
    servers?: unknown[];
    tags?: unknown[];
    // Plain JSON fields
    total_keys?: number;
    keys?: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_data?: any;
}

// ─── Preview overview shape (returned to UI — lightweight summary only) ───────

export interface EndpointPreview {
    endpoint: string;
    method: string;
    status: string;
    fetched_at: string;
    content_type: string;
    // HTML fields
    page_title?: string | null;
    meta_description?: string | null;
    total_links_found?: number;
    links_sample?: string[];
    api_paths_found?: string[];
    form_actions?: string[];
    // OpenAPI fields
    spec_version?: string;
    title?: string;
    description?: string;
    api_version?: string;
    total_paths?: number;
    paths?: string[];
    // JSON object fields
    total_keys?: number;
    keys?: string[];
    value_preview?: Record<string, string>;
    // Array fields
    total_items?: number;
    fields?: string[];
    sample?: unknown[];
}

// ─── Save Endpoint & Scrape ───────────────────────────────────────────────────

export async function saveEndpointAndScrape({
    url,
}: {
    url: string;
}): Promise<Response<{ config: EndpointConfig; endpoints: ScrapedEndpoint[] }>> {
    try {
        const supabase = createAdminClient();

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            return { success: false, message: "Invalid URL format. Please enter a valid endpoint URL." };
        }

        // Upsert endpoint config
        const { data: configData, error: configError } = await supabase
            .from("endpoint_configs")
            .upsert(
                {
                    base_url: parsedUrl.origin,
                    full_url: url,
                    status: "active",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "full_url" }
            )
            .select("*")
            .maybeSingle();

        if (configError || !configData) {
            return {
                success: false,
                message: configError?.message || "Failed to save endpoint configuration.",
            };
        }

        // Scrape — discovers child endpoints AND fetches + stores full content per row
        const scrapedRaw = await scrapeEndpoints(url, configData.id);

        if (!scrapedRaw.length) {
            return {
                success: true,
                message: "Endpoint saved. No additional endpoints were discovered.",
                data: { config: configData, endpoints: [] },
            };
        }

        // Upsert with scraped_content (requires the migration column to exist)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedEndpoints, error: endpointError } = await (supabase.from("scraped_endpoints") as any)
            .upsert(scrapedRaw, { onConflict: "url,config_id" })
            .select("*");

        if (endpointError || !savedEndpoints) {
            return {
                success: false,
                message: endpointError?.message || "Failed to save scraped endpoints.",
            };
        }

        return {
            success: true,
            message: `Endpoint saved. ${savedEndpoints.length} endpoint(s) discovered.`,
            data: { config: configData, endpoints: savedEndpoints as ScrapedEndpoint[] },
        };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Get All Endpoint Configs with their scraped endpoints ───────────────────

export async function getAllEndpointConfigs(): Promise<
    Response<(EndpointConfig & { scraped_endpoints: ScrapedEndpoint[] })[]>
> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await (supabase
            .from("endpoint_configs" as any)
            .select("*, scraped_endpoints(*)")
            .eq("status", "active")
            .order("updated_at", { ascending: false }) as any);

        if (error) return { success: false, message: error.message };

        return { success: true, message: "Configs fetched.", data: data ?? [] };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Get Scraped Endpoints by Config ID ──────────────────────────────────────

export async function getScrapedEndpoints(
    config_id: string
): Promise<Response<ScrapedEndpoint[]>> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("scraped_endpoints")
            .select("*")
            .eq("config_id", config_id)
            .order("discovered_at", { ascending: false });

        if (error) return { success: false, message: error.message };

        return {
            success: true,
            message: "Endpoints fetched successfully.",
            data: (data ?? []) as ScrapedEndpoint[],
        };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Preview: returns lightweight overview only (full data stays in DB) ───────

export async function previewEndpointData(
    endpointUrl: string
): Promise<Response<EndpointPreview>> {
    try {
        try { new URL(endpointUrl); } catch {
            return { success: false, message: "Invalid endpoint URL." };
        }

        const supabase = createAdminClient();

        // 1. Pull stored scraped_content from DB — no re-fetch needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: stored } = await (supabase.from("scraped_endpoints") as any)
            .select("scraped_content, url, label, status, discovered_at, method")
            .eq("url", endpointUrl)
            .maybeSingle();

        if (stored?.scraped_content) {
            const overview = buildOverview(endpointUrl, stored.scraped_content, stored);
            return { success: true, message: "Preview loaded from stored data.", data: overview };
        }

        // 2. Live fallback (preview before saving)
        const fetched = await fetchAndAnalyse(endpointUrl);
        if (!fetched.success || !fetched.content) {
            return { success: false, message: fetched.message };
        }

        const overview = buildOverview(endpointUrl, fetched.content, null);
        return { success: true, message: "Preview loaded (live fetch).", data: overview };

    } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
            return { success: false, message: "Request timed out." };
        }
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Update Endpoint Status ───────────────────────────────────────────────────

export async function updateEndpointStatus(
    endpointId: string,
    status: EndpointStatus
): Promise<Response<ScrapedEndpoint>> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("scraped_endpoints")
            .update({ status })
            .eq("id", endpointId)
            .select("*")
            .maybeSingle();

        if (error || !data) {
            return { success: false, message: error?.message || "Failed to update endpoint status." };
        }

        return { success: true, message: "Status updated.", data: data as ScrapedEndpoint };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Delete a Single Scraped Endpoint ────────────────────────────────────────

export async function deleteScrapedEndpoint(
    endpointId: string
): Promise<Response<null>> {
    try {
        const supabase = createAdminClient();

        const { error } = await supabase
            .from("scraped_endpoints")
            .delete()
            .eq("id", endpointId);

        if (error) return { success: false, message: error.message };

        return { success: true, message: "Endpoint deleted.", data: null };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Delete ALL Scraped Endpoints (across all active configs) ────────────────

export async function deleteAllScrapedEndpoints(): Promise<Response<null>> {
    try {
        const supabase = createAdminClient();

        const { data: configs, error: configError } = await supabase
            .from("endpoint_configs")
            .select("id")
            .eq("status", "active");

        if (configError) return { success: false, message: configError.message };
        if (!configs || configs.length === 0) {
            return { success: true, message: "No endpoints to delete.", data: null };
        }

        const configIds = configs.map((c) => c.id);

        const { error } = await supabase
            .from("scraped_endpoints")
            .delete()
            .in("config_id", configIds);

        if (error) return { success: false, message: error.message };

        return { success: true, message: "All endpoints deleted successfully.", data: null };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═════════════════════════════════════════════════════════════════════════════

// ─── fetchAndAnalyse: fetch URL, return rich structured content for DB ────────

async function fetchAndAnalyse(url: string): Promise<{
    success: boolean;
    message: string;
    content: HtmlScrapedContent | JsonScrapedContent | null;
}> {
    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json, text/html, */*" },
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return { success: false, message: `HTTP ${response.status}: ${response.statusText}`, content: null };
        }

        const contentType = response.headers.get("content-type") ?? "";
        const now = new Date().toISOString();

        // ── JSON / OpenAPI ────────────────────────────────────────────────────
        if (contentType.includes("application/json") || contentType.includes("text/json")) {
            const json = await response.json() as Record<string, unknown>;

            if (json.openapi || json.swagger || json.paths) {
                const info = (json.info ?? {}) as Record<string, unknown>;
                const paths = json.paths ? Object.keys(json.paths as object) : [];
                const content: JsonScrapedContent = {
                    source_url: url,
                    content_type: "openapi",
                    scraped_at: now,
                    spec_version: json.openapi ?? json.swagger,
                    title: info.title,
                    description: info.description,
                    version: info.version,
                    total_paths: paths.length,
                    paths,
                    servers: (json.servers as unknown[]) ?? [],
                    tags: (json.tags as unknown[]) ?? [],
                    raw_data: json,
                };
                return { success: true, message: "ok", content };
            }

            // Plain JSON
            const keys = Object.keys(json);
            const content: JsonScrapedContent = {
                source_url: url,
                content_type: "json",
                scraped_at: now,
                total_keys: keys.length,
                keys,
                raw_data: json,
            };
            return { success: true, message: "ok", content };
        }

        // ── HTML ──────────────────────────────────────────────────────────────
        const html = await response.text();

        // Title
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim() : null;

        // Meta description
        const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
            ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
        const metaDescription = metaMatch ? metaMatch[1].trim() : null;

        // All hrefs
        const allLinks: string[] = [];
        const apiPaths: string[] = [];
        const formActions: string[] = [];
        const externalScripts: string[] = [];
        const seenLinks = new Set<string>();

        const baseOrigin = new URL(url).origin;

        // hrefs
        for (const m of html.matchAll(/href=["']([^"'#][^"']*)["']/gi)) {
            const raw = m[1].trim();
            if (!raw || seenLinks.has(raw)) continue;
            seenLinks.add(raw);
            try {
                const full = raw.startsWith("http") ? raw : new URL(raw, baseOrigin).toString();
                allLinks.push(full);
            } catch { allLinks.push(raw); }
        }

        // form actions
        for (const m of html.matchAll(/action=["']([^"']+)["']/gi)) {
            const raw = m[1].trim();
            if (raw && !formActions.includes(raw)) formActions.push(raw);
        }

        // API path literals  /api/... /v1/... /graphql /rest/...
        for (const m of html.matchAll(/["'](\/(?:api|v\d+|graphql|rest)[^"'\s<>]*)["']/gi)) {
            const raw = m[1].trim();
            if (raw && !apiPaths.includes(raw)) apiPaths.push(raw);
        }

        // external scripts
        for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
            const src = m[1].trim();
            if (src && src.startsWith("http") && !externalScripts.includes(src)) {
                externalScripts.push(src);
            }
        }

        const content: HtmlScrapedContent = {
            source_url: url,
            page_title: pageTitle,
            meta_description: metaDescription,
            total_links_found: allLinks.length,
            links_sample: allLinks.slice(0, 35),     // store up to 35 links
            api_paths_found: apiPaths,
            form_actions: formActions,
            external_scripts: externalScripts.slice(0, 30),
            content_type: contentType || "text/html",
            scraped_at: now,
        };

        return { success: true, message: "ok", content };

    } catch (err) {
        return {
            success: false,
            message: err instanceof Error ? err.message : "Fetch failed",
            content: null,
        };
    }
}

// ─── buildOverview: lightweight summary for the Preview UI ───────────────────
// Full raw data is already in DB (scraped_content). This returns a clean card.

function buildOverview(
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta: Record<string, any> | null
): EndpointPreview {
    const base: EndpointPreview = {
        endpoint: url,
        method: meta?.method ?? "GET",
        status: meta?.status ?? "FOUND",
        fetched_at: meta?.discovered_at ?? content?.scraped_at ?? new Date().toISOString(),
        content_type: content?.content_type ?? "unknown",
    };

    if (!content) return base;

    const ct = content.content_type as string;

    // ── OpenAPI ───────────────────────────────────────────────────────────────
    if (ct === "openapi") {
        return {
            ...base,
            content_type: "openapi",
            spec_version: String(content.spec_version ?? ""),
            title: String(content.title ?? ""),
            description: String(content.description ?? ""),
            api_version: String(content.version ?? ""),
            total_paths: content.total_paths ?? 0,
            paths: (content.paths ?? []).slice(0, 25),
        };
    }

    // ── Plain JSON ────────────────────────────────────────────────────────────
    if (ct === "json") {
        const keys = (content.keys ?? []) as string[];
        // Build a short value preview from raw_data
        const raw = content.raw_data as Record<string, unknown> ?? {};
        const preview: Record<string, string> = {};
        for (const k of keys.slice(0, 15)) {
            const v = raw[k];
            if (Array.isArray(v)) preview[k] = `[Array · ${v.length}]`;
            else if (v !== null && typeof v === "object") preview[k] = `{${Object.keys(v as object).slice(0, 4).join(", ")}…}`;
            else preview[k] = String(v ?? "");
        }

        if (Array.isArray(content.raw_data)) {
            const arr = content.raw_data as unknown[];
            return {
                ...base,
                content_type: "array",
                total_items: arr.length,
                fields: arr.length > 0 && typeof arr[0] === "object"
                    ? Object.keys(arr[0] as object)
                    : [],
                sample: arr.slice(0, 4),
            };
        }

        return {
            ...base,
            content_type: "json_object",
            total_keys: content.total_keys ?? keys.length,
            keys: keys.slice(0, 25),
            value_preview: preview,
        };
    }

    // ── HTML ──────────────────────────────────────────────────────────────────
    return {
        ...base,
        content_type: "html",
        page_title: content.page_title,
        meta_description: content.meta_description,
        total_links_found: content.total_links_found ?? 0,
        links_sample: (content.links_sample ?? []).slice(0, 15),
        api_paths_found: content.api_paths_found ?? [],
        form_actions: content.form_actions ?? [],
    };
}

// ─── scrapeEndpoints: discover child URLs + store full content per row ────────

async function scrapeEndpoints(
    url: string,
    configId: string
): Promise<ScrapedEndpointInsert[]> {
    const discovered: ScrapedEndpointInsert[] = [];
    const baseUrl = new URL(url);
    const now = new Date().toISOString();

    // Analyse root first
    const rootResult = await fetchAndAnalyse(url);
    const rootContent = rootResult.success ? rootResult.content : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const push = (path: string, content: any = null) => {
        let fullUrl: string;
        try {
            fullUrl = path.startsWith("http") ? path : new URL(path, baseUrl.origin).toString();
            if (new URL(fullUrl).origin !== baseUrl.origin) return;   // skip external
        } catch { return; }

        discovered.push({
            url: fullUrl,
            // @ts-ignore
            label: new URL(fullUrl).pathname,
            status: "FOUND",
            // @ts-ignore
            source_url: url,
            config_id: configId,
            discovered_at: now,
            scraped_content: content,
        });
    };

    if (!rootContent) return [];

    const ct = rootContent.content_type;

    // ── OpenAPI / JSON ────────────────────────────────────────────────────────
    if (ct === "openapi") {
        const spec = rootContent as JsonScrapedContent;
        // One row per path, embedding its method detail from the raw spec
        const rawSpec = (spec as JsonScrapedContent & { raw_data?: Record<string, unknown> }).raw_data ?? {};
        const pathsMap = (rawSpec.paths ?? {}) as Record<string, unknown>;

        for (const path of spec.paths ?? []) {
            const pathDetail = pathsMap[path] as Record<string, unknown> ?? {};
            const pathContent = {
                source_url: url,
                content_type: "openapi_path",
                scraped_at: now,
                path,
                methods: Object.keys(pathDetail),
                operations: pathDetail,
                spec_summary: {
                    title: spec.title,
                    version: spec.version,
                    spec_version: spec.spec_version,
                },
            };
            push(`${baseUrl.origin}${path}`, pathContent);
        }
    } else if (ct === "json") {
        // Single JSON endpoint — store at root URL
        push(url, rootContent);

        // ── HTML ──────────────────────────────────────────────────────────────────
    } else {
        const html = rootContent as HtmlScrapedContent;

        // Store root page itself
        push(url, rootContent);

        // Also push each discovered link (same-origin only, no sub-fetch to avoid timeout)
        for (const link of html.links_sample ?? []) {
            try {
                const parsed = new URL(link);
                if (parsed.origin === baseUrl.origin) push(link, null);
            } catch { /* skip malformed */ }
        }

        // Push API path literals
        for (const p of html.api_paths_found ?? []) push(p, null);
    }

    // Deduplicate by URL
    const unique = new Map<string, ScrapedEndpointInsert>();
    for (const ep of discovered) unique.set(ep.url!, ep);
    return Array.from(unique.values());
}