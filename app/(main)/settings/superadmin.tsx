"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Settings, Activity, Save, Globe, LayoutTemplate, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/upload"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchSuperadminAppSettings, updateSuperadminAppSettings } from "./action"
import { useEffect } from "react"


// Schemas
const generalFormSchema = z.object({
    appName: z.string().min(1, "App name is required"),
    appDescription: z.string().optional(),
    darkLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    lightLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    faviconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

const systemFormSchema = z.object({
    maintenanceMode: z.boolean(),
    globalAnnouncement: z.string().optional(),
    systemEmail: z.string().email(),
})

const tenantDefaultsSchema = z.object({
    defaultPlan: z.string(),
    maxUsersLimit: z.string(), // Keeping as string for Input, can be parsed
})

const securityFormSchema = z.object({
    enforce2FA: z.boolean(),
    sessionTimeout: z.string(),
})

type GeneralFormValues = z.infer<typeof generalFormSchema>
type SystemFormValues = z.infer<typeof systemFormSchema>
type TenantDefaultsValues = z.infer<typeof tenantDefaultsSchema>
type SecurityFormValues = z.infer<typeof securityFormSchema>

export default function SuperAdminSettingsPage() {

    const { data: settings, isLoading, error, refetch } = useQuery({
        queryKey: ["superadmin-settings"],
        queryFn: () => fetchSuperadminAppSettings()
    })
    // General Form
    const generalForm = useForm<GeneralFormValues>({
        resolver: zodResolver(generalFormSchema),
        defaultValues: {
            appName: settings?.app_name || "",
            appDescription: settings?.app_description || "",
            darkLogoUrl: settings?.dark_logo_url || "",
            lightLogoUrl: settings?.light_logo_url || "",
            faviconUrl: "",
        }
    })

    useEffect(() => {
        if (settings) {
            generalForm.reset({
                appName: settings.app_name || "",
                appDescription: settings.app_description || "",
                darkLogoUrl: settings.dark_logo_url || "",
                lightLogoUrl: settings.light_logo_url || "",
                faviconUrl: settings.favicon_url || "",
            })
        }
    }, [settings, generalForm])

    const queryClient = useQueryClient()

    const { mutate: updateSettings, isPending: isUpdating } = useMutation({
        mutationFn: updateSuperadminAppSettings,
        onSuccess: () => {
            toast.success("Settings updated successfully")
            queryClient.invalidateQueries({ queryKey: ["superadmin-settings"] })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update settings")
        }
    })


    function onGeneralSubmit(data: GeneralFormValues) {
        if (!settings?.id) {
            toast.error("Settings ID not found")
            return
        }

        updateSettings({
            id: settings.id,
            app_name: data.appName,
            app_description: data.appDescription,
            dark_logo_url: data.darkLogoUrl,
            light_logo_url: data.lightLogoUrl,
            favicon_url: data.faviconUrl
        })
    }



    // System Form
    const systemForm = useForm<SystemFormValues>({
        resolver: zodResolver(systemFormSchema),
        defaultValues: {
            maintenanceMode: false,
            globalAnnouncement: "",
            systemEmail: "admin@elexis.com",
        }
    })

    // Tenant Defaults Form
    const tenantForm = useForm<TenantDefaultsValues>({
        resolver: zodResolver(tenantDefaultsSchema),
        defaultValues: {
            defaultPlan: "standard",
            maxUsersLimit: "50",
        }
    })

    // Security Form
    const securityForm = useForm<SecurityFormValues>({
        resolver: zodResolver(securityFormSchema),
        defaultValues: {
            enforce2FA: false,
            sessionTimeout: "30m",
        }
    })

    function onSystemSubmit(data: SystemFormValues) {
        console.log("Saving System Settings:", data)
        toast.success("System configurations updated")
    }

    function onTenantSubmit(data: TenantDefaultsValues) {
        console.log("Saving Tenant Defaults:", data)
        toast.success("Tenant default settings saved")
    }

    function onSecuritySubmit(data: SecurityFormValues) {
        console.log("Saving Security Settings:", data)
        toast.success("Security policies updated")
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-2 text-destructive">
                <Shield className="h-8 w-8" />
                <p>Failed to load settings. Please try again.</p>
                <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
        )
    }

    return (
        <>
            <Header
                icon={Settings}
                heading="Global Settings"
                description="Manage system-wide configurations and policies."
                breadcrumbs={[{ label: "Settings" }]}
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="tenants">Tenant Defaults</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" >
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">General Information</FieldLegend>
                            <FieldDescription className="px-1">Update the basic details of the application.</FieldDescription>

                            <FieldGroup>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="appName">App Name</FieldLabel>
                                        <Input id="appName" {...generalForm.register("appName")} />
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="appDescription">App Description</FieldLabel>
                                        <Input id="appDescription" {...generalForm.register("appDescription")} />
                                        <FieldDescription>A brief description of the application.</FieldDescription>
                                    </Field>
                                </div>

                                <FieldSeparator />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Controller
                                        control={generalForm.control}
                                        name="faviconUrl"
                                        render={({ field }) => (
                                            <ImageUpload
                                                label="Favicon"
                                                description="Upload the favicon."
                                                value={field.value}
                                                onChange={field.onChange}
                                                dimensions="square"
                                            />
                                        )}
                                    />
                                    <Controller
                                        control={generalForm.control}
                                        name="darkLogoUrl"
                                        render={({ field }) => (
                                            <ImageUpload
                                                label="Dark Logo"
                                                description="Upload the dark version of your logo."
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />

                                    <Controller
                                        control={generalForm.control}
                                        name="lightLogoUrl"
                                        render={({ field }) => (
                                            <ImageUpload
                                                label="Light Logo"
                                                description="Upload the light version of your logo."
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        )}
                                    />

                                </div>


                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2" disabled={isUpdating}>
                                    {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <Save className="h-4 w-4" /> Save General Settings
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* System Settings */}
                <TabsContent value="system" className="mt-6">
                    <form onSubmit={systemForm.handleSubmit(onSystemSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">System Configuration</FieldLegend>
                            <FieldDescription className="px-1 mb-4">Control global system behavior and maintenance.</FieldDescription>

                            <FieldGroup>
                                <Controller
                                    control={systemForm.control}
                                    name="maintenanceMode"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Activity className="h-4 w-4" /> Maintenance Mode</FieldLabel>
                                                <FieldDescription>Put the entire system into maintenance mode. Only SuperAdmins can login.</FieldDescription>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </Field>
                                    )}
                                />

                                <FieldSeparator />

                                <Field>
                                    <FieldLabel htmlFor="globalAnnouncement">Global Announcement</FieldLabel>
                                    <Input id="globalAnnouncement" placeholder="System maintenance scheduled for..." {...systemForm.register("globalAnnouncement")} />
                                    <FieldDescription>This message will be displayed to all users on their dashboard.</FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="systemEmail">System Notification Email</FieldLabel>
                                    <Input id="systemEmail" {...systemForm.register("systemEmail")} />
                                </Field>
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save System Settings
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* Tenant Defaults */}
                <TabsContent value="tenants" className="mt-6">
                    <form onSubmit={tenantForm.handleSubmit(onTenantSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">New Tenant Defaults</FieldLegend>
                            <FieldDescription className="px-1 mb-4">Set default values for newly created client organizations.</FieldDescription>

                            <FieldGroup>
                                <Controller
                                    control={tenantForm.control}
                                    name="defaultPlan"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Default Subscription Plan</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="basic">Basic (Free)</SelectItem>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />

                                <Field>
                                    <FieldLabel htmlFor="maxUsersLimit">Default Max Users</FieldLabel>
                                    <Input id="maxUsersLimit" type="number" {...tenantForm.register("maxUsersLimit")} />
                                </Field>
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save Defaults
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="mt-6">
                    <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">Global Security Policies</FieldLegend>
                            <FieldDescription className="px-1 mb-4">Enforce security standards across the platform.</FieldDescription>

                            <FieldGroup>
                                <Controller
                                    control={securityForm.control}
                                    name="enforce2FA"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Shield className="h-4 w-4" /> Enforce 2FA</FieldLabel>
                                                <FieldDescription>Require Two-Factor Authentication for all admins.</FieldDescription>
                                            </div>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </Field>
                                    )}
                                />

                                <FieldSeparator />

                                <Controller
                                    control={securityForm.control}
                                    name="sessionTimeout"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Session Timeout</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Timeout" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="15m">15 Minutes</SelectItem>
                                                    <SelectItem value="30m">30 Minutes</SelectItem>
                                                    <SelectItem value="1h">1 Hour</SelectItem>
                                                    <SelectItem value="4h">4 Hours</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save Security Policies
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>
            </Tabs>
        </>
    )
}
