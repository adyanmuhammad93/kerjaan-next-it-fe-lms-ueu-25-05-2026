import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Loader2, Trash2, Shield, Activity, FileText, Folder, AlertCircle } from 'lucide-react';
import { assetService } from '../../../services/assetService';
import { format } from 'date-fns';
import { Badge } from '../../ui/Badge';
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

export const AdminAssetPermissions: React.FC = () => {
    const [shares, setShares] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'shares' | 'logs'>('shares');
    const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sharesData, logsData] = await Promise.all([
                assetService.getAllSharesForAdmin(),
                assetService.getAllActivityLogsForAdmin()
            ]);
            // Normalisasi data untuk mencegah crash jika API mengembalikan non-array
            setShares(Array.isArray(sharesData) ? sharesData : []);
            setLogs(Array.isArray(logsData) ? logsData : []);
        } catch (error) {
            console.error('Gagal mengambil data perizinan admin', error);
            setShares([]);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRevokeShare = async () => {
        if (!revokeConfirm) return;
        try {
            await assetService.removeShare(revokeConfirm);
            setRevokeConfirm(null);
            fetchData();
        } catch (error) {
            console.error('Gagal mencabut izin sharing', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#0078C1]" />
                <p className="text-sm font-medium text-[#003366] animate-pulse">Memuat Data Akademik...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-[#F8FAFC] p-6 rounded-[32px]">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-[#003366]">
                        Perizinan & Keamanan Aset
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">
                        Kelola berbagi aset global dan audit log aktivitas akademik.
                    </p>
                </div>
                <div className="flex bg-white p-1.5 rounded-[16px] shadow-sm border border-slate-100">
                    <button 
                        onClick={() => setActiveTab('shares')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all ${
                            activeTab === 'shares' 
                            ? 'bg-[#0078C1] text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Shield className="h-4 w-4" /> Izin Berbagi
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all ${
                            activeTab === 'logs' 
                            ? 'bg-[#0078C1] text-white shadow-md' 
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Activity className="h-4 w-4" /> Log Audit
                    </button>
                </div>
            </div>

            {/* Content Section */}
            {activeTab === 'shares' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[28px] overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-white/50">
                        <CardTitle className="text-[#003366] flex items-center gap-2">
                            <Folder className="h-5 w-5 text-[#0078C1]" />
                            Daftar Berbagi Aset Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-[11px] text-[#003366]/60 bg-slate-50/80 uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Aset / Folder</th>
                                        <th className="px-6 py-4">Dibagikan Oleh</th>
                                        <th className="px-6 py-4">Penerima Akses</th>
                                        <th className="px-6 py-4">Izin (Permissions)</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Array.isArray(shares) && shares.length > 0 ? (
                                        shares.map((share) => (
                                            <tr key={share.id} className="hover:bg-[#0078C1]/5 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#003366] group-hover:text-[#0078C1]">
                                                            {share.asset_name || share.folder_name || 'Item Terhapus'}
                                                        </span>
                                                        <span className="text-[10px] mt-1 text-slate-400 font-semibold uppercase">
                                                            {share.asset_id ? 'Mata Kuliah' : 'Kategori Program Studi'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-700">{share.shared_by_name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-[#003366]">{share.shared_with_name}</div>
                                                    <div className="text-[11px] text-slate-400">{share.shared_with_email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {Array.isArray(share.permissions) && share.permissions.map((p: string) => (
                                                            <Badge key={p} className="rounded-full px-3 py-0.5 bg-[#E0F2FE] text-[#0078C1] border-none text-[10px] font-bold">
                                                                {p.toUpperCase()}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="rounded-[12px] text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                        onClick={() => setRevokeConfirm(share.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Cabut Akses
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center opacity-40">
                                                    <AlertCircle className="h-12 w-12 mb-2" />
                                                    <p className="font-bold text-slate-500">Tidak ada data berbagi aktif.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'logs' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[28px] overflow-hidden bg-white">
                    <CardHeader className="border-b border-slate-50 bg-white/50">
                        <CardTitle className="text-[#003366] flex items-center gap-2">
                            <Activity className="h-5 w-5 text-[#0078C1]" />
                            Audit Log Keamanan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-[11px] text-[#003366]/60 bg-slate-50/80 uppercase tracking-widest font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Waktu</th>
                                        <th className="px-6 py-4">Aktor (Dosen/Admin)</th>
                                        <th className="px-6 py-4">Tindakan</th>
                                        <th className="px-6 py-4">Target Item</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Array.isArray(logs) && logs.length > 0 ? (
                                        logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-slate-500 tabular-nums">
                                                    {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm')}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-[#003366]">{log.actor_name}</div>
                                                    <div className="text-[11px] text-slate-400">{log.actor_email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className="bg-[#003366] text-white border-none rounded-md px-2 py-0.5 text-[10px] font-medium">
                                                        {log.action.replace(/_/g, ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                                        {log.asset_id ? <FileText className="h-4 w-4 text-[#0078C1]"/> : <Folder className="h-4 w-4 text-[#0078C1]"/>}
                                                        {log.asset_name || log.folder_name || 'Item Terhapus'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-20 text-center text-slate-400 font-bold">
                                                Belum ada log aktivitas tercatat.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* MD3 Styled Alert Dialog */}
            <AlertDialog open={!!revokeConfirm} onOpenChange={() => setRevokeConfirm(null)}>
                <AlertDialogContent className="rounded-[32px] border-none p-8 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold text-[#003366]">Cabut Akses Aset?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium">
                            Tindakan ini akan segera memutus akses Mahasiswa/Dosen terhadap materi akademik ini. Pastikan ini adalah instruksi yang benar dari Program Studi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6 gap-3">
                        <AlertDialogCancel className="rounded-[12px] border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 text-white rounded-[12px] font-bold shadow-lg shadow-red-200" 
                            onClick={handleRevokeShare}
                        >
                            Ya, Cabut Akses
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};