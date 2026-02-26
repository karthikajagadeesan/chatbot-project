"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, Trash, Copy, Eye, Play } from "lucide-react";

import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

import { getAgent, updateAgent, deleteAgent } from "@/app/(main)/agents/action";

// Reusable floating chatbot widget
import { ChatbotWidget } from "@/components/chatbot-widget";

//  Page 

export default function AgentDetailsPage() {
    const { agentId } = useParams();
    const router      = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [agent,   setAgent]   = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);

    //  Form fields (live state — widget reads these directly) 
    const [name,           setName]           = useState("");
    const [primaryColor,   setPrimaryColor]   = useState("#3b82f6");
    const [welcomeMessage, setWelcomeMessage] = useState("");
    const [botName,        setBotName]        = useState("");
    const [domains,        setDomains]        = useState("");

    //  Load agent once 
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
            }
            setLoading(false);
        };
        load();
    }, [agentId]);

    //  Save handler 
    const handleSave = async () => {
        setSaving(true);
        const domainList = domains.split(",").map((d) => d.trim()).filter(Boolean);
        const result = await updateAgent(agentId as string, {
            name,
            allowed_domains: domainList,
            config: { ...agent?.config, primaryColor, welcomeMessage, botName },
        });
        setSaving(false);
        if (result.success) {
            toast.success("Agent updated successfully");
            setAgent(result.data);
            // Note: no need to sync previewConfig separately —
            // the widget reads primaryColor/botName/welcomeMessage directly from state.
        } else {
            toast.error(result.message ?? "Failed to update agent");
        }
    };

    //  Delete handler 
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

    //  Copy embed script 
    const copyWidgetScript = () => {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const script = `<script src="${origin}/widget.js" data-agent-id="${agentId}" defer></script>`;
        navigator.clipboard.writeText(script);
        toast.success("Widget script copied!");
    };

    //  Guards 
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Loading agent configuration…
            </div>
        );
    }
    if (!agent) {
        return <div className="p-8 text-muted-foreground">Agent not found</div>;
    }

    return (
        <div>
            <Header
                icon={Play}
                heading={agent.name}
                description="Configure your chatbot's branding and deployment settings."
                breadcrumbs={[
                    { label: "Dashboard",  href: "/dashboard" },
                    { label: "Chatbots",   href: "/agents" },
                    { label: agent.name },
                ]}
            />

            {/*  Knowledge-base nudge banner  */}
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                    Save your settings, then add knowledge sources so your bot can answer questions.
                </span>
                <Link
                    href={`/agents/${agentId}/ingest`}
                    className="ml-auto whitespace-nowrap text-primary font-medium hover:underline text-xs"
                >
                    Knowledge Base →
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/*  Left col: Branding form  */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Branding &amp; Identity</CardTitle>
                            <CardDescription>
                                Customize how your chatbot looks and feels. Changes to color and
                                name are reflected live in the chat widget.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">

                            {/* Display name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="agent-name">Display Name</Label>
                                <Input
                                    id="agent-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="E.g. Support Bot"
                                />
                            </div>

                            {/* Bot avatar name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="bot-name">Bot Avatar Name</Label>
                                <Input
                                    id="bot-name"
                                    value={botName}
                                    onChange={(e) => setBotName(e.target.value)}
                                    placeholder="E.g. AI Assistant"
                                />
                            </div>

                            {/* Primary color */}
                            <div className="space-y-1.5">
                                <Label>Primary Theme Color</Label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="h-9 w-12 cursor-pointer rounded border border-input bg-background p-0.5"
                                    />
                                    <Input
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        placeholder="#3b82f6"
                                        className="font-mono w-32"
                                        maxLength={7}
                                    />
                                </div>
                                {/* Quick-pick swatches */}
                                <div className="flex gap-2 mt-2">
                                    {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setPrimaryColor(c)}
                                            className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                                            style={{
                                                backgroundColor: c,
                                                borderColor: primaryColor === c ? "#1e293b" : "transparent",
                                            }}
                                            aria-label={`Set color ${c}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    The chat bubble and widget header update in real-time as you change this.
                                </p>
                            </div>

                            {/* Welcome message */}
                            <div className="space-y-1.5">
                                <Label htmlFor="welcome">Welcome Message</Label>
                                <Textarea
                                    id="welcome"
                                    value={welcomeMessage}
                                    onChange={(e) => setWelcomeMessage(e.target.value)}
                                    placeholder="Hello! How can I help you today?"
                                    rows={3}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center">
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash className="h-4 w-4 mr-2" />
                            Delete Agent
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? "Saving…" : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {/* Right col: Deployment  */}
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
                                        {`<script\n  src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js"\n  data-agent-id="${agentId}"\n  defer\n></script>`}
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

                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => router.push(`/agents/${agentId}/preview`)}
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Widget Fullscreen
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Hint card */}
                    <Card className="border-dashed">
                        <CardContent className="pt-5 text-center space-y-2">
                            <div
                                className="h-10 w-10 rounded-full mx-auto flex items-center justify-center transition-colors duration-300"
                                style={{ backgroundColor: primaryColor + "22" }}
                            >
                                {/* Mini bot icon inherits live color */}
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={primaryColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5 transition-colors duration-300"
                                >
                                    <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" />
                                    <path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium">Live Chat Widget</p>
                            <p className="text-xs text-muted-foreground">
                                The chat bubble at the bottom-right reflects your current color and
                                name settings in real-time. Click it to test your bot.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <ChatbotWidget
                agentId={agentId as string}
                primaryColor={primaryColor}
                botName={botName}
                welcomeMessage={welcomeMessage}
            />
        </div>
    );
}