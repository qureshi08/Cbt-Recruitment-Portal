import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10 grid-bg">
            {/* Ultra-Slim Navigation */}
            <nav className="h-14 border-b border-border bg-white/95 backdrop-blur-sm sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <Logo withText={true} />
                    <div className="hidden md:flex items-center gap-10">
                        <Link href="https://www.convergentbt.com" className="btn-ghost">Corporate</Link>
                        <Link href="https://www.convergentbt.com/contact" className="btn-primary">Book a Call →</Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section — Exact Marketing Scale */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
                        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-left-4 duration-1000">
                            <span className="inline-block px-2 py-0.5 border border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.3em] rounded-sm">
                                Batch 29 • Applications Open
                            </span>

                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-heading leading-[1.05]">
                                Graduates today.<br />
                                Consultants, <span className="text-primary italic font-heading">shipping.</span>
                            </h1>

                            <p className="text-[14px] md:text-[15px] text-body max-w-lg leading-relaxed font-medium">
                                The **Convergent Graduate Academy Program (CGAP)** is CBT’s 9-month learning-and-grooming pathway — turning top graduates into industry-ready data & AI professionals.
                            </p>

                            <div className="inline-flex items-center gap-4 pt-4">
                                <Link href="#apply" className="btn-primary !px-10 !py-3 !text-xs ring-4 ring-primary/5 shadow-md">
                                    Apply to CGAP <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>

                            <div className="flex gap-8 pt-10">
                                {[
                                    { n: "9", t: "MONTHS" },
                                    { n: "4", t: "PHASES" },
                                    { n: "M2", t: "REAL PROJECTS" },
                                    { n: "B29", t: "NEXT BATCH" },
                                ].map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="text-lg font-bold text-heading">{s.n}</div>
                                        <div className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">{s.t}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group lg:mt-4">
                            {/* Luxury Framing */}
                            <div className="relative aspect-[16/10] rounded-sm overflow-hidden border border-border shadow-soft bg-surface-alt">
                                <Image
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1470"
                                    alt="CBT Team"
                                    fill
                                    className="object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-sm -z-10" />
                        </div>
                    </div>
                </section>

                {/* Editorial Break */}
                <section className="bg-surface-alt/50 border-y border-border py-20 px-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">The 9-Month Journey</span>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-heading leading-none italic">
                            Starts as a graduate. <br />
                            Ends as a <span className="text-primary">consultant.</span>
                        </h2>
                        <p className="text-[14px] text-body max-w-xl leading-relaxed pt-2">
                            Month-by-month, with real stakes. No bootcamp graveyard; no disconnected theory. By month two you’re on a real engagement under a senior lead.
                        </p>
                    </div>
                </section>

                {/* Enrollment Registry Area */}
                <section id="apply" className="py-24 px-6 relative">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-20">
                        <div className="lg:col-span-5 space-y-12">
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-heading italic underline decoration-primary decoration-2 underline-offset-8">
                                    Candidate Thresholds
                                </h2>
                                <p className="text-sm text-body leading-relaxed max-w-sm font-medium">
                                    We search for the top 1% of technical talent. If you have the cognitive agility and the ambition to lead, we have the pathway.
                                </p>
                            </div>

                            <ul className="space-y-5">
                                {[
                                    "Fresh graduates (CS/Data/Engineering)",
                                    "Academic excellence & analytical depth",
                                    "Fluent articulation & structural thinking"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-heading text-[13px] font-bold uppercase tracking-tight">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-10 opacity-30 grayscale saturate-0 contrast-150">
                                <p className="text-[8px] font-black text-muted uppercase tracking-[0.4em] mb-6">Strategic Ecosystem</p>
                                <div className="flex flex-wrap gap-8">
                                    {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF"].map(id => (
                                        <span key={id} className="text-[11px] font-black italic tracking-tighter">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-white border border-border rounded-sm shadow-premium p-8 md:p-12 relative">
                                <div className="h-1 w-full bg-primary absolute top-0 left-0" />
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-border/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-heading uppercase tracking-tighter italic">Application Dossier</h3>
                                        <p className="text-[9px] font-bold text-muted mt-1 uppercase tracking-widest">Formal Recruitment Sequence</p>
                                    </div>
                                    <Link href="/login" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-widest">
                                        Admin Registry <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                                <ApplicationForm />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 px-6 border-t border-border">
                <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-10">
                    <Logo withText={true} className="opacity-40" />
                    <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-muted">
                        <Link href="/" className="hover:text-primary transition-colors">Ecosystem</Link>
                        <Link href="/" className="hover:text-primary transition-colors">Career Path</Link>
                        <span>© 2026 Convergent. All Rights Reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
