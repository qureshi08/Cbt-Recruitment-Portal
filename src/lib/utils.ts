import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// All assessment/interview slot times are anchored to Pakistan Standard Time
// regardless of where the candidate or admin is viewing from.
export const PKT_TIMEZONE = "Asia/Karachi";

export function formatSlotTime(input: string | Date) {
    return new Date(input).toLocaleTimeString("en-US", {
        timeZone: PKT_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function formatSlotDate(
    input: string | Date,
    options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }
) {
    return new Date(input).toLocaleDateString("en-US", {
        timeZone: PKT_TIMEZONE,
        ...options,
    });
}

export function formatSlotRange(start: string | Date, end: string | Date) {
    return `${formatSlotTime(start)} — ${formatSlotTime(end)}`;
}

// YYYY-MM-DD key in Pakistan time, useful for grouping slots by their PKT calendar date.
export function pktDateKey(input: string | Date) {
    return new Date(input).toLocaleDateString("en-CA", { timeZone: PKT_TIMEZONE });
}
