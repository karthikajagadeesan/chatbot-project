"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tables } from "@/type/database-type";

export default function Logo({ settings }: { settings: Partial<Tables<'app_settings'>> }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <Skeleton className="h-[50px] w-[108px] rounded-lg" />;
    }

    const logoSrc = resolvedTheme === "dark"
        ? settings?.dark_logo_url
        : settings?.light_logo_url;

    if (!logoSrc) {
        return <Skeleton className="h-[50px] w-[108px] rounded-lg" />;
    }

    return (
        <Image
            src={logoSrc}
            alt={settings.app_name || "Logo"}
            width={108}
            height={50}
            unoptimized
            className="rounded-lg h-12 w-auto object-contain"
        />
    );
}