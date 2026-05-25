import React, { useState, useEffect, useMemo } from 'react';
import {
    Users, TrendingUp, AlertTriangle, Award, Search, Download,
    Loader2, ArrowUpDown, BookOpen, RefreshCw, Filter, X
} from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../ui/Table';
import { courseService } from '../../../services/courseService';
import { format } from 'date-fns';

type ProgressRow = {
    enrollment_id: string;
    student_id: string;
    student_name: string;
    student_email: string;
    course_id: string;
    course_title: string;
    instructor_id: string;
    instructor_name: string;
    enrolled_at: string;
    enrollment_status: string;
    total_lessons: number;
    completed_lessons: number;
    progress_pct: number;
    best_score: number;
    last_active: string | null;
    has_certificate: boolean;
};

type SortKey = keyof ProgressRow;
type StatusFilter = 'not_started' | 'in_progress' | 'completed' | 'all';

export const AdminStudentProgress: React.FC = () => {
    const [rows, setRows] = useState<ProgressRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortKey, setSortKey] = useState<SortKey>('enrolled_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await courseService.getAllStudentProgress();
            setRows(data);
        } catch (err) {
            console.error("Gagal memuat data progres mahasiswa:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        let result = [...rows];
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(r => 
                r.student_name.toLowerCase().includes(s) || 
                r.course_title.toLowerCase().includes(s) ||
                r.student_email.toLowerCase().includes(s)
            );
        }
        if (statusFilter !== 'all') {
            result = result.filter(r => {
                if (statusFilter === 'not_started') return r.progress_pct === 0;
                if (statusFilter === 'completed') return r.progress_pct === 100;
                return r.progress_pct > 0 && r.progress_pct < 100;
            });
        }
        result.sort((a, b) => {
            const valA = a[sortKey] ?? '';
            const valB = b[sortKey] ?? '';
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return result;
    }, [rows, search, statusFilter, sortKey, sortDir]);

    const stats = useMemo(() => ({
        total: rows.length,
        completed: rows.filter(r => r.progress_pct === 100).length,
        atRisk: rows.filter(r => r.progress_pct < 20 && r.last_active && new Date(r.last_active) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        avgProgress: rows.length ? Math.round(rows.reduce((acc, r) => acc + r.progress_pct, 0) / rows.length) : 0
    }), [rows]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const StatusBadge = ({ pct, hasCert }: { pct: number, hasCert: boolean }) => {
        if (pct === 100) return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full font-bold">Selesai {hasCert && '• Bersertifikat'}</Badge>;
        if (pct === 0) return <Badge className="bg-slate-50 text-slate-500 border-slate-200 rounded-full">Belum Dimulai</Badge>;
        return <Badge className="bg-[#E0F2FE] text-[#0078C1] border-none rounded-full font-bold">Berjalan ({pct}%)</Badge>;
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-[#F8FAFC] min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#0078C1] bg-opacity-10 rounded-2xl">
                            <TrendingUp className="h-6 w-6 text-[#0078C1]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#003366]">Progres Akademik Mahasiswa</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Monitoring aktivitas belajar dan capaian kurikulum mahasiswa secara real-time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={loadData}
                        variant="outline" 
                        className="rounded-xl border-slate-200 text-slate-600 font-semibold bg-white shadow-sm hover:text-[#0078C1]"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Muat Ulang
                    </Button>
                    <Button className="bg-[#003366] hover:bg-[#0078C1] text-white rounded-xl shadow-md transition-all">
                        <Download className="h-4 w-4 mr-2" /> Ekspor Laporan
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-[24px] border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-slate-50 rounded-2xl"><Users className="h-5 w-5 text-slate-600" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendaftaran</p>
                            <p className="text-2xl font-bold text-[#003366]">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[24px] border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-2xl"><Award className="h-5 w-5 text-emerald-600" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lulus Kuliah</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[24px] border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-[#E0F2FE] rounded-2xl"><TrendingUp className="h-5 w-5 text-[#0078C1]" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Progres</p>
                            <p className="text-2xl font-bold text-[#0078C1]">{stats.avgProgress}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[24px] border-none shadow-sm bg-white">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-2xl"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perlu Atensi</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.atRisk}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Table Area */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                {/* SECTION FILTER & REFRESH */}
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-[#F8FAFC]/50">
                    <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Cari mahasiswa, NIM, atau mata kuliah..." 
                                className="pl-10 h-11 bg-white border-slate-200 focus:border-[#0078C1] focus:ring-[#0078C1] rounded-xl shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white px-3 h-11 border border-slate-200 rounded-xl shadow-sm">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <select 
                                    className="bg-transparent text-sm font-bold text-[#003366] outline-none cursor-pointer pr-2"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="not_started">Belum Mulai</option>
                                    <option value="in_progress">Dalam Progres</option>
                                    <option value="completed">Selesai</option>
                                </select>
                            </div>
                            {(search || statusFilter !== 'all') && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => { setSearch(''); setStatusFilter('all'); }}
                                    className="text-slate-400 hover:text-red-500 rounded-full"
                                >
                                    <X className="h-4 w-4 mr-1" /> Bersihkan
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#0078C1]" />
                        <p className="font-medium">Sinkronisasi data akademik...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#F8FAFC]">
                                    <TableRow className="border-none">
                                        <TableHead onClick={() => handleSort('student_name')} className="cursor-pointer hover:text-[#0078C1] transition-colors font-bold text-[#003366] py-5">
                                            Mahasiswa <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('course_title')} className="cursor-pointer hover:text-[#0078C1] transition-colors font-bold text-[#003366]">
                                            Mata Kuliah <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('enrolled_at')} className="cursor-pointer hover:text-[#0078C1] transition-colors font-bold text-[#003366]">
                                            Tgl Terdaftar <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead onClick={() => handleSort('last_active')} className="cursor-pointer hover:text-[#0078C1] transition-colors font-bold text-[#003366]">
                                            Aktivitas Terakhir <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                                        </TableHead>
                                        <TableHead className="font-bold text-[#003366]">Status & Progres</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                    <BookOpen className="h-10 w-10 opacity-20" />
                                                    <p className="italic">Data progres tidak ditemukan.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filtered.map((row) => (
                                            <TableRow key={row.enrollment_id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{row.student_name}</span>
                                                        <span className="text-[11px] text-slate-400 font-medium tracking-tight uppercase">{row.student_email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-[#003366]">{row.course_title}</TableCell>
                                                <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                                    {format(new Date(row.enrolled_at), 'dd MMM yyyy')}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                                                    {row.last_active ? format(new Date(row.last_active), 'dd MMM yyyy') : <span className="text-slate-300 italic text-xs">Belum pernah aktif</span>}
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
                        <div className="px-6 py-4 border-t border-slate-50 bg-[#F8FAFC]/50 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>Menampilkan <strong className="text-[#0078C1]">{filtered.length}</strong> dari <strong className="text-slate-600">{rows.length}</strong> Pendaftaran</span>
                            {statusFilter !== 'all' && <span className="text-[#0078C1]">Status: {statusFilter}</span>}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Helper function untuk class merging (asumsi tersedia di lib/utils)
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}