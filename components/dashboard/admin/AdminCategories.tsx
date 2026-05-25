import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Tag, Filter } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { categoryService } from '../../../services/categoryService';
import { Category } from '../../../types';
import { CategoryList } from './categories/CategoryList';
import { CreateCategoryDialog } from './categories/CreateCategoryDialog';
import { EditCategoryDialog } from './categories/EditCategoryDialog';
import { cn } from '../../../lib/utils';
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

export const AdminCategories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Sort State
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoryService.getCategories();
            setCategories(data);
        } catch (e) { 
            console.error(e); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDeleteCategory = async () => {
        if (!deleteId) return;
        try {
            await categoryService.deleteCategory(deleteId);
            setDeleteId(null);
            fetchCategories();
        } catch (e: any) { 
            console.error(e);
            alert(e.message || "Failed to delete category");
            setDeleteId(null);
        }
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // Filter and Sort Logic
    const processedCategories = useMemo(() => {
        let items = [...categories];
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
        }

        items.sort((a: any, b: any) => {
            const valA = a[sortKey] || '';
            const valB = b[sortKey] || '';
            
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        // Reorganize into hierarchy while preserving sorted sibling order
        const itemIds = new Set(items.map(i => i.id));
        const rootItems = items.filter(c => !c.parentId || !itemIds.has(c.parentId));
        
        const buildHierarchy = (roots: Category[]): Category[] => {
            let result: Category[] = [];
            for (const root of roots) {
                result.push(root);
                const children = items.filter(c => c.parentId === root.id);
                result = result.concat(buildHierarchy(children));
            }
            return result;
        };

        return buildHierarchy(rootItems);
    }, [categories, searchQuery, sortKey, sortDir]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-ueu-blue/10 rounded-xl">
                            <Tag className="h-6 w-6 text-ueu-blue" />
                        </div>
                        <h2 className="text-2xl font-bold text-ueu-navy uppercase tracking-tight">Manajemen Kategori</h2>
                    </div>
                    <p className="text-muted-foreground font-medium ml-12">
                        Kelola dan organisir kategori mata kuliah untuk memudahkan pencarian mahasiswa.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-colors" />
                        <Input 
                            placeholder="Cari kategori..." 
                            className="pl-11 h-12 w-full lg:w-[320px] bg-white border-slate-100 shadow-sm rounded-xl focus:ring-ueu-blue/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-12 px-6 shadow-md transition-all flex items-center gap-2 font-bold"
                    >
                        <Plus className="h-5 w-5" /> <span className="hidden sm:inline">Tambah Kategori</span>
                    </Button>
                </div>
            </div>

            {/* Category Content */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-[32px] overflow-hidden">
                <CardHeader className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Filter className="h-4 w-4 text-ueu-blue" />
                             <span className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px]">Daftar Kategori ({categories.length})</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                            <span>Diurutkan berdasarkan: {sortKey === 'name' ? 'Nama' : sortKey === 'slug' ? 'Slug' : 'Tanggal'}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <CategoryList 
                        categories={processedCategories}
                        loading={loading}
                        onEdit={setEditingCategory}
                        onDelete={setDeleteId}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                </CardContent>
            </Card>

            <CreateCategoryDialog 
                open={isCreateOpen} 
                categories={categories}
                onOpenChange={setIsCreateOpen} 
                onSuccess={fetchCategories} 
            />

            <EditCategoryDialog 
                category={editingCategory} 
                categories={categories}
                onClose={() => setEditingCategory(null)} 
                onSuccess={fetchCategories} 
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-ueu-navy">Konfirmasi Penghapusan</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium pt-2">
                            Apakah Anda yakin ingin menghapus kategori ini? Mata kuliah yang menggunakan kategori ini mungkin perlu diperbarui.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="rounded-xl border-slate-100 hover:bg-slate-50 font-bold text-slate-600">Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold border-none">Hapus Kategori</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};