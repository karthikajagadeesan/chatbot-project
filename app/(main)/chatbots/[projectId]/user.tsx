"use client"
import { useEffect, useState, Suspense } from "react"
import { useProjectStore } from "@/store/user/project-store"
import { getProjectsAction, deleteProjectAction } from "@/app/actions/project-actions"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrainCircuit, Globe, BarChart3, Settings2, Code, Loader2, FolderArchive, Trash2, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import ScraperView from "@/components/chatbots/scraper-view"
import Header from "@/components/header"
import AgentConfigView from "@/components/chatbots/agent-config-view"
import EmbedCodeGenerator from "@/components/chatbots/embed-code-generator"
import AnalyticsDashboard from "@/components/chatbots/analytics-dashboard"
import PreviewChatWidget from "@/components/chatbots/preview-chat-widget"
import AppearanceConfig from "@/components/chatbots/appearance-config"
import ProjectOverview from "@/components/chatbots/project-overview"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from "@/components/ui/dialog"

function ProjectDetailContent({ projectId }: { projectId: string }) {
    const router = useRouter()
    const { projects, setProjects, setCurrentProject, currentProject, removeProject } = useProjectStore()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(true)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Controlled tab — mirrors the ?tab= query param so quick-action links work
    const activeTab = searchParams.get('tab') || 'overview'

    useEffect(() => {
        async function loadProject() {
            // First, check if the project is already in the store
            const existing = projects.find(p => p.id === projectId)
            if (existing) {
                setCurrentProject(existing)
                setIsLoading(false)
                return
            }

            // Not in store (new project, navigation from another page, etc.) — re-fetch
            setIsLoading(true)
            const response = await getProjectsAction()
            if (response.success && response.data) {
                setProjects(response.data)
                const found = response.data.find(p => p.id === projectId)
                setCurrentProject(found || null)
            } else {
                toast.error("Failed to load project details")
                setCurrentProject(null)
            }
            setIsLoading(false)
        }
        loadProject()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId])

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!currentProject) {
        return (
            <div className="p-8 text-center space-y-4">
                <h2 className="text-xl font-bold">Project not found</h2>
                <p className="text-muted-foreground">This project doesn&apos;t exist or you don&apos;t have access.</p>
                <Button asChild><Link href="/chatbots">Back to Chatbots</Link></Button>
            </div>
        )
    }

    const handleDeleteProject = async () => {
        setIsDeleting(true)
        const res = await deleteProjectAction(currentProject.id)
        if (res.success) {
            toast.success("Project deleted")
            removeProject(currentProject.id)
            setCurrentProject(null)
            router.push("/chatbots")
        } else {
            toast.error(res.message || "Failed to delete project")
        }
        setIsDeleting(false)
        setDeleteDialogOpen(false)
    }

    return (
        <div className="space-y-2">
            <Header
                icon={FolderArchive}
                heading={currentProject.name}
                description={currentProject.target_url}
                specialButtons={
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                        <Trash2 className="w-4 h-4 mr-1.5" /> Delete Chatbot
                    </Button>
                }
            />

            {/* Tab order: 1. Overview → 2. AI Agent Details → 3. Scraping/Data → 4. Analytics → 5. Embed Widget */}
            <Tabs value={activeTab} onValueChange={(tab) => router.push(`?tab=${tab}`)} className="w-full">
                <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto overflow-x-auto p-1 bg-secondary">
                    <TabsTrigger value="overview" className="rounded-md">
                        <BrainCircuit className="w-4 h-4 mr-2 hidden sm:flex" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="agent" className="rounded-md">
                        <Settings2 className="w-4 h-4 mr-2 hidden sm:flex" /> AI Agent Details
                    </TabsTrigger>
                    <TabsTrigger value="scraping" className="rounded-md">
                        <Globe className="w-4 h-4 mr-2 hidden sm:flex" /> Scraping / Data
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-md">
                        <BarChart3 className="w-4 h-4 mr-2 hidden sm:flex" /> Analytics
                    </TabsTrigger>
                    <TabsTrigger value="embed" className="rounded-md">
                        <Code className="w-4 h-4 mr-2 hidden sm:flex" /> Embed Widget
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-md">
                        <Palette className="w-4 h-4 mr-2 hidden sm:flex" /> Appearance
                    </TabsTrigger>
                </TabsList>

                <div className="border rounded-xl bg-card p-6 min-h-[calc(100dvh-10rem)]">
                    <TabsContent value="overview" className="mt-0">
                        <ProjectOverview project={currentProject} />
                    </TabsContent>
                    <TabsContent value="agent" className="mt-0 text-foreground">
                        <AgentConfigView project={currentProject} />
                    </TabsContent>
                    <TabsContent value="scraping" className="mt-0 text-foreground">
                        <ScraperView projectId={projectId} targetUrl={currentProject.target_url} />
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-0 text-foreground">
                        <AnalyticsDashboard projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="embed" className="mt-0 text-foreground">
                        <EmbedCodeGenerator projectId={projectId} />
                    </TabsContent>
                    <TabsContent value="appearance" className="mt-0 text-foreground">
                        <AppearanceConfig project={currentProject} />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Floating live-preview chatbot widget — visible across all tabs */}
            {(() => {
                const config = (currentProject.agent_config as Record<string, string> | null) ?? {}
                const botName = config.bot_name || "AI Assistant"
                const primaryColor = config.primary_color || "#6366f1"
                return (
                    <PreviewChatWidget
                        projectId={projectId}
                        botName={botName}
                        primaryColor={primaryColor}
                    />
                )
            })()}

            {/* Delete project confirmation */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete &quot;{currentProject.name}&quot;?
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete the chatbot, all its scraped endpoints, and knowledge base data. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
                            {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting…</> : "Delete Chatbot"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function UserProjectDetail({ projectId }: { projectId: string }) {
    return (
        <Suspense fallback={<div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <ProjectDetailContent projectId={projectId} />
        </Suspense>
    )
}
