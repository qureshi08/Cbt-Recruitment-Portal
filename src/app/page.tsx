import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <div className="h-screen bg-white selection:bg-primary/10 flex flex-col overflow-hidden">
            {/* Minimal Header */}
            <nav className="h-16 flex items-center px-6 md:px-12 shrink-0 border-b border-border/50">
                <Logo withText={true} />
            </nav>

            <main className="flex-1 flex items-center px-6 md:px-12 overflow-hidden">
                <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-10 xl:gap-20 items-center">
                    {/* Left Side: Content — High Density */}
                    <div className="lg:col-span-5 space-y-6 xl:space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tighter text-heading font-heading italic leading-[1.1]">
                                Starts as a graduate. <br />
                                Ends as a <span className="text-primary underline decoration-primary/20 decoration-4 underline-offset-8">consultant.</span>
                            </h1>
                            <p className="text-sm md:text-base text-body max-w-md leading-relaxed font-medium opacity-80">
                                Nine months of structured learning, senior mentorship, and real stakes. Start your career journey today by filling out the form.
                            </p>
                        </div>

                        <div className="flex gap-8 pt-8 border-t border-border/40">
                            {[
                                { n: "09", t: "MONTHS" },
                                { n: "04", t: "PHASES" },
                                { n: "M2+", t: "REAL STAKES" },
                            ].map((s, i) => (
                                <div key={i} className="space-y-0.5">
                                    <div className="text-lg font-bold text-heading font-heading italic">{s.n}</div>
                                    <div className="text-[8px] font-bold text-muted uppercase tracking-[0.2em]">{s.t}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Form — Scrollable within container */}
                    <div className="lg:col-span-7 h-full max-h-[80vh] flex flex-col py-4">
                        <div className="bg-white p-6 md:p-8 xl:p-10 border border-border shadow-soft rounded-md overflow-y-auto custom-scrollbar scroll-smooth">
                            <ApplicationForm />
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="h-14 flex items-center px-6 md:px-12 border-t border-border shrink-0">
                <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
                    <Logo withText={false} className="opacity-20 scale-75 origin-left" />
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        © 2026 Convergent. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
