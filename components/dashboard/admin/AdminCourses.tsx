import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/courseService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { CourseListTable } from './courses/CourseListTable';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/AlertDialog";

export const AdminCourses: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination & Search State (Struktur asli dipertahankan)
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCourses, setTotalCourses] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); 
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const result = await courseService.getPaginatedCourses(page, limit, debouncedSearch);
            setCourses(result.data || []);
            setTotalPages(result.totalPages);
            setTotalCourses(result.total);
        } catch (e) {
            console.error("Gagal mengambil data mata kuliah:", e);
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await courseService.deleteCourse(deleteId);
            setDeleteId(null);
            fetchCourses();
        } catch (e) {
            alert("Gagal menghapus mata kuliah.");
        }
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6 bg-[#F8FAFC] min-h-screen">
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Judul & Deskripsi */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-ueu-blue/10 rounded-2xl">
                                    <BookOpen className="h-6 w-6 text-ueu-blue" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-ueu-navy">Manajemen Kursus</CardTitle>
                            </div>
                            <CardDescription className="text-slate-500 font-medium ml-0 sm:ml-12">
                                Kelola persetujuan, publikasi, dan daftar untuk <span className="text-ueu-blue font-bold">{totalCourses}</span> mata kuliah.
                            </CardDescription>
                        </div>

                        {/* Kontrol Navigasi & Aksi */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full md:flex-1 lg:min-w-[360px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Cari judul mata kuliah atau dosen..." 
                                    className="pl-10 h-11 bg-white border-slate-200 focus:border-ueu-blue focus:ring-ueu-blue rounded-xl transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                             <Button 
                                onClick={() => window.dispatchEvent(new CustomEvent('navigate-dashboard', { detail: 'create_course' }))} 
                                className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-11 px-4 sm:px-6 shadow-md transition-all duration-300 md:flex-shrink-0 w-full md:w-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" /> <span className="whitespace-nowrap">Buat Mata Kuliah</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-0">
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                        <CourseListTable 
                            courses={courses}
                            loading={loading}
                            page={page}
                            limit={limit}
                            totalPages={totalPages}
                            totalCourses={totalCourses}
                            onPageChange={setPage}
                            onEdit={(id) => navigate(`/instructor/course/${id}/edit`)}
                            onDelete={setDeleteId}
                            searchQuery={debouncedSearch}
                            refreshData={fetchCourses}
                        />
                    </div>
                </CardContent>

                {/* Dialog Konfirmasi Hapus */}
                <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                    <AlertDialogContent className="rounded-[24px] border-none shadow-2xl">
                        <AlertDialogHeader>
                            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-center text-xl font-bold text-ueu-navy">Hapus Mata Kuliah?</AlertDialogTitle>
                            <AlertDialogDescription className="text-center text-slate-500">
                                Tindakan ini akan menghapus mata kuliah secara permanen, termasuk semua modul, materi, dan data pendaftaran mahasiswa. Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
                            <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">Batalkan</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDelete} 
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
                            >
                                Ya, Hapus Permanen
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </div>
    );
};