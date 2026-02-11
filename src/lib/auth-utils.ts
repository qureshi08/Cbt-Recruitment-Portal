import { createClient } from "./supabase-server";
import { UserRole, getUserRoles } from "@/app/actions";

export interface AppUser {
    id: string;
    email: string;
    full_name: string;
    roles: UserRole[];
}

export async function getCurrentUser(): Promise<AppUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch user profile from public.users
    const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const roles = await getUserRoles(user.id);

    return {
        id: user.id,
        email: user.email!,
        full_name: profile?.full_name || 'System User',
        roles: roles
    };
}

export function hasRole(user: AppUser | null, role: UserRole): boolean {
    return user?.roles.includes(role) || false;
}

export function canDoEverything(user: AppUser | null): boolean {
    return hasRole(user, "Master");
}
