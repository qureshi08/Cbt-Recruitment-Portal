import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Ultra-Slim Editorial Navigation */}
            <nav className="h-14 bg-white/90 backdrop-blur-md sticky top-0 z-[100] border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                    <Logo withText={true} />
                    <div className="hidden md:flex items-center gap-10">
                        <Link href="https://www.convergentbt.com" className="btn-ghost">Corporate Registry</Link>
                        <Link href="https://www.convergentbt.com/contact" className="bg-heading text-white px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all">
                            Book a Call
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section — Exact Marketing Scale */}
                <section className="py-20 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-border text-primary text-[10px] font-bold uppercase tracking-[0.3em] rounded-sm shadow-soft">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                Batch 29 • Applications Open
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-heading leading-[1.05] font-heading">
                                Graduates today. <br />
                                Consultants, <span className="italic-accent underline decoration-primary/30 underline-offset-8">shipping.</span>
                            </h1>

                            <p className="text-base text-body max-w-lg leading-relaxed font-medium opacity-80">
                                The <span className="text-heading font-bold italic">Convergent Graduate Academy Program</span> is CBT’s elite 9-month learning pathway — turning top-tier graduates into high-impact AI & data professionals.
                            </p>

                            <div className="flex items-center gap-6 pt-4">
                                <Link href="#apply" className="btn-primary py-4 px-10 shadow-premium">
                                    Apply to CGAP <ArrowRight className="w-4 h-4 ml-1" />
                                </Link>
                                <Link href="https://www.convergentbt.com/cgap" className="btn-ghost !text-xs">
                                    Explore Ecosystem
                                </Link>
                            </div>

                            <div className="flex gap-10 pt-10 border-t border-border/50">
                                {[
                                    { n: "09", t: "MONTHS" },
                                    { n: "04", t: "PHASES" },
                                    { n: "M2+", t: "REAL STAKES" },
                                    { n: "B29", t: "NEXT CYCLE" },
                                ].map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="text-xl font-bold text-heading font-heading italic">{s.n}</div>
                                        <div className="text-[9px] font-bold text-muted uppercase tracking-[0.2em]">{s.t}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group lg:mt-4 shadow-premium rounded-md">
                            <div className="relative aspect-[16/10] rounded-md overflow-hidden bg-surface border border-border">
                                <Image
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1470"
                                    alt="CBT Team"
                                    fill
                                    className="object-cover opacity-90 transition-all duration-700 group-hover:scale-105"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-md -z-10" />
                        </div>
                    </div>
                </section>

                {/* Editorial Break */}
                <section className="bg-surface py-24 px-6 border-y border-border">
                    <div className="max-w-4xl mx-auto space-y-6 text-center">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.5em]">The 9-Month Journey</span>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-heading leading-tight font-heading italic">
                            Starts as a graduate. <br />
                            Ends as a <span className="text-primary underline decoration-primary/20 decoration-4 underline-offset-12">consultant.</span>
                        </h2>
                        <p className="text-lg text-body max-w-2xl mx-auto leading-relaxed pt-2 font-medium opacity-80">
                            Month-by-month, with real stakes. No bootcamp graveyard; no disconnected theory. By month two you’re on a real engagement under a senior lead.
                        </p>
                    </div>
                </section>

                {/* Enrollment Registry Area */}
                <section id="apply" className="py-32 px-6 relative overflow-hidden">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-20 items-start">
                        <div className="lg:col-span-5 space-y-16">
                            <div className="space-y-6">
                                <h2 className="text-4xl font-bold tracking-tight text-heading font-heading italic px-4 border-l-4 border-primary">
                                    Candidate Thresholds
                                </h2>
                                <p className="text-base text-body leading-relaxed max-w-sm font-medium opacity-80 underline decoration-border underline-offset-8">
                                    We search for the top 1% of technical talent. If you have the cognitive agility and the ambition to lead, we have the pathway.
                                </p>
                            </div>

                            <ul className="space-y-8">
                                {[
                                    "Fresh graduates (CS/Data/Engineering)",
                                    "Academic excellence & analytical depth",
                                    "Fluent articulation & structural thinking"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-5 text-heading text-[14px] font-bold uppercase tracking-tight group">
                                        <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-150 transition-transform shadow-premium" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="pt-10 opacity-40 grayscale saturate-0 contrast-125">
                                <p className="text-[9px] font-bold text-muted uppercase tracking-[0.5em] mb-8">Strategic Ecosystem Presence</p>
                                <div className="flex flex-wrap gap-10">
                                    {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF"].map(id => (
                                        <span key={id} className="text-sm font-bold text-heading font-heading italic tracking-tighter">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="card !p-0 overflow-hidden relative border-none">
                                <div className="bg-heading p-12 relative">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
                                    <div className="flex justify-between items-center mb-0 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white font-heading italic">Application Dossier</h3>
                                            <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-[0.2em]">Secure Recruitment Sequence</p>
                                        </div>
                                        <Link href="/login" className="btn-ghost !text-white !decoration-white/20 hover:!text-primary">
                                            Admin <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-10 md:p-14 bg-white border border-border border-t-0 rounded-b-md">
                                    <ApplicationForm />
                                </div>
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
