import { Client } from "@microsoft/microsoft-graph-client";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Microsoft Teams meeting link using stored user tokens.
 * Automatically handles token refresh.
 */
export async function createTeamsMeeting(subject: string, startTime: string, endTime: string) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID;

    // 1. Fetch tokens from Supabase
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Check for Master Meeting Link (Manual Fallback)
    const { data: masterSettings } = await supabase
        .from('portal_settings')
        .select('value')
        .eq('key', 'master_meeting_link')
        .single();

    if (masterSettings?.value) {
        console.log("Using Master Meeting Link for interview");
        return {
            success: true,
            joinUrl: masterSettings.value,
            isSimulated: false
        };
    }

    const { data: tokenData, error: dbError } = await supabase
        .from('microsoft_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (dbError || !tokenData) {
        console.warn("No Microsoft token found in database. Using simulation mode.");
        return simulateMeeting();
    }

    let accessToken = tokenData.access_token;

    // 2. Check if token is expired (or close to it)
    const isExpired = new Date(tokenData.expires_at).getTime() < (Date.now() + 60000);

    if (isExpired) {
        try {
            console.log("Refreshing Microsoft token...");
            const refreshResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    refresh_token: tokenData.refresh_token,
                    grant_type: 'refresh_token',
                    scope: 'offline_access OnlineMeetings.ReadWrite User.Read',
                }),
            });

            const newTokens = await refreshResponse.json();
            if (!newTokens.access_token) throw new Error("Refresh failed: " + (newTokens.error_description || "Unknown error"));

            accessToken = newTokens.access_token;
            const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

            // Update database
            await supabase
                .from('microsoft_tokens')
                .update({
                    access_token: accessToken,
                    refresh_token: newTokens.refresh_token || tokenData.refresh_token,
                    expires_at: newExpiresAt
                })
                .eq('id', tokenData.id);

        } catch (refreshErr: any) {
            console.error("Token refresh failed:", refreshErr);
            return { error: "Authentication expired. Please re-connect Microsoft Teams in Settings." };
        }
    }

    // 3. Create the meeting
    try {
        const client = Client.init({
            authProvider: (done) => done(null, accessToken),
        });

        const meeting = {
            subject,
            startDateTime: new Date(startTime).toISOString(),
            endDateTime: new Date(endTime).toISOString(),
            lobbyBypassSettings: { scope: "everyone" }
        };

        // We use /me because we are using delegated permissions
        const result = await client.api('/me/onlineMeetings').post(meeting);

        return {
            success: true,
            joinUrl: result.joinWebUrl,
            isSimulated: false
        };
    } catch (error: any) {
        console.error("Microsoft Graph Error:", error);
        return { error: error.message };
    }
}

function simulateMeeting() {
    const mockMeetingId = Math.random().toString(36).substring(2, 15);
    return {
        success: true,
        joinUrl: `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${mockMeetingId}%40thread.v2/0?context=%7b%22Tid%22%3a%22simulated-tenant%22%2c%22Oid%22%3a%22simulated-owner%22%7d`,
        isSimulated: true
    };
}
