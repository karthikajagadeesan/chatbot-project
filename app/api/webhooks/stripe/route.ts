import { headers } from "next/headers"
import { stripe } from "@/utils/stripe/client"
import { createClient } from "@/utils/supabase/server"
import Stripe from "stripe"

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get("Stripe-Signature")

    if (!signature) {
        return new Response("Missing Stripe signature", { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error(`Stripe Webhook Error: ${message}`)
        return new Response(`Webhook Error: ${message}`, { status: 400 })
    }

    const supabase = await createClient()

    // Helper: safely extract current_period_end from a subscription retrieve response
    const getPeriodEnd = (sub: unknown): string => {
        const periodEndTs = (sub as Record<string, unknown>).current_period_end
        if (typeof periodEndTs === "number") {
            return new Date(periodEndTs * 1000).toISOString()
        }
        return new Date().toISOString()
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session
                const userId = session.metadata?.userId
                const customerId = session.customer as string
                const subId = session.subscription as string

                if (userId && customerId && subId) {
                    const sub = await stripe.subscriptions.retrieve(subId)
                    const planName = sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id ?? "starter"

                    await supabase
                        .from("subscriptions")
                        .upsert({
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subId,
                            plan: planName,
                            status: sub.status,
                            current_period_end: getPeriodEnd(sub),
                        }, { onConflict: "user_id" })
                }
                break
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
                const subId = invoice.subscription

                if (subId) {
                    const sub = await stripe.subscriptions.retrieve(subId)
                    const userId = sub.metadata?.userId
                    if (userId) {
                        await supabase
                            .from("subscriptions")
                            .update({ status: sub.status, current_period_end: getPeriodEnd(sub) })
                            .eq("stripe_subscription_id", subId)
                    }
                }
                break
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription
                await supabase
                    .from("subscriptions")
                    .update({ status: "canceled" })
                    .eq("stripe_subscription_id", sub.id)
                break
            }

            case "customer.subscription.updated": {
                const sub = event.data.object as Stripe.Subscription
                const planName = sub.items.data[0]?.price?.nickname ?? sub.items.data[0]?.price?.id
                await supabase
                    .from("subscriptions")
                    .update({ status: sub.status, plan: planName, current_period_end: getPeriodEnd(sub) })
                    .eq("stripe_subscription_id", sub.id)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error"
        console.error("Error processing webhook:", message)
        return new Response("Internal error processing webhook", { status: 500 })
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    })
}
