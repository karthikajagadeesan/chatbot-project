"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/header";
import { Shield, Plus, Globe, Search, Loader2, Trash2, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { getAgent } from "@/app/actions/chatbot";
import { ingestUrl, getAgentDocuments, deleteDocument } from "@/app/actions/ingest";
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
        setDocs(docData || []);
        setLoadingDocs(false);
    };

    useEffect(() => {
        fetchData();
    }, [agentId]);

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIngesting(true);
        const result = await ingestUrl(agentId as string, url);
        setIngesting(false);

        if (result.success) {
            toast.success(`Successfully ingested ${result.count} chunks from URL`);
            setUrl("");
            fetchData();
        } else {
            toast.error(result.message || "Failed to ingest URL");
        }
    };

    const handleDelete = async (docId: string) => {
        const result = await deleteDocument(docId);
        if (result.success) {
            toast.success("Document chunk deleted");
            setDocs(docs.filter(d => d.id !== docId));
        } else {
            toast.error("Failed to delete");
        }
    };

    if (!agent && !loadingDocs) return <div className="p-8 text-center">Agent not found</div>;

    return (
        <div className="space-y-6">
            <Header
                icon={Shield}
                heading="Knowledge Base"
                description="Ingest data from URLs to train your AI agent."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots", href: "/agents" },
                    { label: agent?.name || "...", href: `/agents/${agentId}` },
                    { label: "Knowledge" },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* URL Ingestion Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add Knowledge Source</CardTitle>
                            <CardDescription>
                                Provide a URL to scrape text and generate embeddings for your agent.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleIngest} className="flex gap-3">
                                <div className="flex-1">
                                    <Input
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/product-info"
                                        disabled={ingesting}
                                    />
                                </div>
                                <Button type="submit" disabled={ingesting || !url}>
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

                    {/* Ingested Content Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingested Knowledge Chunks</CardTitle>
                            <CardDescription>
                                These are the pieces of information your agent uses to answer questions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Content Snippet</TableHead>
                                        <TableHead>Source URL</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingDocs ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8">
                                                Loading documents...
                                            </TableCell>
                                        </TableRow>
                                    ) : docs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No knowledge chunks found. Ingest a URL to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        docs.map((doc) => (
                                            <TableRow key={doc.id}>
                                                <TableCell className="max-w-xs truncate">
                                                    {doc.content}
                                                </TableCell>
                                                <TableCell className="text-xs font-mono text-muted-foreground">
                                                    {doc.metadata?.url ? new URL(doc.metadata.url).hostname : "Manual"}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {format(new Date(doc.created_at), "MMM d, HH:mm")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Chunks</span>
                                <span className="font-bold">{docs.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Embedding Dimension</span>
                                <span className="font-bold text-green-600">768 (Gemini)</span>
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
