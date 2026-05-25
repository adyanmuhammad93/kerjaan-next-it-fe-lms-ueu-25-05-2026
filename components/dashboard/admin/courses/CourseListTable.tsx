
import React from 'react';
import { MoreVertical, Edit, Trash2, Loader2, FileVideo, ExternalLink, CheckCircle, XCircle, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { useCurrency } from '../../../../hooks/useCurrency';
import { courseService } from '../../../../services/courseService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../../ui/DropdownMenu";

interface CourseListTableProps {
    courses: any[];
    loading: boolean;
    page: number;
    limit: number;
    totalPages: number;
    totalCourses: number;
    onPageChange: (newPage: number) => void;
    onEdit: (courseId: string) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
    refreshData?: () => void; // New prop to reload list after approval
}

export const CourseListTable: React.FC<CourseListTableProps> = ({ 
    courses, 
    loading, 
    page, 
    limit, 
    totalPages, 
    totalCourses, 
    onPageChange,
    onEdit,
    onDelete,
    searchQuery,
    refreshData
}) => {
    const { formatPrice } = useCurrency();

    const handleApprove = async (id: string) => {
        try {
            await courseService.approveCourse(id);
            if (refreshData) refreshData();
        } catch (e) { alert("Failed to approve course"); }
    };

    const handleReject = async (id: string) => {
        if (!window.confirm("Are you sure you want to reject this course? It will be unpublished.")) return;
        try {
            await courseService.rejectCourse(id);
            if (refreshData) refreshData();
        } catch (e) { alert("Failed to reject course"); }
    };

    const getStatusBadge = (course: any) => {
        if (course.approvalStatus === 'pending') {
            return <Badge className="bg-amber-50 text-amber-600 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider">Menunggu Peninjauan</Badge>;
        }
        if (course.approvalStatus === 'rejected') {
            return <Badge className="bg-red-50 text-red-600 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider">Ditolak</Badge>;
        }
        if (course.isPublished) {
            return <Badge className="bg-green-50 text-green-600 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider">Terbit</Badge>;
        }
        return <Badge className="bg-slate-100 text-slate-500 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider">Draf</Badge>;
    };

    return (
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
                <Table className="min-w-[980px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Mata Kuliah</TableHead>
                        <TableHead>Dosen Pengampu</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="w-10 h-10 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Menghimpun kurikulum...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : courses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <BookOpen className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="font-bold text-slate-600">Tidak ada mata kuliah</p>
                                    <p className="text-xs">Kursus untuk "{searchQuery}" belum tersedia di database.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        courses.map((course) => (
                            <TableRow key={course.id} className="hover:bg-slate-50/70 transition-all group">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 group-hover:scale-105 transition-transform duration-500">
                                            {course.thumbnailUrl ? (
                                                <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <FileVideo className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col max-w-[200px]">
                                            <span className="font-bold text-sm text-slate-900 truncate group-hover:text-ueu-blue transition-colors" title={course.title}>{course.title}</span>
                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Terakhir Diperbarui: {course.lastUpdated}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">{course.instructor}</span>
                                        <span className="text-[10px] font-medium text-slate-400 uppercase">{course.instructorEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-black text-[10px] rounded-full px-3 border-slate-200 text-slate-500 uppercase">{course.category}</Badge>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(course)}
                                </TableCell>
                                <TableCell className="text-right font-black text-ueu-blue text-sm">
                                    {formatPrice(course.price)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-full group-hover:scale-110 transition-transform">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                                            <DropdownMenuItem onClick={() => onEdit(course.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                <Edit className="h-4 w-4 mr-3 opacity-60" /> Edit Mata Kuliah
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => window.open(`#/course/${course.id}`, '_blank')} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                <ExternalLink className="h-4 w-4 mr-3 opacity-60" /> Lihat Halaman Publik
                                            </DropdownMenuItem>
                                            
                                            {course.approvalStatus === 'pending' && (
                                                <>
                                                    <DropdownMenuSeparator className="my-1 bg-slate-100/50" />
                                                    <DropdownMenuLabel className="px-4 py-2 text-[10px] uppercase font-black tracking-widest text-slate-400">Moderasi</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleApprove(course.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-green-600 focus:bg-green-50 focus:text-green-700 cursor-pointer">
                                                        <CheckCircle className="h-4 w-4 mr-3 opacity-60" /> Setujui
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleReject(course.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                        <XCircle className="h-4 w-4 mr-3 opacity-60" /> Tolak
                                                    </DropdownMenuItem>
                                                </>
                                            )}

                                            <DropdownMenuSeparator className="my-1 bg-slate-100/50" />
                                            <DropdownMenuItem onClick={() => onDelete(course.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                <Trash2 className="h-4 w-4 mr-3 opacity-60" /> Hapus Permanen
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#F8FAFC]/50 border-t border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                    Menampilkan <span className="text-ueu-blue">{Math.min((page - 1) * limit + 1, totalCourses)} - {Math.min(page * limit, totalCourses)}</span> Dari <span className="text-ueu-navy">{totalCourses}</span> Mata Kuliah
                </div>
                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-ueu-blue disabled:opacity-30" 
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1 || loading}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-xs font-black text-ueu-navy bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        Halaman {page} / {totalPages || 1}
                    </span>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-xl hover:bg-white hover:shadow-sm text-slate-400 hover:text-ueu-blue disabled:opacity-30" 
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages || loading}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
