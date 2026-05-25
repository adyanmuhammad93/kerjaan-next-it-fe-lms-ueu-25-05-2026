import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { liveClassService } from '../services/liveClassService';
import { LiveClass } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Loader2, Calendar, Clock, Video, ArrowLeft, ExternalLink, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';

export const Schedule: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<LiveClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user) return;
            try {
                const data = await liveClassService.getSchedule(user.id, user.role);
                setClasses(data);
            } catch (error) {
                console.error("Failed to load schedule", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [user]);

    const getPlatformIcon = (platform: string) => {
        if (platform === 'zoom') return <Video className="h-4 w-4 text-blue-500" />;
        if (platform === 'google_meet') return <Video className="h-4 w-4 text-green-500" />;
        return <Video className="h-4 w-4 text-slate-500" />;
    };

    if (loading) {
        return <LoadingScreen />;
    }

    // Group classes by date
    const groupedClasses: Record<string, LiveClass[]> = {};
    classes.forEach(cls => {
        const dateKey = format(new Date(cls.startTime), 'yyyy-MM-dd');
        if (!groupedClasses[dateKey]) groupedClasses[dateKey] = [];
        groupedClasses[dateKey].push(cls);
    });

    const sortedDates = Object.keys(groupedClasses).sort();

    return (
        <PageWrapper className="bg-slate-50/50 pb-24">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate('/dashboard')}
                            className="rounded-2xl hover:bg-slate-50 text-ueu-navy font-black text-[10px] uppercase tracking-widest px-4 h-11"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Button>
                        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                        <div className="hidden md:block">
                            <h1 className="font-black text-lg text-ueu-navy flex items-center gap-3 uppercase tracking-tight">
                                <CalendarDays className="h-5 w-5 text-ueu-blue" /> Jadwal Kuliah
                            </h1>
                        </div>
                    </div>
                    <Badge variant="outline" className="px-6 py-2 rounded-full border-none bg-ueu-blue/5 text-ueu-blue font-black text-[10px] uppercase tracking-widest shadow-sm">
                        Semester Genap 2023/2024
                    </Badge>
                </div>
            </div>

            <div className="container mx-auto px-6 lg:px-12 py-16 max-w-5xl">
                {/* Intro Section */}
                <div className="mb-12">
                    <h2 className="text-4xl font-black text-ueu-navy tracking-tight uppercase">Agenda Akademik</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Daftar kelas daring dan pertemuan sinkronus Anda mendatang.</p>
                </div>

                {sortedDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Tidak Ada Jadwal Mendatang</h3>
                        <p className="text-slate-500 mt-2 max-w-sm text-center">
                            {user?.role === 'instructor' 
                                ? "Anda belum menjadwalkan sesi kelas live untuk mata kuliah Anda." 
                                : "Belum ada jadwal kelas live dari mata kuliah yang Anda ambil saat ini."}
                        </p>
                        <Button 
                            onClick={() => user?.role === 'instructor' ? navigate('/dashboard') : navigate('/')}
                            className="mt-8 rounded-full bg-[#0078C1] hover:bg-[#003366] text-white px-8 font-bold shadow-lg shadow-blue-100"
                        >
                            {user?.role === 'instructor' ? 'Ke Dashboard' : 'Cari Mata Kuliah'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {sortedDates.map(date => {
                            const [year, month, day] = date.split('-').map(Number);
                            const dateObj = new Date(year, month - 1, day);
                            const dayClasses = groupedClasses[date];
                            
                            return (
                                <div key={date} className="space-y-6 relative">
                                    <div className="flex items-center gap-8 sticky top-28 z-10 py-2">
                                        <div className="bg-ueu-navy text-white shadow-2xl shadow-blue-900/20 rounded-[32px] px-8 py-6 text-center min-w-[120px] transform hover:scale-105 transition-all duration-500 border border-white/5">
                                            <div className="text-[10px] font-black uppercase tracking-[3px] opacity-60 mb-1">{format(dateObj, 'MMM')}</div>
                                            <div className="text-4xl font-black tracking-tighter">{format(dateObj, 'dd')}</div>
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="text-xl font-black text-ueu-navy uppercase tracking-tight">{format(dateObj, 'EEEE')}</div>
                                            <div className="text-[10px] font-black text-ueu-blue uppercase tracking-[2px] mt-1">{format(dateObj, 'MMMM do, yyyy')}</div>
                                        </div>
                                        <div className="h-px bg-slate-100 flex-1 hidden md:block"></div>
                                    </div>

                                    <div className="grid gap-6 ml-0 md:ml-4 border-l-2 border-slate-100 pl-0 md:pl-10">
                                        {dayClasses.map(cls => {
                                            const start = new Date(cls.startTime);
                                            const end = new Date(cls.endTime);
                                            const isNow = new Date() >= start && new Date() <= end;

                                            return (
                                                <Card key={cls.id} className={cn(
                                                    "rounded-[40px] border-none shadow-sm bg-white overflow-hidden group transition-all duration-500",
                                                    isNow ? "ring-2 ring-ueu-blue shadow-2xl shadow-blue-900/10" : "hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                                                )}>
                                                    <CardContent className="p-0">
                                                        <div className="flex flex-col md:flex-row">
                                                            <div className="p-10 flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-6">
                                                                    <Badge variant="outline" className="px-5 py-1.5 rounded-full border-none bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                                                                        {cls.courseTitle || 'MATAKULIAH'}
                                                                    </Badge>
                                                                    {isNow && (
                                                                        <Badge className="bg-accent text-white rounded-full px-5 py-1.5 text-[9px] font-black uppercase tracking-widest animate-pulse border-none shadow-lg shadow-orange-500/20">
                                                                            Sedang Berjalan
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                
                                                                <h3 className="text-2xl font-black text-ueu-navy mb-4 group-hover:text-ueu-blue transition-colors uppercase tracking-tight">{cls.title}</h3>
                                                                {cls.description && <p className="text-slate-500 text-sm mb-8 line-clamp-2 font-medium leading-relaxed">{cls.description}</p>}
                                                                
                                                                <div className="flex flex-wrap gap-8">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                                                                            <Clock className="h-4 w-4 text-ueu-blue" />
                                                                        </div>
                                                                        <span className="font-black text-xs text-ueu-navy uppercase tracking-widest">
                                                                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')} WIB
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 capitalize">
                                                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                                                                            {getPlatformIcon(cls.platform)}
                                                                        </div>
                                                                        <span className="font-black text-xs text-ueu-navy uppercase tracking-widest">{cls.platform.replace('_', ' ')}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className={cn(
                                                                "p-10 border-t md:border-t-0 md:border-l border-slate-50 flex flex-col justify-center items-center gap-4 min-w-[280px]",
                                                                isNow ? "bg-ueu-blue/5" : "bg-slate-50/50"
                                                            )}>
                                                                <Button 
                                                                    className={cn(
                                                                        "w-full h-14 rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-xl transition-all duration-300 active:scale-95",
                                                                        isNow 
                                                                            ? "bg-ueu-blue hover:bg-ueu-navy text-white shadow-blue-900/20" 
                                                                            : "bg-white border-2 border-ueu-blue text-ueu-blue hover:bg-ueu-blue hover:text-white shadow-none"
                                                                    )} 
                                                                    onClick={() => window.open(cls.meetingUrl, '_blank')}
                                                                >
                                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                                    {user?.role === 'instructor' ? 'Mulai Pertemuan' : 'Masuk Ruang Kelas'}
                                                                </Button>
                                                                
                                                                {user?.role === 'instructor' && (
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="sm" 
                                                                        className="text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 w-full font-black text-[9px] uppercase tracking-widest h-10 rounded-xl"
                                                                        onClick={() => navigate(`/instructor/course/${cls.courseId}/edit`)}
                                                                    >
                                                                        Ubah Sesi
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};