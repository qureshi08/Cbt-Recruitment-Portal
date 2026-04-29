import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Logo withText={true} />
                    <div className="flex items-center gap-8">
                        <Link href="https://www.convergentbt.com" className="text-xs font-black tracking-widest text-muted hover:text-primary transition-colors uppercase">
                            Corporate Site
                        </Link>
                        <Link href="https://www.convergentbt.com/contact" className="btn-primary !px-6 !py-2 !text-xs">
                            Book a Call →
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section — Matching convergentbt.com/cgap Editorial Feel */}
                <section className="bg-surface-alt py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black tracking-[0.4em] text-primary uppercase italic">
                                    Convergent Graduate Academy
                                </p>
                                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-heading leading-[0.9]">
                                    Graduates today.<br />
                                    <span className="text-primary italic">Consultants,</span> shipping.
                                </h1>
                            </div>

                            <p className="text-xl md:text-2xl text-body max-w-xl leading-relaxed font-medium">
                                Turning top graduates into industry-ready data & AI professionals. Regular client projects from month two, and a permanent career path.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link href="#apply" className="btn-primary flex items-center gap-2">
                                    Fast-Track Application <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link href="https://www.convergentbt.com/about" className="btn-secondary">
                                    Our Methodology
                                </Link>
                            </div>
                        </div>

                        <div className="relative aspect-[4/3] rounded-sm overflow-hidden shadow-2xl border border-border group">
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors z-10" />
                            <Image
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070"
                                alt="CGAP Craft"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                priority
                            />
                        </div>
                    </div>
                </section>

                {/* The "Craft" Promise Sections — Editorial Alternating Blocks */}
                <section className="py-24 px-6 border-b border-border">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-heading mb-16 text-center italic underline decoration-primary decoration-[12px] underline-offset-[12px]">
                            Starts as a graduate. Ends as a consultant.
                        </h2>

                        <div className="grid md:grid-cols-2 gap-12 text-lg">
                            <div className="space-y-6 accent-left">
                                <h3 className="font-heading text-3xl italic">A Craft, Not a Bootcamp</h3>
                                <p className="text-body font-medium leading-relaxed">
                                    Universities give you theory. Job boards give you a job. CGAP gives you a craft — structured learning, consulting skills, and senior mentorship, stitched into every month.
                                </p>
                            </div>
                            <div className="space-y-6 accent-left">
                                <h3 className="font-heading text-3xl italic">Real Stakes, Month Two</h3>
                                <p className="text-body font-medium leading-relaxed">
                                    No disconnected theory or sandbox projects. By month two, you are on a real engagement under a senior lead, shipping value for global brands.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Application Portal Section */}
                <section id="apply" className="py-32 px-6 bg-surface-alt">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-5 space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-heading italic">
                                    Ready for CGAP<br />Batch 2026?
                                </h2>
                                <p className="text-lg text-body font-medium max-w-md">
                                    We search for the top 1% of technical talent. If you have the cognitive agility and the ambition to lead, we have the pathway.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Institutional Thresholds</p>
                                    <ul className="space-y-4">
                                        {[
                                            "Fresh graduates (CS/Data/Engineering)",
                                            "Academic excellence & analytical depth",
                                            "Commitment to the 9-month learning path",
                                            "Fluent articulation & structural thinking"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-heading font-semibold text-sm">
                                                <div className="w-5 h-5 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                                </div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="pt-4">
                                    <p className="text-[10px] font-bold text-muted uppercase mb-4 tracking-widest">ECOSYSTEM PARTNERS</p>
                                    <div className="flex flex-wrap gap-8 opacity-30 grayscale contrast-125">
                                        {["Microsoft", "Coca-Cola", "PepsiCo", "UNICEF", "Spark"].map(id => (
                                            <span key={id} className="text-sm font-black italic tracking-tighter">{id}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-white p-8 md:p-16 rounded-xl border border-border shadow-soft relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                                <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
                                    <div>
                                        <h3 className="text-2xl font-black text-heading uppercase tracking-tighter italic leading-none">Enrollment Registry</h3>
                                        <p className="text-[10px] font-bold text-muted mt-3 uppercase tracking-widest leading-none">Authentication & Profile Initiation</p>
                                    </div>
                                    <Logo withText={false} className="opacity-10" />
                                </div>
                                <ApplicationForm />

                                <div className="mt-12 pt-8 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-widest">
                                    <span>Encrypted Environment</span>
                                    <Link href="/login" className="text-primary hover:underline flex items-center gap-1.5 uppercase tracking-widest">
                                        Admin Endpoint <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-heading py-20 text-white px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="space-y-4">
                        <Logo withText={true} className="brightness-0 invert opacity-40" />
                        <p className="text-xs text-white/40 font-medium tracking-wide">
                            © 2026 Convergent Business Technologies. All Rights Reserved.
                        </p>
                    </div>
                    <div className="flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                        <Link href="https://www.convergentbt.com/about" className="hover:text-primary transition-colors">Ecosystem</Link>
                        <Link href="https://www.convergentbt.com/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="https://www.convergentbt.com/terms" className="hover:text-primary transition-colors">Security</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
