import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';

import { PageWrapper } from '../components/layout/PageWrapper';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="w-full max-w-lg border-none shadow-2xl rounded-[48px] bg-white p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-ueu-blue"></div>
          <CardContent className="pt-16 pb-12 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
              <Mail className="h-10 w-10 text-ueu-blue" />
            </div>
            <CardTitle className="text-3xl font-black text-ueu-navy mb-4 tracking-tight uppercase">Periksa Email</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium px-4 leading-relaxed">
              Jika akun dengan email <strong className="text-ueu-navy">{email}</strong> terdaftar, kami telah mengirimkan link untuk mereset kata sandi Anda.
              <br /><br />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Periksa folder inbox dan spam Anda.</span>
            </CardDescription>
            <Button
              className="w-full mt-12 h-14 rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 transition-all active:scale-95"
              onClick={() => navigate('/login')}
            >
              Kembali ke Login
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
          <CardTitle className="text-3xl font-black tracking-tight text-ueu-navy uppercase leading-tight">
            Lupa Kata Sandi
          </CardTitle>
          <CardDescription className="text-slate-400 font-black uppercase tracking-[3px] text-[10px]">
            Portal Akademik Global Platform
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
              <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-2">Alamat Email</label>
              <Input
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
              />
            </div>

            <Button
              className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[3px] shadow-xl shadow-blue-900/10 bg-ueu-blue text-white hover:bg-ueu-navy transition-all active:scale-95 mt-4"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Kirim Link Reset
            </Button>
          </form>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-ueu-blue transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Halaman Masuk
            </button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
