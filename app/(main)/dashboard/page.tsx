import RoleGateway from "@/helpers/role-gateway";
import SuperAdminDashboard from "./superadmin";
import UserDashboard from "./user";
export default function Dashboard() {
    return (
        <RoleGateway
            superadmin={<SuperAdminDashboard />}
            user={<UserDashboard />}
        />
    )
}