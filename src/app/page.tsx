import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";
import {
    Code2,
    Settings2,
    Database,
    BarChart3,
    ShieldCheck,
    ChevronRight,
    ExternalLink
} from "lucide-react";

export default function Home() {
    const tracks = [
        {
            title: "Foundation",
            icon: Code2,
            desc: "Fundamentals of programming, variables, loops, and conditional statements forming the bed rock of software development."
        },
        {
            title: "DevOps",
            icon: ShieldCheck,
            desc: "Bridging the gap between development and IT operations seamlessly to support modern software heartbeat."
        },
        {
            title: "Data Engineering",
            icon: Database,
            desc: "Robust infrastructure, DWH, and ETL expertise for data-driven decision making."
        },
        {
            title: "DAVA",
            icon: Settings2,
            desc: "Extracting valuable insights from data through AI-driven analysis and compelling visualizations."
        },
        {
            title: "Applied Statistics",
            icon: BarChart3,
            desc: "Turning data into actionable insights through probability, hypothesis testing, and regression analysis."
        }
    ];

    return (
        <div className="min-h-screen font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-border py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50">
                <Logo />
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                    <a href="#about" className="hover:text-primary transition-colors">Program Details</a>
                    <a href="#curriculum" className="hover:text-primary transition-colors">Curriculum</a>
                    <a href="#apply" className="hover:text-primary transition-colors font-bold text-primary px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">Apply for CGAP</a>
                </nav>
                <div className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hidden sm:block">
                    Official Recruitment Portal
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-white to-white py-16 md:py-24 px-6">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="max-w-4xl mx-auto text-center space-y-6 relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                        Now Accepting Applications
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                        Convergent Graduate <br />
                        <span className="text-primary italic">Academy Program</span> (CGAP)
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        A six months, paid training program. Designed to fill the gap between Academia and Industry for Data Analytics consultancy.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 pt-4">
                        <a href="#apply" className="btn-primary py-3 px-8 text-lg shadow-lg shadow-primary/20">Apply Now</a>
                        <button className="btn-secondary py-3 px-8 text-lg flex items-center gap-2">
                            Learn More <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div id="about" className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-6">
                        <h2 className="text-3xl font-bold text-gray-900">About The Program</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Convergent Graduate Academy Program (CGAP) is our way of helping the nation along its digital journey.
                            Seasoned industry consultants provide mentorship covering all aspects to become a world class consultant.
                            Candidates graduating from the program will be given an opportunity to take on a permanent role in
                            Convergent Business Technologies.
                        </p>
                        <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                            <p className="text-red-800 font-bold italic flex items-center gap-2">
                                Be warned, the program is not for the faint hearted and is designed to push you to your limits.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-medium">
                            <ExternalLink className="w-4 h-4" />
                            <span>Questions? Email us at careers@convergentbt.com</span>
                        </div>
                    </div>
                    <div className="lg:col-span-5 grid grid-cols-1 gap-4">
                        <div className="card p-6 bg-gray-50 border-none">
                            <h4 className="font-bold text-gray-900 mb-2">Iteration Progress</h4>
                            <p className="text-sm text-gray-500">The team behind the program has run more than <span className="font-bold text-primary">12 successful iterations</span> of the program already.</p>
                        </div>
                        <div className="card p-6 bg-primary text-white border-none shadow-xl shadow-primary/20">
                            <h4 className="font-bold mb-2">What you get</h4>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center gap-2">✓ Paid Training (Stipend offered)</li>
                                <li className="flex items-center gap-2">✓ Industry Mentorship</li>
                                <li className="flex items-center gap-2">✓ Permanent Career Path</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tracks Section */}
            <div id="curriculum" className="py-20 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Technical Training Tracks</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg">Our comprehensive curriculum empowers you to acquire essential skills across modern technical pillars.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tracks.map((track) => (
                            <div key={track.title} className="card p-8 bg-white hover:border-primary/50 transition-all hover:shadow-xl group">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                                    <track.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{track.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{track.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Application Form Section */}
            <div id="apply" className="py-24 px-6 bg-white relative">
                <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-gray-50 to-white" />
                <div className="max-w-4xl mx-auto relative">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold text-gray-900 mb-2 font-serif">Apply for CGAP</h3>
                        <p className="text-gray-500">Start your journey into Data Analytics consultancy today.</p>
                    </div>
                    <ApplicationForm />
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-16 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-800 pb-12 mb-12">
                    <div className="space-y-4 max-w-sm">
                        <div className="flex items-center gap-2 text-white">
                            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-xs">CBT</div>
                            <span className="font-bold text-lg">Convergent Business Technologies</span>
                        </div>
                        <p className="text-sm">Driving digital transformation through expertise and innovation.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-12 text-sm">
                        <div className="space-y-3">
                            <h5 className="text-white font-bold uppercase tracking-wider text-xs">Program</h5>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-primary transition-colors">Curriculum</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Mentorship</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h5 className="text-white font-bold uppercase tracking-wider text-xs">Legal</h5>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto text-center text-xs flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} Convergent Business Technologies. All rights reserved.</p>
                    <p>Powered by <span className="text-white font-bold">cbtx</span> | Illustrations from storyset.com</p>
                </div>
            </footer>
        </div>
    );
}
