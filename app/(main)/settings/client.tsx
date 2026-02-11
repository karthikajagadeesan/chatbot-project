"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell, Smartphone, Save, Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Header from "@/components/header"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
    FieldSet,
    FieldLegend,
} from "@/components/ui/field"

// Schemas
const profileFormSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email(),
    phoneNumber: z.string().min(10, "Valid phone number is required"),
})

const appPreferencesSchema = z.object({
    language: z.string(),
    theme: z.string(),
    notificationsEnabled: z.boolean(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type AppPreferencesValues = z.infer<typeof appPreferencesSchema>

export default function ClientSettingsPage() {
    // Profile Form
    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: "Agent Smith",
            email: "agent.smith@example.com",
            phoneNumber: "+91 98765 43210",
        }
    })

    // App Preferences Form
    const appPreferencesForm = useForm<AppPreferencesValues>({
        resolver: zodResolver(appPreferencesSchema),
        defaultValues: {
            language: "en",
            theme: "system",
            notificationsEnabled: true,
        }
    })

    function onProfileSubmit(data: ProfileFormValues) {
        console.log("Saving Profile:", data)
        toast.success("Profile updated successfully")
    }

    function onPreferencesSubmit(data: AppPreferencesValues) {
        console.log("Saving App Preferences:", data)
        toast.success("App preferences saved")
    }

    return (
        <>
            <Header
                icon={User}
                heading="My Account"
                description="Manage your profile and application preferences."
                breadcrumbs={[{ label: "Settings" }]}
            />

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="app">App Preferences</TabsTrigger>
                </TabsList>

                {/* Profile Settings */}
                <TabsContent value="profile" className="mt-6">
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">Personal Information</FieldLegend>
                            <FieldDescription className="px-1 mb-4">Update your personal details.</FieldDescription>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                                    <Input id="fullName" {...profileForm.register("fullName")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                    <Input id="email" {...profileForm.register("email")} disabled className="bg-muted" />
                                    <FieldDescription>Contact your admin to change email.</FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                                    <Input id="phoneNumber" {...profileForm.register("phoneNumber")} />
                                </Field>
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save Profile
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* App Preferences */}
                <TabsContent value="app" className="mt-6">
                    <form onSubmit={appPreferencesForm.handleSubmit(onPreferencesSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">Application Settings</FieldLegend>
                            <FieldDescription className="px-1 mb-4">Customize your app experience.</FieldDescription>

                            <FieldGroup>
                                <Controller
                                    control={appPreferencesForm.control}
                                    name="language"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Language</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="ta">Tamil</SelectItem>
                                                    <SelectItem value="hi">Hindi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />

                                <Controller
                                    control={appPreferencesForm.control}
                                    name="theme"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Theme Preference</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">Light</SelectItem>
                                                    <SelectItem value="dark">Dark</SelectItem>
                                                    <SelectItem value="system">System Default</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />

                                <FieldSeparator />

                                <Controller
                                    control={appPreferencesForm.control}
                                    name="notificationsEnabled"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Bell className="h-4 w-4" /> Push Notifications</FieldLabel>
                                                <FieldDescription>Receive alerts about booth issues and updates.</FieldDescription>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </Field>
                                    )}
                                />
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save Preferences
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>
            </Tabs>
        </>
    )
}
