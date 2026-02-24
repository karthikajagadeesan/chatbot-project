"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Monitor } from "lucide-react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAgent } from "@/app/(main)/agents/action";
import EmbedChatPage from "@/app/embed/[agentId]/page";
import Link from "next/link";

export default function AgentPreviewPage() {
    const { agentId } = useParams();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!agentId) return;
        getAgent(agentId as string).then((data) => {
            setAgent(data);
            setLoading(false);
        });
    }, [agentId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-[calc(100svh-160px)] w-full rounded-xl" />
            </div>
        );
    }

    const primaryColor = agent?.config?.primaryColor ?? "#3b82f6";
    const botName = agent?.config?.botName ?? "AI Assistant";

    return (
        <div className="flex flex-col h-[calc(100svh-32px)] space-y-4">
            {/* ── Page Header ─────────────────────────────────────────── */}
            <Header
                icon={Monitor}
                heading={`Preview: ${agent?.name ?? "Chatbot"}`}
                description="This is how your widget looks to end-users. Fully interactive — try chatting!"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots", href: "/agents" },
                    { label: agent?.name ?? "Agent", href: `/agents/${agentId}` },
                    { label: "Preview" },
                ]}
                specialButtons={
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="gap-1.5 text-xs font-medium border-green-300 text-green-700 bg-green-50"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            Live
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/agents/${agentId}`}>
                                ← Back to Configure
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* ── Chat Widget ─────────────────────────────────────────── */}
            <Card className="flex-1 overflow-hidden shadow-md border">
                <CardContent className="p-0 h-full">
                    <EmbedChatPage
                        agentId={agentId as string}
                        isPreview={true}
                        previewConfig={{
                            primaryColor,
                            botName,
                            welcomeMessage: agent?.config?.welcomeMessage ?? "",
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}