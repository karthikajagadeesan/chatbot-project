"use client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { usegeneralStore } from "@/store/general-store";
import { useAuthStore } from "@/store/user/authStore";
import { useAppSettingsStore } from "@/store/app-settings-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  XIcon,
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  SettingsIcon,
  LogOutIcon,
  PanelLeftIcon,
  CalendarDaysIcon,
  Ticket,
  UserStarIcon,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { SignOut } from "./action";
import { ThemeToggle } from "./theme-toggle";
import Logo from "@/components/logo";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    label: "Chatbots",
    href: "/agents",
    icon: MessageSquare,
  },
  {
    label: "Configure",
    href: "/configure",
    icon: UsersIcon,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SettingsIcon,
  },
];

const SidebarMenuItem = ({ item, pathname, isCollapsed, setIsSidebarOpen }: { item: any, pathname: string, isCollapsed: boolean, setIsSidebarOpen: (open: boolean) => void }) => {
  const Icon = item.icon;
  const searchParams = useSearchParams();

  // Helper function to check if an item is active
  const checkIsActive = (href: string) => {
    if (href === "#") return false;

    // Split href into pathname and search params
    const [itemPath, itemQuery] = href.split("?");
    const isPathMatch = pathname === itemPath || pathname.startsWith(itemPath + "/");

    if (!itemQuery) return isPathMatch;

    // If there's a query, both path and query must match
    const itemSearchParams = new URLSearchParams(itemQuery);
    const isQueryMatch = Array.from(itemSearchParams.entries()).every(
      ([key, value]) => searchParams.get(key) === value
    );

    return isPathMatch && isQueryMatch;
  };

  const isActive = checkIsActive(item.href);
  return (
    <li key={item.href}>
      <Link
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    </li>
  );
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isSidebarOpen = usegeneralStore((state) => state.isSidebarOpen);
  const isCollapsed = usegeneralStore((state) => state.isCollapsed);
  const setIsSidebarOpen = usegeneralStore((state) => state.setIsSidebarOpen);
  const setIsCollapsed = usegeneralStore((state) => state.setIsCollapsed);
  const user = useAuthStore((state) => state.user);
  const appSettings = useAppSettingsStore((state) => state.settings);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    const response = await SignOut();
    if (response.success) {
      toast.success(response.message);
      router.push("/sign-in");
    }
    else {
      toast.error(response.message);
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border rounded-lg border-sidebar-border transition-all duration-300 ease-in-out overflow-hidden",
          "md:relative md:z-auto",
          isCollapsed ? "w-15" : "w-58",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-17 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo settings={appSettings} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>


        {/* Navigation */}
        <nav className="flex-1 p-2 py-0">
          <Separator className="bg-sidebar-border mb-2" />
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <SidebarMenuItem
                key={item.label}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                setIsSidebarOpen={setIsSidebarOpen}
              />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-sidebar-border p-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Collapse Button */}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            className={cn(
              "flex w-full items-center gap-3 px-3   text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "justify-start"
            )}
          >
            <PanelLeftIcon className={cn("h-8 w-8 shrink-0", isCollapsed ? "rotate-180" : "")} />
            {!isCollapsed && <span>Collapse</span>}
          </Button>

          {/* Separator */}
          <Separator className="bg-sidebar-border my-2" />

          {/* User Profile */}
          <div>
            <div className="flex items-center gap-3 px-1 pt-1 pb-2">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground capitalize">
                  {user?.first_name ? getInitials(user.first_name) : "G"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate capitalize">
                    {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Guest"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    User
                  </p>
                </div>
              )}
              {!isCollapsed && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-destructive bg-white text-destructive transition-colors hover:bg-destructive/10"
                      title="Logout"
                    >
                      <LogOutIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be signed out of your account and redirected to the login page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSignOut}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}