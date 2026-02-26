"use client";

import Header from "@/components/header";
import { BadgeCheck, CreditCard } from "lucide-react";
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

export default function UserMembership() {
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
        icon={BadgeCheck}
        heading="Membership"
        description="Manage your plan, payment methods, and billing history."
        breadcrumbs={[{ label: "Membership" }]}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Billing &amp; Subscription
            </CardTitle>
            <CardDescription>
              Manage your plan, payment methods, and billing history via Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BillingCard subscription={subscription} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}