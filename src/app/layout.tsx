import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
        <html lang="en" className={inter.className}>
            <body>
                <main className="min-h-screen bg-gray-50/50">
                    {children}
                </main>
            </body>
        </html>
    );
}
