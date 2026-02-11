import RoleGateway from "@/helpers/role-gateway";
import SuperAdminAccountPage from "./superadmin";
import UserAccountPage from "./user";
export default function AccountPage() {
    return (
        <RoleGateway
            superadmin={<SuperAdminAccountPage />}
            user={<UserAccountPage />}
        />
    )
}