
import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, CheckCircle, Clock, FileText, HelpCircle, ClipboardList 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '../../ui/Table';
import { assignmentService } from '../../../services/assignmentService';
import { useAuth } from '../../../hooks/useAuth';
import { GradingModal } from './grading/GradingModal';
import { cn } from '../../../lib/utils';

export const GradingDashboard: React.FC = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'pending' | 'graded'>('pending');
    
    // Modal State
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

    const fetchSubmissions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await assignmentService.getInstructorSubmissions(user.id);
            setSubmissions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [user]);

    const filteredList = submissions.filter(sub => {
        const matchesSearch = sub.studentName.toLowerCase().includes(search.toLowerCase()) || 
                              sub.lessonTitle.toLowerCase().includes(search.toLowerCase());
        const isGraded = sub.grade !== null && sub.grade !== undefined;
        const matchesFilter = filter === 'graded' ? isGraded : !isGraded;
        return matchesSearch && matchesFilter;
    });

    const pendingCount = submissions.filter(s => s.grade === null || s.grade === undefined).length;
    const gradedCount = submissions.length - pendingCount;

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 bg-[#F8FAFC] min-h-screen px-3 sm:px-4 lg:px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-ueu-blue/10 rounded-2xl">
                            <ClipboardList className="h-6 w-6 text-ueu-blue" />
                        </div>
                        <h2 className="text-2xl font-bold text-ueu-navy">Pusat Penilaian</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Evaluasi dan berikan nilai pada tugas serta kuis mahasiswa Anda.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[28px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menunggu Review</p>
                                <p className="text-3xl font-bold text-ueu-navy">{pendingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[28px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sudah Dinilai</p>
                                <p className="text-3xl font-bold text-emerald-600">{gradedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[28px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all border-l-4 border-l-accent">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-ueu-navy/5 rounded-2xl flex items-center justify-center text-ueu-navy group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pengumpulan</p>
                                <p className="text-3xl font-bold text-ueu-navy">{submissions.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Content Area */}
            <Card className="flex-1 flex flex-col border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-6 justify-between items-center bg-[#F8FAFC]/50">
                    {/* Tabs */}
                    <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl w-full sm:w-auto">
                        <button
                            onClick={() => setFilter('pending')}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex-1 sm:flex-none flex items-center justify-center gap-2",
                                filter === 'pending' 
                                    ? "bg-white text-ueu-navy shadow-sm" 
                                    : "text-slate-500 hover:text-ueu-blue"
                            )}
                        >
                            Belum Dinilai
                            {pendingCount > 0 && (
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setFilter('graded')}
                            className={cn(
                                "px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex-1 sm:flex-none flex items-center justify-center gap-2",
                                filter === 'graded' 
                                    ? "bg-white text-ueu-navy shadow-sm" 
                                    : "text-slate-500 hover:text-ueu-blue"
                            )}
                        >
                            Selesai Dinilai
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Cari mahasiswa atau tugas..." 
                            className="pl-11 h-12 bg-white border-slate-200 focus:border-[#0078C1] focus:ring-[#0078C1] rounded-[18px] shadow-sm placeholder:text-slate-400"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white min-h-[400px] p-6">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Menyiapkan lembar penilaian...</p>
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-24 text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <ClipboardList className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="font-bold text-slate-800">Tidak ada pengumpulan ditemukan</p>
                            <p className="text-sm">Silakan sesuaikan filter atau pencarian Anda.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mahasiswa</TableHead>
                                        <TableHead>Detail Tugas</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead>Dikumpulkan</TableHead>
                                        <TableHead className="text-right">Skala Nilai</TableHead>
                                        <TableHead className="text-right">Navigasi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredList.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-all group">
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-ueu-navy flex items-center justify-center text-sm font-bold text-white shadow-sm ring-4 ring-white group-hover:rotate-6 transition-transform">
                                                        {sub.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                                                        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{sub.studentEmail}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-slate-800 text-sm">{sub.lessonTitle}</div>
                                                <div className="text-xs text-ueu-blue font-medium">{sub.courseTitle}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={cn(
                                                    "border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                                                    sub.lessonType === 'quiz' ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-ueu-blue"
                                                )}>
                                                    {sub.lessonType === 'quiz' ? <HelpCircle className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                                    {sub.lessonType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs font-bold text-slate-600">{new Date(sub.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(sub.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {sub.grade !== null && sub.grade !== undefined ? (
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className={cn(
                                                            "text-lg font-black", 
                                                            sub.grade >= 70 ? "text-emerald-600" : "text-amber-600"
                                                        )}>
                                                            {sub.grade}
                                                            <span className="text-[10px] ml-0.5 opacity-60">/100</span>
                                                        </span>
                                                        <div className={cn(
                                                            "h-1 w-12 rounded-full mt-1",
                                                            sub.grade >= 70 ? "bg-emerald-200" : "bg-amber-200"
                                                        )}>
                                                            <div 
                                                                className={cn("h-full rounded-full", sub.grade >= 70 ? "bg-emerald-500" : "bg-amber-500")}
                                                                style={{ width: `${sub.grade}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold uppercase text-[9px] tracking-widest">
                                                        Belum Dinilai
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => setSelectedSubmission(sub)}
                                                    className="rounded-full px-5 py-5 font-bold text-[11px] uppercase tracking-widest transition-all bg-slate-50 text-slate-600 hover:bg-ueu-blue hover:text-white"
                                                >
                                                    {sub.grade !== null ? 'Lihat Detail' : 'Beri Nilai'}
                                                </Button>
                                            </TableCell>
                                        </tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
                <div className="px-8 py-4 bg-[#F8FAFC]/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                    <span>Protokol Validasi Akademik UEU v2.4</span>
                    <span className="text-ueu-blue">Menampilkan {filteredList.length} dari {submissions.length} Pengumpulan</span>
                </div>
            </Card>

            <GradingModal 
                submission={selectedSubmission} 
                open={!!selectedSubmission} 
                onClose={() => setSelectedSubmission(null)}
                onSuccess={fetchSubmissions}
            />
        </div>
    );
};
