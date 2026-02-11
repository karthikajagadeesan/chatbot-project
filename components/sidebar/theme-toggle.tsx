"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { usegeneralStore } from "@/store/general-store"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { flushSync } from "react-dom"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const isCollapsed = usegeneralStore((state) => state.isCollapsed)
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
        const newTheme = theme === "dark" ? "light" : "dark"

        // @ts-ignore - View Transitions API might not be in TS types yet
        if (!document.startViewTransition) {
            setTheme(newTheme)
            return
        }

        const x = e.clientX
        const y = e.clientY
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        )

        // Add class to force all elements into the root transition group
        document.documentElement.classList.add("theme-transition")

        // @ts-ignore
        const transition = document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme)
            })
        })

        transition.finished.finally(() => {
            document.documentElement.classList.remove("theme-transition")
        })

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ]
            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    pseudoElement: "::view-transition-new(root)",
                }
            )
        })
    }

    if (!mounted) {
        return (
            <Button
                variant="ghost"
                disabled
                className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors",
                    isCollapsed ? "justify-center" : "justify-start"
                )}
            >
                <div className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="opacity-0">Toggle Theme</span>}
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            onClick={toggleTheme}
            className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "justify-start"
            )}
            title="Toggle theme"
        >
            <div className="relative h-5 w-5 shrink-0">
                <Sun className="absolute inset-0 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </div>
            {!isCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </Button>
    )
}
