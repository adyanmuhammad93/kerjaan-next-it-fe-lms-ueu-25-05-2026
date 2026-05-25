import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

import { PageWrapper } from '../components/layout/PageWrapper';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL query: /reset-password?token=xxx
  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('token') || '';
  }, [location.search]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token reset tidak ditemukan. Silakan gunakan link dari email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Kata sandi harus minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal mereset kata sandi. Token mungkin sudah kedaluwarsa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="w-full max-w-lg border-none shadow-2xl rounded-[48px] bg-white p-6 overflow-hidden relative text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
          <CardContent className="pt-16 pb-12">
            <div className="mx-auto w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-black text-ueu-navy mb-4 tracking-tight uppercase">Link Tidak Valid</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium px-4 leading-relaxed mb-10">
              Token reset kata sandi tidak ditemukan atau sudah kedaluwarsa. Silakan minta link reset baru untuk melanjutkan.
            </CardDescription>
            <Button
              className="w-full h-14 rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 transition-all active:scale-95"
              onClick={() => navigate('/forgot-password')}
            >
              Minta Link Reset Baru
            </Button>
          </CardContent>
        </Card>
      </div>
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="w-full max-w-lg border-none shadow-2xl rounded-[48px] bg-white p-6 overflow-hidden relative text-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-ueu-blue"></div>
          <CardContent className="pt-16 pb-12">
            <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-black text-ueu-navy mb-4 tracking-tight uppercase leading-snug">Kata Sandi Berhasil Direset</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium px-4 leading-relaxed mb-10">
              Kata sandi Anda telah berhasil diubah secara aman. Silakan masuk dengan kata sandi baru Anda.
            </CardDescription>
            <Button
              className="w-full h-14 rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 transition-all active:scale-95"
              onClick={() => navigate('/login')}
            >
              Masuk Sekarang
            </Button>
          </CardContent>
        </Card>
      </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
      <Card className="w-full max-w-md shadow-2xl shadow-blue-900/5 rounded-[48px] overflow-hidden border-none bg-white relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-ueu-blue"></div>
        <CardHeader className="space-y-4 pt-16 text-center">
          <div className="mx-auto w-20 h-20 bg-ueu-blue/5 rounded-[28px] flex items-center justify-center mb-2 shadow-inner">
            <ShieldCheck className="h-10 w-10 text-ueu-blue" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-ueu-navy uppercase">
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-400 font-black uppercase tracking-[3px] text-[10px]">
            Keamanan Portal Global Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4 text-red-600 text-[10px] font-black uppercase tracking-widest">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-2">Kata Sandi Baru</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 pr-14 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-ueu-blue transition-colors p-2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-2">Konfirmasi Kata Sandi</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
              />
            </div>

            <Button
              className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[3px] shadow-xl shadow-blue-900/10 bg-ueu-blue text-white hover:bg-ueu-navy transition-all active:scale-95 mt-4"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Simpan Password Baru
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
