
import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Download, ExternalLink, CreditCard, History, Calendar, Receipt } from 'lucide-react';
import { paymentService } from '../../../services/paymentService';
import { Transaction } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrency } from '../../../hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/Table";
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const PaymentHistory: React.FC = () => {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                const data = await paymentService.getUserTransactions(user.id);
                setTransactions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [user]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified': 
                return (
                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        Berhasil
                    </Badge>
                );
            case 'rejected': 
                return (
                    <Badge className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-none rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                        Gagal
                    </Badge>
                );
            default: 
                return (
                    <Badge className="bg-sky-50 text-sky-600 hover:bg-sky-100 border-none rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 w-fit">
                        <div className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce"></div>
                        Proses
                    </Badge>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] animate-pulse">Memuat Riwayat Pembayaran...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-ueu-navy tracking-tight">Status Pembayaran</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Kelola dan pantau seluruh riwayat transaksi akademik Anda.</p>
                </div>
                <Badge className="px-5 py-2.5 rounded-full bg-ueu-blue/5 text-ueu-blue font-black text-[10px] uppercase tracking-widest border-none shadow-sm shadow-blue-900/5">
                    {transactions.length} Total Transaksi
                </Badge>
            </div>

            {/* Content Table */}
            <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-8">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-black text-ueu-navy flex items-center gap-3">
                           <History className="h-5 w-5 text-ueu-blue" /> Riwayat Penagihan
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow className="border-b border-slate-100">
                                <TableHead className="px-8 py-5 font-black text-ueu-navy text-[10px] uppercase tracking-widest">Tanggal</TableHead>
                                <TableHead className="font-black text-ueu-navy text-[10px] uppercase tracking-widest">Keterangan / Item</TableHead>
                                <TableHead className="font-black text-ueu-navy text-[10px] uppercase tracking-widest">Status</TableHead>
                                <TableHead className="text-right font-black text-ueu-navy text-[10px] uppercase tracking-widest">Nominal</TableHead>
                                <TableHead className="text-right px-8 font-black text-ueu-navy text-[10px] uppercase tracking-widest">Dokumen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center bg-white">
                                        <div className="flex flex-col items-center justify-center space-y-6">
                                            <div className="bg-slate-50 p-6 rounded-full">
                                                <Receipt className="h-10 w-10 text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold italic text-sm">Belum ada riwayat transaksi ditemukan.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-100 group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-ueu-navy font-black text-sm">
                                                    <Calendar className="h-4 w-4 text-ueu-blue" />
                                                    {format(new Date(tx.createdAt), 'dd MMM yyyy')}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest pl-6">{format(new Date(tx.createdAt), 'HH:mm')} WIB</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-ueu-blue/10 transition-colors">
                                                    <CreditCard className="h-5 w-5 text-slate-400 group-hover:text-ueu-blue transition-colors" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-sm text-ueu-navy truncate transition-colors group-hover:text-ueu-blue">
                                                        {tx.items && tx.items.length > 0 ? tx.items[0].title : 'Order #' + tx.id.slice(0,8).toUpperCase()}
                                                    </div>
                                                    {tx.items && tx.items.length > 1 && (
                                                        <div className="text-[10px] font-black text-ueu-blue uppercase tracking-widest mt-1">
                                                            + {tx.items.length - 1} item lainnya
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(tx.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-black text-sm text-ueu-navy tracking-tight">
                                                {formatPrice(tx.totalAmount)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-10 rounded-2xl text-ueu-blue hover:bg-ueu-blue hover:text-white font-black text-[10px] uppercase tracking-widest px-6 transition-all border-2 border-transparent hover:border-ueu-blue"
                                                type="button"
                                                onClick={() => navigate(`/invoice/${tx.id}`)}
                                            >
                                                <FileText className="h-4 w-4 mr-2" /> Invoice
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

