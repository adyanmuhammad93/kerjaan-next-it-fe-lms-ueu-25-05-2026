import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode.react';
import { paymentService } from '../services/paymentService';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCurrency } from '../hooks/useCurrency';
import type { Transaction } from '../types';

export const BniPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  const isVerified = tx?.status === 'verified';
  const isRejected = tx?.status === 'rejected';

  const expiresAt = useMemo(() => (tx?.gatewayExpiresAt ? new Date(tx.gatewayExpiresAt) : null), [tx?.gatewayExpiresAt]);
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    let mounted = true;

    const fetchTx = async () => {
      if (!id) return;
      try {
        const data = await paymentService.getTransactionById(id);
        if (mounted) setTx(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTx();

    const interval = window.setInterval(() => {
      if (!id) return;
      if (isVerified || isRejected) return;
      fetchTx();
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [id, isVerified, isRejected]);

  useEffect(() => {
    if (!isVerified) return;
    const t = window.setTimeout(() => navigate('/dashboard'), 2500);
    return () => window.clearTimeout(t);
  }, [isVerified, navigate]);

  const handleReconcile = async () => {
    if (!id) return;
    setReconciling(true);
    try {
      const updated = await paymentService.reconcileBniEcollectionPayment(id);
      setTx(updated);
    } finally {
      setReconciling(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!tx) return <div className="p-8 text-center">Transaction not found</div>;

  return (
    <PageWrapper className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-[32px] overflow-hidden border-none shadow-2xl shadow-blue-900/5">
          <CardHeader className="p-8 bg-ueu-navy text-white">
            <CardTitle className="text-2xl font-black uppercase tracking-tight">BNI Virtual Account</CardTitle>
            <CardDescription className="text-white/60 font-medium mt-1">
              Selesaikan pembayaran sebelum batas waktu berakhir.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {isVerified ? (
              <div className="flex items-start gap-4 p-5 bg-green-50 border border-green-100 rounded-3xl">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <div className="font-black text-ueu-navy uppercase tracking-tight">Pembayaran Berhasil</div>
                  <div className="text-sm text-slate-600 font-medium">Akses kursus akan aktif otomatis. Mengarahkan ke dashboard…</div>
                </div>
              </div>
            ) : isRejected ? (
              <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-3xl">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                <div>
                  <div className="font-black text-ueu-navy uppercase tracking-tight">Transaksi Ditolak</div>
                  <div className="text-sm text-slate-600 font-medium">Silakan buat transaksi baru atau hubungi admin.</div>
                </div>
              </div>
            ) : isExpired ? (
              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-3xl">
                <Clock className="h-6 w-6 text-amber-700 mt-0.5" />
                <div>
                  <div className="font-black text-ueu-navy uppercase tracking-tight">Waktu Pembayaran Habis</div>
                  <div className="text-sm text-slate-600 font-medium">Jika Anda sudah membayar, gunakan tombol Cek Status.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl">
                <Clock className="h-6 w-6 text-slate-600 mt-0.5" />
                <div>
                  <div className="font-black text-ueu-navy uppercase tracking-tight">Menunggu Pembayaran</div>
                  <div className="text-sm text-slate-600 font-medium">Status akan diperbarui otomatis setelah pembayaran diterima.</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-100 bg-white p-6">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Virtual Account</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xl font-black text-ueu-navy">{tx.virtualAccount || '-'}</div>
                  {!!tx.virtualAccount && (
                    <button
                      onClick={() => copyToClipboard(tx.virtualAccount!)}
                      className="p-2.5 text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 rounded-2xl transition-all border border-slate-100"
                      title="Salin VA"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-6">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pembayaran</div>
                <div className="font-black text-2xl text-ueu-blue">{formatAmount(tx.totalAmountCurrency ?? tx.totalAmount, tx.currencyCode === 'USD' ? 'USD' : 'IDR')}</div>
                <div className="text-xs text-slate-500 font-bold mt-1">{tx.currencyCode === 'USD' ? 'USD' : 'IDR'}</div>
              </div>
            </div>

            {!!tx.virtualAccount && (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 flex items-center justify-between gap-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">QR (opsional)</div>
                  <div className="text-sm text-slate-600 font-medium">Gunakan QR ini untuk menyalin nomor VA dengan cepat.</div>
                </div>
                <div className="shrink-0 bg-white p-3 rounded-2xl border border-slate-100">
                  <QRCode value={tx.virtualAccount} size={96} />
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 space-y-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batas Waktu</div>
              <div className="font-bold text-ueu-navy">
                {expiresAt ? expiresAt.toLocaleString() : '-'}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 h-14 text-xs font-black uppercase tracking-[0.2em] bg-ueu-navy hover:bg-ueu-blue text-white rounded-2xl"
                onClick={handleReconcile}
                isLoading={reconciling}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Cek Status
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-2"
                onClick={() => navigate('/checkout')}
              >
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};
