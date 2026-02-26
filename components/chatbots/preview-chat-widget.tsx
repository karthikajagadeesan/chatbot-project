"use client"
import { useState } from "react"
import { X, MessageCircle, ExternalLink, Loader2 } from "lucide-react"

interface PreviewChatWidgetProps {
    projectId: string
    botName: string
    primaryColor: string
}

export default function PreviewChatWidget({ projectId, botName, primaryColor }: PreviewChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)

    // The embed route is the production chat UI – identical to what's served on user sites
    const embedUrl = `/embed/${projectId}`

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="w-[380px] h-[560px] flex flex-col rounded-2xl border overflow-hidden bg-background animate-in slide-in-from-bottom-4 duration-300"
                    style={{ boxShadow: `0 8px 48px 0 ${primaryColor}50` }}
                >
                    {/* Preview label bar */}
                    <div
                        className="flex items-center justify-between px-4 py-2.5 text-white shrink-0"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                                Live Preview — {botName}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <a
                                href={embedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
                                title="Close preview"
                            >
                                <X className="w-4 h-4 opacity-80" />
                            </button>
                        </div>
                    </div>

                    {/* Iframe — loads the real embed chatbot */}
                    <div className="relative flex-1">
                        {!iframeLoaded && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
                                <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
                                <p className="text-xs">Loading chatbot preview…</p>
                            </div>
                        )}
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-0"
                            title={`Live preview — ${botName}`}
                            onLoad={() => setIframeLoaded(true)}
                            allow="microphone"
                        />
                    </div>
                </div>
            )}

            {/* Toggle Bubble */}
            <button
                onClick={() => setIsOpen((o) => !o)}
                className="w-14 h-14 rounded-full shadow-md flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: primaryColor }}
                title={isOpen ? "Close preview chat" : "Open live preview chat"}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <MessageCircle className="w-6 h-6" />
                )}
            </button>
        </div>
    )
}
