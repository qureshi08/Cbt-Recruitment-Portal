import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Star, Briefcase, GraduationCap, Calendar, ArrowRight, MousePointer2 } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] selection:bg-primary/20 overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-primary/3 rounded-full blur-[80px]" />
            </div>

            {/* Premium Header */}
            <header className="sticky top-0 z-[100] px-6 md:px-12 pt-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl py-4 px-8 flex justify-between items-center transition-all duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                        <Logo withText={true} />
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="https://www.convergentbt.com" className="text-[10px] font-black tracking-[0.2em] uppercase text-muted hover:text-primary transition-colors italic">Corporate</Link>
                            <Link href="https://www.convergentbt.com/contact" className="px-5 py-2 bg-heading text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-primary transition-all shadow-lg shadow-heading/10">Contact</Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-12 md:pt-24 pb-32 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-12 gap-12 xl:gap-20 items-start">

                        {/* LEFT: Hero & Application Form */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.1em] italic select-none">
                                    <Star className="w-3 h-3 fill-primary" />
                                    <span>Convergent Graduate Academy Program 2026</span>
                                </div>

                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-7xl font-extrabold text-heading tracking-tight italic flex flex-col">
                                        <span className="leading-tight">Architecting the</span>
                                        <div className="flex flex-wrap items-end gap-x-4">
                                            <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-[12px]">Elite Future.</span>
                                            <div className="relative h-10 w-32 md:h-12 md:w-40 translate-y-[-10px] md:translate-y-[-15px]">
                                                <Image
                                                    src="/cgap-logo.png"
                                                    alt="CGAP"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    </h1>
                                    <p className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed font-medium">
                                        Nine months of elite mentorship, heavy architectural challenges, and career-defining projects. We don't just hire; we forge specialists.
                                    </p>
                                </div>
                            </div>

                            <div className="group relative">
                                {/* Form Backdrop Glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-[42px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative bg-white p-8 md:p-12 rounded-[40px] border border-border/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-500">
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                                        <div>
                                            <h2 className="text-2xl font-black text-heading uppercase tracking-tight italic">Enrollment Form</h2>
                                            <p className="text-xs text-muted font-bold mt-1 uppercase tracking-widest leading-none">Start your professional metamorphosis</p>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100">
                                            <MousePointer2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <ApplicationForm />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: High-Impact Cards */}
                        <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "CURRICULUM", val: "9 months", icon: Calendar, color: "bg-emerald-500" },
                                    { label: "INCENTIVES", val: "Competitive", icon: Star, color: "bg-amber-500" },
                                    { label: "STRUCTURE", val: "4 Phases", icon: GraduationCap, color: "bg-indigo-600" },
                                    { label: "OUTCOME", val: "Global Roles", icon: Briefcase, color: "bg-rose-600" },
                                ].map((item, i) => (
                                    <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-border/60 hover:border-primary/40 transition-all group shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:-translate-y-1">
                                        <div className={cn("inline-flex p-2.5 rounded-xl text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", item.color)}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-2xl font-black text-heading group-hover:text-primary transition-colors italic leading-none">
                                            {item.val}
                                        </h3>
                                        <p className="text-[10px] font-black text-muted tracking-[0.2em] uppercase mt-3">
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-heading rounded-[2.5rem] text-white space-y-10 relative overflow-hidden shadow-2xl shadow-heading/10 group">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125" />
                                <div className="absolute bottom-[-20%] left-[-20%] w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />

                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black italic border-b border-white/10 pb-8 uppercase tracking-tight leading-none">Candidate Specification</h3>
                                    <p className="text-[10px] font-bold text-white/40 mt-4 uppercase tracking-[0.3em]">Institutional Requirements</p>
                                </div>

                                <ul className="space-y-6 relative z-10">
                                    {[
                                        "Fresh graduates or professionals with < 2yr tenure",
                                        "Academic excellence in CS, Data Science, or Engineering",
                                        "Elite analytical & problem-solving cognitive abilities",
                                        "Absolute commitment to the exhaustive 9-month program"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-5 group/item">
                                            <div className="w-7 h-7 rounded-xl bg-white/10 hover:bg-primary flex items-center justify-center shrink-0 mt-0.5 transition-colors border border-white/5">
                                                <CheckCircle2 className="w-4 h-4 text-primary group-hover/item:text-white transition-colors" />
                                            </div>
                                            <span className="text-[15px] font-medium text-white/80 leading-snug group-hover/item:text-white transition-colors">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-6 relative z-10">
                                    <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-white/50 hover:text-primary uppercase tracking-[0.3em] italic transition-colors">
                                        Internal Portal Access
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] border border-border/40 shadow-sm overflow-hidden relative">
                                <p className="text-[11px] text-muted font-black tracking-[0.3em] uppercase italic mb-8">Ecosystem Partners</p>
                                <div className="flex flex-wrap items-center gap-x-8 gap-y-6 opacity-40 grayscale">
                                    {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF", "Spark"].map(id => (
                                        <span key={id} className="text-md font-black italic tracking-tighter hover:text-heading hover:opacity-100 hover:grayscale-0 transition-all cursor-default">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* High-End Footer */}
            <footer className="relative py-24 border-t border-border bg-surface-alt mt-20">
                <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-16 text-center md:text-left relative z-10">
                    <div className="space-y-6 max-w-md">
                        <Logo withText={true} className="scale-125 origin-center md:origin-left" />
                        <p className="text-sm text-body font-medium leading-relaxed">
                            Convergent Graduate Academy Program (CGAP) is a proprietary internship lifecycle management solution developed by CBT.
                        </p>
                        <p className="text-[10px] text-muted font-black uppercase tracking-widest">
                            © 2026 Convergent Business Technologies. All Rights Reserved.
                        </p>
                    </div>
                    <div className="flex flex-col md:items-end gap-6">
                        <div className="flex items-center flex-wrap justify-center md:justify-end gap-10 text-[11px] font-black text-muted tracking-[0.3em] uppercase italic">
                            <Link href="https://www.convergentbt.com/about" className="hover:text-primary transition-all">About Ecosystem</Link>
                            <Link href="https://www.convergentbt.com/contact" className="hover:text-primary transition-all">Careers</Link>
                            <Link href="https://www.convergentbt.com/privacy" className="hover:text-primary transition-all">Privacy</Link>
                        </div>
                        <div className="h-px w-full md:w-32 bg-border" />
                        <p className="text-[10px] text-muted font-bold italic">ISO 27001 Certified Environment</p>
                    </div>
                </div>
            </header>
        </div>
    );
}
