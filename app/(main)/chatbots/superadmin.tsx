"use client"
import { useEffect, useState } from "react"
import { getSuperAdminProjectsAction } from "@/app/actions/project-actions"
import { Loader2, Globe } from "lucide-react"
import { toast } from "sonner"
import type { Tables } from "@/type/database-type"

type ProjectWithUser = Tables<'projects'> & {
    users?: { first_name: string | null; last_name: string | null; email: string | null }
}

export default function SuperAdminProjects() {
    const [projects, setProjects] = useState<ProjectWithUser[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadProjects() {
            try {
                const response = await getSuperAdminProjectsAction()
                if (response.success && response.data) {
                    setProjects(response.data as unknown as ProjectWithUser[]) // Cast to include joined user relations
                } else {
                    toast.error(response.message || "Failed to load projects")
                }
            } catch (error: any) {
                toast.error(error.message || "An error occurred fetching projects")
            } finally {
                setIsLoading(false)
            }
        }
        loadProjects()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Chatbots</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Platform-wide overview of all created chatbots.
                </p>
            </div>

            <div className="border rounded-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Project Name</th>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">URL</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id} className="bg-card border-b hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                                        {project.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        {project.users ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">
                                                    {project.users.first_name} {project.users.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{project.users.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground italic">Unknown Server</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-[200px] truncate">
                                        <a href={project.target_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center text-primary">
                                            <Globe className="w-3 h-3 mr-1" />
                                            {project.target_url}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                        ${project.status === 'live' || project.status === 'ready' ? 'bg-green-500/10 text-green-500' :
                                                project.status === 'scraping' ? 'bg-blue-500/10 text-blue-500' :
                                                    project.status === 'draft' ? 'bg-indigo-500/10 text-indigo-500' :
                                                        project.status === 'error' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-yellow-500/10 text-yellow-500'}`}>
                                            {project.status || 'pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(project.created_at || '').toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {projects.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">No projects found on the platform yet.</div>
                    )}
                </div>
            </div>
        </div>
    )
}
