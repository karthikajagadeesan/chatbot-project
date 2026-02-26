import { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/proxy";

export default async function proxy(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/profile/:path*",
//     "/memberships/:path*",
//     "/settings/:path*",
//   ],
// };