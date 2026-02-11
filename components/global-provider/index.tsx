import RoleGateway from "@/helpers/role-gateway";
import SuperAdminGlobalProvider from "./superadmin";
import UserGlobalProvider from "./user";
import { getSuperAdminSession, getAdminSession } from "@/app/(auth)/action";
import { fetchSuperadminAppSettings } from "@/app/(main)/settings/action";
import type { Subdomain } from "@/type/general-type";

export default async function GlobalProvider({ children, subdomain }: { children: React.ReactNode, subdomain: Subdomain | null }) {
    const superAdminResponse = subdomain === "superadmin" ? await getSuperAdminSession() : null;
    const userResponse = subdomain === "user" ? await getAdminSession() : null;
    const appSettings = await fetchSuperadminAppSettings();

    return <RoleGateway
        superadmin={<SuperAdminGlobalProvider subdomain={subdomain} user={superAdminResponse?.data} appSettings={appSettings} >{children}</SuperAdminGlobalProvider>}
        user={<UserGlobalProvider subdomain={subdomain}  user={userResponse?.data} appSettings={appSettings} >{children}</UserGlobalProvider>}
    />;
}