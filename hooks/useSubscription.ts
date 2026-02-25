import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { Tables } from "@/type/database-type"

type Subscription = Tables<'subscriptions'>

export function useSubscription() {
    const [subscription, setSubscription] = useState<Subscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setIsLoading(false)
                return
            }

            const { data } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("user_id", user.id)
                .single()

            setSubscription(data)
            setIsLoading(false)
        }
        load()
    }, [])

    const isActive = subscription?.status === "active"
    const plan = subscription?.plan?.toLowerCase() ?? "starter"
    const isProOrAbove = isActive && (plan === "pro" || plan === "enterprise")

    return {
        subscription,
        isLoading,
        isActive,
        plan,
        isProOrAbove,
    }
}
