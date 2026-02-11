import RoleGateway from "@/helpers/role-gateway";
import UserMobileHeader from "./user";
import SuperAdminMobileHeader from "./superadmin";

export default function MobileHeader() {
    return (
        <RoleGateway
            superadmin={<SuperAdminMobileHeader />}
            user={<UserMobileHeader />}
            fallback={null}
        />
    );
}