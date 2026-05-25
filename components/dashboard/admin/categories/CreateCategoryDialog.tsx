import React, { useState } from 'react';
import { Tags, Plus, X } from 'lucide-react';
import { categoryService } from '../../../../services/categoryService';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/Dialog";
import { Category } from '../../../../types';
import { cn } from '../../../../lib/utils';

interface CreateCategoryDialogProps {
    open: boolean;
    categories: Category[];
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const CreateCategoryDialog: React.FC<CreateCategoryDialogProps> = ({ open, categories, onOpenChange, onSuccess }) => {
    const [name, setName] = useState('');
    const [parentId, setParentId] = useState<string>('');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        setIsCreating(true);
        try {
            await categoryService.createCategory(name, parentId || null, status);
            setName('');
            setParentId('');
            setStatus('active');
            onOpenChange(false);
            onSuccess();
        } catch (e: any) {
            alert(e.message || "Failed to create category");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="px-8 pt-8 pb-6 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-ueu-blue/10 rounded-lg">
                            <Tags className="h-5 w-5 text-ueu-blue" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-ueu-navy">Tambah Kategori</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 font-medium">Buat kategori baru untuk mengorganisir kurikulum mata kuliah.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Kategori</label>
                        <div className="relative group">
                            <Tags className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-colors" />
                            <Input 
                                className="pl-11 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-ueu-blue/20 rounded-xl transition-all font-bold text-ueu-navy"
                                placeholder="Contoh: Rekayasa Perangkat Lunak"
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                autoFocus
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Kategori Induk (Opsional)</label>
                        <select 
                            className="flex h-12 w-full rounded-xl border-transparent bg-slate-50 px-4 py-2 text-sm font-bold text-ueu-navy focus:bg-white focus:border-ueu-blue/20 focus:outline-none transition-all appearance-none cursor-pointer"
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                        >
                            <option value="">Tidak ada (Kategori Utama)</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status Publikasi</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setStatus('active')}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                    status === 'active' 
                                        ? "bg-ueu-blue/5 border-ueu-blue text-ueu-blue shadow-sm" 
                                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                <Plus className="h-3 w-3" /> Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('inactive')}
                                className={cn(
                                    "flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all",
                                    status === 'inactive' 
                                        ? "bg-slate-100 border-slate-400 text-slate-600 shadow-sm" 
                                        : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                <X className="h-3 w-3" /> Non-Aktif
                            </button>
                        </div>
                    </div>
                    <DialogFooter className="pt-4 gap-3">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl font-bold text-slate-500 hover:bg-slate-100 px-6 h-12"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="submit" 
                            isLoading={isCreating}
                            className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl font-bold px-10 h-12 shadow-lg shadow-blue-900/10 transition-all"
                        >
                            Tambah Kategori
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};