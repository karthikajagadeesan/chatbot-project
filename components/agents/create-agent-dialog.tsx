"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createAgent } from "@/app/(main)/agents/action";

interface CreateAgentDialogProps {
    onSuccess?: () => void;
}

export function CreateAgentDialog({ onSuccess }: CreateAgentDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            toast.error("Please enter an agent name.");
            return;
        }

        setLoading(true);

        try {
            const result = await createAgent({ name: trimmedName });

            if (result.success && result.data) {
                toast.success(`"${result.data.name}" created successfully!`);
                setOpen(false);
                setName("");
                onSuccess?.();
                // Redirect → /agents/{agentId} (configure page)
                router.push(`/agents/${result.data.id}`);
            } else {
                toast.error(result.message ?? "Failed to create agent. Please try again.");
            }
        } catch (err) {
            toast.error("An unexpected error occurred.");
            console.error("[CreateAgentDialog]", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!loading) {
            setOpen(isOpen);
            if (!isOpen) setName("");           // reset on close
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle className="text-lg">Create New Chatbot Agent</DialogTitle>
                    </div>
                    <DialogDescription>
                        Enter a name for your agent. After creation you'll be taken to the
                        configuration page to set up branding, then add knowledge sources.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">
                            Agent Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="agent-name"
                            placeholder="e.g. Support Bot, Sales Assistant, FAQ Bot"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !loading) handleCreate();
                            }}
                            disabled={loading}
                            autoFocus
                            maxLength={80}
                        />
                        <p className="text-xs text-muted-foreground">
                            {name.length}/80 characters
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create & Configure
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
