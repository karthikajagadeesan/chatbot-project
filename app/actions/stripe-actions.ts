"use server";

import { createServer } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { stripe } from "@/utils/stripe/client";
import { redirect } from "next/navigation";

export async function createCheckoutSessionAction(priceId: string) {
    const supabase = await createServer(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be logged in to subscribe.");
    }

    // Check if the user already has a stripe_customer_id in subscriptions table
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
                userId: user.id,
            },
        });
        customerId = customer.id;
    }

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings`,
        metadata: {
            userId: user.id,
        },
    });

    if (session.url) {
        redirect(session.url);
    }
}

export async function createPortalSessionAction() {
    const supabase = await createServer(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("You must be logged in.");
    }

    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

    if (!subscription?.stripe_customer_id) {
        throw new Error("No active subscription found.");
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings`,
    });

    if (session.url) {
        redirect(session.url);
    }
}
