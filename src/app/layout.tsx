import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-body",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-heading",
    display: "swap",
});

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
        <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
            <body className="font-sans antialiased text-text selection:bg-primary/10">
                <main className="min-h-screen bg-white">
                    {children}
                </main>
            </body>
        </html>
    );
}
