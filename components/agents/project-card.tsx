import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Tables } from "@/type/database-type"
import { Globe, Settings, ExternalLink } from "lucide-react"

export function ProjectCard({ project }: { project: Tables<"projects"> }) {
    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "ready": return "bg-green-500/10 text-green-500"
            case "scraping": return "bg-blue-500/10 text-blue-500"
            case "error": return "bg-red-500/10 text-red-500"
            default: return "bg-yellow-500/10 text-yellow-500"
        }
    }

    return (
        <Card className="flex flex-col h-full bg-card hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${getStatusColor(project.status)}`}>
                    {project.status || 'pending'}
                </span>
            </CardHeader>
            <CardContent className="flex-1 pb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 shrink-0" />
                    <a href={project.target_url} target="_blank" rel="noopener noreferrer" className="hover:underline line-clamp-1">
                        {project.target_url}
                    </a>
                </div>
            </CardContent>
            <CardFooter className="pt-0 flex gap-2 w-full mt-auto">
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                    <Link href={`/projects/${project.id}`}>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                    </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${project.id}?tab=embed`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Embed
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
