import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch (error) {
                        // Handle potential cookie set errors in server components
                    }
                },
            },
        }
    );

    // Sign out
    await supabase.auth.signOut();

    // Force clear cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        if (cookie.name.includes('sb-') || cookie.name.includes('auth')) {
            cookieStore.delete(cookie.name);
        }
    });

    return NextResponse.redirect(new URL('/login', request.url));
}
