import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Header / Nav */}
            <nav className="h-20 flex items-center px-6 md:px-12 border-b border-border/50">
                <Logo withText={true} />
            </nav>

            <main className="max-w-7xl mx-auto px-6 md:px-12 py-20 lg:py-32">
                <div className="grid lg:grid-cols-2 gap-20 items-start">
                    {/* Left Side: Content */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-heading font-heading italic leading-[1.1]">
                                Graduates today. <br />
                                Consultants, <span className="text-primary underline decoration-primary/20 decoration-4 underline-offset-8">shipping.</span>
                            </h1>
                            <p className="text-lg text-body max-w-lg leading-relaxed font-medium opacity-80">
                                Nine months of structured learning, senior mentorship, and real stakes. Start your career journey today by filling out the form.
                            </p>
                        </div>

                        {/* Optional subtle accent */}
                        <div className="flex gap-10 pt-10 border-t border-border/40">
                            {[
                                { n: "09", t: "MONTHS" },
                                { n: "04", t: "PHASES" },
                                { n: "M2+", t: "REAL STAKES" },
                            ].map((s, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="text-xl font-bold text-heading font-heading italic">{s.n}</div>
                                    <div className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">{s.t}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                        <div className="bg-white p-10 md:p-14 border border-border shadow-soft rounded-md">
                            <ApplicationForm />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 px-6 border-t border-border mt-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-10">
                    <Logo withText={true} className="opacity-20" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        © 2026 Convergent. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
