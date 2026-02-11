"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usegeneralStore from "@/store/general-store";
import { useAuthStore } from "@/store/superadmin/authStore";
import { useAppSettingsStore } from "@/store/app-settings-store";
import { ReactNode, useLayoutEffect } from "react";
import { Toaster } from "sonner";
import type { Subdomain } from "@/type/general-type";
import type { Tables } from "@/type/database-type";

const queryClient = new QueryClient();

export default function SuperAdminGlobalProvider({ children, appSettings, subdomain, user }: { children: ReactNode, appSettings: Tables<'app_settings'>, subdomain: Subdomain | null, user?: Tables<'super_admins'> | null }) {
    const setSubdomain = usegeneralStore((state) => state.setSubdomain);
    const setSuperadmin = useAuthStore((state) => state.setSuperadmin);
    const setAppSettings = useAppSettingsStore((state) => state.setSettings);

    useLayoutEffect(() => {
        if (subdomain) {
            setSubdomain(subdomain);
        }
        if (user) {
            setSuperadmin(user);
        }
        if (appSettings) {
            setAppSettings(appSettings);
        }
    }, [subdomain, setSubdomain, user, setSuperadmin, appSettings, setAppSettings]);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <Toaster />
        </QueryClientProvider>
    );
}
