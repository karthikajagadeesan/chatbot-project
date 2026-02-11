import RoleGateway from "@/helpers/role-gateway";
import SignUpAdmin from "./admin";
import SignUpSuperAdmin from "./superadmin";
export default function SignUp() {
  return (
    <RoleGateway
      superadmin={<SignUpSuperAdmin />}
      admin={<SignUpAdmin />}
    />
  )
}