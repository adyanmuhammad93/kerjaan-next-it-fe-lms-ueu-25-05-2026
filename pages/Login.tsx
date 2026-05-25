import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle } from 'lucide-react';

import { PageWrapper } from '../components/layout/PageWrapper';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
      <Card className="w-full max-w-md shadow-2xl shadow-blue-900/5 rounded-[48px] overflow-hidden border-none bg-white relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-ueu-blue"></div>
        <CardHeader className="space-y-4 pt-16 text-center">
          <CardTitle className="text-4xl font-black tracking-tight text-ueu-navy uppercase">
            Masuk Akun
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

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2 mr-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60">Kata Sandi</label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] text-ueu-blue font-black uppercase tracking-widest hover:text-ueu-navy transition-colors">
                  Lupa Sandi?
                </button>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 rounded-2xl border-none bg-slate-50 focus:bg-white focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
              />
            </div>

            <Button 
              className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[3px] shadow-xl shadow-blue-900/10 bg-ueu-blue text-white hover:bg-ueu-navy transition-all active:scale-95 mt-4" 
              type="submit" 
              disabled={isSubmitting} 
              isLoading={isSubmitting}
            >
              Masuk Sekarang
            </Button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {"Belum memiliki akun? "}
              <button 
                type="button" 
                onClick={() => navigate('/admission')} 
                className="text-ueu-blue hover:text-ueu-navy underline underline-offset-4 transition-colors"
              >
                Daftar di sini
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageWrapper>
  );
};
