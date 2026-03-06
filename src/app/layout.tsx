import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CBT Recruitment Portal",
    description: "Secure, role-based recruitment portal for CBT.",
    icons: {
        icon: "/favicon.png",
        apple: "/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="font-sans antialiased text-gray-800">
                <main className="min-h-screen bg-gray-50/50">
                    {children}
                </main>
            </body>
        </html>
    );
}
