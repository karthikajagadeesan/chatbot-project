"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Palette, Bot, MessageSquareText, Save, Loader2, Eye, RotateCcw } from "lucide-react"
import { updateProjectAction } from "@/app/actions/project-actions"
import { useProjectStore } from "@/store/user/project-store"
import type { Tables } from "@/type/database-type"
import type { Json } from "@/type/database-type"

interface AppearanceConfigProps {
    project: Tables<"projects">
}

interface AgentAppearance {
    bot_name: string
    primary_color: string
    welcome_message: string
    input_placeholder: string
    powered_by_text: string
}

const PRESET_COLORS = [
    { label: "Indigo", value: "#6366f1" },
    { label: "Violet", value: "#8b5cf6" },
    { label: "Sky", value: "#0ea5e9" },
    { label: "Emerald", value: "#10b981" },
    { label: "Rose", value: "#f43f5e" },
    { label: "Amber", value: "#f59e0b" },
    { label: "Slate", value: "#475569" },
    { label: "Zinc", value: "#18181b" },
]

const DEFAULTS: AgentAppearance = {
    bot_name: "AI Support",
    primary_color: "#6366f1",
    welcome_message: "Hi there! How can I help you today?",
    input_placeholder: "Type your message...",
    powered_by_text: "Powered by EmbedChat",
}

function parseConfig(raw: Json | null): AgentAppearance {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULTS }
    const c = raw as Record<string, string>
    return {
        bot_name: c.bot_name || DEFAULTS.bot_name,
        primary_color: c.primary_color || DEFAULTS.primary_color,
        welcome_message: c.welcome_message || DEFAULTS.welcome_message,
        input_placeholder: c.input_placeholder || DEFAULTS.input_placeholder,
        powered_by_text: c.powered_by_text || DEFAULTS.powered_by_text,
    }
}

export default function AppearanceConfig({ project }: AppearanceConfigProps) {
    const { setCurrentProject, updateProjectInStore } = useProjectStore()

    const [form, setForm] = useState<AgentAppearance>(() => parseConfig(project.agent_config))
    const [isSaving, setIsSaving] = useState(false)

    // Keep in sync if the parent project changes (e.g. after a refresh)
    useEffect(() => {
        setForm(parseConfig(project.agent_config))
    }, [project.id])

    const set = useCallback(<K extends keyof AgentAppearance>(key: K, value: AgentAppearance[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleReset = () => setForm({ ...DEFAULTS })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await updateProjectAction(project.id, { agent_config: form as unknown as Json })
            if (res.success && res.data) {
                toast.success("Appearance saved!")
                setCurrentProject(res.data)
                updateProjectInStore(res.data.id, res.data)
            } else {
                toast.error(res.message || "Failed to save appearance")
            }
        } catch {
            toast.error("An unexpected error occurred")
        }
        setIsSaving(false)
    }

    return (
        <div className="space-y-8 ">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" /> Agent Appearance
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Customise how your chatbot looks and sounds on your website. Changes are reflected in the live preview widget.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* ── Left: Settings ──────────────────────────────── */}
                <div className="space-y-6">
                    {/* Bot Name */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Bot className="w-3.5 h-3.5" /> Bot Name
                        </Label>
                        <Input
                            value={form.bot_name}
                            onChange={e => set("bot_name", e.target.value)}
                            placeholder="e.g. AI Support"
                            maxLength={40}
                        />
                        <p className="text-xs text-muted-foreground">Displayed in the chatbot header.</p>
                    </div>

                    {/* Primary Color */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5" /> Primary Color
                        </Label>
                        {/* Preset swatches */}
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.label}
                                    onClick={() => set("primary_color", c.value)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${form.primary_color === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                        {/* Custom hex picker */}
                        <div className="flex items-center gap-2">
                            <div
                                className="w-9 h-9 rounded-lg border shrink-0 cursor-pointer overflow-hidden relative"
                                style={{ backgroundColor: form.primary_color }}
                            >
                                <input
                                    type="color"
                                    value={form.primary_color}
                                    onChange={e => set("primary_color", e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    title="Pick custom colour"
                                />
                            </div>
                            <Input
                                value={form.primary_color}
                                onChange={e => set("primary_color", e.target.value)}
                                placeholder="#6366f1"
                                className="font-mono text-sm"
                                maxLength={7}
                            />
                        </div>
                    </div>

                    {/* Welcome Message */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-1.5">
                            <MessageSquareText className="w-3.5 h-3.5" /> Welcome Message
                        </Label>
                        <Textarea
                            value={form.welcome_message}
                            onChange={e => set("welcome_message", e.target.value)}
                            placeholder="Hi there! How can I help you today?"
                            className="resize-none min-h-[80px] text-sm"
                            maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">First message visitors see when they open the chat.</p>
                    </div>

                    {/* Input Placeholder */}
                    <div className="space-y-2">
                        <Label>Input Placeholder</Label>
                        <Input
                            value={form.input_placeholder}
                            onChange={e => set("input_placeholder", e.target.value)}
                            placeholder="Type your message..."
                            maxLength={60}
                        />
                    </div>

                    {/* Powered By */}
                    <div className="space-y-2">
                        <Label>Powered-by Text</Label>
                        <Input
                            value={form.powered_by_text}
                            onChange={e => set("powered_by_text", e.target.value)}
                            placeholder="Powered by EmbedChat"
                            maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground">Shown at the bottom of the chat widget. Leave blank to hide.</p>
                    </div>
                </div>

                {/* ── Right: Live Preview ──────────────────────────── */}
                <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-primary" /> Preview
                    </p>
                    <div className="rounded-2xl border ring-1 ring-border overflow-hidden w-full max-w-[320px]">
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-4 py-3 text-white"
                            style={{ backgroundColor: form.primary_color }}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold leading-tight">{form.bot_name || "AI Support"}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                                        <span className="text-[10px] uppercase font-medium tracking-wider opacity-90">Online</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Messages */}
                        <div className="bg-muted/20 p-4 space-y-3 min-h-[160px]">
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                                    style={{ backgroundColor: `${form.primary_color}22` }}>
                                    <Bot className="w-3.5 h-3.5" style={{ color: form.primary_color }} />
                                </div>
                                <div className="px-3.5 py-2.5 max-w-[82%] text-sm rounded-2xl rounded-tl-sm bg-card text-card-foreground border">
                                    {form.welcome_message || "Hi there!"}
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <div className="px-3.5 py-2.5 max-w-[82%] text-sm rounded-2xl rounded-tr-sm text-white"
                                    style={{ backgroundColor: form.primary_color }}>
                                    Hello! Can you help me?
                                </div>
                            </div>
                        </div>
                        {/* Input bar */}
                        <div className="bg-background border-t px-3 py-2.5 flex items-center gap-2">
                            <div className="flex-1 rounded-full border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground truncate">
                                {form.input_placeholder || "Type your message..."}
                            </div>
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: form.primary_color }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                </svg>
                            </div>
                        </div>
                        {/* Powered by */}
                        {form.powered_by_text && (
                            <p className="text-center text-[10px] text-muted-foreground py-1.5 bg-background border-t">
                                {form.powered_by_text}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
                    {isSaving
                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>
                        : <><Save className="w-4 h-4 mr-2" /> Save Appearance</>}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Defaults
                </Button>
            </div>
        </div>
    )
}
