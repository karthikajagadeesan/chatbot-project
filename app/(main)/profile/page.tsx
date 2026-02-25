import RoleGateway from "@/helpers/role-gateway";
import UserSettings from "../settings/user";

export default function ProfilePage() {
    return (
        <RoleGateway user={<UserSettings />} />
    );
}