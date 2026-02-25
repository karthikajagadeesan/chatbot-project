import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import DomainFinder from '@/helpers/domain-finder'

const GUEST_ONLY_PATHS = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password']
const PROTECTED_PATHS = ['/dashboard', '/configure', '/agents', '/settings', '/projects', '/profile']
// Note: /api/*, /embed are intentionally NOT in GUEST_ONLY_PATHS — they must be publicly accessible

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const pathname = request.nextUrl.pathname
    const hostname = request.headers.get("host") || request.nextUrl.hostname
    const subdomain = DomainFinder(hostname)

    if (pathname === "/") return supabaseResponse

    const isGuestOnlyPath = GUEST_ONLY_PATHS.some((path) => pathname.startsWith(path))
    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))

    const { data } = await supabase.auth.getClaims()
    const authUser = data?.claims

    // No auth session at all → kick to sign-in if on protected route
    if (isProtectedPath && !authUser) {
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    // Has auth session → verify the user profile still exists in the DB
    if (authUser) {
        const { data: dbUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.sub)
            .maybeSingle()

        if (!dbUser) {
            // Profile deleted — kill the session and send to sign-in
            await supabase.auth.signOut()
            const response = NextResponse.redirect(new URL('/sign-in', request.url))
            // Clear auth cookies so the session is fully gone
            request.cookies.getAll().forEach(({ name }) => {
                if (name.startsWith('sb-')) response.cookies.delete(name)
            })
            return response
        }

        // Valid session + valid profile → don't let them back to guest pages
        if (isGuestOnlyPath) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}