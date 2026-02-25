"use client";

import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import {
    Eye,
    Copy,
    Plus,
    MessageCircle,
    UsersIcon,
    Loader2,
    Trash2,
    RefreshCw,
    AlertTriangle,
    CheckSquare,
    Square,
    Link2,
    Code2,
    FileJson,
    Globe,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge }    from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import {
    saveEndpointAndScrape,
    previewEndpointData,
    getAllEndpointConfigs,
    deleteScrapedEndpoint,
    deleteAllScrapedEndpoints,
    type ScrapedEndpoint,
    type EndpointConfig,
    type EndpointPreview,
} from "./action";

interface ConfigWithEndpoints extends EndpointConfig {
    scraped_endpoints: ScrapedEndpoint[];
}

// ─── Preview Card Sections ────────────────────────────────────────────────────

function PreviewMeta({ p }: { p: EndpointPreview }) {
    return (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <MetaRow label="Endpoint" value={p.endpoint} mono />
            <MetaRow label="Status"   value={p.status}        />
        </div>
    );
}

function MetaRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className={`mt-0.5 break-all ${mono ? "font-mono text-[11px]" : ""}`}>{value}</p>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{children}</p>;
}

function TagList({ items, color = "secondary" }: { items: string[]; color?: "secondary" | "outline" }) {
    if (!items.length) return <p className="text-xs text-muted-foreground italic">None found</p>;
    return (
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {items.map((i) => (
                <Badge key={i} variant={color} className="font-mono text-[10px]">{i}</Badge>
            ))}
        </div>
    );
}

function HtmlPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">HTML Page</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {p.page_title && <MetaRow label="Page Title" value={p.page_title} />}
                {p.meta_description && <MetaRow label="Meta Description" value={p.meta_description} />}
                <MetaRow label="Total Links Found" value={String(p.total_links_found ?? 0)} />
            </div>
            <div>
                <SectionLabel>Links Sample ({(p.links_sample ?? []).length})</SectionLabel>
                <TagList items={(p.links_sample ?? []).slice(0, 12)} color="outline" />
            </div>
            {(p.api_paths_found ?? []).length > 0 && (
                <div>
                    <SectionLabel>API Paths Found ({p.api_paths_found!.length})</SectionLabel>
                    <TagList items={p.api_paths_found!} />
                </div>
            )}
            {(p.form_actions ?? []).length > 0 && (
                <div>
                    <SectionLabel>Form Actions</SectionLabel>
                    <TagList items={p.form_actions!} />
                </div>
            )}
        </div>
    );
}

function OpenAPIPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">OpenAPI Spec · v{p.spec_version}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <MetaRow label="Title"       value={p.title}       />
                <MetaRow label="API Version" value={p.api_version} />
                <MetaRow label="Description" value={p.description} />
                <MetaRow label="Total Paths" value={String(p.total_paths ?? 0)} />
            </div>
            <div>
                <SectionLabel>
                    Paths ({(p.paths ?? []).length}
                    {(p.total_paths ?? 0) > (p.paths ?? []).length ? ` of ${p.total_paths}` : ""})
                </SectionLabel>
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                    {(p.paths ?? []).map((path) => (
                        <div key={path} className="font-mono text-[11px] bg-muted px-2 py-1 rounded truncate">{path}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function JsonObjectPreview({ p }: { p: EndpointPreview }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <FileJson className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">JSON Object · {p.total_keys} keys</span>
            </div>
            <div>
                <SectionLabel>
                    Keys ({(p.keys ?? []).length}
                    {(p.total_keys ?? 0) > (p.keys ?? []).length ? ` of ${p.total_keys}` : ""})
                </SectionLabel>
                <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                    {(p.keys ?? []).map((k) => (
                        <Badge key={k} variant="secondary" className="font-mono text-[10px]">{k}</Badge>
                    ))}
                </div>
            </div>
            {p.value_preview && Object.keys(p.value_preview).length > 0 && (
                <div>
                    <SectionLabel>Value Preview</SectionLabel>
                    <div className="max-h-44 overflow-y-auto space-y-1">
                        {Object.entries(p.value_preview).map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-[11px]">
                                <span className="font-mono text-primary min-w-[100px] truncate shrink-0">{k}</span>
                                <span className="text-muted-foreground truncate">{v}</span>
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
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">Array Response · {p.total_items} items</span>
            </div>
            {(p.fields ?? []).length > 0 && (
                <div>
                    <SectionLabel>Fields</SectionLabel>
                    <TagList items={p.fields!} />
                </div>
            )}
            {(p.sample ?? []).length > 0 && (
                <div>
                    <SectionLabel>Sample (first {p.sample!.length})</SectionLabel>
                    <pre className="bg-slate-950 text-slate-50 rounded p-2 text-[10px] font-mono overflow-auto max-h-36 whitespace-pre-wrap">
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
            <PreviewMeta p={data} />
            <hr className="border-border" />
            {ct === "html"        && <HtmlPreview       p={data} />}
            {ct === "openapi"     && <OpenAPIPreview     p={data} />}
            {ct === "json_object" && <JsonObjectPreview  p={data} />}
            {ct === "array"       && <ArrayPreview       p={data} />}
            {ct === "unknown"     && (
                <p className="text-xs text-muted-foreground italic">No preview available for this content type.</p>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserConfigure() {
    const [endpointUrl, setEndpointUrl]          = useState("");
    const [isSaving, setIsSaving]                = useState(false);
    const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
    const [configs, setConfigs]                  = useState<ConfigWithEndpoints[]>([]);

    const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
    const [selectMode, setSelectMode]       = useState(false);
    const [deleteSelOpen, setDeleteSelOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const [previewOpen, setPreviewOpen]           = useState(false);
    const [previewUrl, setPreviewUrl]             = useState("");
    const [previewData, setPreviewData]           = useState<EndpointPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError]         = useState<string | null>(null);

    const allEndpoints: ScrapedEndpoint[] = configs.flatMap((c) => c.scraped_endpoints);

    const embedCode = `<iframe
  src="https://api.manager.io/embed/dashboard?key=7x2aBqz"
  width="100%"
  height="500"
  frameborder="0"
></iframe>`;

    const loadConfigs = useCallback(async () => {
        setIsLoadingConfigs(true);
        const result = await getAllEndpointConfigs();
        if (result.success && result.data) setConfigs(result.data as ConfigWithEndpoints[]);
        setIsLoadingConfigs(false);
    }, []);

    useEffect(() => { loadConfigs(); }, [loadConfigs]);

    const handleSaveEndpoint = async () => {
        if (!endpointUrl.trim()) { toast.error("Please enter an endpoint URL."); return; }
        setIsSaving(true);
        const result = await saveEndpointAndScrape({ url: endpointUrl.trim() });
        setIsSaving(false);
        if (!result.success) { toast.error(result.message); return; }
        toast.success(result.message);
        setEndpointUrl("");
        await loadConfigs();
    };

    const handlePreview = async (url: string) => {
        setPreviewUrl(url);
        setPreviewData(null);
        setPreviewError(null);
        setPreviewOpen(true);
        setIsLoadingPreview(true);
        const result = await previewEndpointData(url);
        setIsLoadingPreview(false);
        if (!result.success) { setPreviewError(result.message); return; }
        setPreviewData(result.data as EndpointPreview);
    };

    const handleInputPreview = () => {
        if (!endpointUrl.trim()) { toast.error("Please enter an endpoint URL to preview."); return; }
        handlePreview(endpointUrl.trim());
    };

    const handleDelete = async (endpointId: string) => {
        const result = await deleteScrapedEndpoint(endpointId);
        if (!result.success) { toast.error(result.message); return; }
        toast.success("Endpoint removed.");
        setSelectedIds((prev) => { const s = new Set(prev); s.delete(endpointId); return s; });
        await loadConfigs();
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const allSelected  = allEndpoints.length > 0 && selectedIds.size === allEndpoints.length;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(allEndpoints.map((e) => e.id)));
    };

    const handleDeleteSelected = async () => {
        setIsDeletingAll(true);
        if (selectedIds.size === allEndpoints.length) {
            const result = await deleteAllScrapedEndpoints();
            if (!result.success) { toast.error(result.message); setIsDeletingAll(false); return; }
            toast.success(result.message);
        } else {
            let failed = 0;
            for (const id of selectedIds) {
                const r = await deleteScrapedEndpoint(id);
                if (!r.success) failed++;
            }
            if (failed) toast.error(`${failed} endpoint(s) failed to delete.`);
            else toast.success(`${selectedIds.size} endpoint(s) deleted.`);
        }
        setSelectedIds(new Set());
        setSelectMode(false);
        setDeleteSelOpen(false);
        setIsDeletingAll(false);
        await loadConfigs();
    };

    const handleCopySnippet = async () => {
        try {
            await navigator.clipboard.writeText(embedCode);
            toast.success("Embed snippet copied to clipboard.");
        } catch { toast.error("Failed to copy snippet."); }
    };

    return (
        <div>
            <Header
                icon={UsersIcon}
                heading="Endpoint Configuration"
                description="Design and manage your public API interface"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chartbots", href: "/agents" },
                    { label: "Configure" },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Main Content ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Add New Endpoint */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Endpoint</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <Label htmlFor="endpoint" className="text-xs font-semibold text-muted-foreground">
                                        ENDPOINT URL
                                    </Label>
                                    <Input
                                        id="endpoint"
                                        value={endpointUrl}
                                        onChange={(e) => setEndpointUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveEndpoint()}
                                        placeholder="https://api.example.com/v1/resource"
                                        className="mt-1"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button variant="default" onClick={handleInputPreview} disabled={isSaving}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Found Endpoints — only this card scrolls internally */}
                    <Card className="flex flex-col">
                        <CardHeader className="shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle>Found Endpoints</CardTitle>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        Total: {allEndpoints.length} Discovered
                                    </span>

                                    {allEndpoints.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs gap-1 text-muted-foreground"
                                            onClick={() => {
                                                setSelectMode((v) => !v);
                                                setSelectedIds(new Set());
                                            }}
                                        >
                                            {selectMode ? (
                                                <><CheckSquare className="h-3.5 w-3.5" /> Cancel</>
                                            ) : (
                                                <><Square className="h-3.5 w-3.5" /> Select</>
                                            )}
                                        </Button>
                                    )}

                                    {selectMode && selectedIds.size > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => setDeleteSelOpen(true)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete ({selectedIds.size})
                                        </Button>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={loadConfigs}
                                        disabled={isLoadingConfigs}
                                        title="Refresh"
                                    >
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
                                    No endpoints discovered yet. Enter a URL above and click{" "}
                                    <span className="font-semibold">Save Endpoint</span>.
                                </div>
                            ) : (
                                /* ── Scrollable table only ── */
                                <div className="max-h-[420px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-10">
                                            <TableRow>
                                                {selectMode && (
                                                    <TableHead className="w-8">
                                                        <Checkbox
                                                            checked={allSelected}
                                                            ref={(el) => {
                                                                if (el) (el as HTMLInputElement).indeterminate = someSelected;
                                                            }}
                                                            onCheckedChange={toggleSelectAll}
                                                            aria-label="Select all"
                                                        />
                                                    </TableHead>
                                                )}
                                                <TableHead className="text-xs font-semibold">ENDPOINT</TableHead>
                                                <TableHead className="text-xs font-semibold text-center">STATUS</TableHead>
                                                <TableHead className="text-xs font-semibold text-right">ACTIONS</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allEndpoints.map((item) => (
                                                <TableRow
                                                    key={item.id}
                                                    className={selectedIds.has(item.id) ? "bg-muted/40" : ""}
                                                >
                                                    {selectMode && (
                                                        <TableCell className="w-8">
                                                            <Checkbox
                                                                checked={selectedIds.has(item.id)}
                                                                onCheckedChange={() => toggleSelect(item.id)}
                                                                aria-label={`Select ${item.label}`}
                                                            />
                                                        </TableCell>
                                                    )}

                                                    <TableCell
                                                        className={`font-mono text-sm max-w-[280px] truncate ${
                                                            item.status === "SCANNING" ? "text-orange-500" : "text-foreground"
                                                        }`}
                                                        title={item.url}
                                                    >
                                                        {item.label}
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${
                                                                item.status === "FOUND"
                                                                    ? "text-green-600"
                                                                    : item.status === "ERROR"
                                                                    ? "text-red-500"
                                                                    : "text-orange-500"
                                                            }`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${
                                                                item.status === "FOUND"
                                                                    ? "bg-green-500"
                                                                    : item.status === "ERROR"
                                                                    ? "bg-red-400"
                                                                    : "bg-orange-400 animate-pulse"
                                                            }`} />
                                                            {item.status}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs gap-1 text-primary hover:text-primary"
                                                                onClick={() => handlePreview(item.url)}
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                                Preview
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                                                onClick={() => handleDelete(item.id)}
                                                                title="Remove endpoint"
                                                            >
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
                                Integrate your API dashboard directly into your existing internal
                                tools or public documentation pages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                                <pre>{embedCode}</pre>
                            </div>
                            <Button className="w-full" variant="default" onClick={handleCopySnippet}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Snippet
                            </Button>
                        </CardContent>
                    </Card>

                    <Alert>
                        <AlertDescription>
                            <div className="space-y-3">
                                <h3 className="font-semibold">Need help?</h3>
                                <p className="text-xs text-muted-foreground">
                                    Check out our developer guides or chat with our automated
                                    assistant for quick integration tips.
                                </p>
                                <Button variant="link" className="h-auto p-0 text-xs">
                                    Go to Help Center →
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            {/* ── Fixed bottom actions ── */}
            <div className="fixed bottom-4 right-5 flex flex-col items-end gap-2 z-50">
                <Button size="icon" className="h-11 w-11 rounded-full">
                    <MessageCircle className="h-8 w-8" />
                </Button>
                <Button size="sm" onClick={handleSaveEndpoint} disabled={isSaving}>
                    {isSaving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                    ) : "Save Endpoint"}
                </Button>
            </div>

            {/* ── Delete Selected Confirmation Dialog ── */}
            <Dialog open={deleteSelOpen} onOpenChange={setDeleteSelOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            {selectedIds.size === allEndpoints.length
                                ? "Delete All Endpoints"
                                : `Delete ${selectedIds.size} Endpoint${selectedIds.size !== 1 ? "s" : ""}`}
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete{" "}
                            <span className="font-semibold">{selectedIds.size}</span>{" "}
                            endpoint{selectedIds.size !== 1 ? "s" : ""} and all their stored data
                            (including full scraped content used by the chatbot).
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDeleteSelOpen(false)} disabled={isDeletingAll}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSelected} disabled={isDeletingAll}>
                            {isDeletingAll ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting…</>
                            ) : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Preview Modal ── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            Endpoint Preview
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto mt-2 pr-1">
                        {isLoadingPreview ? (
                            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm">Loading preview…</span>
                            </div>
                        ) : previewError ? (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
                                {previewError}
                            </div>
                        ) : previewData ? (
                            <PreviewContent data={previewData} />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}