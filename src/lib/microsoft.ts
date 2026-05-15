import { supabaseAdmin } from './supabase-admin';

/**
 * DEPRECATED: Azure Graph API integration removed to avoid intrusive MFA requests.
 * Now strictly uses the Master Meeting Link fallback.
 */
export async function createTeamsMeeting(subject: string, start: string, end: string) {
    try {
        // Fetch the Master Meeting Link from settings
        const { data: masterLinkSetting } = await supabaseAdmin
            .from('portal_settings')
            .select('value')
            .eq('key', 'master_meeting_link')
            .single();

        if (!masterLinkSetting?.value) {
            throw new Error("Master Meeting Link not configured in Portal Settings.");
        }

        console.log("Using Master Meeting Link.");
        return {
            joinUrl: masterLinkSetting.value,
            isFallback: true
        };
    } catch (error: any) {
        console.error("Microsoft Teams Meeting error:", error.message);
        // Fallback to a plain message if no link is configured
        return {
            joinUrl: "#",
            isFallback: true,
            error: error.message
        };
    }
}
