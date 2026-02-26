import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bot, Globe, CalendarDays, CheckCircle2, Clock, AlertCircle, Settings2, Database, BarChart3, Code, Palette, ExternalLink, Activity, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { checkProjectCompletenessAction, updateProjectAction } from "@/app/actions/project-actions"
import type { Tables } from "@/type/database-type"

interface ProjectOverviewProps {
    project: Tables<"projects">
}

function statusMeta(status: string | null) {
    switch (status?.toLowerCase()) {
        case "live": return { label: "Live", icon: ShieldCheck, cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
        case "draft": return { label: "Draft", icon: Clock, cls: "text-amber-500   bg-amber-500/10   border-amber-500/20" }
        case "pending": return { label: "Pending", icon: AlertCircle, cls: "text-rose-500    bg-rose-500/10    border-rose-500/20" }
        default: return { label: "Pending", icon: AlertCircle, cls: "text-rose-500    bg-rose-500/10    border-rose-500/20" }
    }
}

const QUICK_ACTIONS = [
    { label: "AI Agent Details", tab: "agent", icon: Settings2, desc: "Manage LLM config & API keys" },
    { label: "Scraping / Data", tab: "scraping", icon: Database, desc: "Manage scraped knowledge base" },
    { label: "Analytics", tab: "analytics", icon: BarChart3, desc: "View chat stats & usage" },
    { label: "Embed Widget", tab: "embed", icon: Code, desc: "Copy your embed snippet" },
    { label: "Appearance", tab: "appearance", icon: Palette, desc: "Customise chatbot look & feel" },
]

export default function ProjectOverview({ project }: ProjectOverviewProps) {
    const router = useRouter()
    const [completeness, setCompleteness] = useState<{ isComplete: boolean; missing: string[] } | null>(null)
    const [currentStatus, setCurrentStatus] = useState(project.status)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        const checkCompleteness = async () => {
            const res = await checkProjectCompletenessAction(project.id)
            if (res.success && res.data) {
                setCompleteness(res.data)
                // Auto-set status to pending if incomplete
                if (!res.data.isComplete && currentStatus !== "pending") {
                    await updateProjectAction(project.id, { status: "pending" })
                    setCurrentStatus("pending")
                } else if (res.data.isComplete && currentStatus === "pending") {
                    // Auto-promote to live once complete
                    await updateProjectAction(project.id, { status: "live" })
                    setCurrentStatus("live")
                }
            }
        }
        checkCompleteness()
    }, [project.id, currentStatus])

    const handleStatusToggle = async (checked: boolean) => {
        if (!completeness?.isComplete) return

        setIsUpdating(true)
        const newStatus = checked ? "live" : "draft"
        const res = await updateProjectAction(project.id, { status: newStatus })

        if (res.success) {
            setCurrentStatus(newStatus)
            toast.success(`Project is now ${newStatus}`)
        } else {
            toast.error(res.message)
        }
        setIsUpdating(false)
    }

    const { label: statusLabel, icon: StatusIcon, cls: statusCls } = statusMeta(currentStatus)
    const config = (project.agent_config as Record<string, string> | null) ?? {}
    const botName = config.bot_name || "AI Support"
    const primaryColor = config.primary_color || "#6366f1"
    const welcomeMsg = config.welcome_message || null

    const createdAt = project.created_at
        ? new Date(project.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—"

    const go = (tab: string) => router.push(`?tab=${tab}`)

    return (
        <div className="space-y-6">
            {/* ── Top: status + meta ───────────────────────────────────────── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
                    <a
                        href={project.target_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        {project.target_url}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {completeness?.isComplete && (
                        <div className="grid grid-cols-2 items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border">
                            <span className="text-xs font-medium text-muted-foreground">
                                {currentStatus === "live" ? "Live" : "Draft"}
                            </span>
                            <Switch
                                checked={currentStatus === "live"}
                                onCheckedChange={handleStatusToggle}
                                disabled={isUpdating}
                            />
                            {isUpdating && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        </div>
                    )}
                    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium border ${statusCls}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusLabel}
                    </Badge>
                </div>
            </div>

            {/* ── Missing Config Alert ─────────────────────────────────────── */}
            {completeness && !completeness.isComplete && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-rose-600">Configuration Incomplete</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your chatbot is currently restricted to app-only preview. To enable it on your domain, please complete the following:
                            <span className="font-semibold block mt-1">
                                {completeness.missing.join(", ")}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stat cards row ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Bot name */}
                <div className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bot Name</p>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                            <Bot className="w-4 h-4" style={{ color: primaryColor }} />
                        </div>
                    </div>
                    <p className="text-base font-semibold truncate">{botName}</p>
                </div>
                {/* Primary color */}
                <div className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Theme</p>
                        <div className="w-7 h-7 rounded-lg border" style={{ backgroundColor: primaryColor }} />
                    </div>
                    <p className="text-base font-semibold font-mono">{primaryColor}</p>
                </div>
                {/* Status */}
                <div className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p>
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                    <p className={`text-base font-semibold capitalize`}>{statusLabel}</p>
                </div>
                {/* Created */}
                <div className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created</p>
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                    <p className="text-base font-semibold">{createdAt}</p>
                </div>
            </div>

            {/* ── Welcome message preview ──────────────────────────────────── */}
            {welcomeMsg && (
                <div className="rounded-xl border bg-card p-4 space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome Message</p>
                    <p className="text-sm text-foreground">{welcomeMsg}</p>
                </div>
            )}

            {/* ── Quick-action shortcuts ───────────────────────────────────── */}
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map(({ label, tab, icon: Icon, desc }) => (
                        <button
                            key={tab}
                            onClick={() => go(tab)}
                            className="flex items-center gap-3 text-left rounded-xl border bg-card px-4 py-3.5 hover:bg-muted/50 hover:border-primary/30 transition-all group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                <Icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium leading-tight group-hover:text-primary transition-colors">{label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Project ID (useful for embed) ─────────────────────────────── */}
            <div className="rounded-xl border bg-muted/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-xs text-muted-foreground font-medium">Project ID</p>
                    <p className="text-xs font-mono text-foreground mt-0.5 break-all">{project.id}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => go("embed")}>
                    <Code className="w-3.5 h-3.5 mr-1.5" /> Get Embed Code
                </Button>
            </div>
        </div>
    )
}
