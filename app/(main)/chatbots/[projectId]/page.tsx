import RoleGateway from "@/helpers/role-gateway"
import UserProjectDetail from "./user"

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    return <RoleGateway user={<UserProjectDetail projectId={projectId} />} />
}
