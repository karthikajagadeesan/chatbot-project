import RoleGateway from "@/helpers/role-gateway"
import UserProjects from "./user"
import SuperAdminProjects from "./superadmin"

export default function ProjectsPage() {
    return <RoleGateway user={<UserProjects />} superadmin={<SuperAdminProjects />} />
}
