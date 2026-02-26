"use client"
import { useEffect, useState } from "react"
import { useProjectStore } from "@/store/user/project-store"
import { getProjectsAction, createProjectAction } from "@/app/actions/project-actions"
import { ProjectCard } from "@/components/agents/project-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Header from "@/components/header"
import { useRouter } from "next/navigation"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"

export default function UserProjects() {
    const router = useRouter()
    const { projects, setProjects } = useProjectStore()
    const [isLoading, setIsLoading] = useState(true)

    // New project dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [projectName, setProjectName] = useState("")
    const [targetUrl, setTargetUrl] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    useEffect(() => {
        async function loadProjects() {
            try {
                const response = await getProjectsAction()
                if (response.success && response.data) {
                    setProjects(response.data)
                } else {
                    toast.error(response.message || "Failed to load projects")
                }
            } catch (error: unknown) {
                toast.error(error instanceof Error ? error.message : "An error occurred fetching projects")
            } finally {
                setIsLoading(false)
            }
        }
        loadProjects()
    }, [setProjects])

    function openDialog() {
        setProjectName("")
        setTargetUrl("")
        setDialogOpen(true)
    }

    async function handleCreate() {
        if (!projectName.trim()) { toast.error("Please enter a project name."); return }
        if (!targetUrl.trim()) { toast.error("Please enter a target URL."); return }
        try { new URL(targetUrl) } catch { toast.error("Please enter a valid URL (e.g. https://example.com)"); return }

        setIsCreating(true)
        const res = await createProjectAction({ name: projectName.trim(), targetUrl: targetUrl.trim() })
        if (!res.success || !res.data) {
            toast.error(res.message || "Failed to create project")
            setIsCreating(false)
            return
        }

        toast.success("Project created!")
        setProjects([res.data, ...projects])
        setDialogOpen(false)
        setIsCreating(false)
        router.push(`/chatbots/${res.data.id}`)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Header icon={PlusCircle} heading="Chatbots" description="Manage your chatbots"
                specialButtons={(
                    <Button onClick={openDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Chatbot
                    </Button>
                )}
            />

            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-card text-center shadow-sm">
                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                        <PlusCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No Chatbots yet</h2>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Get started by creating your first chatbot and training your AI on your website data.
                    </p>
                    <Button onClick={openDialog}>Create Chatbot</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {/* New Project Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>Enter a name and your website URL to get started.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">Project Name</Label>
                            <Input
                                id="project-name"
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                placeholder="e.g. My Support Bot"
                                disabled={isCreating}
                                onKeyDown={e => e.key === "Enter" && handleCreate()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target-url">Website URL</Label>
                            <Input
                                id="target-url"
                                value={targetUrl}
                                onChange={e => setTargetUrl(e.target.value)}
                                placeholder="https://example.com"
                                disabled={isCreating}
                                onKeyDown={e => e.key === "Enter" && handleCreate()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isCreating}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</> : "Create Project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
