"use client";

import Header from "@/components/header";
import ProfileForm from "@/components/profile/profile-form";
import { UserStarIcon } from "lucide-react";

export default function UserProfile() {
    return (
        <div>
            <Header
                icon={UserStarIcon}
                heading="Profile"
                description="Manage your personal information and contact details."
                breadcrumbs={[{ label: "Profile" }]}
            />

            <ProfileForm />

        </div>
    );
}