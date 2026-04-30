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
                "relative border-b border-border/60 transition-colors duration-200 overflow-hidden",
                !notification.is_read
                    ? "bg-primary-muted/40 hover:bg-primary-muted/70 cursor-default"
                    : "bg-white hover:bg-surface cursor-default"
            )}
        >
            {/* Hover progress bar */}
            {hovering && !notification.is_read && (
                <div
                    className="absolute bottom-0 left-0 h-[2px] bg-primary transition-none"
                    style={{ width: `${progress}%` }}
                />
            )}

            <div className="px-3.5 py-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-[12.5px] leading-snug",
                            !notification.is_read ? "font-semibold text-heading" : "font-medium text-body"
                        )}>
                            {notification.title}
                        </p>
                        <p className="text-[11.5px] text-muted mt-0.5 leading-relaxed">{notification.message}</p>
                        <p className="text-[10px] text-muted/70 mt-1">
                            {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {!notification.is_read && (
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                </div>

                {hovering && !notification.is_read && (
                    <p className="text-[9.5px] text-primary/70 mt-1 font-medium animate-in fade-in duration-200">
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
                className="relative cursor-pointer group p-1.5 hover:bg-primary-muted rounded-md transition-colors"
            >
                <Bell className="w-4 h-4 text-muted group-hover:text-primary transition-colors" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white animate-in zoom-in duration-200">
                        {unreadCount}
                    </span>
                )}
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-[12px] border border-border z-50 overflow-hidden animate-in fade-in zoom-in duration-200 sm:origin-top-right"
                        style={{ boxShadow: "var(--shadow-dropdown)" }}
                    >
                        {/* Header */}
                        <div className="px-3.5 py-2.5 border-b border-border flex justify-between items-center bg-surface">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[12.5px] text-heading">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 bg-primary-muted text-primary-dark text-[9.5px] font-semibold rounded-full">
                                        {unreadCount} unread
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 text-[10.5px] text-primary font-semibold hover:underline"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-3 h-3" strokeWidth={1.5} />
                                        All read
                                    </button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="text-muted hover:text-heading p-0.5">
                                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>

                        {unreadCount > 0 && (
                            <p className="px-3.5 py-1.5 text-[9.5px] text-muted bg-surface/60 border-b border-border italic">
                                Hover over a notification for 3 seconds to mark it as read
                            </p>
                        )}

                        <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-border/60 custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map((n) => (
                                    <NotificationItem
                                        key={n.id}
                                        notification={n}
                                        onRead={handleItemRead}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center text-muted text-[12.5px]">
                                    <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" strokeWidth={1.5} />
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
