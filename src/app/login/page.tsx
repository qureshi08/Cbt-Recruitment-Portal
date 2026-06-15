import { getCurrentUser } from "@/lib/auth-utils";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
    // Surface any active session so a second user on a shared device knows
    // exactly whose account is currently signed in before they type their
    // own credentials.
    const user = await getCurrentUser();

    return (
        <LoginForm
            activeSession={
                user
                    ? { email: user.email, fullName: user.full_name }
                    : null
            }
        />
    );
}
