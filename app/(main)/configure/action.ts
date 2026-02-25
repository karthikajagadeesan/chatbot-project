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

export type EndpointConfig  = Database["public"]["Tables"]["endpoint_configs"]["Row"];
export type ScrapedEndpoint = Database["public"]["Tables"]["scraped_endpoints"]["Row"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ScrapedEndpointInsert = Database["public"]["Tables"]["scraped_endpoints"]["Insert"] & { scraped_content?: any };

//  Scraped content shapes 

interface HtmlScrapedContent {
    source_url:        string;
    page_title:        string | null;
    meta_description:  string | null;
    total_links_found: number;
    links_sample:      string[];
    api_paths_found:   string[];
    form_actions:      string[];
    external_scripts:  string[];
    headings:          string[];
    body_text:         string;
    content_type:      string;
    scraped_at:        string;
}

interface JsonScrapedContent {
    source_url:    string;
    content_type:  "json" | "openapi";
    scraped_at:    string;
    spec_version?: string | unknown;
    title?:        string | unknown;
    description?:  string | unknown;
    version?:      string | unknown;
    total_paths?:  number;
    paths?:        string[];
    servers?:      unknown[];
    tags?:         unknown[];
    total_keys?:   number;
    keys?:         string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    raw_data?:     any;
}

//  Preview shape — NO links fields 

export interface EndpointPreview {
    endpoint:      string;
    method:        string;
    status:        string;
    fetched_at:    string;
    content_type:  string;
    page_title?:        string | null;
    meta_description?:  string | null;
    api_paths_found?:   string[];
    form_actions?:      string[];
    headings?:          string[];
    body_text?:         string;
    spec_version?: string;
    title?:        string;
    description?:  string;
    api_version?:  string;
    total_paths?:  number;
    paths?:        string[];
    total_keys?:   number;
    keys?:         string[];
    value_preview?: Record<string, string>;
    total_items?: number;
    fields?:      string[];
    sample?:      unknown[];
}

//  FEATURE 1: Preview Only — NO DB write 

export async function previewEndpointOnly(
    endpointUrl: string
): Promise<Response<EndpointPreview>> {
    try {
        try { new URL(endpointUrl); } catch {
            return { success: false, message: "Invalid endpoint URL." };
        }

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

//  FEATURE 1+2: Save Endpoint & Scrape 

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
            return { success: false, message: "Invalid URL format." };
        }

        const { data: configData, error: configError } = await supabase
            .from("endpoint_configs")
            .upsert(
                {
                    base_url:   parsedUrl.origin,
                    full_url:   url,
                    status:     "active",
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "full_url" }
            )
            .select("*")
            .maybeSingle();

        if (configError || !configData) {
            return { success: false, message: configError?.message || "Failed to save endpoint configuration." };
        }

        const scrapedRaw = await scrapeEndpoints(url, configData.id);

        if (!scrapedRaw.length) {
            return {
                success: true,
                message: "Endpoint saved. No additional endpoints were discovered.",
                data: { config: configData, endpoints: [] },
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedEndpoints, error: endpointError } = await (supabase.from("scraped_endpoints") as any)
            .upsert(scrapedRaw, { onConflict: "url,config_id" })
            .select("*");

        if (endpointError || !savedEndpoints) {
            return { success: false, message: endpointError?.message || "Failed to save scraped endpoints." };
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

//  FEATURE 1: Update & Re-scrape 

export async function updateEndpointAndRescrape({
    url,
    configId,
}: {
    url:      string;
    configId: string;
}): Promise<Response<{ config: EndpointConfig; endpoints: ScrapedEndpoint[] }>> {
    try {
        const supabase = createAdminClient();

        const { data: configData, error: configError } = await supabase
            .from("endpoint_configs")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", configId)
            .select("*")
            .maybeSingle();

        if (configError || !configData) {
            return { success: false, message: configError?.message || "Failed to update config." };
        }

        await supabase.from("scraped_endpoints").delete().eq("config_id", configId);

        const scrapedRaw = await scrapeEndpoints(url, configId);

        if (!scrapedRaw.length) {
            return {
                success: true,
                message: "Endpoint updated. No endpoints discovered.",
                data: { config: configData, endpoints: [] },
            };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: savedEndpoints, error: endpointError } = await (supabase.from("scraped_endpoints") as any)
            .upsert(scrapedRaw, { onConflict: "url,config_id" })
            .select("*");

        if (endpointError || !savedEndpoints) {
            return { success: false, message: endpointError?.message || "Failed to save re-scraped endpoints." };
        }

        return {
            success: true,
            message: `Endpoint updated. ${savedEndpoints.length} endpoint(s) re-discovered.`,
            data: { config: configData, endpoints: savedEndpoints as ScrapedEndpoint[] },
        };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Check if URL exists in DB ────────────────────────────────────────────────

export async function checkEndpointExists(
    url: string
): Promise<Response<{ exists: boolean; configId?: string }>> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("endpoint_configs")
            .select("id")
            .eq("full_url", url)
            .eq("status", "active")
            .maybeSingle();

        if (error) return { success: false, message: error.message };

        return {
            success: true,
            message: data ? "Endpoint exists." : "Endpoint not found.",
            data: { exists: !!data, configId: data?.id },
        };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ─── Get All Endpoint Configs ─────────────────────────────────────────────────

export async function getAllEndpointConfigs(): Promise<
    Response<(EndpointConfig & { scraped_endpoints: ScrapedEndpoint[] })[]>
> {
    try {
        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from("endpoint_configs")
            .select("*, scraped_endpoints(*)")
            .eq("status", "active")
            .order("updated_at", { ascending: false });

        if (error) return { success: false, message: error.message };

        //  KEY FIX 
        // Only return configs that actually have at least one scraped_endpoint.
        // This ensures that after deleteAllScrapedEndpoints() is called (which
        // removes child rows but may leave the parent endpoint_configs row),
        // the dashboard receives an empty list and shows InstructionsDashboard.
        const withEndpoints = (data ?? []).filter(
            (c) => Array.isArray(c.scraped_endpoints) && c.scraped_endpoints.length > 0
        );

        return { success: true, message: "Configs fetched.", data: withEndpoints };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

//  Preview from DB (for saved endpoints) 

export async function previewEndpointData(
    endpointUrl: string
): Promise<Response<EndpointPreview>> {
    try {
        try { new URL(endpointUrl); } catch {
            return { success: false, message: "Invalid endpoint URL." };
        }

        const supabase = createAdminClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: stored } = await (supabase.from("scraped_endpoints") as any)
            .select("scraped_content, url, label, status, discovered_at, method")
            .eq("url", endpointUrl)
            .maybeSingle();

        if (stored?.scraped_content) {
            const overview = buildOverview(endpointUrl, stored.scraped_content, stored);
            return { success: true, message: "Preview loaded from stored data.", data: overview };
        }

        const fetched = await fetchAndAnalyse(endpointUrl);
        if (!fetched.success || !fetched.content) {
            return { success: false, message: fetched.message };
        }

        const overview = buildOverview(endpointUrl, fetched.content, null);
        return { success: true, message: "Preview loaded (live fetch).", data: overview };

    } catch (error) {
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

// ─── Delete Scraped Endpoint ──────────────────────────────────────────────────
// Deletes one scraped_endpoint row.
// If it was the last child of its parent endpoint_config, the parent config
// row is also deleted so the dashboard correctly shows InstructionsDashboard.

export async function deleteScrapedEndpoint(endpointId: string): Promise<Response<null>> {
    try {
        const supabase = createAdminClient();

        // 1. Fetch the config_id before deleting so we can check siblings after.
        const { data: target, error: fetchError } = await supabase
            .from("scraped_endpoints")
            .select("config_id")
            .eq("id", endpointId)
            .maybeSingle();

        if (fetchError) return { success: false, message: fetchError.message };

        // 2. Delete the scraped endpoint row.
        const { error: deleteError } = await supabase
            .from("scraped_endpoints")
            .delete()
            .eq("id", endpointId);

        if (deleteError) return { success: false, message: deleteError.message };

        // 3. If we know the parent config, check whether any siblings remain.
        //    If none remain, delete the parent endpoint_config row too.
        if (target?.config_id) {
            const { count } = await supabase
                .from("scraped_endpoints")
                .select("id", { count: "exact", head: true })
                .eq("config_id", target.config_id);

            if ((count ?? 0) === 0) {
                await supabase
                    .from("endpoint_configs")
                    .delete()
                    .eq("id", target.config_id);
            }
        }

        return { success: true, message: "Endpoint deleted.", data: null };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

//  Delete All Scraped Endpoints 
// Deletes ALL scraped_endpoint rows AND their parent endpoint_config rows so
// that getAllEndpointConfigs() returns an empty list and the dashboard switches
// back to InstructionsDashboard.

export async function deleteAllScrapedEndpoints(): Promise<Response<null>> {
    try {
        const supabase = createAdminClient();

        // 1. Get all active config IDs.
        const { data: configs, error: configError } = await supabase
            .from("endpoint_configs")
            .select("id")
            .eq("status", "active");

        if (configError) return { success: false, message: configError.message };
        if (!configs || configs.length === 0) {
            return { success: true, message: "No endpoints to delete.", data: null };
        }

        const configIds = configs.map((c) => c.id);

        // 2. Delete all child scraped_endpoint rows for those configs.
        const { error: scrapedError } = await supabase
            .from("scraped_endpoints")
            .delete()
            .in("config_id", configIds);

        if (scrapedError) return { success: false, message: scrapedError.message };

        // 3.  KEY FIX 
        //    Delete the parent endpoint_config rows themselves.
        //    Without this step, getAllEndpointConfigs() still returns the parent
        //    rows (with empty scraped_endpoints arrays), and the dashboard
        //    incorrectly stays on AnalyticsDashboard after deletion.
        const { error: configDeleteError } = await supabase
            .from("endpoint_configs")
            .delete()
            .in("id", configIds);

        if (configDeleteError) return { success: false, message: configDeleteError.message };

        return { success: true, message: "All endpoints and configs deleted successfully.", data: null };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

//  FEATURE 4: Build chatbot system context from scraped data 

export async function getScrapedContentForChatbot(
    configId?: string
): Promise<Response<string>> {
    try {
        const supabase = createAdminClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query = (supabase.from("scraped_endpoints") as any)
            .select("url, label, scraped_content, status")
            .not("scraped_content", "is", null);

        if (configId) query = query.eq("config_id", configId);

        const { data, error } = await query.limit(20);

        if (error) return { success: false, message: error.message };
        if (!data || data.length === 0) {
            return { success: true, message: "No scraped content.", data: "" };
        }

        const contextParts: string[] = [
            "=== SCRAPED ENDPOINT KNOWLEDGE BASE ===",
            `Total endpoints: ${data.length}`,
            "",
        ];

        for (const ep of data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sc = ep.scraped_content as any;
            if (!sc) continue;

            contextParts.push(`--- Endpoint: ${ep.label} (${ep.url}) ---`);
            const ct = sc.content_type as string;

            if (ct === "openapi" || ct === "openapi_path") {
                if (sc.title)           contextParts.push(`API Title: ${sc.title}`);
                if (sc.description)     contextParts.push(`Description: ${sc.description}`);
                if (sc.paths?.length)   contextParts.push(`Paths: ${sc.paths.join(", ")}`);
                if (sc.methods?.length) contextParts.push(`Methods: ${sc.methods.join(", ")}`);
                if (sc.operations)      contextParts.push(`Operations:\n${JSON.stringify(sc.operations, null, 2).slice(0, 800)}`);
            } else if (ct === "json") {
                contextParts.push(`Keys: ${(sc.keys ?? []).join(", ")}`);
                if (sc.raw_data) contextParts.push(`Data:\n${JSON.stringify(sc.raw_data, null, 2).slice(0, 1000)}`);
            } else {
                if (sc.page_title)          contextParts.push(`Page Title: ${sc.page_title}`);
                if (sc.meta_description)    contextParts.push(`Meta: ${sc.meta_description}`);
                if (sc.headings?.length)    contextParts.push(`Headings: ${sc.headings.slice(0, 10).join(" | ")}`);
                if (sc.body_text)           contextParts.push(`Content:\n${sc.body_text.slice(0, 1500)}`);
                if (sc.api_paths_found?.length) contextParts.push(`API Paths: ${sc.api_paths_found.join(", ")}`);
            }

            contextParts.push("");
        }

        return { success: true, message: "Context built.", data: contextParts.join("\n") };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═════════════════════════════════════════════════════════════════════════════

async function fetchAndAnalyse(url: string): Promise<{
    success: boolean;
    message: string;
    content: HtmlScrapedContent | JsonScrapedContent | null;
}> {
    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json, text/html, */*" },
            signal:  AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return { success: false, message: `HTTP ${response.status}: ${response.statusText}`, content: null };
        }

        const contentType = response.headers.get("content-type") ?? "";
        const now         = new Date().toISOString();

        if (contentType.includes("application/json") || contentType.includes("text/json")) {
            const json = await response.json() as Record<string, unknown>;

            if (json.openapi || json.swagger || json.paths) {
                const info  = (json.info ?? {}) as Record<string, unknown>;
                const paths = json.paths ? Object.keys(json.paths as object) : [];
                return {
                    success: true, message: "ok", content: {
                        source_url:   url,
                        content_type: "openapi",
                        scraped_at:   now,
                        spec_version: json.openapi ?? json.swagger,
                        title:        info.title,
                        description:  info.description,
                        version:      info.version,
                        total_paths:  paths.length,
                        paths,
                        servers:      (json.servers as unknown[]) ?? [],
                        tags:         (json.tags    as unknown[]) ?? [],
                        raw_data:     json,
                    },
                };
            }

            const keys = Object.keys(json);
            return {
                success: true, message: "ok", content: {
                    source_url:   url,
                    content_type: "json",
                    scraped_at:   now,
                    total_keys:   keys.length,
                    keys,
                    raw_data:     json,
                },
            };
        }

        const html = await response.text();

        const titleMatch      = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const pageTitle       = titleMatch ? titleMatch[1].trim() : null;
        const metaMatch       = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
                             ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
        const metaDescription = metaMatch ? metaMatch[1].trim() : null;

        const allLinks: string[]        = [];
        const apiPaths: string[]        = [];
        const formActions: string[]     = [];
        const externalScripts: string[] = [];
        const headings: string[]        = [];
        const seenLinks = new Set<string>();
        const baseOrigin = new URL(url).origin;

        for (const m of html.matchAll(/href=["']([^"'#][^"']*)["']/gi)) {
            const raw = m[1].trim();
            if (!raw || seenLinks.has(raw)) continue;
            seenLinks.add(raw);
            try {
                allLinks.push(raw.startsWith("http") ? raw : new URL(raw, baseOrigin).toString());
            } catch { allLinks.push(raw); }
        }

        for (const m of html.matchAll(/action=["']([^"']+)["']/gi)) {
            const raw = m[1].trim();
            if (raw && !formActions.includes(raw)) formActions.push(raw);
        }

        for (const m of html.matchAll(/["'](\/(?:api|v\d+|graphql|rest)[^"'\s<>]*)["']/gi)) {
            const raw = m[1].trim();
            if (raw && !apiPaths.includes(raw)) apiPaths.push(raw);
        }

        for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
            const src = m[1].trim();
            if (src && src.startsWith("http") && !externalScripts.includes(src)) externalScripts.push(src);
        }

        for (const m of html.matchAll(/<h[1-3][^>]*>([^<]*)<\/h[1-3]>/gi)) {
            const text = m[1].trim();
            if (text && !headings.includes(text)) headings.push(text);
        }

        const bodyText = html
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 5000);

        return {
            success: true, message: "ok", content: {
                source_url:        url,
                page_title:        pageTitle,
                meta_description:  metaDescription,
                total_links_found: allLinks.length,
                links_sample:      allLinks.slice(0, 35),
                api_paths_found:   apiPaths,
                form_actions:      formActions,
                external_scripts:  externalScripts.slice(0, 30),
                headings:          headings.slice(0, 20),
                body_text:         bodyText,
                content_type:      contentType || "text/html",
                scraped_at:        now,
            },
        };

    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : "Fetch failed", content: null };
    }
}

function buildOverview(
    url:     string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta:    Record<string, any> | null
): EndpointPreview {
    const base: EndpointPreview = {
        endpoint:     url,
        method:       meta?.method        ?? "GET",
        status:       meta?.status        ?? "FOUND",
        fetched_at:   meta?.discovered_at ?? content?.scraped_at ?? new Date().toISOString(),
        content_type: content?.content_type ?? "unknown",
    };

    if (!content) return base;

    const ct = content.content_type as string;

    if (ct === "openapi") {
        return {
            ...base,
            content_type: "openapi",
            spec_version: String(content.spec_version ?? ""),
            title:        String(content.title        ?? ""),
            description:  String(content.description  ?? ""),
            api_version:  String(content.version      ?? ""),
            total_paths:  content.total_paths ?? 0,
            paths:        content.paths ?? [],
        };
    }

    if (ct === "json") {
        if (Array.isArray(content.raw_data)) {
            const arr = content.raw_data as unknown[];
            return {
                ...base,
                content_type: "array",
                total_items:  arr.length,
                fields:       arr.length > 0 && typeof arr[0] === "object" ? Object.keys(arr[0] as object) : [],
                sample:       arr.slice(0, 10),
            };
        }

        const keys    = (content.keys ?? []) as string[];
        const raw     = content.raw_data as Record<string, unknown> ?? {};
        const preview: Record<string, string> = {};
        for (const k of keys) {
            const v = raw[k];
            if (Array.isArray(v))                         preview[k] = `[Array · ${v.length}]`;
            else if (v !== null && typeof v === "object") preview[k] = `{${Object.keys(v as object).slice(0, 4).join(", ")}…}`;
            else                                          preview[k] = String(v ?? "");
        }

        return {
            ...base,
            content_type:  "json_object",
            total_keys:    content.total_keys ?? keys.length,
            keys:          keys,
            value_preview: preview,
        };
    }

    return {
        ...base,
        content_type:      "html",
        page_title:        content.page_title,
        meta_description:  content.meta_description,
        api_paths_found:   content.api_paths_found   ?? [],
        form_actions:      content.form_actions       ?? [],
        headings:          content.headings           ?? [],
        body_text:         content.body_text          ?? "",
    };
}

async function scrapeEndpoints(url: string, configId: string): Promise<ScrapedEndpointInsert[]> {
    const discovered: ScrapedEndpointInsert[] = [];
    const baseUrl = new URL(url);
    const now     = new Date().toISOString();

    const rootResult  = await fetchAndAnalyse(url);
    const rootContent = rootResult.success ? rootResult.content : null;

    const push = (path: string, content: unknown = null) => {
        let fullUrl: string;
        try {
            fullUrl = path.startsWith("http") ? path : new URL(path, baseUrl.origin).toString();
            if (new URL(fullUrl).origin !== baseUrl.origin) return;
        } catch { return; }

        discovered.push({
            url:             fullUrl,
            label:           new URL(fullUrl).pathname,
            status:          "FOUND",
            source_url:      url,
            config_id:       configId,
            discovered_at:   now,
            scraped_content: content,
        });
    };

    if (!rootContent) return [];

    const ct = rootContent.content_type;

    if (ct === "openapi") {
        const spec     = rootContent as JsonScrapedContent;
        const rawSpec  = (spec as JsonScrapedContent & { raw_data?: Record<string, unknown> }).raw_data ?? {};
        const pathsMap = (rawSpec.paths ?? {}) as Record<string, unknown>;

        for (const path of spec.paths ?? []) {
            const pathDetail = pathsMap[path] as Record<string, unknown> ?? {};
            push(`${baseUrl.origin}${path}`, {
                source_url:   url,
                content_type: "openapi_path",
                scraped_at:   now,
                path,
                methods:      Object.keys(pathDetail),
                operations:   pathDetail,
                spec_summary: { title: spec.title, version: spec.version, spec_version: spec.spec_version },
            });
        }
    } else if (ct === "json") {
        push(url, rootContent);
    } else {
        const htmlContent = rootContent as HtmlScrapedContent;
        push(url, rootContent);

        for (const link of htmlContent.links_sample ?? []) {
            try {
                const parsed = new URL(link);
                if (parsed.origin === baseUrl.origin) push(link, null);
            } catch { /* skip */ }
        }

        for (const p of htmlContent.api_paths_found ?? []) push(p, null);
    }

    const unique = new Map<string, ScrapedEndpointInsert>();
    for (const ep of discovered) unique.set(ep.url!, ep);
    return Array.from(unique.values());
}