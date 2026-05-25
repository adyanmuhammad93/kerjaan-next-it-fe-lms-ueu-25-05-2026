
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, ShoppingCart, Loader2, ArrowLeft } from 'lucide-react';
import { bundleService } from '../services/bundleService';
import { useStore } from '../store/useStore';
import { Bundle } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CourseCard } from '../components/CourseCard';
import { useCurrency } from '../hooks/useCurrency';

import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';

export const BundleDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { cart, addToCart } = useStore();
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        if (!id) return;
        bundleService.getBundleById(id).then(setBundle).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingScreen />;
    if (!bundle) return (
        <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50/50">
            <div className="w-20 h-20 bg-white rounded-[28px] shadow-xl flex items-center justify-center">
                <Package className="h-10 w-10 text-slate-200" />
            </div>
            <h2 className="text-2xl font-black text-ueu-navy uppercase">Bundle Tidak Ditemukan</h2>
            <Button onClick={() => navigate('/browse')} variant="outline" className="rounded-2xl border-slate-200 px-8 h-14 font-black uppercase tracking-widest text-xs">Jelajahi Program</Button>
        </div>
    );

    const isInCart = cart.some(item => item.id === bundle.id);
    const totalValue = bundle.courses.reduce((acc, c) => acc + c.price, 0);
    const savings = totalValue - bundle.price;
    const savingsPercent = Math.round((savings / totalValue) * 100);

    return (
        <PageWrapper>
        <div className="min-h-screen bg-slate-50/50 pb-32">
            {/* Header */}
            <div className="bg-ueu-navy text-white pt-24 pb-48 rounded-b-[64px] shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-ueu-blue/20 to-transparent"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-ueu-blue/20 rounded-full blur-[100px]"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/browse')} 
                        className="text-white/60 hover:text-white mb-10 pl-0 font-black uppercase tracking-[3px] text-[10px] gap-2 transition-all"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Katalog
                    </Button>
                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        <div className="flex-1 space-y-6">
                            <Badge className="bg-ueu-blue text-white border-none font-black px-5 py-2 rounded-full uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-blue-900/20">
                                <Package className="mr-2 h-3.5 w-3.5" /> Paket Pendidikan Unggulan
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] uppercase">{bundle.title}</h1>
                            <p className="text-xl text-blue-100/60 max-w-2xl leading-relaxed font-medium">{bundle.description}</p>
                        </div>
                        
                        <Card className="w-full lg:w-[420px] border-none rounded-[56px] shadow-2xl shadow-blue-900/20 bg-white overflow-hidden -mb-40 lg:mb-0 relative z-10 border-b-[12px] border-accent">
                            <CardContent className="p-12 space-y-10">
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-4">
                                        <div className="text-5xl font-black text-ueu-navy uppercase tracking-tight">{formatPrice(bundle.price)}</div>
                                        <div className="text-sm font-black text-accent bg-accent/10 px-4 py-1.5 rounded-full uppercase tracking-widest leading-none">Hemat {savingsPercent}%</div>
                                    </div>
                                    <div className="text-base text-slate-300 font-bold line-through px-1 uppercase tracking-[2px]">{formatPrice(totalValue)}</div>
                                </div>

                                <Button 
                                    className="w-full h-20 rounded-[28px] text-xs font-black uppercase tracking-[3px] shadow-2xl shadow-blue-900/20 bg-ueu-blue text-white hover:bg-ueu-navy transition-all active:scale-95" 
                                    onClick={() => !isInCart ? addToCart(bundle.id, 'bundle') : navigate('/checkout')}
                                >
                                    {isInCart ? 'Lanjutkan Pembayaran' : 'Ambil Paket Sekarang'}
                                </Button>

                                <div className="space-y-5 pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-200 px-1">Manfaat Ekosistem</p>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:rotate-12 transition-all">
                                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">Akses Seumur Hidup</span>
                                    </div>
                                    <div className="flex items-center gap-4 group">
                                        <div className="h-10 w-10 rounded-2xl bg-ueu-blue/5 flex items-center justify-center shrink-0 border border-blue-50 group-hover:-rotate-12 transition-all">
                                            <Package className="h-5 w-5 text-ueu-blue" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">{bundle.courseCount} Program Studi Terintegrasi</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 pt-64 lg:pt-24 pb-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-ueu-blue/10 rounded-[20px] flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-ueu-blue" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-ueu-navy uppercase tracking-tight">Kurikulum Terapan</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daftar program yang termasuk dalam paket ini.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
                    {bundle.courses.map(course => (
                         <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </div>
        </PageWrapper>
    );
};
