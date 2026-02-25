"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy, Code, ExternalLink } from "lucide-react"

interface EmbedCodeGeneratorProps {
    projectId: string
}

export default function EmbedCodeGenerator({ projectId }: EmbedCodeGeneratorProps) {
    const [copied, setCopied] = useState(false)
    const [baseUrl, setBaseUrl] = useState("http://localhost:3000") // Fallback

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin)
        }
    }, [])

    const widgetScriptUrl = `${baseUrl}/widget.js`

    const embedCode = `
<!-- EmbedChat Widget -->
<script>
  window.EmbedChatConfig = {
    projectId: "${projectId}",
    domain: "${baseUrl}"
  };
</script>
<script src="${widgetScriptUrl}" defer></script>
`.trim()

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-semibold tracking-tight mb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Embed on your Website
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                    Copy and paste the following snippet into the <code className="bg-muted px-1 py-0.5 rounded text-xs">&lt;body&gt;</code> of your website. The widget will automatically appear in the bottom right corner of your page.
                </p>
            </div>

            <div className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-xl blur transition-all group-hover:bg-primary/10"></div>
                <div className="relative bg-zinc-950 rounded-xl overflow-hidden border">
                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">HTML</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <><Check className="w-3.5 h-3.5 mr-1" /> Copied</>
                            ) : (
                                <><Copy className="w-3.5 h-3.5 mr-1" /> Copy Code</>
                            )}
                        </Button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
                            <code>{embedCode}</code>
                        </pre>
                    </div>
                </div>
            </div>

            <div className="bg-muted/30 p-4 border rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Test your integration separately</h4>
                <p className="text-xs text-muted-foreground mb-4">
                    Before embedding, you can verify your standalone widget route works exactly as it will appear inside the iframe.
                </p>
                <Button variant="outline" size="sm" asChild>
                    <a href={`/embed/${projectId}`} target="_blank" rel="noopener noreferrer">
                        Open standalone embed <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                </Button>
            </div>
        </div>
    )
}
