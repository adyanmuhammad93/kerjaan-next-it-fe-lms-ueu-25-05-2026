import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users as UsersIcon, Filter } from 'lucide-react';
import { authService } from '../../../services/authService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { UserListTable } from './users/UserListTable';
import { CreateUserDialog } from './users/CreateUserDialog';
import { EditUserDialog } from './users/EditUserDialog';
import { DeleteUserAlert } from './users/DeleteUserAlert';
import { UserFilterControls } from './users/UserFilterControls';
import { AssignCoursesDialog } from './users/AssignCoursesDialog';
import { ChangePasswordDialog } from './users/ChangePasswordDialog';

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search State (Struktur tetap dipertahankan)
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Filter State
    const [roleFilter, setRoleFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [hasEnrollments, setHasEnrollments] = useState(false);

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [assigningUser, setAssigningUser] = useState<any | null>(null);
    const [passwordChangeUser, setPasswordChangeUser] = useState<any | null>(null);

    // Debounce Search Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); 
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await authService.getPaginatedUsers(
                page,
                limit,
                debouncedSearch,
                {
                    role: roleFilter,
                    sortBy,
                    sortDir,
                    hasEnrollments
                }
            );
            setUsers(result.data || []);
            setTotalPages(result.totalPages);
            setTotalUsers(result.total);
        } catch (e) {
            console.error("Gagal memuat data civitas:", e);
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch, roleFilter, sortBy, sortDir, hasEnrollments]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleClearFilters = () => {
        setRoleFilter('all');
        setSortBy('created_at');
        setSortDir('desc');
        setHasEnrollments(false);
        setPage(1);
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
                                    <UsersIcon className="h-6 w-6 text-ueu-blue" />
                                </div>
                                <CardTitle className="text-2xl font-bold text-ueu-navy">Manajemen Civitas</CardTitle>
                            </div>
                            <CardDescription className="text-slate-500 font-medium ml-0 sm:ml-12">
                                Kelola akses dan profil untuk <span className="text-ueu-blue font-bold">{totalUsers}</span> pengguna sistem.
                            </CardDescription>
                        </div>

                        {/* Kontrol Navigasi & Aksi */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full md:flex-1 lg:min-w-[360px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari nama atau email mahasiswa..."
                                    className="pl-10 h-11 bg-white border-slate-200 focus:border-ueu-blue focus:ring-ueu-blue rounded-xl transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                                <UserFilterControls
                                    roleFilter={roleFilter}
                                    setRoleFilter={setRoleFilter}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    sortDir={sortDir}
                                    setSortDir={setSortDir}
                                    hasEnrollments={hasEnrollments}
                                    setHasEnrollments={setHasEnrollments}
                                    onClear={handleClearFilters}
                                />

                                <Button 
                                    onClick={() => setIsCreateOpen(true)} 
                                    className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-11 px-4 sm:px-6 shadow-md transition-all duration-300 md:flex-shrink-0 w-auto"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Tambah Pengguna</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-0">
                    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                        <UserListTable
                            users={users}
                            loading={loading}
                            page={page}
                            limit={limit}
                            totalPages={totalPages}
                            totalUsers={totalUsers}
                            onPageChange={setPage}
                            onEdit={setEditingUser}
                            onDelete={setDeleteId}
                            onAssignCourses={setAssigningUser}
                            onChangePassword={setPasswordChangeUser}
                            searchQuery={debouncedSearch}
                        />
                    </div>
                </CardContent>

                {/* Dialog Components */}
                <CreateUserDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    onSuccess={fetchUsers}
                />

                <EditUserDialog
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={fetchUsers}
                />

                <DeleteUserAlert
                    userId={deleteId}
                    onClose={() => setDeleteId(null)}
                    onSuccess={() => {
                        setUsers(users.filter(u => u.id !== deleteId));
                        fetchUsers();
                    }}
                />

                <AssignCoursesDialog
                    isOpen={!!assigningUser}
                    instructor={assigningUser}
                    onClose={() => setAssigningUser(null)}
                    onAssignmentComplete={() => console.log('Penugasan selesai')}
                />

                <ChangePasswordDialog
                    user={passwordChangeUser}
                    onClose={() => setPasswordChangeUser(null)}
                    onSuccess={() => console.log('Sandi diperbarui')}
                />
            </Card>
        </div>
    );
};