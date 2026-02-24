"use client";

import React, { useEffect, useState, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Send, Bot, Sparkles, User, RotateCcw } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { getAgent } from "@/app/actions/chatbot";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

import type {
    Agent,
    EmbedChatPageProps,
    ChatMessage,
    MessageTimesMap,
} from "@/type/general-type";

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "59, 130, 246";
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function getLuminance(hex: string): number {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 0.5;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const SUGGESTED_PROMPTS = [
    "What can you help me with?",
    "Tell me about your features",
    "How do I get started?",
];

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton({ primaryColor }: { primaryColor: string }) {
    return (
        <div className="flex h-full min-h-[300px] flex-col">
            {/* Header skeleton */}
            <div
                className="shrink-0 px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: primaryColor, opacity: 0.9 }}
            >
                <Skeleton className="w-10 h-10 rounded-xl bg-white/20" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28 bg-white/20 rounded" />
                    <Skeleton className="h-2.5 w-20 bg-white/15 rounded" />
                </div>
            </div>
            {/* Messages skeleton */}
            <div className="flex-1 p-4 space-y-4 bg-muted/30">
                <div className="flex gap-2 items-end">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
                </div>
                <div className="flex gap-2 items-end flex-row-reverse">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="h-8 w-36 rounded-2xl rounded-br-sm" />
                </div>
                <div className="flex gap-2 items-end">
                    <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                    <Skeleton className="h-14 w-56 rounded-2xl rounded-bl-sm" />
                </div>
            </div>
            {/* Input skeleton */}
            <div className="px-3 py-3 bg-background border-t">
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </div>
    );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator({ primaryColor }: { primaryColor: string }) {
    return (
        <div className="flex items-end gap-2 mt-3">
            <Avatar className="w-7 h-7 shrink-0 shadow-sm">
                <AvatarFallback style={{ backgroundColor: primaryColor }}>
                    <Bot className="h-3.5 w-3.5 text-white" />
                </AvatarFallback>
            </Avatar>
            <Card className="border-border/60 shadow-sm">
                <CardContent className="px-4 py-2.5 flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{
                                backgroundColor: primaryColor,
                                opacity: 0.7,
                                animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                            }}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmbedChatPage(props: EmbedChatPageProps = {}) {
    const params       = useParams();
    const searchParams = useSearchParams();

    const agentId   = props.agentId  ?? (params?.agentId as string);
    const isPreview = props.isPreview ?? searchParams?.get("preview") === "true";

    const [agent, setAgent]         = useState<Agent | null>(null);
    const [loading, setLoading]     = useState(true);
    const [messageTimes, setMessageTimes] = useState<MessageTimesMap>({});

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef  = useRef<HTMLTextAreaElement>(null);

    const {
        messages,
        input: chatInput,
        handleInputChange,
        handleSubmit,
        isLoading,
        setInput,
        reload,
    } = useChat({
        api: "/api/chat",
        body: { agentId },
        onFinish: (message) => {
            setMessageTimes((prev) => ({ ...prev, [message.id]: formatTime(new Date()) }));
        },
    });

    const input = chatInput ?? "";

    useEffect(() => {
        if (!agentId) return;
        getAgent(agentId).then((data: Agent) => {
            setAgent(data);
            setLoading(false);
        });
    }, [agentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        setMessageTimes((prev) => ({
            ...prev,
            [`user-${Date.now()}`]: formatTime(new Date()),
        }));
        handleSubmit(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!input.trim() || isLoading) return;
            handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
        }
    };

    const handleSuggestion = (text: string) => {
        setInput(text);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // ── Resolve config ────────────────────────────────────────────────────────

    const primaryColor  = props.previewConfig?.primaryColor   ?? agent?.config?.primaryColor   ?? "#3b82f6";
    const botName       = props.previewConfig?.botName        ?? agent?.config?.botName        ?? "AI Assistant";
    const welcomeMsg    = props.previewConfig?.welcomeMessage ?? agent?.config?.welcomeMessage ?? "";

    const rgb           = hexToRgb(primaryColor);
    const textOnPrimary = getLuminance(primaryColor) < 0.5 ? "#ffffff" : "#1e293b";

    const allMessages: ChatMessage[] =
        welcomeMsg && messages.length === 0
            ? [{ id: "welcome", role: "assistant", content: welcomeMsg }]
            : (messages as ChatMessage[]);

    if (loading) {
        return <LoadingSkeleton primaryColor={primaryColor} />;
    }

    return (
        <TooltipProvider delayDuration={300}>
            <div
                className="flex flex-col bg-background"
                style={{
                    height: isPreview ? "100%" : "100svh",
                    fontFamily: "'Inter', system-ui, sans-serif",
                }}
            >
                {/* ── Header ──────────────────────────────────────────────── */}
                <div
                    className="shrink-0 px-4 py-3 flex items-center gap-3"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, rgba(${rgb}, 0.82) 100%)`,
                        boxShadow: `0 2px 16px rgba(${rgb}, 0.3)`,
                    }}
                >
                    <Avatar className="w-10 h-10 rounded-xl shrink-0 shadow-inner">
                        <AvatarFallback
                            className="rounded-xl"
                            style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <Sparkles className="h-4.5 w-4.5" style={{ color: textOnPrimary }} />
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <p
                            className="text-sm font-semibold leading-none truncate"
                            style={{ color: textOnPrimary }}
                        >
                            {botName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                            </span>
                            <span
                                className="text-[11px] font-medium"
                                style={{ color: textOnPrimary, opacity: 0.8 }}
                            >
                                Online · Ready to help
                            </span>
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => reload()}
                                    className="w-8 h-8 rounded-xl hover:opacity-80 transition-all active:scale-95"
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.18)",
                                        color: textOnPrimary,
                                    }}
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                Restart conversation
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {/* ── Messages ────────────────────────────────────────────── */}
                <ScrollArea
                    ref={scrollRef as any}
                    className="flex-1 px-3 py-4"
                    style={{
                        background: "linear-gradient(180deg, hsl(var(--muted)/0.4) 0%, hsl(var(--muted)/0.6) 100%)",
                    }}
                >
                    {/* ── Empty state ── */}
                    {allMessages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
                            <div
                                className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor}, rgba(${rgb}, 0.65))`,
                                    boxShadow: `0 8px 32px rgba(${rgb}, 0.35)`,
                                }}
                            >
                                <Sparkles className="h-7 w-7 text-white" />
                            </div>

                            <div className="text-center space-y-1.5">
                                <p className="text-sm font-semibold text-foreground">Hey there! 👋</p>
                                <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                                    I'm {botName}. Ask me anything to get started.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 w-full max-w-[240px]">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <Button
                                        key={prompt}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSuggestion(prompt)}
                                        className={cn(
                                            "text-xs text-left justify-start h-auto py-2.5 px-4 rounded-2xl",
                                            "hover:shadow-md transition-all duration-150 hover:-translate-y-0.5",
                                            "text-muted-foreground hover:text-foreground"
                                        )}
                                        onMouseEnter={(e) => {
                                            (e.currentTarget as HTMLElement).style.borderColor = primaryColor;
                                            (e.currentTarget as HTMLElement).style.color = primaryColor;
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLElement).style.borderColor = "";
                                            (e.currentTarget as HTMLElement).style.color = "";
                                        }}
                                    >
                                        {prompt}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Message bubbles ── */}
                    <div className="space-y-0.5">
                        {allMessages.map((m, i) => {
                            const isUser         = m.role === "user";
                            const prevRole       = allMessages[i - 1]?.role;
                            const nextRole       = allMessages[i + 1]?.role;
                            const isFirstInGroup = prevRole !== m.role;
                            const isLastInGroup  = nextRole !== m.role;

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex items-end gap-2",
                                        isUser ? "flex-row-reverse" : "flex-row",
                                        isFirstInGroup && i !== 0 ? "mt-4" : "mt-0.5"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="w-7 shrink-0 flex items-end">
                                        {isLastInGroup && (
                                            <Avatar className="w-7 h-7 shadow-sm">
                                                <AvatarFallback
                                                    style={{
                                                        backgroundColor: isUser
                                                            ? "hsl(var(--muted))"
                                                            : primaryColor,
                                                    }}
                                                >
                                                    {isUser
                                                        ? <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                        : <Bot  className="h-3.5 w-3.5 text-white" />
                                                    }
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>

                                    <div className={cn(
                                        "flex flex-col gap-1",
                                        isUser ? "items-end" : "items-start"
                                    )}>
                                        {isFirstInGroup && (
                                            <span className="text-[10px] text-muted-foreground px-1">
                                                {isUser ? "You" : botName}
                                            </span>
                                        )}

                                        {/* Bubble */}
                                        <div
                                            className={cn(
                                                "max-w-[75%] px-4 py-2.5 text-sm leading-relaxed break-words rounded-2xl",
                                                isUser
                                                    ? [
                                                        "bg-background text-foreground border border-border/70 shadow-sm",
                                                        isFirstInGroup  && !isLastInGroup  && "rounded-tr-sm",
                                                        !isFirstInGroup && !isLastInGroup  && "rounded-r-sm",
                                                        !isFirstInGroup && isLastInGroup   && "rounded-tr-sm",
                                                    ]
                                                    : [
                                                        "text-white shadow-md",
                                                        isFirstInGroup  && !isLastInGroup  && "rounded-tl-sm",
                                                        !isFirstInGroup && !isLastInGroup  && "rounded-l-sm",
                                                        !isFirstInGroup && isLastInGroup   && "rounded-tl-sm",
                                                    ]
                                            )}
                                            style={
                                                !isUser
                                                    ? {
                                                        backgroundColor: primaryColor,
                                                        boxShadow: `0 4px 12px rgba(${rgb}, 0.28)`,
                                                    }
                                                    : {}
                                            }
                                        >
                                            {m.content}
                                        </div>

                                        {isLastInGroup && messageTimes[m.id] && (
                                            <span className="text-[10px] text-muted-foreground px-1">
                                                {messageTimes[m.id]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isLoading && <TypingIndicator primaryColor={primaryColor} />}
                </ScrollArea>

                {/* ── Input area ──────────────────────────────────────────── */}
                <div className="shrink-0 px-3 py-3 bg-background border-t border-border/50">
                    <form
                        onSubmit={handleFormSubmit}
                        className={cn(
                            "flex items-end gap-2 bg-muted/50 border border-border rounded-2xl px-3 py-2",
                            "transition-all duration-200 focus-within:border-[var(--chat-primary)] focus-within:shadow-sm"
                        )}
                        style={{ "--chat-primary": primaryColor } as React.CSSProperties}
                    >
                        <Textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message…"
                            rows={1}
                            className={cn(
                                "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
                                "outline-none resize-none py-1 max-h-32 overflow-y-auto leading-relaxed",
                                "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-0"
                            )}
                            disabled={isLoading}
                            autoComplete="off"
                            style={{ lineHeight: "1.5" }}
                            onInput={(e) => {
                                const el = e.currentTarget;
                                el.style.height = "auto";
                                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                            }}
                        />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={!input.trim() || isLoading}
                                    className="w-8 h-8 rounded-xl shrink-0 mb-0.5 transition-all duration-150 active:scale-95 disabled:opacity-35"
                                    style={{ backgroundColor: primaryColor, color: "#fff" }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                                Send (Enter)
                            </TooltipContent>
                        </Tooltip>
                    </form>

                    <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60 font-medium tracking-wide select-none">
                        <kbd className="font-mono bg-muted text-muted-foreground px-1 rounded text-[9px]">Enter</kbd> to send ·{" "}
                        <kbd className="font-mono bg-muted text-muted-foreground px-1 rounded text-[9px]">Shift+Enter</kbd> for new line ·{" "}
                        Powered by <span className="font-semibold text-foreground/50">Antigravity AI</span>
                    </p>
                </div>

                {/* ── Keyframe animations ────────────────────────────────── */}
                <style>{`
                    @keyframes typingBounce {
                        0%, 60%, 100% { transform: translateY(0); }
                        30%           { transform: translateY(-5px); }
                    }
                `}</style>
            </div>
        </TooltipProvider>
    );
}