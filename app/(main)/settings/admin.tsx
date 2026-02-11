"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Shield, Settings, Activity, Save } from "lucide-react"
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
const generalFormSchema = z.object({
    orgName: z.string().min(1, "Organization name is required"),
    address1: z.string().min(1, "Address Line 1 is required"),
    address2: z.string().optional(),
    landmark: z.string().optional(),
    district: z.string().min(1, "District is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "Zip Code is required"),
    timezone: z.string().min(1, "Timezone is required"),
    dateFormat: z.string().min(1, "Date Format is required"),
    timeFormat: z.string().min(1, "Time Format is required"),
})

const dataFormSchema = z.object({
    autoSync: z.boolean(),
    offlineMode: z.boolean(),
    retentionPolicy: z.string(),
})

const notificationFormSchema = z.object({
    boothAlerts: z.boolean(),
    turnoutUpdates: z.boolean(),
    securityAlerts: z.boolean(),
})

type GeneralFormValues = z.infer<typeof generalFormSchema>
type DataFormValues = z.infer<typeof dataFormSchema>
type NotificationFormValues = z.infer<typeof notificationFormSchema>

export default function AdminSettingsPage() {
    // General Form
    const generalForm = useForm<GeneralFormValues>({
        resolver: zodResolver(generalFormSchema),
        defaultValues: {
            orgName: "Tamil Nadu Election Watch",
            address1: "",
            address2: "",
            landmark: "",
            district: "chennai",
            state: "Tamil Nadu",
            country: "India",
            zipCode: "",
            timezone: "ist",
            dateFormat: "ddmmyyyy",
            timeFormat: "12h"
        }
    })

    // Data Form
    const dataForm = useForm<DataFormValues>({
        resolver: zodResolver(dataFormSchema),
        defaultValues: {
            autoSync: true,
            offlineMode: true,
            retentionPolicy: "1year"
        }
    })

    // Notification Form
    const notificationForm = useForm<NotificationFormValues>({
        resolver: zodResolver(notificationFormSchema),
        defaultValues: {
            boothAlerts: true,
            turnoutUpdates: false,
            securityAlerts: true
        }
    })

    function onGeneralSubmit(data: GeneralFormValues) {
        console.log("Saving General Settings:", data)
        toast.success("General settings saved successfully")
    }

    function onDataSubmit(data: DataFormValues) {
        console.log("Saving Data Settings:", data)
        toast.success("Data synchronization settings saved")
    }

    function onNotificationSubmit(data: NotificationFormValues) {
        console.log("Saving Notification Settings:", data)
        toast.success("Alert preferences updated")
    }

    return (
        <>
            <Header
                icon={Settings}
                heading="System Settings"
                description="Configure your Election Management System preferences and operational parameters."
                breadcrumbs={[{ label: "Settings" }]}
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="data">Data & Sync</TabsTrigger>
                    <TabsTrigger value="notifications">Alerts</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                {/* General Settings */}
                <TabsContent value="general" >
                    <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                        <FieldSet className="border rounded-md p-4 pt-0">
                            <FieldLegend className="px-1">Organization Details</FieldLegend>
                            <FieldDescription className="px-1">Manage your political organization or agency profile.</FieldDescription>

                            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Field>
                                    <FieldLabel htmlFor="orgName">Organization Name</FieldLabel>
                                    <Input id="orgName" {...generalForm.register("orgName")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="address1">Address Line 1</FieldLabel>
                                    <Input id="address1" placeholder="123 Main St" {...generalForm.register("address1")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="address2">Address Line 2</FieldLabel>
                                    <Input id="address2" placeholder="Suite 101 (Optional)" {...generalForm.register("address2")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="landmark">Landmark</FieldLabel>
                                    <Input id="landmark" placeholder="Near City Center" {...generalForm.register("landmark")} />
                                </Field>

                                <Controller
                                    control={generalForm.control}
                                    name="district"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>District</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select District" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="chennai">Chennai</SelectItem>
                                                    <SelectItem value="kanchipuram">Kanchipuram</SelectItem>
                                                    <SelectItem value="thiruvallur">Thiruvallur</SelectItem>
                                                    <SelectItem value="coimbatore">Coimbatore</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />

                                <Field>
                                    <FieldLabel htmlFor="state">State</FieldLabel>
                                    <Input id="state" {...generalForm.register("state")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="country">Country</FieldLabel>
                                    <Input id="country" {...generalForm.register("country")} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="zipcode">Zip Code</FieldLabel>
                                    <Input id="zipcode" placeholder="600001" {...generalForm.register("zipCode")} />
                                </Field>

                                <FieldSeparator className="col-span-full" />

                                <Controller
                                    control={generalForm.control}
                                    name="timezone"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Timezone</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ist">India Standard Time (IST)</SelectItem>
                                                    <SelectItem value="utc">UTC</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />
                                <Controller
                                    control={generalForm.control}
                                    name="dateFormat"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Date Format</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Date Format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                                                    <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                                                    <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />
                                <Controller
                                    control={generalForm.control}
                                    name="timeFormat"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Time Format</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Time Format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                                                    <SelectItem value="24h">24-hour</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save General Settings
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* Data Management */}
                <TabsContent value="data" className="mt-6">
                    <form onSubmit={dataForm.handleSubmit(onDataSubmit)}>
                        <FieldSet>
                            <div className="mb-4">
                                <FieldLegend>Data Synchronization</FieldLegend>
                                <FieldDescription>Manage how field agent data is synced with the central server.</FieldDescription>
                            </div>

                            <FieldGroup>
                                <Controller
                                    control={dataForm.control}
                                    name="autoSync"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel>Auto-Sync Field Data</FieldLabel>
                                                <FieldDescription>Automatically push data from agent devices every 15 minutes.</FieldDescription>
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
                                    control={dataForm.control}
                                    name="offlineMode"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel>Offline Data Cache</FieldLabel>
                                                <FieldDescription>Allow agents to collect data without internet (synced later).</FieldDescription>
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
                                    control={dataForm.control}
                                    name="retentionPolicy"
                                    render={({ field }) => (
                                        <Field>
                                            <FieldLabel>Data Retention Policy</FieldLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Retention" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="6months">6 Months</SelectItem>
                                                    <SelectItem value="1year">1 Year</SelectItem>
                                                    <SelectItem value="5years">5 Years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </Field>
                                    )}
                                />
                            </FieldGroup>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" className="gap-2">
                                    <Save className="h-4 w-4" /> Save Data Settings
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="mt-6">
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                        <FieldSet>
                            <div className="mb-4">
                                <FieldLegend>Alert Configuration</FieldLegend>
                                <FieldDescription>Configure critical alerts for booth issues and agent activities.</FieldDescription>
                            </div>

                            <FieldGroup>
                                <Controller
                                    control={notificationForm.control}
                                    name="boothAlerts"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Bell className="h-4 w-4" /> Booth Emergency Alerts</FieldLabel>
                                                <FieldDescription>Immediate SMS/Push notification for "High Priority" booth issues.</FieldDescription>
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
                                    control={notificationForm.control}
                                    name="turnoutUpdates"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Activity className="h-4 w-4" /> Turnout Updates</FieldLabel>
                                                <FieldDescription>Hourly voter turnout summary notifications.</FieldDescription>
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
                                    control={notificationForm.control}
                                    name="securityAlerts"
                                    render={({ field }) => (
                                        <Field orientation="horizontal" className="justify-between">
                                            <div className="flex flex-col gap-1">
                                                <FieldLabel className="flex items-center gap-2"><Shield className="h-4 w-4" /> Login Security Alerts</FieldLabel>
                                                <FieldDescription>Notify when a new device logs into an admin account.</FieldDescription>
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
                                    <Save className="h-4 w-4" /> Save Alert Preferences
                                </Button>
                            </div>
                        </FieldSet>
                    </form>
                </TabsContent>
            </Tabs>
        </>
    )
}
