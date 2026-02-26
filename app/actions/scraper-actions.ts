'use server'

import { createServer } from "@/utils/supabase";
import type { Response } from "@/type/general-type";
import type { Tables } from "@/type/database-type";
import { cookies } from "next/headers";

type ScrapedEndpoint = Tables<'scraped_endpoints'>;

// ─── Link Discovery Helper ────────────────────────────────────────────────────

async function discoverLinks(url: string): Promise<{ url: string; type: string }[]> {
    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json, text/html, */*" },
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return [];
        }

        const contentType = response.headers.get("content-type") ?? "";
        const baseUrl = new URL(url);
        const discovered: { url: string; type: string }[] = [];

        if (contentType.includes("application/json") || contentType.includes("text/json")) {
            // It's an API endpoint or OpenAPI spec
            discovered.push({ url, type: "rest_api" });

            const json = await response.json().catch(() => ({}));
            if (json.openapi || json.swagger || json.paths) {
                // It's an OpenAPI spec, let's try to extract paths
                const paths = json.paths ? Object.keys(json.paths) : [];
                for (const path of paths) {
                    try {
                        const fullUrl = new URL(path, baseUrl.origin).toString();
                        discovered.push({ url: fullUrl, type: "rest_api" });
                    } catch {
                        // ignore malformed paths
                    }
                }
            }
        } else if (contentType.includes("text/html")) {
            // It's HTML, parse for links
            discovered.push({ url, type: "page" });
            const html = await response.text();

            const seenLinks = new Set<string>();
            seenLinks.add(url);

            // hrefs
            for (const m of html.matchAll(/href=["']([^"'#][^"']*)["']/gi)) {
                const raw = m[1].trim();
                if (!raw) continue;
                try {
                    const fullUrl = new URL(raw, baseUrl.origin).toString();
                    // Only keep same-origin links to avoid scraping the whole internet
                    if (new URL(fullUrl).origin === baseUrl.origin) {
                        if (!seenLinks.has(fullUrl)) {
                            seenLinks.add(fullUrl);
                            discovered.push({ url: fullUrl, type: "page" });
                        }
                    }
                } catch {
                    // ignore malformed
                }
            }

            // API path literals
            for (const m of html.matchAll(/["'](\/(?:api|v\d+|graphql|rest)[^"'\s<>]*)["']/gi)) {
                const raw = m[1].trim();
                if (!raw) continue;
                try {
                    const fullUrl = new URL(raw, baseUrl.origin).toString();
                    if (!seenLinks.has(fullUrl)) {
                        seenLinks.add(fullUrl);
                        discovered.push({ url: fullUrl, type: "rest_api" }); // Path literals starting with /api/ are likely JSON
                    }
                } catch {
                    // ignore malformed
                }
            }
        } else {
            // Unknown content type, default to HTML page
            discovered.push({ url, type: "page" });
        }

        return discovered;
    } catch {
        return [];
    }
}

// ─── Scraper Actions ─────────────────────────────────────────────────────────

export async function startScrapingAction(projectId: string, targetUrl: string): Promise<Response<{ count: number }>> {
    try {
        const supabase = await createServer(cookies());

        // Validate user has access to this project
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id, target_url")
            .eq("id", projectId)
            .single();

        if (projectError || !project) {
            return { success: false, message: "Project not found or access denied." };
        }

        const urlToScrape = targetUrl || project.target_url;

        if (!urlToScrape) {
            return { success: false, message: "No target URL provided." };
        }

        const discoveredLinks = await discoverLinks(urlToScrape);

        if (discoveredLinks.length === 0) {
            return { success: false, message: "Could not discover any valid endpoints from the provided URL." };
        }

        // Insert discovered links into scraped_endpoints
        const endpointsToInsert = discoveredLinks.map(link => ({
            project_id: projectId,
            url: link.url,
            type: link.type,
            status: "FOUND",
            is_approved: true, // Default to approved so it's ready for ingestion later
        }));

        // Because we might run this multiple times and we don't want duplicates, 
        // we ideally need an upsert. The constraint on scraped_endpoints is likely (project_id, url) if we set it up so.
        // Assuming no unique constraint, we'll first fetch existing to prevent duplicates.
        const { data: existing } = await supabase
            .from("scraped_endpoints")
            .select("url")
            .eq("project_id", projectId);

        const existingUrls = new Set((existing || []).map(e => e.url));

        const newEndpoints = endpointsToInsert.filter(e => !existingUrls.has(e.url));

        if (newEndpoints.length === 0) {
            return { success: true, message: "Scan completed. No new endpoints found.", data: { count: 0 } };
        }

        const { error: insertError } = await supabase
            .from("scraped_endpoints")
            .insert(newEndpoints);

        if (insertError) {
            return { success: false, message: insertError.message || "Failed to save discovered endpoints." };
        }

        return {
            success: true,
            message: `Scan successful. Discovered ${newEndpoints.length} new endpoints.`,
            data: { count: newEndpoints.length }
        };

    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

export async function getScrapedEndpointsAction(projectId: string): Promise<Response<ScrapedEndpoint[]>> {
    try {
        const supabase = await createServer(cookies());

        const { data, error } = await supabase
            .from("scraped_endpoints")
            .select("*")
            .eq("project_id", projectId)
            .order("url", { ascending: true });

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: "Endpoints fetched.", data };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

export async function updateEndpointApprovalAction(endpointId: string, is_approved: boolean): Promise<Response<null>> {
    try {
        const supabase = await createServer(cookies());

        const { error } = await supabase
            .from("scraped_endpoints")
            .update({ is_approved })
            .eq("id", endpointId);

        if (error) {
            return { success: false, message: error.message };
        }

        return { success: true, message: is_approved ? "Endpoint approved." : "Endpoint excluded." };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

export async function deleteEndpointAction(endpointId: string): Promise<Response<null>> {
    try {
        const supabase = await createServer(cookies());
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

export async function bulkDeleteEndpointsAction(endpointIds: string[]): Promise<Response<null>> {
    try {
        if (endpointIds.length === 0) return { success: true, message: "Nothing to delete.", data: null };
        const supabase = await createServer(cookies());
        const { error } = await supabase
            .from("scraped_endpoints")
            .delete()
            .in("id", endpointIds);
        if (error) return { success: false, message: error.message };
        return { success: true, message: `${endpointIds.length} endpoint(s) deleted.`, data: null };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Something went wrong" };
    }
}

export async function getEndpointPreviewAction(url: string): Promise<Response<string>> {
    try {
        const response = await fetch(url, {
            headers: { Accept: "application/json, text/html, text/plain, */*" },
            signal: AbortSignal.timeout(8_000), // Quick timeout for preview
        });

        if (!response.ok) {
            return { success: false, message: `Failed to fetch: ${response.status} ${response.statusText}` };
        }

        const contentType = response.headers.get("content-type") ?? "";

        // Handle JSON
        if (contentType.includes("application/json") || contentType.includes("text/json")) {
            const data = await response.json();
            return {
                success: true,
                message: "Fetched JSON successfully",
                data: JSON.stringify(data, null, 2)
            };
        }

        // Handle HTML mapping to raw text (very naive strip for preview purposes)
        if (contentType.includes("text/html")) {
            let html = await response.text();

            // Extract body if possible
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (bodyMatch && bodyMatch[1]) {
                html = bodyMatch[1];
            }

            // Remove scripts and styles
            html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '\n');
            html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '\n');

            // Remove tags
            let text = html.replace(/<[^>]+>/g, ' ');

            // Clean up whitespace
            text = text.replace(/\s+/g, ' ').trim();

            // Truncate if massive
            if (text.length > 20000) {
                text = text.slice(0, 20000) + "\n\n... [Content Truncated For Preview] ...";
            }

            return {
                success: true,
                message: "Fetched HTML quickly",
                data: text
            };
        }

        // Handle raw text
        const text = await response.text();
        return {
            success: true,
            message: "Fetched plain text",
            data: text.slice(0, 20000)
        };

    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load preview" };
    }
}
