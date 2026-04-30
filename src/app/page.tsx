import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";

export default function Home() {
    return (
        <div className="min-h-screen md:h-screen bg-white selection:bg-primary/10 flex flex-col md:overflow-hidden overflow-y-auto">
            {/* Compact Header — 56px */}
            <nav className="h-12 flex items-center px-5 md:px-8 shrink-0 border-b border-border/40 bg-white/95 backdrop-blur-sm">
                <Logo />
            </nav>

            <main className="flex-1 flex items-center px-5 md:px-8 py-10 md:py-0 overflow-hidden">
                <div className="container-main w-full grid lg:grid-cols-12 gap-8 xl:gap-14 items-center">
                    {/* Left: Editorial copy */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-4 md:space-y-6 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex flex-col md:flex-row items-center gap-4 lg:gap-5">
                            <div className="relative h-11 w-32 shrink-0 opacity-95">
                                <Image
                                    src="/cgap-logo.png"
                                    alt="CGAP Logo"
                                    fill
                                    className="object-contain object-center lg:object-left"
                                    priority
                                />
                            </div>
                            <span className="section-tag !mb-0 whitespace-nowrap">Convergent Graduate Academy Program</span>
                        </div>

                        <h1
                            className="font-bold text-heading leading-[1.05] tracking-tight"
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Starts as a graduate.<br className="hidden md:block" />
                            Ends as a <span className="italic-accent">consultant.</span>
                        </h1>

                        <p className="text-[13.5px] md:text-[14px] text-body max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                            Nine months of structured learning, senior mentorship, and real stakes. Apply below to begin.
                        </p>
                    </div>

                    {/* Right: Form card */}
                    <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-center py-4 md:py-1">
                        <div className="bg-white p-4 md:p-6 lg:p-8 border border-border rounded-[12px] shadow-soft overflow-hidden mx-auto w-full max-w-2xl lg:max-w-none">
                            <ApplicationForm />
                        </div>
                    </div>
                </div>
            </main>

            {/* Compact Footer */}
            <footer className="h-10 flex items-center px-5 md:px-8 border-t border-border/40 shrink-0 bg-surface/50">
                <div className="container-main w-full flex justify-between items-center">
                    <Logo className="opacity-100 scale-[0.6] origin-left brightness-[0.9]" />
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.12em]">
                        © 2026 Convergent Business Technologies · All Rights Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
