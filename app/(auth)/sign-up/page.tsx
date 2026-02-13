import RoleGateway from "@/helpers/role-gateway";
import SignUpUser from "./user";
import SignUpSuperAdmin from "./superadmin";
export default function SignUp() {
  return (
    <RoleGateway
      superadmin={<SignUpSuperAdmin />}
      user={<SignUpUser />}
    />
  )
}