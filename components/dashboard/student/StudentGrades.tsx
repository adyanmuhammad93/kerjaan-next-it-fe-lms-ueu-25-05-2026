import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, HelpCircle, AlertCircle, CheckCircle, ArrowRight, Loader2, RefreshCw, Trophy, Target, Award, BookOpen 
} from 'lucide-react';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../ui/Table';
import { DashboardStatsCard } from '../DashboardStatsCard';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

export const StudentGrades: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            if (!user) return;
            try {
                const data = await assignmentService.getStudentSubmissions(user.id);
                setSubmissions(data);
            } catch (e) {
                console.error("Failed to fetch grades", e);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, [user]);

    const handleRetake = (courseId: string, lessonId: string) => {
        navigate(`/course/${courseId}/learn?lessonId=${lessonId}`);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] animate-pulse">Memuat Transkrip Nilai...</p>
                </div>
            </div>
        );
    }

    const passedCount = submissions.filter(s => s.status === 'passed').length;
    const failedCount = submissions.filter(s => s.status === 'failed').length;
    const pendingCount = submissions.filter(s => s.status === 'pending').length;

    return (
        <div className="space-y-8 bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-ueu-navy tracking-tight">Transkrip Nilai</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Pantau pencapaian akademik dan riwayat penilaian Anda.</p>
                </div>
                <Badge className="px-5 py-2.5 rounded-full bg-ueu-blue/5 text-ueu-blue font-black text-[10px] uppercase tracking-widest border-none shadow-sm shadow-blue-900/5">
                    {submissions.length} Total Penilaian
                </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardStatsCard 
                    title="Lulus" 
                    value={passedCount} 
                    icon={CheckCircle} 
                    trend="Mata kuliah berhasil diselesaikan"
                    trendUp={true}
                    className="rounded-[32px] border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Perlu Perbaikan" 
                    value={failedCount} 
                    icon={AlertCircle} 
                    trend={failedCount > 0 ? "Segera ambil remedial" : "Pertahankan prestasi Anda"}
                    trendUp={failedCount === 0}
                    className={cn(
                        "rounded-[32px] border-none shadow-sm bg-white",
                        failedCount > 0 && "ring-2 ring-red-100"
                    )}
                />
                <DashboardStatsCard 
                    title="Menunggu Review" 
                    value={pendingCount} 
                    icon={Target} 
                    trend="Dalam antrean penilaian dosen"
                    className="rounded-[32px] border-none shadow-sm bg-white"
                />
                <DashboardStatsCard 
                    title="Skor Rata-rata" 
                    value={submissions.length > 0 ? `${Math.round(submissions.reduce((acc, curr) => acc + (curr.grade || 0), 0) / submissions.length)}%` : '0%'} 
                    icon={Award} 
                    trend="Indeks performa akademik Anda"
                    className="rounded-[32px] border-none shadow-sm bg-white"
                />
            </div>

            {/* Submissions List */}
            <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-8">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-black text-ueu-navy flex items-center gap-3">
                           <FileText className="h-5 w-5 text-ueu-blue" /> Detail Penilaian
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow className="border-b border-slate-100">
                                <TableHead className="px-8 py-5 font-black text-ueu-navy text-[10px] uppercase tracking-widest">Materi & Kursus</TableHead>
                                <TableHead className="font-black text-ueu-navy text-[10px] uppercase tracking-widest">Tipe</TableHead>
                                <TableHead className="font-black text-ueu-navy text-[10px] uppercase tracking-widest">Tanggal</TableHead>
                                <TableHead className="text-center font-black text-ueu-navy text-[10px] uppercase tracking-widest">Skor</TableHead>
                                <TableHead className="text-center font-black text-ueu-navy text-[10px] uppercase tracking-widest">Status Kontrak</TableHead>
                                <TableHead className="text-right px-8 font-black text-ueu-navy text-[10px] uppercase tracking-widest">Opsi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center space-y-6">
                                            <div className="bg-slate-50 p-7 rounded-[32px]">
                                                <Trophy className="h-12 w-12 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-ueu-navy font-black">Belum Ada Data Nilai</p>
                                                <p className="text-slate-400 text-xs font-bold italic">Selesaikan modul untuk mendapatkan penilaian.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.map((sub) => (
                                    <TableRow key={sub.id} className="group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-100">
                                        <TableCell className="py-7 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-500">
                                                    {sub.courseThumbnail ? (
                                                        <img src={sub.courseThumbnail} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                            <BookOpen className="h-5 w-5 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-sm text-ueu-navy truncate leading-snug group-hover:text-ueu-blue transition-colors">{sub.lessonTitle}</p>
                                                    <p className="text-[10px] font-black text-ueu-blue uppercase tracking-widest truncate mt-1">{sub.courseTitle}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-slate-50 text-ueu-navy border border-slate-100 rounded-full px-4 py-1.5 font-black uppercase text-[9px] tracking-widest shadow-sm">
                                                {sub.lessonType === 'quiz' ? <HelpCircle className="w-3 h-3 mr-2 text-accent" /> : <FileText className="w-3 h-3 mr-2 text-ueu-blue" />}
                                                {sub.lessonType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                            {format(new Date(sub.submittedAt), 'dd MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={cn(
                                                "inline-block px-5 py-2 rounded-full text-xs font-black shadow-sm tracking-tighter",
                                                sub.grade >= 80 ? "bg-green-100 text-green-800" :
                                                sub.grade >= 60 ? "bg-amber-100 text-amber-800" :
                                                sub.grade === null ? "bg-slate-100 text-slate-400" : "bg-red-100 text-red-800"
                                            )}>
                                                {sub.grade !== null ? `${sub.grade}` : '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {sub.status === 'passed' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">KOMPETEN</span>
                                                </div>
                                            )}
                                            {sub.status === 'failed' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">REMEDIAL</span>
                                                </div>
                                            )}
                                            {sub.status === 'pending' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse"></div>
                                                    <span className="text-[10px] font-black text-ueu-blue uppercase tracking-widest">MODERASI</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            {sub.status === 'failed' ? (
                                                <Button 
                                                    size="sm" 
                                                    className="h-10 bg-accent hover:bg-ueu-navy text-white rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95" 
                                                    onClick={() => handleRetake(sub.courseId, sub.lessonId)}
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5 mr-2" /> Ulangi
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-10 text-ueu-blue hover:bg-ueu-blue hover:text-white rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest border-2 border-transparent hover:border-ueu-blue transition-all" 
                                                    onClick={() => handleRetake(sub.courseId, sub.lessonId)}
                                                >
                                                    Laporan <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
