"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createAgent } from "@/app/actions/chatbot";
import { toast } from "sonner";

interface CreateAgentDialogProps {
    onSuccess: () => void;
}

export function CreateAgentDialog({ onSuccess }: CreateAgentDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        const result = await createAgent({
            name,
            allowed_domains: [],
            config: {
                primaryColor: "#3b82f6",
                welcomeMessage: "Hello! How can I help you today?",
                botName: "AI Assistant"
            }
        });
        setLoading(false);

        if (result.success) {
            toast.success("Agent created successfully");
            setOpen(false);
            setName("");
            onSuccess();
        } else {
            toast.error(result.message || "Failed to create agent");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agent
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New AI Agent</DialogTitle>
                        <DialogDescription>
                            Give your agent a name. You can configure branding and knowledge base later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Agent Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Product Support Bot"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Agent"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
