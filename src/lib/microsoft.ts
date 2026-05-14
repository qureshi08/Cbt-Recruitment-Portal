import { Client } from "@microsoft/microsoft-graph-client";
import * as msal from "@azure/msal-node";

/**
 * Creates a Microsoft Teams meeting link.
 * Falls back to a simulated link if Graph API credentials are not provided.
 */
export async function createTeamsMeeting(subject: string, startTime: string, endTime: string) {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const tenantId = process.env.MICROSOFT_TENANT_ID;

    // SIMULATION MODE: If no credentials, generate a realistic but mock link
    if (!clientId || !clientSecret || !tenantId) {
        console.warn("Microsoft Graph API credentials missing. Generating a simulated Teams link.");
        // Generate a random-ish meeting ID
        const mockMeetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        return {
            success: true,
            joinUrl: `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${mockMeetingId}%40thread.v2/0?context=%7b%22Tid%22%3a%22${Math.random().toString(36).substring(2, 10)}%22%2c%22Oid%22%3a%22${Math.random().toString(36).substring(2, 10)}%22%7d`,
            isSimulated: true
        };
    }

    try {
        const msalConfig = {
            auth: {
                clientId,
                authority: `https://login.microsoftonline.com/${tenantId}`,
                clientSecret,
            }
        };

        const cca = new msal.ConfidentialClientApplication(msalConfig);
        const tokenResponse = await cca.acquireTokenByClientCredential({
            scopes: ["https://graph.microsoft.com/.default"],
        });

        if (!tokenResponse?.accessToken) throw new Error("Could not acquire Microsoft Graph access token.");

        const client = Client.init({
            authProvider: (done) => {
                done(null, tokenResponse.accessToken!);
            },
        });

        // Use the user ID of the account that should own the meeting
        const userId = process.env.MICROSOFT_USER_ID;

        if (!userId) throw new Error("MICROSOFT_USER_ID is required for automated meeting creation via Graph API.");

        const meeting = {
            subject,
            startDateTime: new Date(startTime).toISOString(),
            endDateTime: new Date(endTime).toISOString(),
            lobbyBypassSettings: {
                scope: "everyone"
            }
        };

        const result = await client.api(`/users/${userId}/onlineMeetings`).post(meeting);

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
