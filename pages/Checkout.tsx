
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Trash2, Lock, CheckCircle, Package, CreditCard, Upload, Copy, AlertCircle, FileText, X } from 'lucide-react';
import { courseService } from '../services/courseService';
import { bundleService } from '../services/bundleService';
import { paymentService } from '../services/paymentService';
import { useCurrency } from '../hooks/useCurrency';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import { cn } from '../lib/utils';
import { isIntegerAmount, normalizeIndonesianPhone } from '../lib/paymentUtils';
import { validateAmountDecimals } from '../lib/money';

interface CheckoutItem {
    id: string;
    type: 'course' | 'bundle';
    title: string;
    instructor?: string;
    thumbnailUrl?: string;
    price: number;
}

export const Checkout: React.FC = () => {
  const { cart, removeFromCart, user, clearCart } = useStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'manual' | 'bni_ecollection'>('bni_ecollection');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice, convertPrice, currency } = useCurrency();

  // File Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
        const fetchedItems: CheckoutItem[] = [];
        for (const item of cart) {
            try {
                if (item.type === 'course') {
                    const course = await courseService.getCourseById(item.id, true);
                    if (course) {
                        fetchedItems.push({
                            id: course.id,
                            type: 'course',
                            title: course.title,
                            instructor: course.instructor,
                            thumbnailUrl: course.thumbnailUrl,
                            price: course.price
                        });
                    }
                } else if (item.type === 'bundle') {
                    const bundle = await bundleService.getBundleById(item.id);
                    if (bundle) {
                         fetchedItems.push({
                            id: bundle.id,
                            type: 'bundle',
                            title: bundle.title,
                            instructor: 'Bundle',
                            thumbnailUrl: bundle.thumbnailUrl,
                            price: bundle.price
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch checkout item", e);
            }
        }
        setItems(fetchedItems);
        setLoading(false);
    };

    if (cart.length > 0) {
        fetchItems();
    } else {
        setItems([]);
        setLoading(false);
    }
  }, [cart]);

  const total = items.reduce((acc, item) => acc + item.price, 0);
  const totalInCurrency = convertPrice(total);

  useEffect(() => {
    if (currency.code !== 'IDR' && paymentMethod === 'bni_ecollection') setPaymentMethod('manual');
  }, [currency.code, paymentMethod]);

  const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
      } else if (e.type === "dragleave") {
          setDragActive(false);
      }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setReceiptFile(e.dataTransfer.files[0]);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
          setReceiptFile(e.target.files[0]);
      }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      // Optional: Add toast notification here
  };

  const handleConfirmPayment = async () => {
    if (!user) {
        navigate('/login');
        return;
    }

    setIsProcessing(true);

    try {
        if (paymentMethod === 'bni_ecollection') {
            if (currency.code !== 'IDR') {
                alert("BNI Virtual Account hanya tersedia untuk pembayaran dalam IDR.");
                return;
            }
            if (!isIntegerAmount(totalInCurrency)) {
                alert("Total pembayaran harus bilangan bulat (tanpa desimal) untuk Virtual Account.");
                return;
            }
            const tx = await paymentService.initiateBniEcollectionPayment(
                items.map(i => ({ id: i.id, type: i.type, title: i.title, price: i.price })),
                totalInCurrency,
                normalizeIndonesianPhone(customerPhone) || undefined,
                currency.code,
            );
            clearCart();
            navigate(`/payment/bni/${tx.id}`);
            return;
        }

        if (!receiptFile) {
            alert("Please upload your payment receipt to continue.");
            return;
        }

        if (!validateAmountDecimals(totalInCurrency, currency.code)) {
            alert(`Invalid amount for currency ${currency.code}.`);
            return;
        }

        await paymentService.createTransaction(
            user.id,
            items.map(i => ({ id: i.id, type: i.type, title: i.title, price: i.price })),
            totalInCurrency,
            receiptFile,
            currency.code,
        );
        
        clearCart();
        setSuccess(true);
        // Redirect after short delay
        setTimeout(() => {
            navigate('/dashboard');
        }, 3000);

    } catch (error: any) {
        console.error("Checkout failed", error);
        alert(`Checkout failed: ${error.message || "Please try again."}`);
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (success) {
      return (
          <PageWrapper className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
              <Card className="w-full max-w-md text-center border-green-200 bg-green-50 shadow-xl rounded-[32px]">
                  <CardHeader className="pt-10">
                      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white">
                          <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <CardTitle className="text-2xl text-slate-900 font-black uppercase tracking-tight">Pesanan Berhasil!</CardTitle>
                      <CardDescription className="text-slate-600 font-medium">
                          Bukti pembayaran Anda telah masuk ke sistem untuk diverifikasi.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-10">
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                          Anda akan terdaftar otomatis segera setelah admin memverifikasi pembayaran (biasanya kurang dari 24 jam).
                          <br />Kembali ke dashboard dalam beberapa detik...
                      </p>
                  </CardContent>
              </Card>
          </PageWrapper>
      );
  }

  return (
    <PageWrapper className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 text-slate-900">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Payment & Instructions */}
            <div className="lg:col-span-8 space-y-6">

                <Card className="border-slate-100 shadow-xl shadow-blue-900/5 rounded-[32px] overflow-hidden border-none">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-ueu-navy">Metode Pembayaran</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Pilih metode pembayaran yang Anda inginkan.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentMethod('bni_ecollection')}
                                className={cn(
                                    "p-5 rounded-3xl border-2 text-left transition-all",
                                    currency.code !== 'IDR'
                                        ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                                        : paymentMethod === 'bni_ecollection'
                                            ? "border-ueu-blue bg-ueu-blue/5"
                                            : "border-slate-100 bg-white hover:border-ueu-blue/30"
                                )}
                                disabled={currency.code !== 'IDR'}
                            >
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Virtual Account</div>
                                <div className="font-black text-ueu-navy uppercase tracking-tight mt-1">BNI eCollection</div>
                                <div className="text-sm text-slate-600 font-medium mt-1">Konfirmasi otomatis lewat notifikasi bank.</div>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('manual')}
                                className={cn(
                                    "p-5 rounded-3xl border-2 text-left transition-all",
                                    paymentMethod === 'manual' ? "border-ueu-blue bg-ueu-blue/5" : "border-slate-100 bg-white hover:border-ueu-blue/30"
                                )}
                            >
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transfer Manual</div>
                                <div className="font-black text-ueu-navy uppercase tracking-tight mt-1">Upload Bukti</div>
                                <div className="text-sm text-slate-600 font-medium mt-1">Diverifikasi admin (≤ 24 jam).</div>
                            </button>
                        </div>

                        {paymentMethod === 'bni_ecollection' && (
                            <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor HP (Opsional)</div>
                                <input
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white font-medium outline-none focus:border-ueu-blue"
                                />
                                <div className="text-xs text-slate-500 font-medium mt-2">Nomor akan dinormalisasi ke format 62xxxxxxxxxx.</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* 1. Bank Information */}
                {paymentMethod === 'manual' && (
                <Card className="border-slate-100 shadow-xl shadow-blue-900/5 rounded-[32px] overflow-hidden border-none">
                    <CardHeader className="bg-ueu-navy text-white p-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <CreditCard className="h-6 w-6 text-ueu-blue" />
                            </div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Transfer Bank</CardTitle>
                        </div>
                        <CardDescription className="text-white/60 font-medium mt-2">
                            Silakan transfer jumlah total yang tertera ke salah satu rekening resmi di bawah ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Bank Account 1 */}
                            <div className="border rounded-xl p-4 bg-slate-50 relative group hover:border-indigo-200 transition-colors">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bank Central Asia (BCA)</div>
                                <div className="text-xl font-mono font-bold text-slate-900 mb-1">8210 992 881</div>
                                <div className="text-sm text-slate-600">Universitas Esa Unggul</div>
                                <button 
                                    onClick={() => copyToClipboard("8210992881")}
                                    className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 rounded-2xl transition-all shadow-sm border border-slate-100"
                                    title="Salin Nomor Rekening"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                            
                            {/* Bank Account 2 */}
                            <div className="border border-slate-100 rounded-3xl p-6 bg-slate-50/50 relative group hover:border-ueu-blue/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-blue-900/5">
                                <div className="text-[10px] font-black text-ueu-navy/40 uppercase tracking-[3px] mb-3">Bank Mandiri</div>
                                <div className="text-2xl font-mono font-black text-ueu-navy mb-1">122 000 981 221</div>
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-tight">NextSkill PT</div>
                                <button 
                                    onClick={() => copyToClipboard("122000981221")}
                                    className="absolute top-6 right-6 p-2.5 text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/5 rounded-2xl transition-all shadow-sm border border-slate-100"
                                    title="Salin Nomor Rekening"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex items-start gap-4 p-5 bg-amber-50/50 border border-amber-100 text-amber-900 rounded-3xl text-sm font-medium">
                            <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-amber-600" />
                            <p className="leading-relaxed">Pastikan untuk menyertakan referensi pesanan atau nama lengkap Anda pada kolom deskripsi transfer agar proses verifikasi lebih cepat.</p>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* 2. Upload Receipt */}
                {paymentMethod === 'manual' && (
                <Card className={cn("border-2 border-dashed transition-all rounded-[32px] overflow-hidden", dragActive ? "border-ueu-blue bg-ueu-blue/5" : "border-slate-200")}>
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-ueu-navy">
                            <div className="p-2 bg-slate-100 rounded-xl">
                                <Upload className="h-5 w-5 text-slate-500" />
                            </div>
                            Unggah Bukti Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <label 
                        htmlFor="receipt-upload"
                        className="block flex flex-col items-center justify-center p-8 pt-6 text-center cursor-pointer focus-within:ring-2 focus-within:ring-ueu-blue focus-within:ring-offset-2 outline-none"
                        onDragEnter={handleDrag} 
                        onDragLeave={handleDrag} 
                        onDragOver={handleDrag} 
                        onDrop={handleDrop}
                    >
                        <input 
                            id="receipt-upload" 
                            type="file" 
                            className="sr-only" 
                            accept="image/*,application/pdf"
                            onChange={handleChange}
                            aria-label="Upload Bukti Pembayaran"
                        />
                        
                        <div className={cn(
                            "w-full h-64 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center transition-all bg-slate-50/50",
                            dragActive && "border-ueu-blue bg-white"
                        )}>
                            {receiptFile ? (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in p-6">
                                    <div className="bg-emerald-100 p-5 rounded-3xl mb-4 border-4 border-white shadow-sm">
                                        <FileText className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <p className="font-black text-ueu-navy uppercase tracking-tight text-lg mb-1">{receiptFile.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={(e) => { e.stopPropagation(); setReceiptFile(null); }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-2 border-red-100 rounded-2xl px-6 h-12 font-black uppercase text-[10px] tracking-widest"
                                    >
                                        Hapus File
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-8">
                                    <div className="bg-white p-5 rounded-3xl mb-6 shadow-xl shadow-slate-200/50 inline-block">
                                        <Upload className="h-8 w-8 text-ueu-blue" />
                                    </div>
                                    <p className="text-xl font-black text-ueu-navy uppercase tracking-tight mb-2">Tarik Bukti Transfer Ke Sini</p>
                                    <p className="text-slate-500 font-medium mb-6">atau klik untuk memilih file dari perangkat Anda</p>
                                    <div className="text-[10px] font-black text-ueu-blue uppercase tracking-widest bg-ueu-blue/10 px-6 py-2 rounded-full inline-block">
                                        Format: JPG, PNG, PDF
                                    </div>
                                </div>
                            )}
                        </div>
                    </label>
                </Card>
                )}

            </div>

            {/* Right Column: Summary */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="sticky top-24 shadow-2xl shadow-blue-900/5 rounded-[40px] overflow-hidden border-none bg-white">
                    <CardHeader className="bg-slate-50/80 backdrop-blur-md p-8 border-b border-slate-100">
                        <CardTitle className="text-xl font-black uppercase tracking-tight text-ueu-navy">Ringkasan Pesanan</CardTitle>
                        <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{items.length} Program dalam keranjang</CardDescription>
                    </CardHeader>
                    
                    <div className="max-h-[300px] overflow-y-auto px-8 py-4 space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center py-12 gap-4">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Memuat Item...</p>
                            </div>
                        ) : items.length > 0 ? (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4 group">
                                    <div className="h-16 w-24 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                        <img src={item.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-bold text-ueu-navy text-sm line-clamp-1 leading-tight uppercase tracking-tight">{item.title}</h4>
                                        <div className="flex justify-between items-center mt-1.5">
                                            {item.type === 'bundle' ? (
                                                <Badge className="bg-ueu-blue text-white text-[9px] font-black px-2 py-0.5 h-auto rounded-full uppercase tracking-widest border-none">Bundle</Badge>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kursus</span>
                                            )}
                                            <span className="font-black text-sm text-ueu-navy ml-auto">{formatPrice(item.price)}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-slate-300 hover:text-red-600 self-center p-2 hover:bg-red-50 rounded-xl transition-all"
                                        aria-label="Hapus dari keranjang"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Package className="h-6 w-6 text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Keranjang Kosong</p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-100 p-8 bg-slate-50/50 space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Subtotal</span>
                                <span className="text-ueu-navy">{formatPrice(total)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Biaya Layanan</span>
                                <span className="text-emerald-600">Gratis</span>
                            </div>
                        </div>
                        <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
                            <span className="font-black text-ueu-navy uppercase tracking-tight text-lg">Total Pembayaran</span>
                            <span className="font-black text-3xl text-ueu-blue tabular-nums">{formatPrice(total)}</span>
                        </div>
                        
                        <Button 
                            className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] bg-ueu-navy hover:bg-ueu-blue text-white shadow-xl shadow-blue-900/20 rounded-2xl transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none" 
                            onClick={handleConfirmPayment} 
                            disabled={items.length === 0 || isProcessing || (paymentMethod === 'manual' && !receiptFile)}
                            isLoading={isProcessing}
                        >
                            Konfirmasi Pembayaran
                        </Button>
                        
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Lock className="h-3.5 w-3.5 text-ueu-blue/40" /> Transaksi Terenkripsi SSL
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};
