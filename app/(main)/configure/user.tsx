"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/header";
import {
    Eye, Copy, Plus, UsersIcon, Loader2,
    Trash2, RefreshCw, AlertTriangle, Code2, FileJson,
    Globe, Pencil, Save, RotateCcw, CheckSquare, Square,
    List,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge }    from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import {
    saveEndpointAndScrape,
    updateEndpointAndRescrape,
    previewEndpointOnly,
    previewEndpointData,
    checkEndpointExists,
    getAllEndpointConfigs,
    deleteScrapedEndpoint,
    deleteAllScrapedEndpoints,
    type ScrapedEndpoint,
    type EndpointConfig,
    type EndpointPreview,
} from "./action";

//  Reusable floating chatbot widget 
import { ChatbotWidget } from "@/components/chatbot-widget";

interface ConfigWithEndpoints extends EndpointConfig {
    scraped_endpoints: ScrapedEndpoint[];
}

type InputMode = "idle" | "saved" | "editing";

// ─── Preview sub-components ───────────────────────────────────────────────────

function MetaRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-0.5 break-all ${mono ? "font-mono text-[11px]" : "text-xs"}`}>{value}</p>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{children}</p>;
}

function TagList({ items, color = "secondary" }: { items: string[]; color?: "secondary" | "outline" }) {
    if (!items.length) return <p className="text-xs text-muted-foreground italic">None found</p>;
    return (
        <div className="flex flex-wrap gap-1">
            {items.map((i) => <Badge key={i} variant={color} className="font-mono text-[10px]">{i}</Badge>)}
        </div>
    );
}

function HtmlPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Scraped Data</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {p.page_title       && <MetaRow label="Page Title"       value={p.page_title} />}
                {p.meta_description && <MetaRow label="Meta Description" value={p.meta_description} />}
            </div>
            {(p.headings ?? []).length > 0 && (
                <div>
                    <SectionLabel>Headings ({p.headings!.length})</SectionLabel>
                    <div className="space-y-0.5">
                        {p.headings!.map((h, i) => (
                            <div key={i} className="text-xs bg-muted px-2 py-1 rounded">{h}</div>
                        ))}
                    </div>
                </div>
            )}
            {p.body_text && (
                <div>
                    <SectionLabel>Full Page Content</SectionLabel>
                    <div className="rounded bg-muted p-3 text-[11px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
                        {p.body_text}
                    </div>
                </div>
            )}
            {(p.api_paths_found ?? []).length > 0 && (
                <div>
                    <SectionLabel>API Paths Found ({p.api_paths_found!.length})</SectionLabel>
                    <TagList items={p.api_paths_found!} />
                </div>
            )}
            {(p.form_actions ?? []).length > 0 && (
                <div>
                    <SectionLabel>Form Actions ({p.form_actions!.length})</SectionLabel>
                    <TagList items={p.form_actions!} />
                </div>
            )}
        </div>
    );
}

function OpenAPIPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">OpenAPI Spec · v{p.spec_version}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <MetaRow label="Title"       value={p.title}       />
                <MetaRow label="API Version" value={p.api_version} />
                {p.description && <div className="col-span-2"><MetaRow label="Description" value={p.description} /></div>}
                <MetaRow label="Total Paths" value={String(p.total_paths ?? 0)} />
            </div>
            {(p.paths ?? []).length > 0 && (
                <div>
                    <SectionLabel>All Paths ({p.paths!.length})</SectionLabel>
                    <div className="space-y-0.5">
                        {p.paths!.map((path) => (
                            <div key={path} className="font-mono text-[11px] bg-muted px-2 py-1 rounded">{path}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function JsonObjectPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <FileJson className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">JSON Object · {p.total_keys} keys</span>
            </div>
            {p.value_preview && Object.keys(p.value_preview).length > 0 && (
                <div>
                    <SectionLabel>All Keys &amp; Values ({p.total_keys})</SectionLabel>
                    <div className="space-y-1 rounded bg-muted p-2">
                        {Object.entries(p.value_preview).map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-[11px]">
                                <span className="font-mono text-primary min-w-[120px] shrink-0 truncate">{k}</span>
                                <span className="text-muted-foreground break-all">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ArrayPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <List className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Array Response · {p.total_items} items</span>
            </div>
            {(p.fields ?? []).length > 0 && (
                <div>
                    <SectionLabel>Fields ({p.fields!.length})</SectionLabel>
                    <TagList items={p.fields!} />
                </div>
            )}
            {(p.sample ?? []).length > 0 && (
                <div>
                    <SectionLabel>Sample (first {p.sample!.length} of {p.total_items})</SectionLabel>
                    <pre className="bg-slate-950 text-slate-50 rounded p-3 text-[10px] font-mono overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(p.sample, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

function PreviewContent({ data }: { data: EndpointPreview }) {
    const ct = data.content_type;
    return (
        <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <MetaRow label="Endpoint" value={data.endpoint} mono />
                <MetaRow label="Status"   value={data.status} />
            </div>
            <hr className="border-border" />
            {ct === "html"        && <HtmlPreview      p={data} />}
            {ct === "openapi"     && <OpenAPIPreview   p={data} />}
            {ct === "json_object" && <JsonObjectPreview p={data} />}
            {ct === "array"       && <ArrayPreview     p={data} />}
            {ct === "unknown"     && <p className="text-xs text-muted-foreground italic">No preview available.</p>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserConfigure() {
    const [endpointUrl, setEndpointUrl]     = useState("");
    const [inputMode, setInputMode]         = useState<InputMode>("idle");
    const [savedConfigId, setSavedConfigId] = useState<string | null>(null);
    const [isSaving, setIsSaving]           = useState(false);
    const [isUpdating, setIsUpdating]       = useState(false);

    const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
    const [configs, setConfigs]                  = useState<ConfigWithEndpoints[]>([]);
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
    const [deleteSelOpen, setDeleteSelOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const [previewOpen, setPreviewOpen]           = useState(false);
    const [previewData, setPreviewData]           = useState<EndpointPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError]         = useState<string | null>(null);

    // Track whether scraped data is available to give contextual widget message
    const [hasScrapedData, setHasScrapedData] = useState(false);

    const allEndpoints: ScrapedEndpoint[] = configs.flatMap((c) => c.scraped_endpoints);

    const embedCode = `<iframe
  src="https://api.manager.io/embed/dashboard?key=7x2aBqz"
  width="100%"
  height="500"
  frameborder="0"
