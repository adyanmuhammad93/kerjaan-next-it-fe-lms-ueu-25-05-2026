import React, { useState, useEffect } from 'react';
import { Search, Loader2, CheckCircle, XCircle, FileText, ExternalLink, ReceiptText, User } from 'lucide-react';
import { paymentService } from '../../../services/paymentService';
import { courseService } from '../../../services/courseService';
import { bundleService } from '../../../services/bundleService';
import { notificationService } from '../../../services/notificationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useCurrency } from '../../../hooks/useCurrency';
import { Transaction } from '../../../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";

import { LoadingState } from '../../layout/PageWrapper';

export const AdminTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();
    const [searchQuery, setSearchQuery] = useState('');
    
    // Verification Modal
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const data = await paymentService.getPendingTransactions();
            // Normalisasi data array untuk mencegah crash
            setTransactions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Gagal mengambil data transaksi:', e);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleVerify = async (status: 'verified' | 'rejected') => {
        if (!selectedTx) return;
        setIsVerifying(true);
        try {
            if (status === 'verified') {
                const courseIds = new Set<string>();
                const bundleItems = selectedTx.items?.filter(item => item.itemType === 'bundle') || [];

                selectedTx.items
                    ?.filter(item => item.itemType === 'course' && item.itemId)
                    .forEach(item => courseIds.add(item.itemId));

                for (const item of bundleItems) {
                    const bundle = await bundleService.getBundleById(item.itemId);
                    bundle?.courses?.forEach(course => courseIds.add(course.id));
                }

                await Promise.all(
                    Array.from(courseIds).map(courseId => courseService.adminEnrollUser(selectedTx.userId, courseId, 'active'))
                );
            }

            await paymentService.verifyTransaction(selectedTx.id, status, selectedTx);
            
            if (status === 'verified') {
                const courseItems = selectedTx.items?.filter(item => item.itemType === 'course') || [];
                await Promise.all(
                    courseItems.map(item => courseService.adminEnrollUser(selectedTx.userId, item.itemId, 'active'))
                );
                await notificationService.createNotification(
                    selectedTx.userId,
                    "Pembayaran Diverifikasi!",
                    `Pembayaran Anda sebesar ${formatPrice(selectedTx.totalAmount)} telah berhasil diverifikasi. Anda kini telah terdaftar dalam mata kuliah terkait.`,
                    "success"
                );
            } else {
                await notificationService.createNotification(
                    selectedTx.userId,
                    "Pembayaran Ditolak",
                    `Pembayaran Anda sebesar ${formatPrice(selectedTx.totalAmount)} tidak dapat diverifikasi. Silakan periksa kembali detail transaksi atau hubungi bagian administrasi.`,
                    "error"
                );
            }

            setSelectedTx(null);
            fetchTransactions();
        } catch (e) {
            console.error("Gagal memproses verifikasi:", e);
        } finally {
            setIsVerifying(false);
        }
    };

    const filteredTransactions = Array.isArray(transactions) 
        ? transactions.filter(t => 
            (t.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
            (t.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
          )
        : [];

    return (
        <div className="space-y-6 bg-[#F8FAFC]/50 p-4 md:p-8 rounded-[32px]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-ueu-navy">
                        Verifikasi Transaksi
                    </h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[2px]">Tinjau dan validasi bukti pembayaran manual mahasiswa.</p>
                </div>
                
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-ueu-blue transition-all" />
                    <Input 
                        placeholder="Cari Nama Mahasiswa..." 
                        className="pl-12 pr-4 py-6 bg-white border-none shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-ueu-blue transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Container */}
            <Card className="border border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Mahasiswa</TableHead>
                                    <TableHead>Mata Kuliah</TableHead>
                                    <TableHead className="text-right">Nominal</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64">
                                            <LoadingState message="Menyelaraskan Data Transaksi..." minHeight="h-64" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center opacity-40 py-12">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <ReceiptText className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <p className="font-bold text-slate-500">Tidak ada transaksi tertunda</p>
                                                <p className="text-xs">Seluruh kewajiban finansial mahasiswa telah diselesaikan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="group hover:bg-slate-50/70 transition-all border-b border-slate-50 last:border-0 cursor-default">
                                            <td className="px-6 py-5 text-slate-500 tabular-nums font-bold text-xs uppercase">
                                                {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-ueu-navy flex items-center justify-center text-white font-bold text-xs uppercase ring-4 ring-white shadow-sm group-hover:rotate-6 transition-transform">
                                                        {tx.userName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-ueu-navy group-hover:text-ueu-blue transition-colors text-sm">{tx.userName}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{tx.userEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="bg-blue-50 text-ueu-blue rounded-full font-black px-3 py-1 text-[10px] border-none uppercase tracking-tight">
                                                        {tx.items && tx.items.length > 0 ? tx.items[0].title : 'Progres Akademik'}
                                                    </Badge>
                                                    {tx.items && tx.items.length > 1 && (
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">+{tx.items.length - 1} LAINNYA</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="font-black text-ueu-navy text-sm tabular-nums">{formatPrice(tx.totalAmount)}</span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => setSelectedTx(tx)}
                                                    className="bg-ueu-blue hover:bg-ueu-navy text-white font-bold rounded-xl shadow-lg shadow-blue-100 px-6 h-9 group-hover:scale-105 transition-transform"
                                                >
                                                    Verifikasi
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* MD3 Verification Modal */}
            <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none shadow-2xl">
                    <DialogHeader className="p-8 pb-6 bg-white sticky top-0 z-10 border-b border-slate-100/50">
                        <DialogTitle className="text-2xl font-black text-ueu-navy">Detail Pembayaran</DialogTitle>
                        <DialogDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-[2px]">Tinjau bukti transfer mahasiswa untuk validasi enrollment.</DialogDescription>
                    </DialogHeader>
                    
                    {selectedTx && (
                        <div className="p-8 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm text-ueu-blue">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mahasiswa</p>
                                        <p className="font-black text-ueu-navy text-base leading-tight">{selectedTx.userName}</p>
                                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">{selectedTx.userEmail}</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-ueu-blue/5 rounded-3xl border border-ueu-blue/10 flex items-start gap-4">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm text-ueu-blue">
                                        <span className="font-black text-lg leading-none">Rp</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-ueu-blue uppercase tracking-widest mb-1">Total Bayar</p>
                                        <p className="text-3xl font-black text-ueu-navy tabular-nums leading-none tracking-tighter">{formatPrice(selectedTx.totalAmount)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-ueu-blue" /> Daftar Mata Kuliah / Layanan
                                </h4>
                                <div className="space-y-3">
                                    {Array.isArray(selectedTx.items) && selectedTx.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-slate-100 hover:border-ueu-blue/30 transition-all shadow-sm group">
                                            <span className="font-bold text-ueu-navy group-hover:text-ueu-blue transition-colors">{item.title}</span>
                                            <span className="font-black text-ueu-blue tabular-nums">{formatPrice(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Proof Image */}
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ReceiptText className="h-4 w-4 text-accent" /> Bukti Transfer (Receipt)
                                </h4>
                                <div className="rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center min-h-[400px] shadow-inner relative group">
                                    {selectedTx.proofUrl ? (
                                        selectedTx.proofUrl.endsWith('.pdf') ? (
                                            <div className="text-center p-12">
                                                <div className="bg-white p-8 rounded-3xl shadow-md mb-6 inline-block">
                                                    <FileText className="h-16 w-16 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-black text-ueu-navy mb-6 text-center uppercase tracking-widest">Dokumen PDF Terlampir</p>
                                                <Button 
                                                    variant="outline" 
                                                    className="rounded-xl border-slate-200 font-bold text-ueu-blue h-12 px-8 hover:bg-ueu-blue hover:text-white transition-all"
                                                    onClick={() => window.open(selectedTx.proofUrl, '_blank')}
                                                >
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Buka di Tab Baru
                                                </Button>
                                            </div>
                                        ) : (
                                            <img 
                                                src={selectedTx.proofUrl} 
                                                alt="Struk Pembayaran" 
                                                className="max-w-full max-h-[700px] object-contain group-hover:scale-[1.02] transition-transform duration-700 cursor-zoom-in" 
                                            />
                                        )
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <ReceiptText className="h-12 w-12 mb-3 opacity-20" />
                                            <p className="font-black uppercase text-xs tracking-widest italic">Belum Ada Bukti Bayar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="p-8 pb-10 pt-6 bg-slate-50/80 flex-col sm:flex-row gap-4 border-t border-slate-100 sticky bottom-0">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl font-bold text-slate-500 hover:bg-slate-200 h-12 px-6 transition-all"
                            onClick={() => setSelectedTx(null)}
                        >
                            Batal
                        </Button>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <Button 
                                variant="outline"
                                className="flex-1 sm:flex-none rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-black text-xs uppercase tracking-widest px-8 h-12 transition-all" 
                                onClick={() => handleVerify('rejected')} 
                                disabled={isVerifying}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Tolak
                            </Button>
                            <Button 
                                className="flex-1 sm:flex-none rounded-xl bg-ueu-blue hover:bg-ueu-navy text-white font-black text-xs uppercase tracking-widest px-10 h-12 shadow-xl shadow-blue-200 transition-all" 
                                onClick={() => handleVerify('verified')}
                                disabled={isVerifying}
                            >
                                {isVerifying ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <><CheckCircle className="mr-2 h-4 w-4" /> Setujui & Daftarkan</>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};