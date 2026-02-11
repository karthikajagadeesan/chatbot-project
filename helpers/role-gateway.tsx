
import ErrorState from "@/components/error-state";
import { headers } from "next/headers";
import DomainFinder from "./domain-finder";

export default async function RoleGateway({
    superadmin,
    user,
    fallback = <ErrorState title="Unauthorized" description="You do not have permission to access this page" />
}: {
    superadmin?: React.ReactNode,
    user?: React.ReactNode,
    fallback?: React.ReactNode
}) {
    const subdomain = DomainFinder((await headers()).get("host")!);

    if (subdomain === "superadmin" && superadmin) {
        return superadmin;
    }
    if (subdomain === "user" && user) {
        return user;
    }
    return fallback;
}