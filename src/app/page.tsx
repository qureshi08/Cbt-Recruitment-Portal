import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <div className="h-screen bg-white selection:bg-primary/10 flex flex-col overflow-hidden">
            {/* Compact Header — 56px */}
            <nav className="h-12 flex items-center px-5 md:px-8 shrink-0 border-b border-border/40 bg-white/95 backdrop-blur-sm">
                <Logo withText={true} />
            </nav>

            <main className="flex-1 flex items-center px-5 md:px-8 overflow-hidden">
                <div className="container-main w-full grid lg:grid-cols-12 gap-8 xl:gap-14 items-center">
                    {/* Left: Editorial copy */}
                    <div className="lg:col-span-5 space-y-5 animate-in fade-in slide-in-from-left-4 duration-700">
                        <span className="section-tag">Convergent · Graduate Programme</span>

                        <h1
                            className="font-bold text-heading leading-[1.1] tracking-tight"
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "clamp(2rem, 3.6vw, 3rem)",
                                letterSpacing: "-0.025em",
                            }}
                        >
                            Starts as a graduate.<br />
                            Ends as a <span className="italic-accent">consultant.</span>
                        </h1>

                        <p className="text-[13.5px] text-body max-w-md leading-relaxed">
                            Nine months of structured learning, senior mentorship, and real stakes. Apply below to begin.
                        </p>


                    </div>

                    {/* Right: Form card */}
                    <div className="lg:col-span-7 flex flex-col justify-center py-1">
                        <div className="bg-white p-5 md:p-6 border border-border rounded-[10px] shadow-soft overflow-hidden">
                            <ApplicationForm />
                        </div>
                    </div>
                </div>
            </main>

            {/* Compact Footer */}
            <footer className="h-10 flex items-center px-5 md:px-8 border-t border-border/40 shrink-0 bg-surface/50">
                <div className="container-main w-full flex justify-between items-center">
                    <Logo withText={false} className="opacity-100 scale-[0.6] origin-left brightness-[0.9]" />
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.15em]">
                        © 2026 Convergent · All Rights Reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}
