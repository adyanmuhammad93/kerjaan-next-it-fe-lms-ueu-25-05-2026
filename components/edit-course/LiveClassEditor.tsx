
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar as CalendarIcon, Video, Trash2, Plus, ExternalLink, Clock } from 'lucide-react';
import { liveClassService } from '../../services/liveClassService';
import { Course, LiveClass } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { Calendar } from '../ui/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";

export const LiveClassEditor: React.FC<{ course: Course }> = ({ course }) => {
    const { user } = useAuth();
    const [classes, setClasses] = useState<LiveClass[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Date Picker State
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState("12:00");
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // Delete Confirmation State
    const [classToDelete, setClassToDelete] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            startTime: '',
            duration: 60,
            platform: 'google_meet',
            meetingUrl: ''
        }
    });

    const loadClasses = async () => {
        try {
            const data = await liveClassService.getLiveClassesByCourse(course.id);
            setClasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClasses();
    }, [course.id]);

    // Sync custom date/time state with RHF
    useEffect(() => {
        if (date && time) {
            const [hours, minutes] = time.split(':').map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours);
            newDate.setMinutes(minutes);
            // Format to ISO string for backend
            setValue('startTime', newDate.toISOString());
        }
    }, [date, time, setValue]);

    const onSubmit = async (data: any) => {
        if (!user) return;
        try {
            // Calculate end time
            const start = new Date(data.startTime);
            const end = new Date(start.getTime() + data.duration * 60000);

            await liveClassService.createLiveClass(course.id, user.id, {
                title: data.title,
                description: data.description,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                platform: data.platform,
                meetingUrl: data.meetingUrl
            });
            
            reset();
            // Reset local date state
            setDate(new Date());
            setTime("12:00");
            
            setIsAdding(false);
            loadClasses();
        } catch (error) {
            console.error(error);
            alert("Gagal menjadwalkan kelas");
        }
    };

    const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setClassToDelete(id);
    };

    const executeDelete = async () => {
        if (!classToDelete) return;
        const id = classToDelete;
        setClassToDelete(null);

        // Optimistic UI update
        const previousClasses = [...classes];
        setClasses(prev => prev.filter(c => c.id !== id));

        try {
            await liveClassService.deleteLiveClass(id);
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus kelas");
            setClasses(previousClasses); // Revert
        }
    };

    const getPlatformIcon = (platform: string) => {
        if (platform === 'zoom') return <Video className="h-4 w-4 text-blue-500" />;
        if (platform === 'google_meet') return <Video className="h-4 w-4 text-green-500" />;
        return <Video className="h-4 w-4 text-slate-500" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-ueu-navy tracking-tight">Jadwal Kelas Live</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Jadwalkan sesi Zoom atau Google Meet untuk mahasiswa Anda.</p>
                </div>
                {!isAdding && (
                    <Button 
                        onClick={() => setIsAdding(true)}
                        className="h-12 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-bold px-6 shadow-xl shadow-blue-900/10 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Jadwalkan Kelas
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="border-violet-100 bg-violet-50/30 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-top-4 duration-500 ring-2 ring-violet-500/20">
                    <CardHeader className="p-8 border-b border-violet-100/50">
                        <CardTitle className="text-lg font-black text-ueu-navy flex items-center gap-2">
                             <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                             New Live Session
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Judul Sesi</label>
                                    <Input 
                                        {...register('title', { required: true })} 
                                        placeholder="contoh: Sesi Tanya Jawab Mingguan" 
                                        className="h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all bg-white font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Platform</label>
                                    <div className="relative">
                                        <select 
                                            {...register('platform')}
                                            className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium appearance-none"
                                        >
                                            <option value="google_meet">Google Meet</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="other">Lainnya</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Tanggal & Waktu Mulai</label>
                                    <div className="flex gap-3">
                                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    type="button"
                                                    className={cn(
                                                        "h-12 flex-1 justify-start text-left font-medium bg-white rounded-xl border-slate-200 hover:bg-slate-50 transition-all",
                                                        !date && "text-slate-300"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-violet-500" />
                                                    {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-slate-100" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={(d) => {
                                                        setDate(d);
                                                        setIsCalendarOpen(false);
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <Input 
                                            type="time" 
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="h-12 w-[140px] bg-white rounded-xl border-slate-200 focus:border-violet-500 font-bold text-ueu-navy"
                                        />
                                        <input type="hidden" {...register('startTime', { required: true })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Durasi (menit)</label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            {...register('duration', { required: true, min: 15 })} 
                                            className="h-12 rounded-xl border-slate-200 focus:border-violet-500 transition-all bg-white font-bold text-ueu-navy pl-4 pr-12"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase italic">MINS</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1 block">URL Meeting</label>
                                <Input 
                                    {...register('meetingUrl', { required: true })} 
                                    placeholder="https://meet.google.com/..." 
                                    className="h-12 rounded-xl border-slate-200 focus:border-violet-500 transition-all bg-white font-medium"
                                />
                                <p className="text-[11px] text-slate-400 font-medium ml-1">
                                    Paste your Google Meet or Zoom invite link here.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Deskripsi (Opsional)</label>
                                <Textarea 
                                    {...register('description')} 
                                    placeholder="Apa yang akan dibahas?" 
                                    className="rounded-xl border-slate-200 focus:border-violet-500 transition-all bg-white min-h-[100px]"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="h-12 rounded-xl font-bold text-slate-500 hover:bg-white">Batal</Button>
                                <Button 
                                    type="submit" 
                                    isLoading={isSubmitting}
                                    className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 shadow-xl shadow-violet-600/10 transition-all active:scale-95"
                                >
                                    Simpan Jadwal Sesi
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-6">
                {classes.length === 0 && !loading && (
                    <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] animate-in fade-in zoom-in duration-1000">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
                            <CalendarIcon className="h-8 w-8 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-black text-ueu-navy tracking-tight">Belum ada kelas live terjadwal</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Mulai terhubung dengan mahasiswa Anda secara live.</p>
                        <Button
                            variant="ghost" 
                            onClick={() => setIsAdding(true)}
                            className="mt-6 font-bold text-violet-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl"
                        >
                            Jadwalkan sesi pertama Anda
                        </Button>
                    </div>
                )}

                {classes.map((cls, index) => {
                    const start = new Date(cls.startTime);
                    const isPast = new Date() > new Date(cls.endTime);

                    return (
                        <div 
                            key={cls.id} 
                            style={{ animationDelay: `${index * 100}ms` }}
                            className={cn(
                                "group flex flex-col md:flex-row gap-6 p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-in slide-in-from-bottom-8",
                                isPast ? 'opacity-50 grayscale' : ''
                            )}
                        >
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 bg-slate-900 rounded-[24px] border border-slate-800 shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                                <div className="w-full bg-red-500 py-1 text-[10px] font-black text-white text-center uppercase tracking-widest">{start.toLocaleString('default', { month: 'short' })}</div>
                                <div className="flex-1 flex items-center justify-center text-3xl font-black text-white leading-none">{start.getDate()}</div>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-black text-xl text-ueu-navy tracking-tight group-hover:text-violet-600 transition-colors">{cls.title}</h3>
                                    {isPast ? (
                                        <Badge className="bg-slate-100 text-slate-400 border-none rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest">Selesai</Badge>
                                    ) : (
                                        <Badge className="bg-green-100 text-green-600 border-none rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-widest animate-pulse">Akan Datang</Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-bold">
                                    <div className="flex items-center gap-2 text-slate-500 italic">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                            <Clock className="h-3.5 w-3.5" />
                                        </div>
                                        <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 italic">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                            {getPlatformIcon(cls.platform)}
                                        </div>
                                        <span className="capitalize">{cls.platform.replace('_', ' ')}</span>
                                    </div>
                                </div>
                                {cls.description && <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl line-clamp-2">{cls.description}</p>}
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="truncate max-w-xs">{cls.meetingUrl}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => window.open(cls.meetingUrl, '_blank')}
                                    className="h-12 rounded-2xl border-slate-200 font-black text-ueu-navy hover:bg-slate-50 hover:border-slate-300 transition-all px-6 active:scale-95"
                                >
                                    Join Now
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    type="button"
                                    onClick={(e) => handleDeleteClick(cls.id, e)} 
                                    className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all group-hover:opacity-100 md:opacity-0"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this live class schedule. Students will no longer see it in their dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
