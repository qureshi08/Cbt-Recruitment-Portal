import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Ultra-Minimal Header */}
            <header className="py-2.5 px-6 md:px-12 flex justify-start border-b border-surface">
                <Logo />
            </header>

            <main className="pt-8 md:pt-12 pb-20 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

                        {/* Left Side: Program Identity */}
                        <div className="w-full lg:w-1/3 lg:sticky lg:top-24 space-y-8">
                            <div className="relative w-full aspect-[4/1] lg:aspect-square max-w-sm mx-auto lg:mx-0 opacity-90 hover:opacity-100 transition-opacity">
                                <Image
                                    src="/cgap-logo.png"
                                    alt="CGAP Program Logo"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>
                            <div className="hidden lg:block space-y-4">
                                <h2 className="text-2xl font-extrabold text-heading tracking-tight italic">
                                    Join the Academy
                                </h2>
                                <p className="text-sm text-text-muted leading-relaxed">
                                    The Convergent Graduate Academy Program (CGAP) is designed to transform fresh talent into industry-ready engineers. Apply now to start your journey.
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Application Portal */}
                        <div className="w-full lg:flex-1">
                            <div className="text-center lg:text-left mb-8">
                                <h1 className="text-2xl md:text-4xl font-extrabold text-heading mb-2 tracking-tight font-heading flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
                                    <span>Apply for</span>
                                    <div className="relative h-10 w-32 translate-y-1">
                                        <Image
                                            src="/cgap-logo.png"
                                            alt="CGAP"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </h1>
                                <p className="text-sm text-text-muted max-w-xl lg:mx-0 leading-relaxed mt-4">
                                    Start your recruitment journey today. Please fill out the form below carefully.
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/2 rounded-full blur-3xl -z-10" />
                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/2 rounded-full blur-3xl -z-10" />
                                <ApplicationForm />
                            </div>
                        </div>
                    </div>
                </div>
            </main>


            {/* Simple Footer */}
            <footer className="py-8 px-6 border-t border-border bg-surface">
                <div className="max-w-2xl mx-auto text-center space-y-2">
                    <p className="text-[11px] text-text-muted flex items-center justify-center gap-2">
                        <span className="font-bold text-heading">Convergent Business Technologies</span>
                        <span className="text-border">|</span>
                        <span>Official Recruitment Portal</span>
                    </p>
                    <p className="text-[10px] text-text-muted/40">
                        &copy; {new Date().getFullYear()} All rights reserved. Reach us at careers@convergentbt.com
                    </p>
                </div>
            </footer>
        </div>
    );
}
