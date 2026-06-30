import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import CandidateChatBot from "@/components/CandidateChatBot";
import Image from "next/image";
import { getApplicationsOpenSetting } from "@/app/actions";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
    const { open: applicationsOpen } = await getApplicationsOpenSetting();
    return (
        <div className="min-h-screen bg-white selection:bg-primary/10 flex flex-col overflow-y-auto">
            {/* Compact Header — 56px */}
            <nav className="h-12 flex items-center border-b border-border/40 bg-white/95 backdrop-blur-sm shrink-0">
                <div className="container-main w-full flex justify-between items-center">
                    <Logo />
                    {/* CGAP Logo in top right */}
                    <div className="relative h-7 w-24 opacity-90">
                        <Image
                            src="/cgap-logo.png"
                            alt="CGAP Logo"
                            fill
                            className="object-contain object-right"
                            priority
                        />
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex items-center px-5 md:px-8 py-6 md:py-10 overflow-y-auto">
                <div className="container-main w-full grid lg:grid-cols-12 gap-8 xl:gap-14 items-center">
                    {/* Left: Editorial copy */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-4 md:space-y-6 text-center lg:text-left animate-in fade-in slide-in-from-left-4 duration-700">
                        <div className="flex justify-center lg:justify-start">
                            <span className="section-tag !mb-0 whitespace-nowrap">Convergent Graduate Academy Program</span>
                        </div>

                        <h1
                            className="font-bold text-heading leading-[1.05] tracking-tight"
                            style={{
                                fontFamily: "var(--font-heading)",
                                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                                letterSpacing: "-0.03em",
                            }}
                        >
                            Starts as a graduate.<br className="hidden md:block" />
                            Ends as a <span className="italic-accent">consultant.</span>
                        </h1>

                        <p className="text-[13.5px] md:text-[14px] text-body max-w-md mx-auto lg:mx-0 leading-relaxed font-medium">
                            Six months of structured learning, senior mentorship, and real stakes. Apply below to begin.
                        </p>
                    </div>

                    {/* Right: Form card OR closed-state notice */}
                    <div className="lg:col-span-12 xl:col-span-7 flex flex-col justify-center">
                        {applicationsOpen ? (
                            <div className="bg-white p-4 md:p-6 lg:p-8 border border-border rounded-[12px] shadow-soft mx-auto w-full max-w-2xl lg:max-w-none">
                                <ApplicationForm />
                            </div>
                        ) : (
                            <div className="bg-white p-8 md:p-10 border border-red-200 rounded-[12px] shadow-soft mx-auto w-full max-w-2xl lg:max-w-none text-center space-y-5 animate-in fade-in duration-500">
                                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                                    <Lock className="w-6 h-6 text-red-600" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-2">
                                    <h2
                                        className="text-heading font-bold"
                                        style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}
                                    >
                                        Applications are currently <span className="text-red-600 italic">closed</span>
                                    </h2>
                                    <p className="text-[13px] text-red-600 font-semibold leading-relaxed max-w-md mx-auto">
                                        We are not accepting new CGAP applications at this time. Please check back later for the next intake.
                                    </p>
                                    <p className="text-[12px] text-muted leading-relaxed max-w-md mx-auto pt-1">
                                        For any queries, feel free to reach out via the chat assistant on this page, or email us at <span className="font-semibold text-heading">careers@convergentbt.com</span>.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled
                                    aria-disabled="true"
                                    title="Applications are closed"
                                    className="w-full max-w-sm mx-auto py-3 rounded-md bg-gray-100 text-gray-400 text-[12.5px] font-bold uppercase tracking-[0.12em] cursor-not-allowed border border-gray-200"
                                >
                                    Submit Application (Unavailable)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Compact Footer */}
            <footer className="h-10 flex items-center px-5 md:px-8 border-t border-border/40 shrink-0 bg-surface/50">
                <div className="container-main w-full flex justify-between items-center">
                    <Logo className="opacity-100 scale-[0.6] origin-left brightness-[0.9]" />
                    <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.12em]">
                        © 2026 Convergent Business Technologies · All Rights Reserved
                    </p>
                </div>
            </footer>

            {/* Floating AI support assistant — answers CGAP / application FAQs */}
            <CandidateChatBot />
        </div>
    );
}
