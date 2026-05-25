import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, TrendingUp, AlertTriangle, Award, Search, Download,
    Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../ui/Table';
import { courseService } from '../../../services/courseService';
import { useAuth } from '../../../hooks/useAuth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type ProgressRow = {
    enrollment_id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    course_id: string;
    course_title: string;
    enrolled_at: string;
    enrollment_status: string;
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
    best_quiz_score: number;
    last_active: string | null;
    has_certificate: boolean;
};

type SortKey = keyof ProgressRow;

const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => {
    const color =
        pct >= 100 ? 'bg-emerald-500' :
            pct >= 60 ? 'bg-ueu-blue' :
                pct >= 30 ? 'bg-amber-500' :
                    'bg-red-400';
    return (
        <div className="flex items-center gap-3 min-w-[120px]">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${color}`} 
                    style={{ width: `${Math.min(pct, 100)}%` }} 
                />
            </div>
            <span className="text-[11px] font-black text-slate-600 w-8 text-right underline underline-offset-4 decoration-ueu-blue/30">{pct}%</span>
        </div>
    );
};

const StatusBadge: React.FC<{ pct: number; hasCert: boolean }> = ({ pct, hasCert }) => {
    if (hasCert || pct >= 100) return <Badge className="bg-emerald-500 text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm">Selesai</Badge>;
    if (pct === 0) return <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-wider">Belum Mulai</Badge>;
    if (pct < 30) return <Badge className="bg-red-500 text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm">Berisiko</Badge>;
    return <Badge className="bg-ueu-blue text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-wider shadow-sm">Berjalan</Badge>;
};

export const StudentProgressReport: React.FC = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState<ProgressRow[]>([]);
    const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(
        { key: 'enrolled_at', dir: 'desc' }
    );
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            try {
                const data = await courseService.getInstructorStudentProgress(user.id);
                setRows(data);
                // Derive unique courses
                const seen = new Map<string, string>();
                data.forEach(r => seen.set(r.course_id, r.course_title));
                setCourses(Array.from(seen.entries()).map(([id, title]) => ({ id, title })));
            } catch (e) {
                console.error('Failed to load progress', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?.id]);

    // Summary stats
    const summary = useMemo(() => {
        const total = rows.length;
        const avgProgress = total ? Math.round(rows.reduce((s, r) => s + r.progress_pct, 0) / total) : 0;
        const atRisk = rows.filter(r => r.progress_pct > 0 && r.progress_pct < 30).length;
        const completed = rows.filter(r => r.progress_pct >= 100 || r.has_certificate).length;
        return { total, avgProgress, atRisk, completed };
    }, [rows]);

    const handleSort = (key: SortKey) => {
        setSortConfig(prev =>
            prev?.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        );
    };

    const filtered = useMemo(() => {
        let items = [...rows];
        if (courseFilter) items = items.filter(r => r.course_id === courseFilter);
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(r =>
                r.student_name.toLowerCase().includes(q) ||
                r.student_email.toLowerCase().includes(q)
            );
        }
        if (sortConfig) {
            items.sort((a, b) => {
                const av = a[sortConfig.key] ?? '';
                const bv = b[sortConfig.key] ?? '';
                if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
                if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [rows, courseFilter, search, sortConfig]);

    const handleExport = () => {
        if (!filtered.length) return;
        const headers = ['Student', 'Email', 'Course', 'Enrolled', 'Progress %', 'Lessons Done', 'Total Lessons', 'Best Quiz', 'Last Active', 'Status'];
        const csvRows = filtered.map(r => [
            `"${r.student_name}"`,
            r.student_email,
            `"${r.course_title}"`,
            format(new Date(r.enrolled_at), 'yyyy-MM-dd'),
            r.progress_pct,
            r.completed_lessons,
            r.total_lessons,
            r.best_quiz_score,
            r.last_active ? format(new Date(r.last_active), 'yyyy-MM-dd') : 'Never',
            r.has_certificate || r.progress_pct >= 100 ? 'Completed' : r.progress_pct === 0 ? 'Not Started' : r.progress_pct < 30 ? 'At Risk' : 'In Progress'
        ]);
        const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `student_progress_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    if (loading) return (
        <div className="flex h-[400px] items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-ueu-blue rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium animate-pulse">Menghimpun Data Progres...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 bg-[#F8FAFC] min-h-screen px-3 sm:px-4 lg:px-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-ueu-blue/10 rounded-2xl">
                            <Users className="h-6 w-6 text-ueu-blue" />
                        </div>
                        <h1 className="text-2xl font-bold text-ueu-navy">Progres Belajar Mahasiswa</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-0 sm:ml-12">Pantau perjalanan belajar dan pencapaian kompetensi seluruh mahasiswa Anda.</p>
                </div>
                <Button 
                    variant="outline" 
                    className="rounded-xl border-slate-200 text-slate-600 font-semibold bg-white shadow-sm hover:text-[#0078C1] transition-all"
                    onClick={handleExport} 
                    disabled={!filtered.length}
                >
                    <Download className="h-4 w-4 mr-2" /> Ekspor CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { icon: Users, label: 'Total Pendaftaran', value: summary.total, color: 'text-[#003366]', bg: 'bg-slate-50' },
                    { icon: TrendingUp, label: 'Rata-rata Progres', value: `${summary.avgProgress}%`, color: 'text-[#0078C1]', bg: 'bg-[#E0F2FE]' },
                    { icon: AlertTriangle, label: 'Perlu Atensi', value: summary.atRisk, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: Award, label: 'Lulus Mata Kuliah', value: summary.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                    <Card key={label} className="rounded-[24px] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${bg} group-hover:scale-110 transition-transform`}>
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#F8FAFC]/50">
                    <div className="flex flex-col lg:flex-row gap-4 w-full flex-1">
                        <div className="relative w-full lg:flex-1 lg:max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Cari nama atau email mahasiswa..."
                                className="pl-11 h-11 bg-white border-slate-200 focus:border-[#0078C1] focus:ring-[#0078C1] rounded-xl shadow-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative w-full lg:w-auto">
                            <button
                                onClick={() => setCourseDropdownOpen(o => !o)}
                                className="flex items-center gap-3 px-4 h-11 rounded-xl border border-slate-200 bg-white text-sm font-bold text-ueu-navy hover:bg-slate-50 transition-all w-full lg:min-w-[240px] justify-between shadow-sm"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <BookOpen className="h-4 w-4 text-ueu-blue shrink-0" />
                                    {courseFilter ? courses.find(c => c.id === courseFilter)?.title ?? 'Semua Mata Kuliah' : 'Semua Mata Kuliah'}
                                </span>
                                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", courseDropdownOpen && "rotate-180")} />
                            </button>
                            {courseDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setCourseDropdownOpen(false)}></div>
                                    <div className="absolute z-20 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => { setCourseFilter(''); setCourseDropdownOpen(false); }}
                                            className="w-full px-4 py-2.5 text-sm text-left hover:bg-[#F8FAFC] text-slate-600 font-medium"
                                        >
                                            Semua Mata Kuliah
                                        </button>
                                        <div className="h-px bg-slate-50 mx-2 my-1"></div>
                                        {courses.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setCourseFilter(c.id); setCourseDropdownOpen(false); }}
                                                className={cn(
                                                    "w-full px-4 py-2.5 text-sm text-left hover:bg-ueu-blue/10 truncate transition-colors",
                                                    courseFilter === c.id ? "bg-ueu-blue/10 text-ueu-blue font-bold" : "text-slate-600 font-medium"
                                                )}
                                            >
                                                {c.title}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="p-4 sm:p-6">
                    <div className="w-full overflow-x-auto">
                        <Table className="min-w-[920px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:text-ueu-blue transition-colors" onClick={() => handleSort('student_name')}>
                                    Mahasiswa <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                </TableHead>
                                <TableHead className="cursor-pointer hover:text-ueu-blue transition-colors" onClick={() => handleSort('course_title')}>
                                    Mata Kuliah <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                </TableHead>
                                <TableHead className="cursor-pointer hover:text-ueu-blue transition-colors" onClick={() => handleSort('progress_pct')}>
                                    Progres <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                </TableHead>
                                <TableHead className="text-center cursor-pointer hover:text-ueu-blue transition-colors" onClick={() => handleSort('best_quiz_score')}>
                                    Nilai Kuis <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                </TableHead>
                                <TableHead className="cursor-pointer hover:text-ueu-blue transition-colors" onClick={() => handleSort('last_active')}>
                                    Aktivitas <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                </TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Users className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <p className="italic">
                                                {rows.length === 0
                                                    ? 'Belum ada mahasiswa terdaftar di mata kuliah Anda.'
                                                    : 'Tidak ada hasil yang sesuai dengan filter.'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(row => (
                                    <TableRow key={row.enrollment_id} className="group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-ueu-navy flex items-center justify-center text-white text-xs font-bold shrink-0 group-hover:rotate-6 transition-transform">
                                                    {row.student_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-slate-900 truncate">{row.student_name}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter truncate">{row.student_email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-semibold text-slate-700 line-clamp-1 max-w-[200px]">{row.course_title}</p>
                                            <p className="text-[10px] font-bold text-ueu-blue mt-0.5">{row.completed_lessons}/{row.total_lessons} Materi Selesai</p>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000",
                                                            row.progress_pct >= 100 ? 'bg-emerald-500' :
                                                            row.progress_pct >= 60 ? 'bg-ueu-blue' :
                                                            row.progress_pct >= 30 ? 'bg-amber-500' : 'bg-red-400'
                                                        )} 
                                                        style={{ width: `${Math.min(row.progress_pct, 100)}%` }} 
                                                    />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-600 w-8 text-right underline underline-offset-4 decoration-ueu-blue/30">{row.progress_pct}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {row.best_quiz_score > 0 ? (
                                                <span className={cn(
                                                    "font-black text-sm",
                                                    row.best_quiz_score >= 80 ? 'text-emerald-600' : 
                                                    row.best_quiz_score >= 60 ? 'text-ueu-blue' : 'text-amber-600'
                                                )}>
                                                    {row.best_quiz_score}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-500">
                                            {row.last_active
                                                ? format(new Date(row.last_active), 'dd MMM yyyy')
                                                : <span className="text-slate-300 italic text-xs">Belum Aktif</span>}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge pct={row.progress_pct} hasCert={row.has_certificate} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </div>
                {filtered.length > 0 && (
                    <div className="px-6 py-4 bg-[#F8FAFC]/50 text-[10px] font-black text-slate-400 uppercase tracking-[2px] flex justify-between items-center">
                        <span>Laporan Terverifikasi Digital</span>
                        <span>Menampilkan {filtered.length} dari {rows.length} Pendaftaran</span>
                    </div>
                )}
            </div>
        </div>
    );
};
