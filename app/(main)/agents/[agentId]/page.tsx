"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/header";
import {
    MessageSquare, Save, Trash, Copy, ExternalLink,
    Palette, Play, BookOpen, ArrowRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { getAgent, updateAgent, deleteAgent } from "@/app/(main)/agents/action";
import Link from "next/link";
import EmbedChatPage from "@/app/embed/[agentId]/page";

export default function AgentDetailsPage() {
    const { agentId } = useParams();
    const router = useRouter();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#3b82f6");
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [botName, setBotName] = useState("");
    const [domains, setDomains] = useState("");

    // ── Live preview config: only updates AFTER clicking Save ──────────────
    const [previewConfig, setPreviewConfig] = useState<{
        primaryColor: string;
        botName: string;
        welcomeMessage: string;
    }>({
        primaryColor: "#3b82f6",
        botName: "AI Assistant",
        welcomeMessage: "",
    });

    useEffect(() => {
        const load = async () => {
            const data = await getAgent(agentId as string);
            if (data) {
                setAgent(data);
                setName(data.name ?? "");
                setPrimaryColor(data.config?.primaryColor ?? "#3b82f6");
                setWelcomeMessage(data.config?.welcomeMessage ?? "");
                setBotName(data.config?.botName ?? "AI Assistant");
                setDomains(data.allowed_domains?.join(", ") ?? "");
                setPreviewConfig({
                    primaryColor: data.config?.primaryColor ?? "#3b82f6",
                    botName: data.config?.botName ?? "AI Assistant",
                    welcomeMessage: data.config?.welcomeMessage ?? "",
                });
            }
            setLoading(false);
        };
        load();
    }, [agentId]);

    const handleSave = async () => {
        setSaving(true);
        const domainList = domains.split(",").map((d) => d.trim()).filter(Boolean);
        const result = await updateAgent(agentId as string, {
            name,
            allowed_domains: domainList,
            config: {
                ...agent?.config,
                primaryColor,
                welcomeMessage,
                botName,
            },
        });
        setSaving(false);

        if (result.success) {
            toast.success("Agent updated successfully");
            setAgent(result.data);
            // ✅ Only update Live Preview after successful save
            setPreviewConfig({ primaryColor, botName, welcomeMessage });
        } else {
            toast.error(result.message ?? "Failed to update agent");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this agent? This cannot be undone.")) return;
        const result = await deleteAgent(agentId as string);
        if (result.success) {
            toast.success("Agent deleted");
            router.push("/agents");
        } else {
            toast.error(result.message ?? "Failed to delete");
        }
    };

    const copyWidgetScript = () => {
        const script = `<script src="${window.location.origin}/widget.js" data-agent-id="${agentId}" defer></script>`;
        navigator.clipboard.writeText(script);
        toast.success("Widget script copied!");
    };

    // ✅ Navigate to the in-app fullscreen preview page (sidebar + header visible)
    const openFullscreenPreview = () => {
        router.push(`/agents/${agentId}/preview`);
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Loading agent configuration...
            </div>
        );
    }
    if (!agent) {
        return <div className="p-8 text-center text-destructive">Agent not found</div>;
    }

    return (
        <div className="space-y-6">
            <Header
                icon={MessageSquare}
                heading={`Configure: ${agent.name}`}
                description="Customize your chatbot appearance and deployment settings."
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Chatbots", href: "/agents" },
                    { label: agent.name },
                ]}
            />

            {/* Next-step banner */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                    Save your settings, then add knowledge sources so your bot can answer questions.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0"
                    asChild
                >
                    <Link href={`/agents/${agentId}/ingest`}>
                        Knowledge Base
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-primary" />
                                <CardTitle>Branding &amp; Identity</CardTitle>
                            </div>
                            <CardDescription>
                                Customize how your chatbot looks and feels to your users.
                                Click <strong>Save Changes</strong> to update the Live Preview →
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="agent-name">Display Name</Label>
                                    <Input
                                        id="agent-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="E.g. Support Bot"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bot-name">Bot Avatar Name</Label>
                                    <Input
                                        id="bot-name"
                                        value={botName}
                                        onChange={(e) => setBotName(e.target.value)}
                                        placeholder="E.g. AI Assistant"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="primary-color">Primary Theme Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="primary-color"
                                        type="color"
                                        className="w-12 h-10 p-1 cursor-pointer rounded-md"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <Input
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        placeholder="#3b82f6"
                                        className="font-mono"
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                                            <button
                                                key={c}
                                                title={c}
                                                onClick={() => setPrimaryColor(c)}
                                                className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                                                style={{
                                                    backgroundColor: c,
                                                    borderColor: primaryColor === c ? "#1e293b" : "transparent",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="welcome-msg">Welcome Message</Label>
                                <Textarea
                                    id="welcome-msg"
                                    value={welcomeMessage}
                                    onChange={(e) => setWelcomeMessage(e.target.value)}
                                    placeholder="Hello! How can I help you today?"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Agent
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Right: Deployment + Live Preview */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Play className="h-4 w-4" />
                                Deployment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                                    Embed Script
                                </Label>
                                <div className="relative">
                                    <pre className="bg-slate-950 text-slate-50 p-3 rounded-md text-[10px] overflow-x-auto whitespace-pre-wrap break-all pr-10">
                                        {`<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-agent-id="${agentId}" defer></script>`}
                                    </pre>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute right-1 top-1 h-6 w-6 text-slate-400 hover:text-white"
                                        onClick={copyWidgetScript}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            {/* ✅ Navigates to in-app preview (sidebar + header visible) */}
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={openFullscreenPreview}
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Preview Widget Fullscreen
                            </Button>
                        </CardContent>
                    </Card>

                    {/* ── Live Preview Card — updates only after Save ── */}
                    <Card className="overflow-hidden border shadow-sm">
                        <CardHeader className="bg-muted/50 py-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                <Eye className="h-3.5 w-3.5" />
                                Live Preview
                            </CardTitle>
                            <span className="text-[10px] text-muted-foreground italic">
                                Updates after Save
                            </span>
                        </CardHeader>
                        <CardContent className="p-0 h-[460px] overflow-hidden bg-slate-100">
                            <EmbedChatPage
                                agentId={agentId as string}
                                isPreview={true}
                                previewConfig={previewConfig}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}