"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import { Shield, Plus, Loader2, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { getAgent } from "@/app/(main)/agents/action";
import { ingestUrl, getAgentDocuments, deleteDocument,
} from "@/app/(main)/agents/[agentId]/ingest/action";
import { format } from "date-fns";

export default function IngestPage() {
    const { agentId } = useParams();
    const [agent, setAgent] = useState<any>(null);
    const [url, setUrl] = useState("");
    const [ingesting, setIngesting] = useState(false);
    const [docs, setDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    const fetchData = async () => {
        const agentData = await getAgent(agentId as string);
        setAgent(agentData);

        setLoadingDocs(true);
        const docData = await getAgentDocuments(agentId as string);
        setDocs(docData ?? []);
        setLoadingDocs(false);
    };

    useEffect(() => {
        fetchData();
    }, [agentId]);

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        setIngesting(true);
        const result = await ingestUrl(agentId as string, trimmedUrl);
        setIngesting(false);

        if (result.success) {
            toast.success(`Ingested ${result.data?.count ?? 0} chunks successfully!`);
            setUrl("");
            fetchData();
        } else {
            toast.error(result.message ?? "Failed to ingest URL");
        }
    };

    const handleDelete = async (docId: string) => {
        const result = await deleteDocument(docId);
        if (result.success) {
            toast.success("Chunk deleted");
            setDocs((prev) => prev.filter((d) => d.id !== docId));
        } else {
            toast.error("Failed to delete chunk");
        }
    };

    const uniqueSources = [
        ...new Set(docs.map((d) => d.metadata?.url).filter(Boolean)),
    ];

    if (!agent && !loadingDocs) {
        return (
            <div className="p-8 text-center text-destructive">Agent not found</div>
        );
    }

    return (
        <div className="space-y-6">
            <Header
                icon={Shield}
                heading="Knowledge Base"
                description="Ingest URLs to give your AI agent knowledge to answer questions."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots", href: "/agents" },
                    { label: agent?.name ?? "...", href: `/agents/${agentId}` },
                    { label: "Knowledge" },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* URL Input */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Knowledge Source</CardTitle>
                            <CardDescription>
                                Provide a URL to scrape text and generate embeddings for your agent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleIngest} className="flex gap-3">
                                <Input
                                    className="flex-1"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/docs/page"
                                    disabled={ingesting}
                                    type="url"
                                />
                                <Button type="submit" disabled={ingesting || !url.trim()}>
                                    {ingesting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Ingesting...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add URL
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Sources summary */}
                    {uniqueSources.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Ingested Sources</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {uniqueSources.map((src) => (
                                    <Badge
                                        key={src as string}
                                        variant="secondary"
                                        className="text-xs font-mono"
                                    >
                                        {new URL(src as string).hostname}
                                        {new URL(src as string).pathname !== "/"
                                            ? new URL(src as string).pathname
                                            : ""}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Chunks table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Knowledge Chunks</CardTitle>
                            <CardDescription>
                                These are the pieces of information your agent uses to answer questions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Content Preview</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingDocs ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : docs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No chunks yet. Add a URL above to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        docs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="max-w-xs">
                                                    <p className="text-sm truncate">{doc.content}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Chunk #{(doc.metadata?.chunk_index ?? 0) + 1}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                                                    {doc.metadata?.url
                                                        ? new URL(doc.metadata.url).hostname
                                                        : "Manual"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(doc.created_at), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(doc.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Knowledge Base Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Chunks</span>
                                <span className="font-bold text-lg">{docs.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Sources</span>
                                <span className="font-bold text-lg">{uniqueSources.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Embedding</span>
                                <Badge
                                    variant="outline"
                                    className="text-green-700 border-green-200 text-xs"
                                >
                                    Gemini 768d
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            How it works
                        </h4>
                        <ul className="text-xs space-y-2 text-slate-600">
                            <li>1. We fetch the HTML content of the URL.</li>
                            <li>2. Content is cleaned and chunked into ~1000 characters.</li>
                            <li>3. Gemini generates vector embeddings for each chunk.</li>
                            <li>4. During chat, we find the most relevant chunks to answer.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
