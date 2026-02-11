import { supabase } from "./supabase";
import { UserRole } from "@/app/actions";

export interface AppUser {
    id: string;
    email: string;
    full_name: string;
    roles: UserRole[];
}

// In a real app, this would use supabase.auth.getUser()
// For now, we simulate "Farooq Sahab" as the default Master/Approver user
export async function getCurrentUser(): Promise<AppUser | null> {
    // We'll mock a user for the demonstration
    return {
        id: "fc2db9a3-5c8e-4a6b-9c5d-4f1e2a3b4c5d",
        email: "farooq@cbt.com",
        full_name: "Farooq Sahab",
        roles: ["Master", "Approver"] // Give him dual roles as requested
    };
}

export function hasRole(user: AppUser | null, role: UserRole): boolean {
    return user?.roles.includes(role) || false;
}

export function canDoEverything(user: AppUser | null): boolean {
    return hasRole(user, "Master");
}
