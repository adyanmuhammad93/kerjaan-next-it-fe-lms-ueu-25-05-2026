
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, Package, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import { cn } from '../../../lib/utils';
import { bundleService } from '../../../services/bundleService';
import { Bundle } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrency } from '../../../hooks/useCurrency';

export const InstructorBundles: React.FC = () => {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [newBundleTitle, setNewBundleTitle] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const fetchBundles = async () => {
            if (!user) return;
            try {
                const data = await bundleService.getInstructorBundles(user.id);
                setBundles(data);
            } catch (e) { 
                console.error(e); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchBundles();
    }, [user]);

    const handleCreate = async () => {
        if (!newBundleTitle.trim() || !user) return;
        setCreating(true);
        try {
            const newBundle = await bundleService.createBundle(newBundleTitle, user.id);
            setIsCreateOpen(false);
            setNewBundleTitle('');
            navigate(`/instructor/bundle/${newBundle.id}/edit`);
        } catch (e: any) { 
            alert("Failed to create bundle: " + e.message);
        } finally {
            setCreating(false); 
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 bg-[#F8FAFC] min-h-screen px-3 sm:px-4 lg:px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-ueu-blue/10 rounded-2xl">
                            <Layers className="h-6 w-6 text-ueu-blue" />
                        </div>
                        <h2 className="text-2xl font-bold text-ueu-navy">Bundel Mata Kuliah</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Grup mata kuliah Anda untuk ditawarkan sebagai paket pembelajaran terintegrasi.</p>
                </div>
                <Button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-12 px-6 shadow-md shadow-ueu-navy/10 transition-all duration-300 flex items-center gap-2 font-bold"
                >
                    <Plus className="h-5 w-5" /> Buat Bundel Baru
                </Button>
            </div>

            {bundles.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Package className="h-10 w-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Belum Ada Bundel</h3>
                    <p className="text-slate-500 mt-2 max-w-sm text-center">Bundel memungkinkan Anda menggabungkan beberapa mata kuliah menjadi satu paket kompetensi.</p>
                    <Button 
                        variant="outline" 
                        className="mt-8 rounded-full border-ueu-blue text-ueu-blue hover:bg-ueu-blue hover:text-white px-8"
                        onClick={() => setIsCreateOpen(true)}
                    >
                        Mulai Buat Bundel Pertama
                    </Button>
                </div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {bundles.map(bundle => (
                        <div 
                            key={bundle.id} 
                            className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_20px_50px_rgba(0,120,193,0.1)] transition-all duration-500 flex flex-col cursor-pointer"
                            onClick={() => navigate(`/instructor/bundle/${bundle.id}/edit`)}
                        >
                            <div className="h-36 bg-gradient-to-br from-ueu-navy to-ueu-blue relative overflow-hidden">
                                {bundle.thumbnailUrl ? (
                                    <img src={bundle.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt={bundle.title} />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/5">
                                        <Package className="h-20 w-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <Badge className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                        bundle.isPublished 
                                            ? "bg-emerald-500 text-white" 
                                            : "bg-amber-500 text-white"
                                    )}>
                                        {bundle.isPublished ? 'Live' : 'Draft'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-black text-ueu-blue uppercase tracking-[2px]">
                                        Program Paket
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-lg text-ueu-navy mb-2 line-clamp-2 leading-tight group-hover:text-ueu-blue transition-colors">{bundle.title}</h3>
                                
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-6">
                                    <Layers className="h-3 w-3 text-ueu-blue" />
                                    <span>{bundle.courseCount} Mata Kuliah Terkait</span>
                                </div>
                                
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Investasi</span>
                                        <p className="text-xl font-black text-ueu-navy">{formatPrice(bundle.price)}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-ueu-navy group-hover:bg-ueu-navy group-hover:text-white transition-all shadow-sm">
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl p-8">
                    <DialogHeader className="space-y-3">
                        <div className="h-14 w-14 bg-ueu-blue/10 rounded-2xl flex items-center justify-center text-ueu-blue mb-2">
                            <Layers className="h-7 w-7" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-ueu-navy">Buat Bundel Baru</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">Berikan judul yang menarik untuk paket mata kuliah Anda agar mahasiswa tertarik untuk mendaftar.</DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-ueu-navy uppercase tracking-[1px] ml-1">Judul Bundel</label>
                            <Input 
                                placeholder="Cth: Jalur Cepat Web Development 2024" 
                                className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-ueu-blue focus:ring-ueu-blue text-lg font-bold shadow-inner"
                                value={newBundleTitle} 
                                onChange={(e) => setNewBundleTitle(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:gap-0 mt-4">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl font-bold h-12 px-6" 
                            onClick={() => setIsCreateOpen(false)}
                        >
                            Batalkan
                        </Button>
                        <Button 
                            className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-12 px-8 font-bold transition-all shadow-md shadow-ueu-navy/20"
                            onClick={handleCreate} 
                            isLoading={creating}
                        >
                            Buat & Lanjutkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
