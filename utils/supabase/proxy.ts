import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import DomainFinder from '@/helpers/domain-finder'
import { Database } from '@/type/database-type'

const AUTH_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
                },
            },
        }
    )

    const pathname = request.nextUrl.pathname;
    const hostname = request.headers.get("host") || request.nextUrl.hostname;
    const subdomain = DomainFinder(hostname)
    const isAuthPath = AUTH_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))

    if (subdomain === "superadmin" || subdomain === "user") {



        const { data } = await supabase.auth.getClaims();
        const user = data?.claims;
        if (isAuthPath && user) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (pathname === '/' && subdomain !== "user") {
            return NextResponse.redirect(
                new URL(user ? '/dashboard' : '/sign-in', request.url)
            )
        }
        if (pathname === '/' && subdomain === "user") {
            return
        }
        if (!user && !isAuthPath) {
            return NextResponse.redirect(new URL('/sign-in', request.url))
        }
    }


    return supabaseResponse;
}