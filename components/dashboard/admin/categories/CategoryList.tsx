import React from 'react';
import { Edit2, Trash2, Loader2, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight, Hash, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { Category } from '../../../../types';
import { cn } from '../../../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/Table";

interface CategoryListProps {
    categories: Category[];
    loading: boolean;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
    sortKey: string;
    sortDir: 'asc' | 'desc';
    onSort: (key: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({ 
    categories, 
    loading, 
    onEdit, 
    onDelete,
    sortKey,
    sortDir,
    onSort
}) => {
    const SortIcon = ({ column }: { column: string }) => {
        if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300 group-hover:text-slate-400 transition-colors" />;
        return sortDir === 'asc' 
            ? <ArrowUp className="h-3 w-3 ml-1 text-ueu-blue" /> 
            : <ArrowDown className="h-3 w-3 ml-1 text-ueu-blue" />;
    };

    return (
        <div className="bg-white overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-b border-slate-100">
                        <TableHead className="py-5 cursor-pointer group select-none" onClick={() => onSort('name')}>
                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">
                                Nama Kategori <SortIcon column="name" />
                            </div>
                        </TableHead>
                        <TableHead className="py-5 cursor-pointer group select-none" onClick={() => onSort('slug')}>
                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Slug <SortIcon column="slug" />
                            </div>
                        </TableHead>
                        <TableHead className="py-5 cursor-pointer group select-none hidden md:table-cell" onClick={() => onSort('createdAt')}>
                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Calendar className="h-3 w-3 mr-1.5 text-slate-300" /> Tanggal <SortIcon column="createdAt" />
                            </div>
                        </TableHead>
                        <TableHead className="py-5 hidden md:table-cell">
                            <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Status
                            </div>
                        </TableHead>
                        <TableHead className="py-5 text-right">
                             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pr-4">
                                Aksi
                            </div>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-ueu-blue" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Memuat Kategori...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : categories.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-40 text-center">
                                <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                                    <Hash className="h-8 w-8 text-slate-200" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Tidak ada kategori ditemukan</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        categories.map((category) => {
                            // Calculate depth for indentation
                            let depth = 0;
                            let current = category;
                            const maxDepth = 10;
                            while (current.parentId && depth < maxDepth) {
                                const parent = categories.find(c => c.id === current.parentId);
                                if (!parent) break;
                                current = parent;
                                depth++;
                            }
                            
                            const isActive = category.status !== 'inactive';
                            
                            return (
                                <TableRow key={category.id} className="hover:bg-ueu-blue/[0.02] transition-colors border-b border-slate-50 group">
                                    <TableCell className="py-6 font-bold text-slate-700 pl-8">
                                        <div className="flex items-center">
                                            {depth > 0 && Array.from({ length: depth }).map((_, i) => (
                                                <div key={i} className="w-8 flex justify-center">
                                                    <div className="h-6 w-px bg-slate-100" />
                                                </div>
                                            ))}
                                            {depth > 0 && (
                                                <ChevronRight className="h-4 w-4 text-slate-300 mr-2" />
                                            )}
                                            <span className={cn(
                                                "text-sm font-bold tracking-tight",
                                                depth === 0 ? "text-ueu-navy" : "text-slate-600 font-semibold"
                                            )}>
                                                {category.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 text-slate-500 font-mono text-[10px] tracking-tight">
                                            {category.slug}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="text-xs font-medium text-slate-400">
                                            {category.createdAt ? new Date(category.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            isActive 
                                                ? 'bg-emerald-50 text-emerald-600' 
                                                : 'bg-slate-100 text-slate-500'
                                        )}>
                                            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {isActive ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 hover:bg-ueu-blue/5 rounded-xl text-slate-400 hover:text-ueu-blue transition-all"
                                                onClick={() => onEdit(category)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-all"
                                                onClick={() => onDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
};