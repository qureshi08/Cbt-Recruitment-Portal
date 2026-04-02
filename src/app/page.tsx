import ApplicationForm from "@/components/ApplicationForm";
import Logo from "@/components/Logo";

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            {/* Simple Header */}
            <header className="py-6 px-6 md:px-12 flex justify-center border-b border-gray-50">
                <Logo />
            </header>

            <main className="py-12 md:py-24 px-4 md:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Apply for <span className="text-primary italic">CGAP</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Start your journey into Data Analytics consultancy today. 
                            Please fill out the form below to join Convergent Business Technologies.
                        </p>
                    </div>
                    
                    <div className="relative">
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                        <ApplicationForm />
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="py-12 px-6 border-t border-gray-100 bg-gray-50/50">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} Convergent Business Technologies. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        Official Recruitment Portal | careers@convergentbt.com
                    </p>
                </div>
            </footer>
        </div>
    );
}
