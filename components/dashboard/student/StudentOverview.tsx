import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Trophy, Clock, Target, PlayCircle, Calendar, ArrowRight, 
  Award, Star, Zap, CheckCircle2, Loader2, ChevronRight, User, Book, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useStore } from '../../../store/useStore';
import { courseService } from '../../../services/courseService';
import { liveClassService } from '../../../services/liveClassService';
import { assignmentService } from '../../../services/assignmentService';
import { Course, LiveClass, CertificateWithCourse } from '../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Progress } from '../../ui/Progress';
import { Skeleton } from '../../ui/Skeleton';
import { DashboardStatsCard } from '../DashboardStatsCard';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const StudentOverview: React.FC = () => {
    const { user } = useAuth();
    const { courses: allCourses } = useStore();
    const navigate = useNavigate();

    const [enrolledCourses, setEnrolledCourses] = useState<(Course & { progress: number })[]>([]);
    const [certificates, setCertificates] = useState<CertificateWithCourse[]>([]);
    const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
    const [averageGrade, setAverageGrade] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Get Enrolled Courses with Progress
                const enrolledIds = user.enrolledCourseIds || [];
                const coursePromises = enrolledIds.map(async (id) => {
                    const course = await courseService.getCourseById(id, true);
                    if (!course) return null;
                    
                    const completedLessonIds = await courseService.getStudentProgress(user.id, id);
                    const totalLessons = course.syllabus.reduce((acc, m) => acc + m.lessons.length, 0);
                    const progress = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;
                    
                    return { ...course, progress };
                });

                const coursesData = (await Promise.all(coursePromises)).filter(Boolean) as (Course & { progress: number })[];
                setEnrolledCourses(coursesData);

                // 2. Get Certificates
                const certs = await courseService.getUserCertificates(user.id);
                setCertificates(certs);

                // 3. Get Schedule
                const schedule = await liveClassService.getSchedule(user.id, 'student');
                setUpcomingClasses(schedule.slice(0, 3)); // Top 3

                // 4. Calculate Average Grade (simplified)
                const submissions = await assignmentService.getStudentSubmissions(user.id);
                const gradedSubs = submissions.filter((s: any) => s.grade !== null);
                const avg = gradedSubs.length > 0 
                    ? Math.round(gradedSubs.reduce((acc: number, curr: any) => acc + curr.grade, 0) / gradedSubs.length)
                    : 0;
                setAverageGrade(avg);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) {
        return (
        <div className="space-y-8 min-h-screen p-4 md:p-8">
            <div className="space-y-4">
                <Skeleton className="h-12 w-80 rounded-2xl" />
                <Skeleton className="h-4 w-96 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-96 rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Skeleton className="h-96 rounded-3xl" />
                        <Skeleton className="h-96 rounded-3xl" />
                    </div>
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-[600px] rounded-3xl" />
                </div>
            </div>
        </div>
        );
    }

    const activeCourse = enrolledCourses.find(c => c.progress > 0 && c.progress < 100) || enrolledCourses[0];
    const completedCount = enrolledCourses.filter(c => c.progress === 100).length;
    const inProgressCount = enrolledCourses.filter(c => c.progress < 100).length;

    return (
        <div className="space-y-8 min-h-screen bg-transparent">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-ueu-navy">
                        Selamat datang, <span className="text-ueu-blue">{user?.name.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 text-lg">Semangat belajar hari ini! Ada banyak hal menarik yang menanti Anda.</p>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-ueu-blue bg-white px-6 py-3 rounded-xl shadow-sm border border-slate-50">
                    <Calendar className="h-5 w-5" />
                    <span>{format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}</span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatsCard 
                    title="Mata Kuliah" 
                    value={inProgressCount} 
                    icon={Book} 
                    trend="Belum diselesaikan"
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Lulus" 
                    value={completedCount} 
                    icon={CheckCircle2} 
                    trend="Mata kuliah selesai"
                    trendUp={true}
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="E-Sertifikat" 
                    value={certificates.length} 
                    icon={Trophy} 
                    trend="Telah diraih"
                    trendUp={certificates.length > 0}
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Rata-rata Nilai" 
                    value={averageGrade > 0 ? `${averageGrade}%` : '-'} 
                    icon={GraduationCap} 
                    trend="Performa akademik"
                    className="rounded-3xl border-none shadow-sm bg-white"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* Resume Learning Hero */}
                    {activeCourse && (
                        <div className="group relative overflow-hidden rounded-3xl bg-ueu-navy text-white shadow-2xl transition-all duration-500 hover:shadow-blue-200/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-ueu-navy via-ueu-navy to-ueu-blue opacity-100 z-0"></div>
                            <div className="absolute right-0 top-0 h-full w-2/3 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10 z-0"></div>
                            
                            <div className="relative z-10 p-10 flex flex-col md:flex-row gap-10 items-center">
                                <div className="flex-1 space-y-6">
                                    <Badge className="bg-accent text-white rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-none shadow-lg shadow-orange-500/20">
                                        Lanjutkan Belajar
                                    </Badge>
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-black leading-tight mb-3 group-hover:text-blue-50 transition-colors">{activeCourse.title}</h2>
                                        <p className="text-blue-50/80 text-sm font-bold flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-accent"></span>
                                            {activeCourse.instructor}
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3 max-w-sm">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-ueu-blue">
                                            <span>Progress Belajar</span>
                                            <span>{activeCourse.progress}%</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-ueu-blue to-blue-50 rounded-full transition-all duration-1000" 
                                                style={{ width: `${activeCourse.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button 
                                            onClick={() => navigate(`/course/${activeCourse.id}/learn`)} 
                                            className="bg-white text-ueu-navy hover:bg-accent hover:text-white rounded-xl h-14 px-10 text-base font-black shadow-xl transition-all duration-300 transform group-hover:scale-105"
                                        >
                                            <PlayCircle className="mr-3 h-6 w-6" /> Resume Modul
                                        </Button>
                                    </div>
                                </div>
                                <div className="hidden md:block w-72 aspect-video rounded-2xl overflow-hidden border-4 border-white/5 shadow-2xl shrink-0 rotate-3 group-hover:rotate-0 transition-all duration-700">
                                    <img src={activeCourse.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enrolled Courses Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-ueu-blue rounded-full"></div>
                                <h3 className="text-2xl font-black text-ueu-navy">Mata Kuliah Diambil</h3>
                            </div>
                            <Button variant="ghost" className="text-ueu-blue hover:bg-ueu-blue/10 rounded-full font-bold transition-all px-6" onClick={() => navigate('/browse')}>
                                Lihat Katalog <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                        
                        {enrolledCourses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {enrolledCourses.map(course => (
                                    <div 
                                        key={course.id} 
                                        className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col border border-slate-50 hover:-translate-y-2"
                                        onClick={() => navigate(`/course/${course.id}/learn`)}
                                    >
                                        <div className="h-44 bg-slate-100 relative overflow-hidden">
                                            <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-ueu-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="bg-white rounded-full p-4 shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                                    <PlayCircle className="h-8 w-8 text-ueu-blue" />
                                                </div>
                                            </div>
                                            {course.progress === 100 && (
                                                <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-white/20">
                                                    LULUS
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <div className="mb-4">
                                                <Badge variant="secondary" className="text-[10px] px-3 py-0.5 rounded-full font-bold text-slate-500 bg-slate-50 border-none uppercase tracking-wider">{course.category}</Badge>
                                            </div>
                                            <h4 className="font-black text-ueu-navy line-clamp-2 mb-2 group-hover:text-ueu-blue transition-colors text-lg leading-snug">{course.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 mb-6">Bersama {course.instructor}</p>
                                            
                                            <div className="mt-auto pt-6 border-t border-slate-50">
                                                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                    <span>Progression</span>
                                                    <span className="text-ueu-blue">{course.progress}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-500",
                                                            course.progress === 100 ? "bg-green-200" : "bg-ueu-blue"
                                                        )} 
                                                        style={{ width: `${course.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="h-12 w-12 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-3">Mulai perjalanan belajar Anda</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium">Ambil mata kuliah favorit Anda sekarang dan raih impian bersama para pengajar profesional kami.</p>
                                <Button onClick={() => navigate('/browse')} className="bg-ueu-blue hover:bg-ueu-navy h-14 px-10 rounded-full font-black text-white shadow-xl shadow-blue-100 transition-all">
                                    Lihat Semua Mata Kuliah
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-10">
                    
                    {/* Upcoming Live Classes */}
                    <Card className="rounded-[32px] border border-slate-100 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-slate-50 pb-6">
                            <CardTitle className="text-xl font-black text-ueu-navy flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-ueu-blue" /> Kelas Live Terdekat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {upcomingClasses.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {upcomingClasses.map((cls) => {
                                        const date = new Date(cls.startTime);
                                        return (
                                            <div key={cls.id} className="p-8 hover:bg-slate-50 transition-all cursor-pointer group" onClick={() => navigate('/schedule')}>
                                                <div className="flex items-start gap-6">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-3xl px-4 py-4 text-center min-w-[72px] shrink-0 shadow-sm group-hover:bg-blue-50 group-hover:border-ueu-blue/20 transition-all duration-300">
                                                        <div className="text-[10px] font-black text-ueu-blue uppercase tracking-[2px]">{format(date, 'MMM')}</div>
                                                        <div className="text-2xl font-black text-ueu-navy mt-1 tracking-tighter">{format(date, 'd')}</div>
                                                    </div>
                                                    <div className="min-w-0 pt-1">
                                                        <h5 className="font-bold text-sm text-ueu-navy mb-3 line-clamp-2 group-hover:text-ueu-blue transition-colors leading-relaxed">{cls.title}</h5>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-2 bg-white border border-slate-100 px-3 py-1.5 rounded-full shadow-sm">
                                                                <Clock className="h-3 w-3 text-ueu-blue" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{format(date, 'HH:mm')} WIB</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="p-6 bg-slate-50/50">
                                        <Button variant="ghost" className="w-full h-12 bg-white rounded-2xl font-bold text-xs text-ueu-blue hover:bg-ueu-blue hover:text-white shadow-sm border border-slate-100 transition-all" onClick={() => navigate('/schedule')}>
                                            Lihat Seluruh Jadwal <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-muted-foreground bg-slate-50/30">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <Calendar className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">Belum ada jadwal kelas live.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Achievements Section */}
                    <Card className="rounded-[32px] border border-slate-100 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="p-8 pb-6 border-b border-slate-50">
                            <CardTitle className="text-xl font-black text-ueu-navy flex items-center gap-3">
                                <Award className="h-5 w-5 text-accent" /> Pencapaian Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {certificates.length > 0 ? (
                                <div className="space-y-6">
                                    {certificates.slice(0, 2).map((cert) => (
                                        <div key={cert.id} className="group bg-slate-50 p-6 rounded-[32px] border border-white shadow-sm flex items-center gap-5 transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-blue-900/5">
                                            <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 transform group-hover:rotate-12 transition-transform">
                                                <Trophy className="h-7 w-7 text-accent" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-black text-ueu-blue uppercase tracking-[2px] mb-1">Verifikasi Ahli</p>
                                                <p className="text-sm font-black text-ueu-navy truncate group-hover:text-ueu-blue transition-colors" title={cert.courseTitle}>{cert.courseTitle}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" className="w-full h-12 rounded-2xl border-2 border-ueu-blue text-ueu-blue hover:bg-ueu-blue hover:text-white font-black text-xs mt-4 transition-all" onClick={() => navigate('/dashboard', { state: { tab: 'certificates' } })}>
                                        Lihat Semua Sertifikat
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed px-4">
                                        Selesaikan modul kuliah Anda dan kumpulkan sertifikat kompetensi berkualitas dari kami.
                                    </p>
                                    <div className="flex justify-center gap-6 opacity-10">
                                        <Award className="h-10 w-10 text-ueu-navy" />
                                        <Trophy className="h-10 w-10 text-ueu-navy" />
                                        <Star className="h-10 w-10 text-ueu-navy" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
};
