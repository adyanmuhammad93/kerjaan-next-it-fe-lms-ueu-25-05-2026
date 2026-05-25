
import React from 'react';
import { User, GraduationCap, Shield, MoreVertical, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Eye, BookOpen } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { useStore } from '../../../../store/useStore';
import { authService } from '../../../../services/authService';
import { useNavigate } from 'react-router-dom';
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
} from "../../../ui/DropdownMenu";

interface UserListTableProps {
    users: any[];
    loading: boolean;
    page: number;
    limit: number;
    totalPages: number;
    totalUsers: number;
    onPageChange: (newPage: number) => void;
    onEdit: (user: any) => void;
    onDelete: (id: string) => void;
    onAssignCourses?: (user: any) => void;
    onChangePassword?: (user: any) => void;
    searchQuery: string;
}

export const UserListTable: React.FC<UserListTableProps> = ({
    users,
    loading,
    page,
    limit,
    totalPages,
    totalUsers,
    onPageChange,
    onEdit,
    onDelete,
    onAssignCourses,
    onChangePassword,
    searchQuery
}) => {
    const { startImpersonation } = useStore();
    const navigate = useNavigate();

    const handleImpersonate = async (userId: string) => {
        try {
            const targetUser = await authService.getUserDetailsForImpersonation(userId);
            startImpersonation(targetUser);
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            alert("Failed to impersonate user.");
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider gap-1.5"><Shield className="h-3 w-3" /> Admin</Badge>;
            case 'instructor':
                return <Badge className="bg-ueu-blue/10 text-ueu-blue hover:bg-ueu-blue/20 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider gap-1.5"><GraduationCap className="h-3 w-3" /> Pengajar</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-wider gap-1.5"><User className="h-3 w-3" /> Mahasiswa</Badge>;
        }
    };

    return (
        <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
            <div className="w-full overflow-x-auto">
            <Table className="min-w-[860px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Pengguna</TableHead>
                        <TableHead>Peran</TableHead>
                        <TableHead className="hidden md:table-cell">Tanggal Bergabung</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="w-10 h-10 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin"></div>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Menghimpun data civitas...</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-48 text-center">
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <GraduationCap className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="font-bold text-slate-600">Tidak ada pengguna ditemukan</p>
                                    <p className="text-xs">Hasil pencarian untuk "{searchQuery}" tidak tersedia.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-slate-50/70 transition-all group">
                                <TableCell>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-ueu-navy flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm ring-4 ring-white group-hover:rotate-6 transition-transform">
                                            {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-900 group-hover:text-ueu-blue transition-colors">{user.full_name || 'No Name'}</span>
                                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getRoleBadge(user.role)}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="text-xs font-bold text-slate-600">{new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Akademik Terdaftar</div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-slate-100 rounded-full group-hover:scale-110 transition-transform">
                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[200px]">
                                            <DropdownMenuItem onClick={() => handleImpersonate(user.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                <Eye className="h-4 w-4 mr-3 opacity-60" /> Login Sebagai User
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-slate-100/50" />
                                            {user.role === 'instructor' && onAssignCourses && (
                                                <DropdownMenuItem onClick={() => onAssignCourses(user)} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                    <BookOpen className="h-4 w-4 mr-3 opacity-60" /> Tugaskan Matkul
                                                </DropdownMenuItem>
                                            )}
                                            {onChangePassword && (
                                                <DropdownMenuItem onClick={() => onChangePassword(user)} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                    <Shield className="h-4 w-4 mr-3 opacity-60" /> Ubah Sandi
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => onEdit(user)} className="rounded-xl px-4 py-3 font-bold text-xs text-slate-700 focus:bg-ueu-blue/10 focus:text-ueu-blue cursor-pointer">
                                                <Edit className="h-4 w-4 mr-3 opacity-60" /> Ubah Detail
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(user.id)} className="rounded-xl px-4 py-3 font-bold text-xs text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                                                <Trash2 className="h-4 w-4 mr-3 opacity-60" /> Hapus Sipil
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
                    Menampilkan <span className="text-ueu-blue">{Math.min((page - 1) * limit + 1, totalUsers)} - {Math.min(page * limit, totalUsers)}</span> Dari <span className="text-ueu-navy">{totalUsers}</span> Civitas
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
