import RoleGateway from "@/helpers/role-gateway";
import SuperAdminSettings from "./superadmin";
import UserSettings from "./user";
export default function settings() {
    return (
        <RoleGateway
            superadmin={<SuperAdminSettings />}
            user={<UserSettings />}
        />
    )
}
