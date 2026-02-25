"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/header";
import { MessageSquare, Settings, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
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
import Link from "next/link";
import { getAgents, deleteAgent } from "@/app/(main)/agents/action";
import { CreateAgentDialog } from "@/components/agents/create-agent-dialog";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AgentsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchAgents = async () => {
        setLoading(true);
        const data = await getAgents();
        setAgents(data);
        setLoading(false);
    };

    const handleDelete = async (agentId: string) => {
        setDeletingId(agentId);
        await deleteAgent(agentId);
        await fetchAgents();
        setDeletingId(null);
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    return (
        <div className="space-y-6">
            <Header
                icon={MessageSquare}
                heading="Chatbots"
                description="Manage your AI chatbot agents and their knowledge bases."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots" },
                ]}
            />

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Active Agents</h2>
                <CreateAgentDialog onSuccess={fetchAgents} />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent Name</TableHead>
                                <TableHead>Domains</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Loading agents...
                                    </TableCell>
                                </TableRow>
                            ) : agents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No agents found. Create your first chatbot to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                agents.map((agent) => (
                                    <TableRow key={agent.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: agent.config?.primaryColor ?? "#3b82f6" }}
                                                />
                                                {agent.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {agent.allowed_domains?.length > 0 ? (
                                                    agent.allowed_domains.map((domain: string) => (
                                                        <Badge key={domain} variant="outline" className="text-xs">
                                                            {domain}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">All domains</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(agent.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/agents/${agent.id}`}>
                                                        <Settings className="h-4 w-4 mr-1" />
                                                        Configure
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/agents/${agent.id}/ingest`}>
                                                        <Shield className="h-4 w-4 mr-1" />
                                                        Knowledge
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            disabled={deletingId === agent.id}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            {deletingId === agent.id ? "Deleting..." : "Delete"}
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone and will permanently remove the agent and all its associated data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-red-500 hover:bg-red-600"
                                                                onClick={() => handleDelete(agent.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Agents</span>
                            <span className="text-2xl font-bold">{agents.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="outline" className="text-green-600 border-green-200">
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}