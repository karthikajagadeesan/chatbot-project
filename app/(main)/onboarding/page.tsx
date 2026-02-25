import RoleGateway from "@/helpers/role-gateway"
import UserOnboarding from "./user"

export default function OnboardingPage() {
    return <RoleGateway user={<UserOnboarding />} />
}