import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Ultra-Minimal Header */}
            <header className="py-2.5 px-6 md:px-12 flex justify-start border-b border-surface">
                <Logo />
            </header>

            <main className="pt-4 md:pt-8 pb-16 px-4 md:px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-5">
                        <h1 className="text-xl md:text-3xl font-extrabold text-heading mb-1 tracking-tight font-heading">
                            Apply for <span className="text-primary italic">CGAP</span>
                        </h1>
                        <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                            Start your recruitment journey today. Please fill out the form below.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <ApplicationForm />
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
