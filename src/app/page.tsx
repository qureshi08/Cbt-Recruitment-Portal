import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Star, Quote, Building2, GraduationCap, Briefcase, Trophy, Calendar } from "lucide-react";

export default function Home() {
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10">
            {/* Top Banner */}
            <div className="bg-primary text-white py-2 px-4 text-center text-xs md:text-sm font-medium tracking-wide">
                Batch 29 · applications open
            </div>

            {/* Navigation */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface px-6 md:px-12 py-3.5 flex items-center justify-between">
                <Logo withText={false} className="scale-110" />

                <nav className="hidden lg:flex items-center gap-8">
                    {["Home", "Services", "Case Studies", "Products", "Partners", "Careers", "About"].map((item) => (
                        <Link key={item} href="#" className="text-[13px] font-medium text-text-muted hover:text-primary transition-colors">
                            {item}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <button className="hidden sm:flex items-center gap-2 bg-heading text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-heading/90 transition-all shadow-sm">
                        Book a Call
                        <span className="text-lg">→</span>
                    </button>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="pt-20 pb-32 px-6 md:px-12 max-w-7xl mx-auto border-b border-surface overflow-hidden relative">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-primary" />
                                Convergent Graduate Academy Program
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-heading tracking-tight font-heading leading-[1.05]">
                                Graduates today. <br />
                                <span className="italic text-primary">Consultants, shipping.</span>
                            </h1>
                            <p className="text-xl text-text-muted max-w-xl leading-relaxed">
                                The Convergent Graduate Academy Program (CGAP) is CBT’s 9-month learning-and-grooming pathway — turning top graduates into industry-ready data & AI professionals.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    href="#apply"
                                    className="px-8 py-4 bg-heading text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary transition-all group shadow-xl shadow-heading/10"
                                >
                                    Apply to CGAP
                                    <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-surface overflow-hidden">
                                            <Image
                                                src={`https://i.pravatar.cc/150?u=cgap${i}`}
                                                alt="Alumni"
                                                width={48}
                                                height={48}
                                            />
                                        </div>
                                    ))}
                                    <div className="w-12 h-12 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                                        +500
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative">
                            {[
                                { label: "MONTHS", val: "9" },
                                { label: "PHASES", val: "4" },
                                { label: "REAL PROJECTS", val: "M2" },
                                { label: "NEXT BATCH", val: "B29" },
                            ].map((stat, i) => (
                                <div key={i} className="p-8 bg-surface rounded-3xl border border-border/50 hover:border-primary/20 transition-all group">
                                    <h3 className="text-4xl md:text-5xl font-black text-heading mb-2 group-hover:text-primary transition-colors">
                                        {stat.val}
                                    </h3>
                                    <p className="text-xs font-bold text-text-muted tracking-widest uppercase">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10" />
                        </div>
                    </div>
                </section>

                {/* The Journey Section */}
                <section className="py-24 px-6 md:px-12 bg-white border-b border-surface">
                    <div className="max-w-7xl mx-auto">
                        <div className="max-w-3xl mb-20 space-y-4">
                            <span className="text-xs font-black text-primary tracking-widest uppercase italic">the 9-month journey</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-heading tracking-tight italic">
                                Starts as a graduate. Ends as a consultant.
                            </h2>
                            <p className="text-lg text-text-muted leading-relaxed">
                                Month-by-month, with real stakes. No bootcamp graveyard; no disconnected theory. By month two you’re on a real engagement under a senior lead.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    range: "M1–M2", phase: "Phase 01", title: "Fundamentals",
                                    desc: "CBT-designed bootcamp. SQL, data modelling, Power BI, Python, consulting basics — built and delivered by the same senior consultants who ship for our enterprise clients."
                                },
                                {
                                    range: "M3–M5", phase: "Phase 02", title: "Specialise",
                                    desc: "Pick a track — data engineering, BI, analytics, or applied AI. Deepen the stack, ship practice projects, sit certifications (we pay)."
                                },
                                {
                                    range: "M6–M7", phase: "Phase 03", title: "Live project",
                                    desc: "Embedded on a real CBT client engagement under a senior lead. Not a sandbox — production code, real data, real stakeholders."
                                },
                                {
                                    range: "M8–M9", phase: "Phase 04", title: "Placement",
                                    desc: "Permanent placement on a CBT delivery team, or partner track with a sponsoring client. Either way, the program ends with a career, not a certificate."
                                },
                            ].map((p, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-surface/50 border border-border/40 hover:bg-white hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all space-y-6">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-primary tracking-tighter italic">{p.range}</span>
                                        <span className="px-2 py-1 bg-heading/5 rounded text-[10px] font-bold text-heading uppercase tracking-wide">{p.phase}</span>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-xl font-extrabold text-heading italic">{p.title}</h4>
                                        <p className="text-sm text-text-muted leading-relaxed">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-24 px-6 md:px-12 bg-heading text-white overflow-hidden relative">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <span className="text-xs font-black text-primary tracking-widest uppercase italic border-l-2 border-primary pl-4">learning + grooming</span>
                                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight italic leading-tight">
                                    Not a bootcamp. <br />
                                    Not a bench. <span className="text-primary">A craft.</span>
                                </h2>
                                <p className="text-lg text-white/70 max-w-xl leading-relaxed">
                                    Universities give you theory. Job boards give you a job. CGAP gives you a craft — structured learning, consulting skills, and senior mentorship, stitched into every month of the program.
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                                {[
                                    { id: "01", title: "Structured learning", desc: "A month-by-month curriculum designed by senior CBT consultants — grounded in real delivery methodology." },
                                    { id: "02", title: "Consulting craft", desc: "Stakeholder management, discovery, scoping, pushback. The soft skills that separate a junior analyst." },
                                    { id: "03", title: "Certification budget", desc: "We pay for Microsoft Fabric, Databricks, Snowflake, Azure, Power BI — whatever your track needs." },
                                    { id: "04", title: "Mentorship + stipend", desc: "Paired with senior mentors from day one. Paid stipend from day one. Residential or hybrid — we flex." },
                                ].map((benefit, i) => (
                                    <div key={i} className="space-y-3 group">
                                        <div className="text-primary font-black text-4xl italic opacity-40 group-hover:opacity-100 transition-opacity">
                                            {benefit.id}
                                        </div>
                                        <h4 className="text-xl font-bold italic">{benefit.title}</h4>
                                        <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/80 transition-colors">
                                            {benefit.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative aspect-square lg:scale-110">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 group">
                                <Image
                                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                                    alt="Learning Craft"
                                    fill
                                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-heading via-transparent to-transparent opacity-60" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Career Track (Georgia Tech) Section */}
                <section className="py-24 px-6 md:px-12 bg-surface text-center border-b border-surface">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="space-y-4">
                            <span className="text-xs font-black text-primary tracking-widest uppercase italic">post-placement career track</span>
                            <h2 className="text-4xl md:text-5xl font-extrabold text-heading tracking-tight italic">
                                When you’re in, we keep investing.
                            </h2>
                            <p className="text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
                                Placement isn’t the finish line. Once you’ve joined CBT and proven you can deliver, <span className="text-heading font-bold">we sponsor a Georgia Tech academic credential</span> to compound the program into a career.
                            </p>
                        </div>

                        <div className="bg-white p-8 md:p-12 rounded-[40px] border border-border/50 shadow-2xl shadow-primary/5 grid md:grid-cols-3 gap-8 items-center text-left">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary italic tracking-widest uppercase">Month 9</span>
                                <h4 className="text-xl font-bold italic text-heading leading-tight">Placed as a CBT consultant</h4>
                            </div>
                            <div className="md:border-x border-border md:px-12 space-y-2">
                                <span className="text-[10px] font-black text-primary italic tracking-widest uppercase">Post-placement</span>
                                <h4 className="text-xl font-bold italic text-heading leading-tight">Live engagements, senior mentorship</h4>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary italic tracking-widest uppercase">Career Benefit</span>
                                <h4 className="text-xl font-bold italic text-heading leading-tight">CBT-sponsored Georgia Tech credential</h4>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 p-4 bg-primary/5 rounded-2xl text-[11px] font-medium text-text-muted italic">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Georgia Tech isn’t a CGAP partner. It’s a post-placement benefit CBT funds for consultants who’ve earned it.
                        </div>
                    </div>
                </section>

                {/* Candidate Criteria */}
                <section className="py-24 px-6 md:px-12 bg-white">
                    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <span className="text-xs font-black text-primary tracking-widest uppercase italic">the ideal candidate</span>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-heading tracking-tight italic">
                                    Who CGAP is for.
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {[
                                    "Bachelor's degree in CS, Stats, Math, Engineering, or Economics",
                                    "Fresh graduates or up to 2 years of experience",
                                    "Strong analytical thinking and problem-solving skills",
                                    "Willing to commit to the full 9-month program"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <span className="text-lg font-medium text-heading/80">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface rounded-[40px] p-12 space-y-10 border border-border/50 relative overflow-hidden">
                            <Quote className="w-20 h-20 text-primary/10 absolute -top-4 -right-4 italic" />

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-4">
                                    <span className="text-xs font-black text-primary tracking-widest uppercase italic">alumni outcomes</span>
                                    <h3 className="text-3xl font-extrabold text-heading tracking-tight italic">
                                        Where they ended up.
                                    </h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-8 bg-white rounded-3xl border border-border shadow-sm">
                                        <p className="text-lg italic text-text-muted mb-6">“CGAP gave me the practical skills.”</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-primary/20" />
                                            <div>
                                                <h5 className="font-bold text-heading text-sm">Anas Qureshi</h5>
                                                <p className="text-[10px] text-text-muted">BI Consultant · CBT · Batch 18</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-white rounded-3xl border border-border shadow-sm">
                                        <p className="text-lg italic text-text-muted mb-6">“The hands-on approach is what sets CGAP apart.”</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-heading/20" />
                                            <div>
                                                <h5 className="font-bold text-heading text-sm">Ali Hassan</h5>
                                                <p className="text-[10px] text-text-muted">Data Engineer · CBT · Batch 11</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Section */}
                <section className="py-20 px-6 bg-surface overflow-hidden border-y border-surface">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-[10px] font-black text-text-muted tracking-[0.2em] uppercase text-center mb-12">Trusted by Industry Leaders</p>
                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-10 opacity-30 grayscale px-4">
                            {["Ministry of Minerals", "SPAR", "Tabadlab", "Empower Brands", "Unicef", "Dabur", "PepsiCo", "NURSA", "Microsoft", "Coca-Cola", "KPMG", "ZTBL"].map((client) => (
                                <span key={client} className="text-lg font-black text-heading italic tracking-tighter">{client}</span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Application Section */}
                <section id="apply" className="py-32 px-4 md:px-6 bg-white relative">
                    <div className="max-w-4xl mx-auto relative z-10">
                        <div className="text-center mb-20 space-y-6">
                            <span className="text-xs font-black text-primary tracking-widest uppercase italic border-l-2 border-primary pl-4">Ready for CGAP batch 29?</span>
                            <h2 className="text-4xl md:text-6xl font-extrabold text-heading tracking-tight italic">
                                Applications are open.
                            </h2>
                            <p className="text-lg text-text-muted leading-relaxed max-w-xl mx-auto">
                                Nine months of structured learning, senior mentorship, and real stakes from month two. Start your journey today.
                            </p>
                        </div>

                        <div className="bg-white p-6 md:p-12 rounded-[40px] border-2 border-primary/10 shadow-2xl shadow-primary/5">
                            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border">
                                <div className="space-y-4 text-left">
                                    <h3 className="text-2xl font-extrabold text-heading italic flex items-center gap-3">
                                        Apply for
                                        <div className="relative h-8 w-24 translate-y-1">
                                            <Image src="/cgap-logo.png" alt="CGAP" fill className="object-contain" />
                                        </div>
                                    </h3>
                                    <p className="text-sm text-text-muted">Please fill out the form below carefully. Your journey starts here.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-primary/20" />)}
                                    </div>
                                    <span className="text-[10px] font-bold text-text-muted italic">Joining 500+ successful alumni</span>
                                </div>
                            </div>
                            <ApplicationForm />
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-heading text-white pt-24 pb-12 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-4 gap-16 mb-20">
                        <div className="lg:col-span-1 space-y-8">
                            <Logo withText={false} className="opacity-100 brightness-0 invert scale-125 origin-left" />
                            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                                Data, Cloud & AI consultancy. Senior consultants, outcome-owned delivery — trusted by P&G, Coca-Cola, PepsiCo, UNICEF, and ADNOC.
                            </p>
                        </div>

                        <div>
                            <h5 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase italic mb-8">Navigation</h5>
                            <ul className="space-y-4">
                                {["Home", "Services", "Case Studies", "Products", "Partners", "CGAP", "About"].map(item => (
                                    <li key={item}><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase italic mb-8">Services</h5>
                            <ul className="space-y-4">
                                {["Data Strategy & Maturity", "Data Engineering & Platforms", "Data Governance & Quality", "Data Analytics & BI", "AI & Generative AI", "Agentic AI"].map(item => (
                                    <li key={item}><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h5 className="text-[10px] font-black text-primary tracking-[0.2em] uppercase italic mb-8">Products</h5>
                            <ul className="space-y-4">
                                {["All Products", "ECL Calculator", "Custom Visuals"].map(item => (
                                    <li key={item}><Link href="#" className="text-sm text-white/50 hover:text-white transition-colors">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                        <p className="text-xs text-white/30 italic">© 2026 Convergent Business Technologies. All rights reserved.</p>
                        <div className="flex items-center gap-8">
                            <Link href="#" className="text-xs text-white/30 hover:text-white">Contact</Link>
                            <Link href="#" className="text-xs text-white/30 hover:text-white">Privacy Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
