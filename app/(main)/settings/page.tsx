
import RoleGateway from "@/helpers/role-gateway";
import AdminSettingsPage from "./admin";
import SuperAdminSettingsPage from "./superadmin";
import ClientSettingsPage from "./client";

export default function SettingsPage() {
    return (
        <RoleGateway
            superadmin={<SuperAdminSettingsPage />}
            admin={<AdminSettingsPage />}
            user={<ClientSettingsPage />}
        />
    )
}
