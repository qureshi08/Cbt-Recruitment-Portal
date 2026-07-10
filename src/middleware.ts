import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Use getUser() instead of getSession() for security
    const { data: { user } } = await supabase.auth.getUser()

    // '/program/*' is the Academy section (Program Admin/Mentor/Fellow) —
    // protected the same way as '/admin/*'. Role-specific gating happens in
    // each section's own layout.tsx, same pattern as today.
    const isProtected = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/program')

    // If trying to access a protected section without login -> Redirect to login
    if (isProtected && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // NOTE: previously we redirected '/login' to '/admin' when a session
    // existed. That blocked legitimate account switching on shared devices —
    // a second user could never reach the form, so they ended up signed in as
    // whoever last used the machine. /login is always reachable now; the page
    // itself shows the active session and lets the user either go to the
    // dashboard or submit new credentials (which signs the previous user out).

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public static assets)
         * - api (API routes - exclude if you want to protect them)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
