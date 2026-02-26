"use client"
import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Send, Bot, RefreshCw, X, Loader2 } from "lucide-react"

interface EmbedChatInterfaceProps {
    projectId: string
    botName: string
    primaryColor: string
    welcomeMessage: string
    inputPlaceholder: string
    poweredByText: string
}

export default function EmbedChatInterface({
    projectId,
    botName,
    primaryColor,
    welcomeMessage,
    inputPlaceholder,
    poweredByText,
}: EmbedChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [input, setInput] = useState("")
    const [inputFocused, setInputFocused] = useState(false)

    const { messages, sendMessage, status, setMessages } = useChat({
        id: projectId,
        transport: new DefaultChatTransport({
            api: "/api/chat",
            body: { projectId }
        })
    })

    const isChatLoading = status === 'submitted' || status === 'streaming'

    useEffect(() => {
        if (messages.length === 0 && !isChatLoading) {
            setMessages([
                { id: 'welcome', role: 'assistant', parts: [{ type: 'text', text: welcomeMessage }] } as UIMessage
            ])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === 'WIDGET_OPENED') setIsWidgetOpen(true)
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const [isWidgetOpen, setIsWidgetOpen] = useState(true)

    const handleClose = () => {
        window.parent.postMessage({ type: 'CLOSE_WIDGET' }, '*')
    }

    const handleClearChat = () => {
        setMessages([
            { id: 'welcome-reset', role: 'assistant', parts: [{ type: 'text', text: welcomeMessage }] } as UIMessage
        ])
    }

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isChatLoading) return
        sendMessage({ text: input })
        setInput("")
    }

    return (
        <div className="flex flex-col h-screen w-full bg-background border rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 text-white shrink-0"
                style={{ backgroundColor: primaryColor }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">{botName}</h3>
                        <div className="flex items-center gap-1.5 opacity-90">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <span className="text-[10px] uppercase font-medium tracking-wider">Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                        title="Clear conversation"
                    >
                        <RefreshCw className="w-4 h-4 opacity-80" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                        title="Close chat"
                    >
                        <X className="w-5 h-5 opacity-80" />
                    </button>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                {messages.map((message) => {
                    const textContent = (message.parts || [])
                        .filter((p) => p.type === 'text')
                        .map((p) => (p as { type: 'text'; text: string }).text)
                        .join('\n') || (message as { content?: string }).content

                    return (
                        <div
                            key={message.id}
                            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role !== 'user' && (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                                    style={{ backgroundColor: `${primaryColor}20` }}>
                                    <Bot className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                </div>
                            )}
                            <div
                                className={`px-4 py-2.5 max-w-[85%] text-sm ${message.role === 'user'
                                    ? 'text-white rounded-2xl rounded-tr-sm'
                                    : 'bg-card text-card-foreground border rounded-2xl rounded-tl-sm'
                                    }`}
                                style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                            >
                                {textContent}
                            </div>
                        </div>
                    )
                })}

                {isChatLoading && (
                    <div className="flex gap-2 justify-start">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
                            style={{ backgroundColor: `${primaryColor}20` }}>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: primaryColor }} />
                        </div>
                        <div className="px-4 py-3 bg-card border rounded-2xl rounded-tl-sm text-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={onSubmit} className="p-3 bg-background border-t shrink-0">
                <div className="relative flex items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="w-full pl-4 pr-12 py-3 rounded-full border bg-muted/50 text-sm transition-all outline-none"
                        style={inputFocused ? { boxShadow: `0 0 0 2px ${primaryColor}` } : {}}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        disabled={isChatLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isChatLoading || !input.trim()}
                        className="absolute right-1.5 w-8 h-8 rounded-full shadow-sm hover:shadow"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Send className="w-4 h-4 text-white" />
                    </Button>
                </div>
                {poweredByText && (
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-muted-foreground">{poweredByText}</span>
                    </div>
                )}
            </form>
        </div>
    )
}
