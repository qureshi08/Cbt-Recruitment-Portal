import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const client_id = process.env.MICROSOFT_CLIENT_ID;
const client_secret = process.env.MICROSOFT_CLIENT_SECRET;
const tenant_id = process.env.MICROSOFT_TENANT_ID;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const { origin } = new URL(request.url);
        const redirect_uri = `${origin}/api/microsoft/callback`;

        // Exchange code for token
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: client_id!,
                client_secret: client_secret!,
                code,
                redirect_uri,
                grant_type: 'authorization_code',
                scope: 'offline_access OnlineMeetings.ReadWrite User.Read',
            }),
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            throw new Error(tokens.error_description || 'Failed to exchange token');
        }

        // Get user info to identify whose token this is
        const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userRes.json();
        const userEmail = userData.mail || userData.userPrincipalName;

        // Save to Supabase (using service role)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        await supabase
            .from('microsoft_tokens')
            .upsert({
                user_email: userEmail,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expires_at: expiresAt,
            }, { onConflict: 'user_email' });

        // Redirect back to dashboard with success
        return NextResponse.redirect(`${origin}/admin/settings?microsoft=success`);
    } catch (err: any) {
        console.error("Microsoft Auth Error:", err);
        const errorOrigin = new URL(request.url).origin;
        return NextResponse.redirect(`${errorOrigin}/admin/settings?microsoft=error&msg=${encodeURIComponent(err.message)}`);
    }
}
