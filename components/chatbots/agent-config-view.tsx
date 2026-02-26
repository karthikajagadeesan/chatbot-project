"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter
} from "@/components/ui/sheet"
import { toast } from "sonner"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    Eye, EyeOff, Key, Loader2, Save, Bot, Plus, CheckCircle2, Trash2, Pencil
} from "lucide-react"
import type { AgentProvider } from "@/type/general-type"
import type { ProjectAgentConfig } from "@/type/general-type"
import type { Tables } from "@/type/database-type"
import {
    getAgentConfigsAction,
    createAgentConfigAction,
    updateAgentConfigAction,
    deleteAgentConfigAction,
    setActiveAgentConfigAction,
} from "@/app/actions/agent-config-actions"

interface AgentConfigViewProps { project: Tables<'projects'> }

const PROVIDER_MODELS: Record<AgentProvider, { label: string; value: string }[]> = {
    openai: [
        { label: "GPT-4o Mini (Best Value)", value: "gpt-4o-mini" },
        { label: "GPT-4o", value: "gpt-4o" },
        { label: "GPT-o3 Mini", value: "o3-mini" },
    ],
    gemini: [
        { label: "Gemini 2.0 Flash (Free ⚡)", value: "gemini-2.0-flash" },
        { label: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        { label: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
    ],
    anthropic: [
        { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
        { label: "Claude 3.5 Haiku (Fast)", value: "claude-3-5-haiku-20241022" },
    ],
    groq: [
        { label: "Llama 3.3 70B (Free ⚡)", value: "llama-3.3-70b-versatile" },
        { label: "Llama 3.1 8B (Fastest)", value: "llama-3.1-8b-instant" },
        { label: "Mixtral 8x7B", value: "mixtral-8x7b-32768" },
        { label: "Gemma 2 9B", value: "gemma2-9b-it" },
    ],
}
const PROVIDER_LABELS: Record<AgentProvider, string> = {
    openai: "OpenAI", gemini: "Google Gemini", anthropic: "Anthropic", groq: "Groq (Free)"
}
const PROVIDER_COLORS: Record<AgentProvider, string> = {
    openai: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
    gemini: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    anthropic: "bg-orange-500/10 border-orange-500/30 text-orange-600",
    groq: "bg-violet-500/10 border-violet-500/30 text-violet-600",
}

const DEFAULT_PROMPT = "You are a helpful A.I. assistant. Answer strictly using the provided context."

export default function AgentConfigView({ project }: AgentConfigViewProps) {
    const [configs, setConfigs] = useState<ProjectAgentConfig[]>([])
    const [activeConfigId, setActiveConfigId] = useState<string | null>(project.active_agent_config_id ?? null)
    const [isLoading, setIsLoading] = useState(true)

    // Sheet state
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editingConfigId, setEditingConfigId] = useState<string | null>(null)

    // Editor fields (live inside sheet)
    const [name, setName] = useState("New Agent")
    const [provider, setProvider] = useState<AgentProvider>("groq")
    const [model, setModel] = useState("llama-3.3-70b-versatile")
    const [apiKeys, setApiKeys] = useState<Record<AgentProvider, string>>({ openai: "", gemini: "", anthropic: "", groq: "" })
    const [embeddingApiKey, setEmbeddingApiKey] = useState("")
    const [basePrompt, setBasePrompt] = useState(DEFAULT_PROMPT)
    const [showApiKey, setShowApiKey] = useState(false)
    const [showEmbeddingKey, setShowEmbeddingKey] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const loadConfigs = useCallback(async () => {
        setIsLoading(true)
        const res = await getAgentConfigsAction(project.id)
        if (res.success && res.data) setConfigs(res.data)
        setIsLoading(false)
    }, [project.id])

    useEffect(() => { loadConfigs() }, [loadConfigs])

    function openNew() {
        setEditingConfigId(null)
        setName("New Agent")
        setProvider("groq")
        setModel("llama-3.3-70b-versatile")
        setApiKeys({ openai: "", gemini: "", anthropic: "", groq: "" })
        setEmbeddingApiKey("")
        setBasePrompt(DEFAULT_PROMPT)
        setShowApiKey(false)
        setShowEmbeddingKey(false)
        setSheetOpen(true)
    }

    function openEdit(cfg: ProjectAgentConfig) {
        setEditingConfigId(cfg.id)
        setName(cfg.name)
        setProvider(cfg.provider as AgentProvider)
        setModel(cfg.model)
        setApiKeys({
            openai: cfg.openai_api_key ?? "",
            gemini: cfg.gemini_api_key ?? "",
            anthropic: cfg.anthropic_api_key ?? "",
            groq: cfg.groq_api_key ?? "",
        })
        setEmbeddingApiKey(cfg.embedding_api_key ?? "")
        setBasePrompt(cfg.base_prompt ?? DEFAULT_PROMPT)
        setShowApiKey(false)
        setShowEmbeddingKey(false)
        setSheetOpen(true)
    }

    function handleProviderChange(p: AgentProvider) {
        setProvider(p)
        setModel(PROVIDER_MODELS[p][0].value)
    }

    async function handleSave() {
        setIsSaving(true)
        const payload = {
            name,
            provider,
            model,
            openai_api_key: apiKeys.openai || null,
            gemini_api_key: apiKeys.gemini || null,
            anthropic_api_key: apiKeys.anthropic || null,
            groq_api_key: apiKeys.groq || null,
            embedding_api_key: embeddingApiKey || null,
            base_prompt: basePrompt,
        }

        const res = editingConfigId
            ? await updateAgentConfigAction(editingConfigId, payload)
            : await createAgentConfigAction(project.id, payload)

        if (res.success) {
            toast.success(editingConfigId ? "Config updated!" : "Agent config created!")
            setSheetOpen(false)
            await loadConfigs()
        } else {
            toast.error(res.message || "Failed to save")
        }
        setIsSaving(false)
    }

    async function handleSetActive(configId: string) {
        const res = await setActiveAgentConfigAction(project.id, configId)
        if (res.success) {
            setActiveConfigId(configId)
            toast.success("Active agent updated!")
        } else {
            toast.error(res.message || "Failed to set active")
        }
    }

    async function handleDelete(configId: string) {
        if (!confirm("Delete this agent configuration?")) return
        const res = await deleteAgentConfigAction(configId)
        if (res.success) {
            toast.success("Config deleted")
            await loadConfigs()
            if (activeConfigId === configId) setActiveConfigId(null)
        } else {
            toast.error(res.message || "Failed to delete")
        }
    }

    return (
        <>
            {/* ── Editor Sheet ───────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto space-y-6 px-4">
                    <SheetHeader className="p-0 pt-4 pb-2">
                        <SheetTitle>{editingConfigId ? "Edit Agent Config" : "New Agent Config"}</SheetTitle>
                        <SheetDescription>Configure the AI provider, model, API keys, and system prompt for this agent.</SheetDescription>
                    </SheetHeader>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Config Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Customer Support Agent" />
                    </div>

                    {/* Provider */}
                    <div className="space-y-2">
                        <Label>AI Provider</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(PROVIDER_MODELS) as AgentProvider[]).map(p => (
                                <button key={p} type="button" onClick={() => handleProviderChange(p)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${provider === p ? PROVIDER_COLORS[p] + " border-[1.5px]" : "border-border bg-background text-muted-foreground hover:border-primary/40"}`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${provider === p ? "bg-current" : "bg-muted-foreground/40"}`} />
                                    {PROVIDER_LABELS[p]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model */}
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PROVIDER_MODELS[provider].map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" /> {PROVIDER_LABELS[provider]} API Key
                        </Label>
                        <div className="relative">
                            <Input type={showApiKey ? "text" : "password"}
                                value={apiKeys[provider]}
                                onChange={e => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                                placeholder={`Enter your ${PROVIDER_LABELS[provider]} API key`}
                                className="pr-10 font-mono text-xs"
                            />
                            <button type="button" onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">Each provider key is saved independently.</p>
                    </div>

                    {/* Embedding key — Groq/Anthropic only */}
                    {(provider === "groq" || provider === "anthropic") && (
                        <div className="space-y-2 p-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5">
                            <Label className="flex items-center gap-1.5 text-amber-600">
                                <Key className="w-3.5 h-3.5" />
                                Embedding API Key <span className="text-xs font-normal">(for training)</span>
                            </Label>
                            <div className="relative">
                                <Input type={showEmbeddingKey ? "text" : "password"}
                                    value={embeddingApiKey}
                                    onChange={e => setEmbeddingApiKey(e.target.value)}
                                    placeholder="Google (AIza...) or OpenAI (sk-...) key"
                                    className="pr-10 font-mono text-xs"
                                />
                                <button type="button" onClick={() => setShowEmbeddingKey(!showEmbeddingKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showEmbeddingKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-amber-600/80">{provider === "groq" ? "Groq" : "Anthropic"} has no embedding API. Required for RAG training.</p>
                        </div>
                    )}

                    {/* System Prompt */}
                    <div className="space-y-2">
                        <Label>System Prompt</Label>
                        <Textarea value={basePrompt} onChange={e => setBasePrompt(e.target.value)}
                            placeholder="e.g. You are a customer support agent..."
                            className="min-h-[150px] font-mono text-sm resize-none" />
                    </div>

                    <SheetFooter>
                        <Button onClick={handleSave} disabled={isSaving} className="w-full">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {editingConfigId ? "Save Changes" : "Create Config"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ── Config List ────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">AI Agent Configurations</h2>
                        <p className="text-sm text-muted-foreground mt-1">Set one config as active — it powers chat and knowledge base training.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={openNew}>
                        <Plus className="w-4 h-4 mr-1" /> New
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                ) : configs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground space-y-3">
                        <Bot className="w-8 h-8 mx-auto opacity-30" />
                        <p className="text-sm">No agent configs yet.</p>
                        <Button size="sm" variant="outline" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Create first config</Button>
                    </div>
                ) : (
                    <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {configs.map(cfg => (
                            <div key={cfg.id}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg border transition-all ${cfg.id === activeConfigId ? "border-primary/50 bg-primary/5" : "border-border"}`}
                            >
                                <Bot className="w-4 h-4 shrink-0 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{cfg.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {PROVIDER_LABELS[cfg.provider as AgentProvider] ?? cfg.provider} · {cfg.model}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {cfg.id === activeConfigId ? (
                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                                            <CheckCircle2 className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <Button size="sm" variant="ghost" className="text-xs h-7 px-2"
                                            onClick={() => handleSetActive(cfg.id)}>
                                            Set Active
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"
                                        onClick={() => openEdit(cfg)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(cfg.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
