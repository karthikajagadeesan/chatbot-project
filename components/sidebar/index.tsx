import RoleGateway from "@/helpers/role-gateway";
import SuperAdminSidebar from "./superadmin";
import UserSidebar from "./user";

export default function Sidebar() {
    return (
        <RoleGateway
            superadmin={<SuperAdminSidebar />}
            user={<UserSidebar />}
            fallback={null}
        />
    );
}