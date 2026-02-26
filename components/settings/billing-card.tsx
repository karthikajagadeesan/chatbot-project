"use client"
import { useState } from "react"
import { createCheckoutSessionAction, createPortalSessionAction } from "@/app/actions/stripe-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Star, Zap, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Tables } from "@/type/database-type"

interface BillingCardProps {
    subscription: Tables<'subscriptions'> | null
}

const PLANS = [
    {
        name: "Starter",
        price: "$0",
        description: "For individuals & side projects",
        features: ["1 project", "500 chat messages/mo", "Community support"],
        priceId: null, // Free = no priceId
        badge: null,
    },
    {
        name: "Pro",
        price: "$29",
        description: "For growing businesses",
        features: ["5 projects", "10,000 chat messages/mo", "Priority support", "Custom branding"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        badge: "Most Popular",
    },
    {
        name: "Enterprise",
        price: "$99",
        description: "For high-volume operations",
        features: ["Unlimited projects", "Unlimited chat messages", "Dedicated support", "Advanced analytics"],
        priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
        badge: null,
    },
]

export default function BillingCard({ subscription }: BillingCardProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null)

    const currentPlan = subscription?.plan?.toLowerCase() || "starter"
    const isActive = subscription?.status === "active"
    const renewsAt = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null

    const handleUpgrade = async (priceId: string) => {
        if (!priceId) return
        try {
            setIsLoading(priceId)
            await createCheckoutSessionAction(priceId)
        } catch (err: any) {
            toast.error(err.message || "Failed to start checkout.")
            setIsLoading(null)
        }
    }

    const handlePortal = async () => {
        try {
            setIsLoading("portal")
            await createPortalSessionAction()
        } catch (err: any) {
            toast.error(err.message || "Could not open billing portal.")
            setIsLoading(null)
        }
    }

    return (
        <div className="space-y-6">
            {/* Current plan overview */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                        <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium capitalize">{currentPlan} Plan</p>
                        <p className="text-xs text-muted-foreground">
                            {isActive && renewsAt ? `Renews on ${renewsAt}` : "Free tier — no billing"}
                        </p>
                    </div>
                </div>
                {isActive && (
                    <Button variant="outline" size="sm" onClick={handlePortal} disabled={isLoading === "portal"}>
                        {isLoading === "portal" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Manage Billing
                    </Button>
                )}
            </div>

            {/* Plan cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {PLANS.map((plan) => {
                    const isCurrentPlan = currentPlan === plan.name.toLowerCase()

                    return (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col p-4 rounded-xl border transition-all ${isCurrentPlan ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:border-primary/30"
                                }`}
                        >
                            {plan.badge && (
                                <Badge className="absolute -top-2.5 right-3 text-xs" variant="secondary">
                                    <Star className="w-3 h-3 mr-1" />
                                    {plan.badge}
                                </Badge>
                            )}

                            <div className="mb-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-primary" /> {plan.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                                <p className="text-2xl font-bold mt-2">
                                    {plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                                </p>
                            </div>

                            <ul className="space-y-1.5 mb-4 flex-1">
                                {plan.features.map((feat) => (
                                    <li key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="w-1 h-1 rounded-full bg-primary shrink-0"></span>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                size="sm"
                                variant={isCurrentPlan ? "secondary" : "default"}
                                disabled={isCurrentPlan || !plan.priceId || isLoading !== null}
                                onClick={() => plan.priceId && handleUpgrade(plan.priceId)}
                                className="w-full"
                            >
                                {plan.priceId !== null && isLoading === plan.priceId ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
