"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usegeneralStore from "@/store/general-store";
import { useAuthStore } from "@/store/user/authStore";
import { ReactNode, useEffect } from "react";
import { Toaster } from "sonner";
import { Subdomain } from "@/type/general-type";
import { Tables } from "@/type/database-type";
import { useAppSettingsStore } from "@/store/app-settings-store";

const queryClient = new QueryClient();

export default function UserGlobalProvider({ children, subdomain, appSettings, user }: { children: ReactNode, subdomain: Subdomain | null, appSettings: Tables<'app_settings'>, user?: Tables<'users'> | null }) {
    const { setSubdomain } = usegeneralStore();
    const { setUser } = useAuthStore();
    const setAppSettings = useAppSettingsStore((state) => state.setSettings);

    useEffect(() => {
        if (subdomain) {
            setSubdomain(subdomain);
        }
        if (user) {
            setUser(user);
        }
        if (appSettings) {
            setAppSettings(appSettings);
        }
    }, [subdomain, setSubdomain, user, setUser, appSettings, setAppSettings]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    );
}