></iframe>`;

    // ── Load configs ──────────────────────────────────────────────────────────
    const loadConfigs = useCallback(async () => {
        setIsLoadingConfigs(true);
        const result = await getAllEndpointConfigs();
        if (result.success && result.data) {
            const data = result.data as ConfigWithEndpoints[];
            setConfigs(data);
            const total = data.reduce((s, c) => s + c.scraped_endpoints.length, 0);
            setHasScrapedData(total > 0);
        }
        setIsLoadingConfigs(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    useEffect(() => {
        autoRefreshRef.current = setInterval(loadConfigs, 30_000);
        return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
    }, [loadConfigs]);

    // ── Preview helpers ───────────────────────────────────────────────────────
    const openPreview = async (
        fetchFn: () => Promise<{ success: boolean; message?: string; data?: EndpointPreview }>
    ) => {
        setPreviewData(null);
        setPreviewError(null);
        setPreviewOpen(true);
        setIsLoadingPreview(true);
        const result = await fetchFn();
        setIsLoadingPreview(false);
        if (!result.success) { setPreviewError(result.message ?? "Failed to load preview."); return; }
        setPreviewData(result.data as EndpointPreview);
    };

    const handlePreviewOnly   = () => {
        if (!endpointUrl.trim()) { toast.error("Please enter an endpoint URL to preview."); return; }
        openPreview(() => previewEndpointOnly(endpointUrl.trim()));
    };
    const handlePreviewSaved  = (url: string) => openPreview(() => previewEndpointData(url));

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!endpointUrl.trim()) { toast.error("Please enter an endpoint URL."); return; }
        setIsSaving(true);
        const result = await saveEndpointAndScrape({ url: endpointUrl.trim() });
        setIsSaving(false);
        if (!result.success) { toast.error(result.message); return; }
        toast.success(result.message);
        const check = await checkEndpointExists(endpointUrl.trim());
        if (check.success && check.data?.configId) setSavedConfigId(check.data.configId);
        setInputMode("saved");
        await loadConfigs();
    };

    const handleEdit   = () => setInputMode("editing");

    // ── Update ────────────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        if (!endpointUrl.trim()) { toast.error("Please enter an endpoint URL."); return; }
        if (!savedConfigId)      { toast.error("No saved config found. Please Save first."); return; }
        setIsUpdating(true);
        const result = await updateEndpointAndRescrape({ url: endpointUrl.trim(), configId: savedConfigId });
        setIsUpdating(false);
        if (!result.success) { toast.error(result.message); return; }
        toast.success(result.message);
        setInputMode("saved");
        await loadConfigs();
    };

    const handleReset = () => { setEndpointUrl(""); setInputMode("idle"); setSavedConfigId(null); };

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = (id: string) =>
        setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

    const allSelected  = allEndpoints.length > 0 && selectedIds.size === allEndpoints.length;
    const someSelected = selectedIds.size > 0 && !allSelected;
    const toggleSelectAll = () =>
        allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(allEndpoints.map((e) => e.id)));

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        const result = await deleteScrapedEndpoint(id);
        if (!result.success) { toast.error(result.message); return; }
        toast.success("Endpoint removed.");
        setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        await loadConfigs();
    };

    const handleDeleteSelected = async () => {
        setIsDeletingAll(true);
        if (selectedIds.size === allEndpoints.length) {
            const r = await deleteAllScrapedEndpoints();
            if (!r.success) { toast.error(r.message); setIsDeletingAll(false); return; }
            toast.success(r.message);
        } else {
            let failed = 0;
            for (const id of selectedIds) { const r = await deleteScrapedEndpoint(id); if (!r.success) failed++; }
            if (failed) toast.error(`${failed} endpoint(s) failed to delete.`);
            else toast.success(`${selectedIds.size} endpoint(s) deleted.`);
        }
        setSelectedIds(new Set());
        setDeleteSelOpen(false);
        setIsDeletingAll(false);
        await loadConfigs();
    };

    const handleCopySnippet = async () => {
        try { await navigator.clipboard.writeText(embedCode); toast.success("Embed snippet copied."); }
        catch { toast.error("Failed to copy snippet."); }
    };

    const inputDisabled = inputMode === "saved" || isSaving || isUpdating;
    const isBusy        = isSaving || isUpdating;

    return (
        <div>
            <Header
                icon={UsersIcon}
                heading="Endpoint Configuration"
                description="Design and manage your public API interface"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots",  href: "/agents" },
                    { label: "Configure" },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* ── Add / Edit Endpoint ── */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>
                                    {inputMode === "idle"    ? "Add New Endpoint"
                                     : inputMode === "saved" ? "Saved Endpoint"
                                     : "Edit Endpoint"}
                                </CardTitle>
                                {inputMode !== "idle" && (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={handleReset}>
                                        <RotateCcw className="h-3 w-3" /> Reset
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="endpoint" className="text-xs font-semibold text-muted-foreground">ENDPOINT URL</Label>
                                    <Input
                                        id="endpoint"
                                        value={endpointUrl}
                                        onChange={(e) => setEndpointUrl(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key !== "Enter") return;
                                            if (inputMode === "idle")    handleSave();
                                            if (inputMode === "editing") handleUpdate();
                                        }}
                                        placeholder="https://api.example.com/v1/resource"
                                        className={`mt-1 ${inputDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                                        disabled={inputDisabled}
                                    />
                                    {inputMode === "saved" && (
                                        <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
                                            ✓ Saved &amp; scraped — the chatbot (↘) can now answer questions about this data.
                                            Click <strong>Edit</strong> to change the URL.
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {inputMode === "idle" && (
                                        <>
                                            <Button variant="outline" onClick={handlePreviewOnly} disabled={isBusy} className="gap-2">
                                                <Eye className="h-4 w-4" /> Preview
                                            </Button>
                                            <Button onClick={handleSave} disabled={isBusy} className="gap-2">
                                                {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Endpoint</>}
                                            </Button>
                                        </>
                                    )}
                                    {inputMode === "saved" && (
                                        <>
                                            <Button variant="outline" onClick={handleEdit} className="gap-2">
                                                <Pencil className="h-4 w-4" /> Edit
                                            </Button>
                                            <Button onClick={handleUpdate} disabled={isBusy} className="gap-2">
                                                {isUpdating ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><RefreshCw className="h-4 w-4" /> Update</>}
                                            </Button>
                                        </>
                                    )}
                                    {inputMode === "editing" && (
                                        <>
                                            <Button variant="outline" onClick={handlePreviewOnly} disabled={isBusy} className="gap-2">
                                                <Eye className="h-4 w-4" /> Preview
                                            </Button>
                                            <Button onClick={handleUpdate} disabled={isBusy} className="gap-2">
                                                {isUpdating ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : <><RefreshCw className="h-4 w-4" /> Update</>}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Found Endpoints ── */}
                    <Card className="flex flex-col">
                        <CardHeader className="shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle>Found Endpoints</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Total: {allEndpoints.length} Discovered</span>
                                    {allEndpoints.length > 0 && (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={toggleSelectAll}>
                                            {allSelected ? <><CheckSquare className="h-3.5 w-3.5" /> Deselect All</> : <><Square className="h-3.5 w-3.5" /> Select All</>}
                                        </Button>
                                    )}
                                    {selectedIds.size > 0 && (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteSelOpen(true)}>
                                            <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={loadConfigs} disabled={isLoadingConfigs} title="Refresh">
                                        <RefreshCw className={`h-3.5 w-3.5 ${isLoadingConfigs ? "animate-spin" : ""}`} />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="shrink-0 p-0">
                            {isLoadingConfigs ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="text-sm">Loading endpoints…</span>
                                </div>
                            ) : allEndpoints.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm px-6">
                                    No endpoints discovered yet. Enter a URL above and click <span className="font-semibold">Save Endpoint</span>.
                                </div>
                            ) : (
                                <div className="max-h-[420px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                <TableHead className="w-10">
                                                    <Checkbox
                                                        checked={allSelected}
                                                        ref={(el) => { if (el) (el as HTMLInputElement).indeterminate = someSelected; }}
                                                        onCheckedChange={toggleSelectAll}
                                                        aria-label="Select all"
                                                    />
                                                </TableHead>
                                                <TableHead className="text-xs font-semibold">ENDPOINT</TableHead>
                                                <TableHead className="text-xs font-semibold text-center">STATUS</TableHead>
                                                <TableHead className="text-xs font-semibold text-right">ACTIONS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allEndpoints.map((item) => (
                                                <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-muted/40" : ""}>
                                                    <TableCell className="w-10">
                                                        <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} aria-label={`Select ${item.label}`} />
                                                    </TableCell>
                                                    <TableCell
                                                        className={`font-mono text-sm max-w-[280px] truncate ${item.status === "SCANNING" ? "text-orange-500" : "text-foreground"}`}
                                                        title={item.url}
                                                    >
                                                        {item.label}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${item.status === "FOUND" ? "text-green-600" : item.status === "ERROR" ? "text-red-500" : "text-orange-500"}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${item.status === "FOUND" ? "bg-green-500" : item.status === "ERROR" ? "bg-red-400" : "bg-orange-400 animate-pulse"}`} />
                                                            {item.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary" onClick={() => handlePreviewSaved(item.url)}>
                                                                <Eye className="h-3.5 w-3.5" /> Preview
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(item.id)} title="Remove endpoint">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sidebar ── */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                <CardTitle className="text-base">Embed Iframe</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                                Integrate your API dashboard directly into your existing internal tools or public documentation pages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                <pre>{embedCode}</pre>
                            </div>
                            <Button className="w-full" variant="default" onClick={handleCopySnippet}>
                                <Copy className="h-4 w-4 mr-2" /> Copy Snippet
                            </Button>
                        </CardContent>
                    </Card>

                    <Alert>
                        <AlertDescription>
                            <div className="space-y-3">
                                <h3 className="font-semibold">Need help?</h3>
                                <p className="text-xs text-muted-foreground">
                                    Check out our developer guides or chat with our automated assistant for quick integration tips.
                                </p>
                                <Button variant="link" className="h-auto p-0 text-xs">Go to Help Center →</Button>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Show a hint once data is scraped */}
                    {hasScrapedData && (
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                            <AlertDescription>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-green-800 dark:text-green-400 text-sm">🤖 AI Chat Ready</h3>
                                    <p className="text-xs text-green-700 dark:text-green-500">
                                        Your chatbot is now trained on the scraped endpoint data.
                                        Click the chat bubble at the bottom-right to ask questions.
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>

            {/* ── Delete Selected Dialog ── */}
            <Dialog open={deleteSelOpen} onOpenChange={setDeleteSelOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-semibold text-base">
                                {selectedIds.size === allEndpoints.length ? "Delete All Endpoints" : `Delete ${selectedIds.size} Endpoint${selectedIds.size !== 1 ? "s" : ""}`}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground pt-1">
                            This will permanently delete <span className="font-semibold">{selectedIds.size}</span> endpoint{selectedIds.size !== 1 ? "s" : ""} and all stored scraped content (including chatbot knowledge). This action cannot be undone.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="lg:gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteSelOpen(false)} disabled={isDeletingAll}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeletingAll}>
                            {isDeletingAll ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Preview Modal ── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-base">Endpoint Preview</span>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto mt-2 pr-1">
                        {isLoadingPreview ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm">Loading preview…</span>
                            </div>
                        ) : previewError ? (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">{previewError}</div>
                        ) : previewData ? (
                            <PreviewContent data={previewData} />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            <ChatbotWidget
                useScrapedContext={true}
                botName="Endpoint Assistant"
                primaryColor="#3b82f6"
                welcomeMessage={
                    hasScrapedData
                        ? "Hi! I'm trained on your scraped endpoints. Ask me anything about the data!"
                        : "Hi! Save and scrape an endpoint above, then I'll be able to answer questions about it."
                }
            />
        </div>
    );
}