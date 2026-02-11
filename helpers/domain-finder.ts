import { Subdomain } from "../type/general-type";
const ALLOWED_SUBDOMAINS: Subdomain[] = ["superadmin"];

export default function DomainFinder(hostname: string): Subdomain | null {
    if (hostname.includes(".") && hostname.split(".").length === 2) {
        const subdomain = hostname.split(".")[0];
        if (ALLOWED_SUBDOMAINS.includes(subdomain as Subdomain)) {
            return subdomain as Subdomain;
        } else {
            return null;
        }
    }
    return "user"
}
