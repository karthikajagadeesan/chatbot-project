"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { usegeneralStore } from "@/store/general-store";
import { useAuthStore } from "@/store/user/authStore";
import { MenuIcon, LogOutIcon, UserIcon, SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignOut } from "../sidebar/action";
import { toast } from "sonner";

export default function AdminMobileHeader() {
    const setIsSidebarOpen = usegeneralStore((state) => state.setIsSidebarOpen);
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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
            setIsLogoutDialogOpen(false);
            toast.success(response.message);
            router.push("/sign-in");
        } else {
            toast.error(response.message);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">


            <div className="flex flex-1 items-center justify-between">
                <h1 className="text-lg font-semibold">Elexis</h1>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary text-primary-foreground capitalize">
                                        {user?.first_name ? getInitials(user.first_name) : "G"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none capitalize">
                                        {user?.first_name + " " + user?.last_name || "Guest"}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email || "No email"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push("/settings")}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push("/settings")}>
                                <SettingsIcon className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            setIsLogoutDialogOpen(true);
                                        }}
                                        variant="destructive"
                                    >
                                        <LogOutIcon className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
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
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <MenuIcon className="h-5 w-5" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}

