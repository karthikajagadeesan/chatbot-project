"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useAuthStore } from "@/store/user/authStore";
import { updateUserProfile, type ProfileFormValues } from "@/app/(main)/profile/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileForm() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const getInitials = (first: string | null, last: string | null) => {
        const f = first?.[0] ?? "";
        const l = last?.[0] ?? "";
        return (f + l).toUpperCase() || "U";
    };

    const form = useForm<ProfileFormValues>({
        defaultValues: {
            first_name: user?.first_name ?? "",
            last_name: user?.last_name ?? "",
            phone_no: user?.phone_no ?? "",
        },
    });

    // Re-sync form when user data is loaded into the store
    useEffect(() => {
        if (user) {
            form.reset({
                first_name: user.first_name ?? "",
                last_name: user.last_name ?? "",
                phone_no: user.phone_no ?? "",
            });
        }
    }, [user, form]);

    const onSubmit = async (values: ProfileFormValues) => {
        const result = await updateUserProfile(values);
        if (result.success) {
            toast.success("Profile updated successfully");
            if (user) {
                setUser({
                    ...user,
                    first_name: values.first_name,
                    last_name: values.last_name,
                    phone_no: values.phone_no ?? null,
                });
            }
        } else {
            toast.error(result.error ?? "Failed to update profile");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Avatar / Identity Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Account</CardTitle>
                    <CardDescription>
                        Your identity as it appears across the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 text-lg">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {getInitials(user?.first_name ?? null, user?.last_name ?? null)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                        <p className="text-base font-medium capitalize">
                            {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                        Update your name and contact details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                            {/* Name row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="first_name"
                                    rules={{ required: "First name is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>First Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="First name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="last_name"
                                    rules={{ required: "Last name is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Last name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Email — read only */}
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                    <Input
                                        value={user?.email ?? ""}
                                        disabled
                                        className="cursor-not-allowed opacity-60"
                                    />
                                </FormControl>
                            </FormItem>

                            {/* Phone */}
                            <FormField
                                control={form.control}
                                name="phone_no"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 234 567 890" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                    className="gap-2"
                                >
                                    {form.formState.isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
