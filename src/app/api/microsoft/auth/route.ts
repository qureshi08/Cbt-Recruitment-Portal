import { NextResponse } from 'next/server';

const client_id = process.env.MICROSOFT_CLIENT_ID;
const tenant_id = process.env.MICROSOFT_TENANT_ID;

export async function GET() {
    const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/microsoft/callback`;
    const scope = 'offline_access OnlineMeetings.ReadWrite User.Read';

    const authUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/authorize?client_id=${client_id}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&response_mode=query&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(authUrl);
}
