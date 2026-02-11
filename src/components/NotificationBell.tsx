"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { markNotificationsAsRead } from "@/app/actions";

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    // Fetch real notifications and listen for new applicants
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        };

        fetchNotifications();

        // Subscribe to new candidate real-time inserts for a real notification feel
        const subscription = supabase
            .channel('any')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'candidates' }, (payload: any) => {
                const newNotif = {
                    id: Math.random(),
                    title: "New Application",
                    message: `${payload.new.name} has applied for CGAP.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                };
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const markAllAsRead = async () => {
        const result = await markNotificationsAsRead();
        if (result.success) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="relative cursor-pointer group p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <div key={n.id} className={cn(
                                        "p-4 border-b border-border hover:bg-gray-50 transition-colors cursor-pointer",
                                        !n.is_read && "bg-primary/5"
                                    )}>
                                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    No notifications yet.
                                </div>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <div className="p-3 text-center bg-gray-50 border-t border-border">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary font-bold hover:underline"
                                >
                                    Mark all as read
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
