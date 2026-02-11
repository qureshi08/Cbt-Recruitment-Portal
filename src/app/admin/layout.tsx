import Sidebar from "@/components/Sidebar";
import NotificationBell from "@/components/NotificationBell";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar />
            <div className="flex-1 ml-64">
                <header className="h-16 bg-white border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-gray-800">Admin Portal</h1>
                    <div className="flex items-center gap-6">
                        <NotificationBell />
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">Farooq Sahab</p>
                                <p className="text-xs text-gray-500">Approving Authority</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 border border-border" />
                        </div>
                    </div>
                </header>
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
