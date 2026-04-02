"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { markNotificationsAsRead, markSingleNotificationAsRead } from "@/app/actions";

const HOVER_DELAY_MS = 3000;

// Single notification row with hover-to-read
function NotificationItem({
    notification,
    onRead,
}: {
    notification: any;
    onRead: (id: string) => void;
}) {
    const [hovering, setHovering] = useState(false);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const clearAll = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setProgress(0);
        setHovering(false);
    };

    const handleMouseEnter = () => {
        if (notification.is_read) return;
        setHovering(true);
        startTimeRef.current = Date.now();

        // Progress bar tick (every 30ms for smooth animation)
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            setProgress(Math.min((elapsed / HOVER_DELAY_MS) * 100, 100));
        }, 30);

        // Mark as read after 3s
        timerRef.current = setTimeout(async () => {
            clearAll();
            await markSingleNotificationAsRead(String(notification.id));
            onRead(notification.id);
        }, HOVER_DELAY_MS);
    };

    const handleMouseLeave = () => {
        clearAll();
    };

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "relative border-b border-border transition-colors duration-200 overflow-hidden",
                !notification.is_read
                    ? "bg-primary/5 hover:bg-primary/10 cursor-default"
                    : "bg-white hover:bg-gray-50/60 cursor-default"
            )}
        >
            {/* Hover progress bar */}
            {hovering && !notification.is_read && (
                <div
                    className="absolute bottom-0 left-0 h-[2px] bg-primary transition-none"
                    style={{ width: `${progress}%` }}
                />
            )}

            <div className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-[13px] leading-snug",
                            !notification.is_read ? "font-bold text-gray-900" : "font-medium text-gray-700"
                        )}>
                            {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {!notification.is_read && (
                        <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                </div>

                {/* Hint text while hovering */}
                {hovering && !notification.is_read && (
                    <p className="text-[10px] text-primary/70 mt-1.5 font-medium animate-in fade-in duration-200">
                        Keep hovering to mark as read…
                    </p>
                )}
            </div>
        </div>
    );
}

export default function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        };

        fetchNotifications();

        const subscription = supabase
            .channel('notification-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'candidates' }, (payload: any) => {
                const newNotif = {
                    id: `temp-${Math.random()}`,
                    title: "New Application",
                    message: `${payload.new.name} has applied for CGAP.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                };
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    // Called by each item when it's been read
    const handleItemRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        const result = await markNotificationsAsRead();
        if (result.success) {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    return (
        <div className="relative">
            {/* Bell icon */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="relative cursor-pointer group p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-200">
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 sm:origin-top-right">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-gray-50/80">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-[13px] text-gray-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        All read
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Hint */}
                        {unreadCount > 0 && (
                            <p className="px-4 py-2 text-[10px] text-text-muted/60 bg-gray-50/50 border-b border-border/50 italic">
                                Hover over a notification for 3 seconds to mark it as read
                            </p>
                        )}

                        {/* Notification list */}
                        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto divide-y divide-border/50">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <NotificationItem
                                        key={n.id}
                                        notification={n}
                                        onRead={handleItemRead}
                                    />
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-400 text-sm">
                                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    No notifications yet.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
