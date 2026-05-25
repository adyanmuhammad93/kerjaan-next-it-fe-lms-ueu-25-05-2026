
import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export const DashboardNotifications: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [user]);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) { console.error(e); }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            await notificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) { console.error(e); }
    };

    if (loading) return (
        <Card className="h-full border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                <CardTitle className="text-sm font-black text-ueu-navy uppercase tracking-widest">Aktivitas Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex flex-col items-center justify-center gap-3">
                <div className="w-8 w-8 border-2 border-slate-100 border-t-ueu-blue rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] animate-pulse">Memuat Notifikasi...</p>
            </CardContent>
        </Card>
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Card className="h-full border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-5 px-6 border-b border-slate-50 bg-slate-50/30">
                <CardTitle className="text-xs font-black text-ueu-navy uppercase tracking-[2px] flex items-center gap-2">
                    <Bell className="h-4 w-4 text-ueu-blue" /> 
                    Notifikasi
                </CardTitle>
                {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-8 text-[10px] font-black text-ueu-blue hover:text-ueu-navy hover:bg-ueu-blue/5 px-3 rounded-full uppercase tracking-tighter">
                        Tandai Terbaca
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-0 flex-1 overflow-hidden min-h-[400px] p-0">
                <div className="space-y-1 overflow-y-auto h-full px-4 py-4 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Belum Ada Notifikasi</p>
                            <p className="text-[10px] mt-1">Kami akan mengabarimu segera.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={cn("relative group flex gap-4 p-4 rounded-2xl transition-all border", n.isRead ? "bg-white border-transparent hover:bg-slate-50/50" : "bg-blue-50/30 border-blue-100/50 hover:bg-blue-50/50")}>
                                <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0 transition-all", n.isRead ? "bg-slate-200" : "bg-ueu-blue shadow-sm shadow-blue-200 animate-pulse")} />
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={cn("text-xs font-black leading-tight pr-4", n.isRead ? "text-slate-500" : "text-ueu-navy")}>{n.title}</p>
                                        {!n.isRead && (
                                            <button 
                                                onClick={() => handleMarkRead(n.id)} 
                                                className="text-slate-400 hover:text-ueu-blue opacity-0 group-hover:opacity-100 transition-all absolute right-4 top-4 p-1 bg-white rounded-lg shadow-sm border border-slate-100" 
                                                title="Tandai terbaca"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{n.message}</p>
                                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-2 font-black uppercase tracking-tight opacity-70">
                                        <Clock className="h-3 w-3" /> 
                                        {new Date(n.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
