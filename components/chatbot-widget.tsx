"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface ChatbotWidgetProps {
    /** Agent ID — loads RAG docs from chatbot_documents (agent detail page) */
    agentId?: string;
    /**
     * When true, the widget uses scraped_endpoints as its knowledge source.
     * Used on the configure page — no agentId needed.
     */
    useScrapedContext?: boolean;
    /**
     * Primary color for the widget header, FAB, and user bubbles.
     * Pass this directly from the parent's live state so changes reflect
     * immediately without needing a DB round-trip.
     */
    primaryColor?: string;
    /** Bot display name shown in the header */
    botName?: string;
    /** First message shown when the chat opens */
    welcomeMessage?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingDots() {
    return (
        <span className="flex items-center gap-1 px-1 py-0.5">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </span>
    );
}

// ── Single message bubble ─────────────────────────────────────────────────────

function Bubble({ msg, color }: { msg: Message; color: string }) {
    const isUser = msg.role === "user";
    return (
        <div className={cn("flex gap-2 items-end", isUser && "flex-row-reverse")}>
            {!isUser && (
                <div
                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mb-0.5"
                    style={{ backgroundColor: color + "22" }}
                >
                    <Bot className="h-3.5 w-3.5" style={{ color }} />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                    isUser
                        ? "text-white rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                )}
                style={isUser ? { backgroundColor: color } : undefined}
            >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                    className={cn(
                        "text-[10px] mt-1 select-none",
                        isUser ? "text-white/60 text-right" : "text-muted-foreground"
                    )}
                >
                    {formatTime(msg.timestamp)}
                </p>
            </div>
        </div>
    );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export function ChatbotWidget({
    agentId,
    useScrapedContext = false,
    primaryColor: colorProp,
    botName: nameProp,
    welcomeMessage: welcomeProp,
}: ChatbotWidgetProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Resolved branding — props win; fallback to defaults
    const color   = colorProp   ?? "#3b82f6";
    const name    = nameProp    ?? "AI Assistant";
    const welcome = welcomeProp ?? "Hello! How can I help you today?";

    // Ref for the scrollable messages container (plain div, not ScrollArea)
    const messagesEndRef  = useRef<HTMLDivElement>(null);
    const messagesBoxRef  = useRef<HTMLDivElement>(null);
    const inputRef        = useRef<HTMLInputElement>(null);

    // ── Seed welcome message once on mount ──────────────────────────────────
    useEffect(() => {
        if (initialized) return;
        setMessages([
            {
                id: "welcome",
                role: "assistant",
                content: welcome,
                timestamp: new Date(),
            },
        ]);
        setInitialized(true);
    }, [initialized, welcome]);

    // ── Scroll to bottom whenever messages change ────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // ── Focus input when chat opens ──────────────────────────────────────────
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open]);

    // ── Send a message ───────────────────────────────────────────────────────
    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || isTyping) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const history = [...messages, userMsg].map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch("/api/chat/widget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: history,
                    agentId,
                    useScrapedContext,
                }),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({ error: "Request failed" }));
                throw new Error(errJson.error ?? `HTTP ${res.status}`);
            }

            if (!res.body) throw new Error("No response body");

            // Create assistant message placeholder
            const assistantId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
            ]);
            setIsTyping(false);

            // Stream tokens from Vercel AI SDK data stream format
            const reader  = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                for (const line of chunk.split("\n")) {
                    // Vercel AI SDK text tokens: "0:<json-string>\n"
                    if (line.startsWith("0:")) {
                        try {
                            const token = JSON.parse(line.slice(2)) as string;
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === assistantId
                                        ? { ...m, content: m.content + token }
                                        : m
                                )
                            );
                        } catch {
                            // Non-token lines (e.g. metadata) — safe to ignore
                        }
                    }
                }
            }
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error ? err.message : "Something went wrong. Please try again.";
            setIsTyping(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: `⚠️ ${errorMessage}`,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [input, isTyping, messages, agentId, useScrapedContext]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Chat panel ─────────────────────────────────────────────────
                The panel has a FIXED height (520px). Inside:
                  - Header:    shrink-0  (never shrinks)
                  - Messages:  flex-1 + overflow-y-auto  (scrolls independently)
                  - Footer:    shrink-0  (never shrinks)
                This ensures the modal never grows/shifts — only the message
                list scrolls when content overflows.
            ── */}
            <div
                className={cn(
                    "fixed bottom-20 right-5 z-50",
                    "flex flex-col rounded-2xl border bg-background shadow-2xl",
                    "transition-all duration-300 ease-in-out origin-bottom-right",
                    open
                        ? "scale-100 opacity-100 pointer-events-auto"
                        : "scale-90 opacity-0 pointer-events-none"
                )}
                style={{ width: 360, height: 520 }}   /* fixed dimensions — never changes */
            >
                {/* ── Header — fixed, never scrolls ── */}
                <div
                    className="flex items-center justify-between px-4 py-3 rounded-t-2xl shrink-0"
                    style={{ backgroundColor: color }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-none">{name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                                <span className="text-[10px] text-white/70">Online</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
                        onClick={() => setOpen(false)}
                        aria-label="Close chat"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* ── Messages — scrollable area, takes all remaining space ── */}
                <div
                    ref={messagesBoxRef}
                    className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
                    /* min-h-0 is critical: without it, flex children won't shrink below their content size */
                >
                    <div className="flex flex-col gap-3">
                        {messages.map((msg) => (
                            <Bubble key={msg.id} msg={msg} color={color} />
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 items-end">
                                <div
                                    className="h-6 w-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: color + "22" }}
                                >
                                    <Bot className="h-3.5 w-3.5" style={{ color }} />
                                </div>
                                <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 text-muted-foreground">
                                    <TypingDots />
                                </div>
                            </div>
                        )}

                        {/* Invisible anchor — scrolled into view on new messages */}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* ── Powered-by badge — fixed above input ── */}
                <div className="flex justify-center pb-1 shrink-0">
                    <Badge variant="secondary" className="text-[9px] gap-1 py-0.5 px-2 font-normal">
                        <Sparkles className="h-2.5 w-2.5" />
                        Powered by Gemini
                    </Badge>
                </div>

                {/* ── Input row — fixed at bottom ── */}
                <div className="flex items-center gap-2 px-3 pb-3 pt-1 shrink-0 border-t">
                    <Input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything…"
                        className="h-9 text-sm rounded-xl"
                        disabled={isTyping}
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 rounded-xl shrink-0 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={send}
                        disabled={!input.trim() || isTyping}
                        aria-label="Send message"
                    >
                        {isTyping
                            ? <Loader2 className="h-4 w-4 animate-spin text-white" />
                            : <Send className="h-4 w-4 text-white" />
                        }
                    </Button>
                </div>
            </div>

            {/* ── FAB toggle ─────────────────────────────────────────────── */}
            <button
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    "fixed bottom-5 right-5 z-50",
                    "h-12 w-12 rounded-full shadow-lg",
                    "flex items-center justify-center",
                    "transition-all duration-300 hover:scale-110 active:scale-95",
                    "ring-2 ring-white/30"
                )}
                style={{ backgroundColor: color }}
                aria-label={open ? "Close chat" : "Open chat"}
            >
                <MessageCircle
                    className={cn(
                        "h-5 w-5 text-white absolute transition-all duration-200",
                        open ? "opacity-0 scale-75 rotate-90" : "opacity-100 scale-100 rotate-0"
                    )}
                />
                <X
                    className={cn(
                        "h-5 w-5 text-white absolute transition-all duration-200",
                        open ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-75 -rotate-90"
                    )}
                />
            </button>
        </>
    );
}