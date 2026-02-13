import RoleGateway from "@/helpers/role-gateway";
import SuperAdminConfigure from "./superadmin";
import UserConfigure from "./user";
export default function Dashboard() {
    return (
        <RoleGateway
            superadmin={<SuperAdminConfigure />}
            user={<UserConfigure />}
        />
    )
}