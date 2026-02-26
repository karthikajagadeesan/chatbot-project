"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { BarChart3, BookOpen, Database, Link2, TrendingUp, CheckCircle2, XCircle, ShieldCheck } from "lucide-react"

interface AnalyticsProps {
    projectId: string
}

interface Stats {
    totalChunks: number
    totalEndpoints: number
    trainedEndpoints: number
    approvedEndpoints: number
    unapprovedEndpoints: number
}

const StatCard = ({ label, value, icon: Icon, sub }: {
    label: string
    value: number | string
    icon: React.ElementType
    sub?: string
}) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card transition-shadow">
        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            {sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>}
        </div>
    </div>
)

export default function AnalyticsDashboard({ projectId }: AnalyticsProps) {
    const [stats, setStats] = useState<Stats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const supabase = createClient()

            const [chunksRes, endpointsRes] = await Promise.all([
                supabase
                    .from("content_chunks")
                    .select("id, endpoint_id", { count: "exact" })
                    .eq("project_id", projectId),
                supabase
                    .from("scraped_endpoints")
                    .select("id, status, is_approved")
                    .eq("project_id", projectId)
            ])

            const all = endpointsRes.data ?? []
            const trainedIds = new Set(
                all.filter(e => e.status === "INGESTED").map(e => e.id)
            )
            const approvedIds = new Set(
                all.filter(e => e.is_approved).map(e => e.id)
            )

            // Chunks that come from an approved + trained endpoint
            const allChunks = chunksRes.data ?? []
            const activeChunkCount = allChunks.filter(
                c => c.endpoint_id === null || (approvedIds.has(c.endpoint_id) && trainedIds.has(c.endpoint_id))
            ).length

            setStats({
                totalChunks: activeChunkCount,    // only chunks the bot can actually use
                totalEndpoints: all.length,
                trainedEndpoints: all.filter(e => trainedIds.has(e.id)).length,
                approvedEndpoints: all.filter(e => approvedIds.has(e.id) && trainedIds.has(e.id)).length,
                unapprovedEndpoints: all.filter(e => !e.is_approved).length,
            })
            setIsLoading(false)
        }
        load()
    }, [projectId])


    // Coverage = approved+trained out of all discovered endpoints
    const coverage = stats && stats.totalEndpoints > 0
        ? Math.round((stats.approvedEndpoints / stats.totalEndpoints) * 100)
        : 0

    const coverageLabel =
        coverage === 100
            ? "✅ All trained endpoints are active. Your chatbot has full knowledge coverage."
            : coverage === 0
                ? "⚠️ No endpoints are approved and trained yet. Go to Scraping / Data to get started."
                : `ℹ️ ${stats?.approvedEndpoints} of ${stats?.totalEndpoints} endpoints are active (approved + trained).`

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Knowledge Base Analytics
                </h2>
                <p className="text-sm text-muted-foreground">
                    Live snapshot of your chatbot's active knowledge — only approved endpoints are shown.
                </p>
            </div>


            {isLoading ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted" />
                ))}
            </div> :
                <div className="space-y-6">


                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            label="Active Knowledge Chunks"
                            value={stats?.totalChunks ?? 0}
                            icon={Database}
                            sub="From approved + trained endpoints"
                        />
                        <StatCard
                            label="Endpoints Discovered"
                            value={stats?.totalEndpoints ?? 0}
                            icon={Link2}
                        />
                        <StatCard
                            label="Ingested Endpoints"
                            value={stats?.trainedEndpoints ?? 0}
                            icon={BookOpen}
                            sub="Processed and indexed"
                        />
                        <StatCard
                            label="Active Coverage"
                            value={`${coverage}%`}
                            icon={TrendingUp}
                            sub="Approved + trained / total"
                        />
                    </div>

                    {/* Coverage progress bar */}
                    <div className="p-5 rounded-xl border bg-card space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 font-medium">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Active Training Coverage
                            </div>
                            <span className="text-muted-foreground font-mono text-xs">
                                {stats?.approvedEndpoints} / {stats?.totalEndpoints} active
                            </span>
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-700"
                                style={{ width: `${coverage}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{coverageLabel}</p>
                    </div>

                    {/* Approved vs disabled breakdown */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-lg font-bold">{stats?.approvedEndpoints ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Approved & active endpoints</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
                            <XCircle className="w-5 h-5 text-destructive shrink-0" />
                            <div>
                                <p className="text-lg font-bold">{stats?.unapprovedEndpoints ?? 0}</p>
                                <p className="text-xs text-muted-foreground">Disabled endpoints (excluded from bot)</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border rounded-xl bg-muted/20 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Coming Soon: Conversation Analytics</p>
                        <p>
                            In a future release, we will track live chat conversations and display metrics like total sessions,
                            most frequently asked questions, and user satisfaction.
                        </p>
                    </div>
                </div>
            }
        </div>
    )
}
