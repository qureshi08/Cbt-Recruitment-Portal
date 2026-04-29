import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Star, Briefcase, GraduationCap, Calendar } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/5">
            {/* Ultra-Minimal Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface px-6 md:px-12">
                <div className="max-w-7xl mx-auto py-3">
                    <Logo withText={false} />
                </div>
            </header>

            <main className="pt-12 md:pt-20 pb-24 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-16 xl:gap-24 items-start">

                        {/* LEFT: The Application Form (Main Action) */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-6">
                                <h1 className="text-4xl md:text-6xl font-extrabold text-heading tracking-tight italic flex flex-wrap items-center gap-x-4 gap-y-2">
                                    Apply for
                                    <div className="relative h-10 w-32 translate-y-1">
                                        <Image
                                            src="/cgap-logo.png"
                                            alt="CGAP"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </h1>
                                <p className="text-lg text-muted max-w-xl leading-relaxed">
                                    Nine months of structured learning, senior mentorship, and real stakes. Start your career journey today by filling out the form below.
                                </p>
                            </div>

                            <div className="relative bg-white p-6 md:p-10 rounded-[40px] border border-border/60 shadow-elevated">
                                <ApplicationForm />
                            </div>
                        </div>

                        {/* RIGHT: Basic Program Info */}
                        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-10">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "DURATION", val: "9 months", icon: Calendar },
                                    { label: "STIPEND", val: "From Day 1", icon: Star },
                                    { label: "PHASES", val: "4 Core", icon: GraduationCap },
                                    { label: "ENGAGEMENT", val: "Real Stakes", icon: Briefcase },
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-white rounded-[2rem] border border-border/40 hover:border-primary/20 transition-all group shadow-sm hover:shadow-premium">
                                        <h3 className="text-2xl font-bold text-heading group-hover:text-primary transition-colors italic">
                                            {item.val}
                                        </h3>
                                        <p className="text-[10px] font-black text-muted tracking-[0.2em] uppercase mt-2">
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-heading rounded-[2.5rem] text-white space-y-8 relative overflow-hidden shadow-elevated">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <h3 className="text-2xl font-bold italic border-b border-white/10 pb-6">Ideal Candidate</h3>
                                <ul className="space-y-5">
                                    {[
                                        "Fresh graduates or up to 2yr experience",
                                        "Bachelor's in CS, Stats, or Engineering",
                                        "Strong analytical & problem-solving skills",
                                        "Commitment to full 9-month program"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium text-white/80 leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="text-center md:text-left pt-4">
                                <p className="text-[10px] text-muted font-bold tracking-[0.3em] uppercase italic">Trusted by Industry Leaders</p>
                                <div className="flex flex-wrap items-center gap-6 mt-8 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                                    {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF", "Spark"].map(id => (
                                        <span key={id} className="text-sm font-black italic tracking-tighter">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-20 border-t border-border bg-surface-alt">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <Logo withText={true} className="scale-110 origin-center md:origin-left" />
                        <p className="text-[11px] text-muted italic max-w-xs leading-relaxed">
                            © 2026 Convergent Business Technologies. Empowering the next generation of Cloud & AI specialists.
                        </p>
                    </div>
                    <div className="flex items-center gap-10 text-[10px] font-black text-muted tracking-[0.3em] uppercase italic">
                        <Link href="https://www.convergentbt.com/contact" className="hover:text-primary transition-all">Contact Us</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
