"use client";

import Header from "@/components/header";
import { Settings as SettingsIcon, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BillingCard from "@/components/settings/billing-card";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Tables } from "@/type/database-type";

export default function UserSettings() {
  const [subscription, setSubscription] = useState<Tables<'subscriptions'> | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single()

      setSubscription(data)
    }
    fetchSubscription()
  }, [])

  return (
    <div>
      <Header
        icon={SettingsIcon}
        heading="Settings"
        description="Manage your account preferences, chatbot configurations, and security."
        breadcrumbs={[
          { label: "Settings" },
        ]}
      />

      <div className="flex flex-col gap-6 ">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your photo and personal details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-20">
                <AvatarImage src="/avatar.png" alt="Alex Johnson" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button>Upload New Photo</Button>
                <Button variant="ghost" size="sm">Remove Photo</Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Alex Johnson" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" defaultValue="alex.johnson@chatbotapp.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your plan, payment methods, and billing history via Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingCard subscription={subscription} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2  gap-6">
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
          <Button variant="ghost">Discard Changes</Button>
          <Button>Save All Settings</Button>
        </div>
      </div>
    </div>
  );
}