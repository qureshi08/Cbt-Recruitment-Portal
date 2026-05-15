import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Emergency logout endpoint.
 * Visit /api/logout in the browser to forcibly clear the session and
 * escape any redirect loop caused by a stuck or corrupted auth session.
 */
export async function GET() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Aggressively nuke every auth-related cookie
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        if (
            cookie.name.includes('auth') ||
            cookie.name.includes('supabase') ||
            cookie.name.includes('sb-') ||
            cookie.name.includes('session')
        ) {
            cookieStore.delete(cookie.name);
        }
    });

    // Redirect to login using a relative URL to ensure it works in all environments
    return NextResponse.redirect(new URL('/login', request.url));
}
