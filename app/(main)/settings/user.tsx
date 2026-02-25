"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import Header from "@/components/header";
import { Settings as SettingsIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
} from "./action";

type ProfileState = {
  fullName:     string;
  email:        string;
  behaviorType: string;
  customPrompt: string;
  avatarUrl:    string;
};

const DEFAULT_STATE: ProfileState = {
  fullName:     "",
  email:        "",
  behaviorType: "friendly",
  customPrompt: "",
  avatarUrl:    "",
};

export default function UserSettings() {
  const [saved, setSaved]           = useState<ProfileState>(DEFAULT_STATE);
  const [form, setForm]             = useState<ProfileState>(DEFAULT_STATE);
  const [isPending, startTransition] = useTransition();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto,  setIsRemovingPhoto]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchUserProfile()
      .then((data) => {
        const loaded: ProfileState = {
          fullName:     data.full_name,
          email:        data.email,
          behaviorType: data.behavior_type,
          customPrompt: data.custom_prompt,
          avatarUrl:    data.avatar_url,
        };
        setSaved(loaded);
        setForm(loaded);
      })
      .catch((err) => {
        toast.error(err.message ?? "Failed to load profile.");
      });
  }, []);

  // ── Field change ───────────────────────────────────────────────────────────
  const handleChange = (field: keyof ProfileState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert File → base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const extension = file.type.split("/")[1].replace("jpeg", "jpg");

      const result = await uploadProfilePhoto({
        base64,
        mimeType:  file.type,
        extension,
      });

      // Update both form and saved so discard doesn't revert the avatar
      const updatedAvatar = result.avatarUrl;
      setForm( (prev) => ({ ...prev, avatarUrl: updatedAvatar }));
      setSaved((prev) => ({ ...prev, avatarUrl: updatedAvatar }));

      toast.success("Profile photo updated.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to upload photo.");
    } finally {
      setIsUploadingPhoto(false);
      // Reset the file input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Photo remove ───────────────────────────────────────────────────────────
  const handleRemovePhoto = async () => {
    if (!form.avatarUrl) return;
    setIsRemovingPhoto(true);
    try {
      await removeProfilePhoto();
      setForm( (prev) => ({ ...prev, avatarUrl: "" }));
      setSaved((prev) => ({ ...prev, avatarUrl: "" }));
      toast.success("Profile photo removed.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove photo.");
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // ── Save all settings ──────────────────────────────────────────────────────
  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserProfile({
          full_name:     form.fullName,
          email:         form.email,
          behavior_type: form.behaviorType,
          custom_prompt: form.customPrompt,
          avatar_url:    form.avatarUrl,
        });
        setSaved(form);
        toast.success("Settings saved successfully.");
      } catch (err: any) {
        toast.error(err.message ?? "Failed to save settings.");
      }
    });
  };

  // ── Discard ────────────────────────────────────────────────────────────────
  const handleDiscard = () => {
    setForm(saved);
    toast.info("Changes discarded.");
  };

  const isPhotoBusy = isUploadingPhoto || isRemovingPhoto;

  // Derive initials for AvatarFallback
  const initials = form.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div>
      <Header
        icon={SettingsIcon}
        heading="Settings"
        description="Manage your account preferences, chatbot configurations, and security."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Chartbots", href: "/agents" },
          { label: "Configure", href: "/configure" },
          { label: "Settings" },
        ]}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your photo and personal details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">

            {/* ── Avatar row ── */}
            <div className="flex items-center gap-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />

              {/* Avatar with upload-on-click overlay */}
              <div className="relative group">
                <Avatar className="size-20">
                  <AvatarImage src={form.avatarUrl || undefined} alt={form.fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                {/* Loading spinner overlay while uploading */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPhotoBusy}
                >
                  {isUploadingPhoto ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
                  ) : (
                    "Upload New Photo"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={isPhotoBusy || !form.avatarUrl}
                >
                  {isRemovingPhoto ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Removing…</>
                  ) : (
                    "Remove Photo"
                  )}
                </Button>
              </div>
            </div>

            {/* ── Name / Email ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Preferences</CardTitle>
              <CardDescription>Set global defaults for all your managed chatbots.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="behaviorType">Behavior Type</Label>
                <Select
                  value={form.behaviorType}
                  onValueChange={(val) => handleChange("behaviorType", val)}
                >
                  <SelectTrigger id="behaviorType">
                    <SelectValue placeholder="Select behavior type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly and Helpful</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.behaviorType === "custom" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customPrompt">Custom Behavior Instructions</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Enter your custom prompt or behavior instructions..."
                    value={form.customPrompt}
                    onChange={(e) => handleChange("customPrompt", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                </div>
                <Button variant="link">Update</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleDiscard} disabled={isPending}>
            Discard Changes
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}