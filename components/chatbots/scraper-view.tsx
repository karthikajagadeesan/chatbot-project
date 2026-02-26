"use client"

import { useEffect, useState } from "react"
import { useScraperStore } from "@/store/user/scraper-store"
import {
    getScrapedEndpointsAction, startScrapingAction, updateEndpointApprovalAction,
    deleteEndpointAction, getEndpointPreviewAction, bulkDeleteEndpointsAction
} from "@/app/actions/scraper-actions"
import { ingestProjectAction } from "@/app/actions/ingest-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    ScanSearch, Loader2, Trash2, Globe, FileJson, Eye, BrainCircuit
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

export default function ScraperView({ projectId, targetUrl }: { projectId: string, targetUrl: string }) {
    const { endpoints, setEndpoints, updateEndpoint, removeEndpoint } = useScraperStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isScraping, setIsScraping] = useState(false)
    const [isIngesting, setIsIngesting] = useState(false)

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isDeletingBulk, setIsDeletingBulk] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)

    // Preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewContent, setPreviewContent] = useState<string>("")
    const [isPreviewLoading, setIsPreviewLoading] = useState(false)
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

    const allSelected = endpoints.length > 0 && selectedIds.size === endpoints.length
    const someSelected = selectedIds.size > 0 && !allSelected

    useEffect(() => {
        async function loadEndpoints() {
            setIsLoading(true)
            const response = await getScrapedEndpointsAction(projectId)
            if (response.success && response.data) {
                setEndpoints(response.data)
            } else {
                toast.error("Failed to load endpoints")
            }
            setIsLoading(false)
        }
        loadEndpoints()
    }, [projectId, setEndpoints])

    // Clear selection when endpoints list changes
    useEffect(() => { setSelectedIds(new Set()) }, [endpoints])

    const handleScrape = async () => {
        setIsScraping(true)
        const toastId = toast.loading("Scanning target URL for endpoints...")
        const response = await startScrapingAction(projectId, targetUrl)
        if (response.success && response.data) {
            toast.success(response.message, { id: toastId })
            const listResponse = await getScrapedEndpointsAction(projectId)
            if (listResponse.success && listResponse.data) setEndpoints(listResponse.data)
        } else {
            toast.error(response.message || "Scraping failed", { id: toastId })
        }
        setIsScraping(false)
    }

    const handleIngest = async () => {
        setIsIngesting(true)
        const response = await ingestProjectAction(projectId)
        if (response.success && response.data) {
            toast.success(`Training Complete! Processed ${response.data.processed} endpoints.`)
            const updatedEndpoints = await getScrapedEndpointsAction(projectId)
            if (updatedEndpoints.success && updatedEndpoints.data) setEndpoints(updatedEndpoints.data)
        } else {
            toast.error(response.message || "Failed to train agent")
        }
        setIsIngesting(false)
    }

    const handleApprovalToggle = async (endpointId: string, currentVal: boolean) => {
        const newVal = !currentVal
        updateEndpoint(endpointId, { is_approved: newVal })
        const response = await updateEndpointApprovalAction(endpointId, newVal)
        if (!response.success) {
            updateEndpoint(endpointId, { is_approved: currentVal })
            toast.error("Failed to update approval status")
        }
    }

    const handleDelete = async (endpointId: string) => {
        const response = await deleteEndpointAction(endpointId)
        if (response.success) {
            removeEndpoint(endpointId)
            toast.success("Endpoint deleted")
        } else {
            toast.error("Failed to delete endpoint")
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(endpoints.map(e => e.id)))
        }
    }

    const handleBulkDelete = async () => {
        setIsDeletingBulk(true)
        const ids = Array.from(selectedIds)
        const res = await bulkDeleteEndpointsAction(ids)
        if (res.success) {
            toast.success(res.message ?? `${ids.length} endpoint(s) deleted`)
            ids.forEach(id => removeEndpoint(id))
            setSelectedIds(new Set())
        } else {
            toast.error(res.message || "Failed to delete selected endpoints")
        }
        setIsDeletingBulk(false)
        setConfirmOpen(false)
    }

    const getTypeIcon = (type: string | null) => {
        if (type === 'rest_api' || type === 'graphql') return <FileJson className="w-4 h-4 text-blue-500" />
        return <Globe className="w-4 h-4 text-muted-foreground" />
    }

    const handlePreview = async (url: string) => {
        setPreviewUrl(url)
        setIsPreviewLoading(true)
        setPreviewDialogOpen(true)
        const response = await getEndpointPreviewAction(url)
        if (response.success && response.data !== undefined) {
            setPreviewContent(response.data || "(No readable text extracted from this page)")
        } else {
            setPreviewContent("Failed to load preview: " + response.message)
            toast.error("Preview failed")
        }
        setIsPreviewLoading(false)
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── Header row ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Discovered Endpoints</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage the URLs and APIs your AI agent will crawl and learn from.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setConfirmOpen(true)}
                            disabled={isDeletingBulk}
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={handleScrape} disabled={isScraping || isIngesting} variant="outline">
                        {isScraping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</> : <><ScanSearch className="w-4 h-4 mr-2" />Scan Website</>}
                    </Button>
                    <Button
                        onClick={handleIngest}
                        disabled={isScraping || isIngesting || endpoints.filter(e => e.is_approved && e.status !== 'INGESTED').length === 0}
                    >
                        {isIngesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Training...</> : <><BrainCircuit className="w-4 h-4 mr-2" />Train Agent</>}
                    </Button>
                </div>
            </div>

            {/* ── Table ── */}
            {isLoading ? (
                <div className="flex h-40 items-center justify-center border rounded-lg bg-card/50 border-dashed">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : endpoints.length === 0 ? (
                <div className="flex flex-col h-40 items-center justify-center border rounded-lg bg-card/50 border-dashed text-center p-6 space-y-2">
                    <ScanSearch className="w-8 h-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium">No endpoints found</p>
                    <p className="text-xs text-muted-foreground">Click &apos;Scan Website&apos; to discover URLs automatically.</p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* Select-all checkbox */}
                                <TableHead className="w-10 px-3">
                                    <Checkbox
                                        checked={allSelected}
                                        ref={el => { if (el) (el as unknown as HTMLInputElement & { indeterminate: boolean }).indeterminate = someSelected }}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-[100px]">Status</TableHead>
                                <TableHead>URL Path</TableHead>
                                <TableHead className="w-[100px] text-center">Type</TableHead>
                                <TableHead className="w-[100px] text-center">Approved</TableHead>
                                <TableHead className="w-[100px] text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {endpoints.map((ep) => {
                                let displayUrl = ep.url
                                try {
                                    if (new URL(ep.url).origin === new URL(targetUrl).origin) {
                                        displayUrl = new URL(ep.url).pathname + new URL(ep.url).search
                                    }
                                } catch { }

                                return (
                                    <TableRow key={ep.id} className={selectedIds.has(ep.id) ? "bg-muted/40" : ""}>
                                        <TableCell className="px-3">
                                            <Checkbox
                                                checked={selectedIds.has(ep.id)}
                                                onCheckedChange={() => toggleSelect(ep.id)}
                                                aria-label={`Select ${ep.url}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {ep.status === 'INGESTED' ? (
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">TRAINED</Badge>
                                            ) : ep.status === 'ERROR' ? (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">ERROR</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{ep.status || 'FOUND'}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[280px] truncate" title={ep.url}>
                                            <a href={ep.url} target="_blank" rel="noreferrer" className="hover:underline">{displayUrl}</a>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center" title={ep.type || 'unknown'}>{getTypeIcon(ep.type)}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={!!ep.is_approved}
                                                onCheckedChange={() => handleApprovalToggle(ep.id, !!ep.is_approved)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={() => handlePreview(ep.url)} title="Preview Content">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(ep.id)} title="Delete Endpoint">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* ── Bulk Delete Confirm Dialog ── */}
            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete {selectedIds.size} Endpoint{selectedIds.size !== 1 ? "s" : ""}?
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete the selected endpoint{selectedIds.size !== 1 ? "s" : ""} and their stored data. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isDeletingBulk}>Cancel</Button>
                        <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingBulk}>
                            {isDeletingBulk ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Preview Dialog ── */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Endpoint Preview</DialogTitle>
                        <DialogDescription className="truncate" title={previewUrl || ""}>{previewUrl}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto bg-muted/30 border rounded-md p-4 mt-2">
                        {isPreviewLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 space-y-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Fetching live content...</p>
                            </div>
                        ) : (
                            <pre className="text-xs whitespace-pre-wrap font-mono break-words">
                                {previewContent || "No content found."}
                            </pre>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
