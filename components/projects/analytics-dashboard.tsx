"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { BarChart3, MessageSquare, BookOpen, Database, Link, TrendingUp } from "lucide-react"

interface AnalyticsProps {
    projectId: string
}

interface Stats {
    totalChunks: number
    totalEndpoints: number
    trainedEndpoints: number
    approvedEndpoints: number
}

const StatCard = ({ label, value, icon: Icon, color }: {
    label: string
    value: number | string
    icon: React.ElementType
    color: string
}) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
        <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
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
                supabase.from("content_chunks").select("id", { count: "exact", head: true }).eq("project_id", projectId),
                supabase.from("scraped_endpoints").select("status, is_approved").eq("project_id", projectId)
            ])

            const totalChunks = chunksRes.count ?? 0
            const all = endpointsRes.data ?? []
            const totalEndpoints = all.length
            const trainedEndpoints = all.filter(e => e.status === "TRAINED").length
            const approvedEndpoints = all.filter(e => e.is_approved).length

            setStats({ totalChunks, totalEndpoints, trainedEndpoints, approvedEndpoints })
            setIsLoading(false)
        }
        load()
    }, [projectId])

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-muted" />
                ))}
            </div>
        )
    }

    const coverage = stats && stats.totalEndpoints > 0
        ? Math.round((stats.trainedEndpoints / stats.totalEndpoints) * 100)
        : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Knowledge Base Analytics
                </h2>
                <p className="text-sm text-muted-foreground">
                    A snapshot of your project's indexed knowledge and coverage.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Knowledge Chunks Indexed" value={stats?.totalChunks ?? 0} icon={Database} color="bg-blue-500/10 text-blue-600" />
                <StatCard label="Endpoints Discovered" value={stats?.totalEndpoints ?? 0} icon={Link} color="bg-purple-500/10 text-purple-600" />
                <StatCard label="Endpoints Trained" value={stats?.trainedEndpoints ?? 0} icon={BookOpen} color="bg-green-500/10 text-green-600" />
                <StatCard label="Knowledge Coverage" value={`${coverage}%`} icon={TrendingUp} color="bg-orange-500/10 text-orange-600" />
            </div>

            {/* Coverage bar */}
            <div className="p-5 rounded-xl border bg-card space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                        <MessageSquare className="w-4 h-4 text-primary" />
                        Training Coverage
                    </div>
                    <span className="text-muted-foreground font-mono text-xs">{stats?.trainedEndpoints} / {stats?.totalEndpoints} endpoints</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-700"
                        style={{ width: `${coverage}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    {coverage === 100
                        ? "✅ All discovered endpoints have been trained! Your chatbot has full knowledge coverage."
                        : coverage === 0
                            ? "⚠️ No endpoints have been trained yet. Go to the Scraping tab to approve and train endpoints."
                            : `ℹ️ ${100 - coverage}% of endpoints still need to be approved and trained for full coverage.`}
                </p>
            </div>

            <div className="p-5 border rounded-xl bg-muted/20 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Coming Soon: Conversation Analytics</p>
                <p>
                    In a future release, we will track live chat conversations and display metrics like total sessions,
                    most frequently asked questions, and user satisfaction. All data will be stored privately and securely in your Supabase project.
                </p>
            </div>
        </div>
    )
}
