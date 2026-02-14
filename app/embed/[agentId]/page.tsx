"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useParams, useSearchParams } from "next/navigation";
import { getAgent } from "@/app/actions/chatbot";
import { cn } from "@/lib/utils";

export default function EmbedChatPage() {
    const { agentId } = useParams();
    const searchParams = useSearchParams();
    const isPreview = searchParams.get("preview") === "true";

    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const chatHelpers = useChat({
        api: "/api/chat",
        body: { agentId },
        initialMessages: agent?.config?.welcomeMessage ? [
            { id: 'welcome', role: 'assistant', content: agent.config.welcomeMessage } as any
        ] : []
    });

    const { messages, input, handleInputChange, handleSubmit, isLoading } = chatHelpers as any;

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAgent = async () => {
            const data = await getAgent(agentId as string);
            setAgent(data);
            setLoading(false);
        };
        fetchAgent();
    }, [agentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const primaryColor = agent?.config?.primaryColor || "#3b82f6";
    const botName = agent?.config?.botName || "AI Assistant";

    return (
        <div className={cn(
            "flex flex-col h-screen bg-white transition-all duration-300 border-none",
            isPreview ? "rounded-none" : "rounded-none shadow-none"
        )}>
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 text-white shrink-0"
                style={{ backgroundColor: primaryColor }}
            >
                <div className="flex items-center gap-2">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-sm font-semibold leading-none">{botName}</h1>
                        <p className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="w-12 h-12 bg-slate-200/50 rounded-full flex items-center justify-center">
                            <Bot className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">How can I help you today?</p>
                    </div>
                )}

                {messages.map((m: any) => (
                    <div
                        key={m.id}
                        className={cn(
                            "flex items-end gap-2 max-w-[85%]",
                            m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}
                    >
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback
                                className={cn(
                                    "text-[10px]",
                                    m.role === "user" ? "bg-slate-200 text-slate-700" : "text-white"
                                )}
                                style={m.role === "assistant" ? { backgroundColor: primaryColor } : {}}
                            >
                                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                "px-3 py-2 rounded-2xl text-sm shadow-sm",
                                m.role === "user"
                                    ? "bg-white text-slate-800 rounded-br-none border"
                                    : "text-white rounded-bl-none"
                            )}
                            style={m.role === "assistant" ? { backgroundColor: primaryColor } : {}}
                        >
                            {m.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-2">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-white" style={{ backgroundColor: primaryColor }}>
                                <Bot className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-100 px-3 py-2 rounded-2xl rounded-bl-none">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className="pr-12 rounded-full border-slate-200 focus:ring-0 focus-visible:ring-offset-0 focus-visible:ring-1"
                        style={{ '--tw-ring-color': primaryColor } as any}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                        disabled={!input || isLoading}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <div className="mt-2 text-[10px] text-center text-slate-400 font-medium">
                    Powered by <span className="text-slate-600">Antigravity AI</span>
                </div>
            </div>
        </div>
    );
}
