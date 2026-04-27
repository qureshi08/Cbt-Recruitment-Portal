import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Star, Briefcase, GraduationCap, Calendar } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            {/* Ultra-Minimal Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface px-6 md:px-12 py-3 flex items-center justify-between">
                <Logo withText={false} />
            </header>

            <main className="pt-12 md:pt-20 pb-32 px-4 md:px-12">
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
                                <p className="text-lg text-text-muted max-w-xl leading-relaxed">
                                    Nine months of structured learning, senior mentorship, and real stakes. Start your career journey today by filling out the form below.
                                </p>
                            </div>

                            <div className="relative bg-white p-6 md:p-10 rounded-[32px] border border-border shadow-2xl shadow-primary/5">
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
                                    <div key={i} className="p-6 bg-surface rounded-2xl border border-border/40 hover:border-primary/20 transition-all group">
                                        <h3 className="text-xl font-bold text-heading group-hover:text-primary transition-colors">
                                            {item.val}
                                        </h3>
                                        <p className="text-[10px] font-black text-text-muted tracking-widest uppercase mt-1">
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-8 bg-heading rounded-[24px] text-white space-y-6">
                                <h3 className="text-lg font-extrabold italic border-b border-white/10 pb-4">Ideal Candidate</h3>
                                <ul className="space-y-4">
                                    {[
                                        "Fresh graduates or up to 2yr experience",
                                        "Bachelor's in CS, Stats, or Engineering",
                                        "Strong analytical & problem-solving skills",
                                        "Commitment to full 9-month program"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <span className="text-sm font-medium text-white/80 leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="text-center md:text-left pt-4">
                                <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase italic">Trusted by Industry Leaders</p>
                                <div className="flex flex-wrap items-center gap-4 mt-6 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                                    {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF", "Spark"].map(id => (
                                        <span key={id} className="text-xs font-black italic tracking-tighter">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-border bg-surface">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="space-y-2">
                        <Logo withText={false} className="scale-90 origin-center md:origin-left" />
                        <p className="text-[11px] text-text-muted italic max-w-xs">
                            © 2026 Convergent Business Technologies. Data, Cloud & AI consultancy.
                        </p>
                    </div>
                    <div className="flex items-center gap-8 text-[11px] font-bold text-text-muted tracking-widest uppercase italic">
                        <Link href="https://www.convergentbt.com/contact" className="hover:text-primary transition-colors">Contact</Link>
                        <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
