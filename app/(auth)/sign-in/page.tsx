import RoleGateway from "@/helpers/role-gateway";
import SuperAdminSignIn from "./superadmin";
import SignInUser from "./user";
export default function SignIn() {
  return (
    <RoleGateway
      superadmin={<SuperAdminSignIn />}
      user={<SignInUser />}
    />
  )
}