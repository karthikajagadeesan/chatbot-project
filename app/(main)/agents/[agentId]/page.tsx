"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/header";
import { MessageSquare, Save, Trash, Copy, ExternalLink, Palette, Globe, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { getAgent, updateAgent, deleteAgent } from "@/app/actions/chatbot";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

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

    useEffect(() => {
        const fetchAgent = async () => {
            const data = await getAgent(agentId as string);
            if (data) {
                setAgent(data);
                setName(data.name);
                setPrimaryColor(data.config?.primaryColor || "#3b82f6");
                setWelcomeMessage(data.config?.welcomeMessage || "");
                setBotName(data.config?.botName || "AI Assistant");
                setDomains(data.allowed_domains?.join(", ") || "");
            }
            setLoading(false);
        };
        fetchAgent();
    }, [agentId]);

    const handleSave = async () => {
        setSaving(true);
        const domainList = domains.split(",").map(d => d.trim()).filter(Boolean);
        const result = await updateAgent(agentId as string, {
            name,
            allowed_domains: domainList,
            config: {
                ...agent.config,
                primaryColor,
                welcomeMessage,
                botName,
            }
        });
        setSaving(false);

        if (result.success) {
            toast.success("Agent updated successfully");
            setAgent(result.data);
        } else {
            toast.error(result.message || "Failed to update agent");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

        const result = await deleteAgent(agentId as string);
        if (result.success) {
            toast.success("Agent deleted");
            router.push("/agents");
        } else {
            toast.error(result.message || "Failed to delete agent");
        }
    };

    const copyWidgetScript = () => {
        const script = `<script src="${window.location.origin}/widget.js" data-agent-id="${agentId}" defer></script>`;
        navigator.clipboard.writeText(script);
        toast.success("Widget script copied to clipboard");
    };

    if (loading) return <div className="p-8 text-center">Loading agent configurations...</div>;
    if (!agent) return <div className="p-8 text-center text-destructive">Agent not found</div>;

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Forms */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-primary" />
                                <CardTitle>Branding & Identity</CardTitle>
                            </div>
                            <CardDescription>
                                Customize how your chatbot looks and feels to your users.
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
                                <div className="flex gap-2">
                                    <Input
                                        id="primary-color"
                                        type="color"
                                        className="w-12 h-10 p-1"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <Input
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        placeholder="#3b82f6"
                                    />
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

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-primary" />
                                <CardTitle>Security & Access</CardTitle>
                            </div>
                            <CardDescription>
                                Restrict where your chatbot can be embedded.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="domains">Allowed Domains</Label>
                                <Input
                                    id="domains"
                                    value={domains}
                                    onChange={(e) => setDomains(e.target.value)}
                                    placeholder="example.com, myapp.io (comma separated)"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to allow all domains (for development).
                                </p>
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

                {/* Deployment & Preview */}
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
                                <Label className="text-xs">WIDGET SCRIPT</Label>
                                <div className="relative group">
                                    <pre className="bg-slate-950 text-slate-50 p-3 rounded-md text-[10px] overflow-x-auto whitespace-pre-wrap break-all pr-8">
                                        {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-agent-id="${agentId}" defer></script>`}
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
                            <Button className="w-full" variant="outline" asChild>
                                <Link href={`/embed/${agentId}`} target="_blank">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Preview Widget Fullscreen
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider">Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-[400px] bg-slate-100 flex items-center justify-center relative">
                            <iframe
                                src={`/embed/${agentId}?preview=true`}
                                className="w-full h-full border-none"
                                title="Chatbot Preview"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
