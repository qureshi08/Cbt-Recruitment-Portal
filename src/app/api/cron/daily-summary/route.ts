import { NextResponse } from "next/server";
import { sendDailySummaryNotifications } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        console.log("[Cron Job] Triggering daily summary notification job...");
        
        // Optional: Verify Vercel Cron authorization token if configured
        const authHeader = request.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.warn("[Cron Job] Unauthorized request attempt to trigger daily summary.");
            return new Response("Unauthorized", { status: 401 });
        }

        const result = await sendDailySummaryNotifications();
        
        if (!result.success) {
            console.error("[Cron Job] Daily summary job failed:", result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        console.log(`[Cron Job] Daily summary job completed successfully. Handled: ${result.count || 0} events.`);
        return NextResponse.json({ success: true, count: result.count || 0 });
    } catch (err: any) {
        console.error("[Cron Job] Crash in daily summary route:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
