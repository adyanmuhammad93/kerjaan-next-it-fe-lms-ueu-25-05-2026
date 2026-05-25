import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { AdmissionPeriod, Program } from '../types';
import { AlertCircle, CheckCircle, Eye, EyeOff, ChevronDown, GraduationCap, Loader2 } from 'lucide-react';

import { PageWrapper } from '../components/layout/PageWrapper';

export const AdmissionForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [admissionPeriodId, setAdmissionPeriodId] = useState('');
  const [programId, setProgramId] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Reference data
  const [admissionPeriods, setAdmissionPeriods] = useState<AdmissionPeriod[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [periods, progs] = await Promise.all([
          authService.getAdmissionPeriods(),
          authService.getPrograms(),
        ]);
        setAdmissionPeriods(periods);
        setPrograms(progs);
      } catch (err) {
        console.error('Failed to load reference data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!firstName.trim()) {
      setError('First Name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[0-9]+$/.test(phone)) {
      setError('Mobile number must contain only digits');
      return;
    }
    if (phone.length < 8) {
      setError('Mobile number must be at least 8 digits');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!admissionPeriodId) {
      setError('Please select an admission period');
      return;
    }
    if (!programId) {
      setError('Please select a program');
      return;
    }

    try {
      await register({
        email,
        password,
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone,
        admissionPeriodId,
        programId,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  // Success screen
  if (success) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
        <Card className="w-full max-w-lg border-none shadow-2xl rounded-[48px] bg-white p-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-ueu-blue"></div>
          <CardContent className="pt-16 pb-12 text-center">
            <div className="mx-auto w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-black text-ueu-navy mb-4 tracking-tight uppercase">Pendaftaran Berhasil!</CardTitle>
            <CardDescription className="text-base text-slate-500 font-medium px-4 leading-relaxed">
              Akun Anda dengan email <strong className="text-ueu-navy underline decoration-ueu-blue/30">{email}</strong> telah berhasil didaftarkan. 
              Silakan lanjut ke portal akademik Global Platform.
            </CardDescription>
            <Button
              className="w-full mt-12 h-14 rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10 transition-all active:scale-95"
              onClick={() => navigate('/dashboard')}
            >
              Lanjut ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="min-h-screen flex items-center justify-center p-6 py-20 bg-slate-50/50">
      <Card className="w-full max-w-xl shadow-2xl shadow-blue-900/5 rounded-[48px] overflow-hidden border-none bg-white relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ueu-blue/5 rounded-bl-[100px] -z-0"></div>
        <CardHeader className="space-y-4 pt-16 text-center relative z-10">
          <div className="mx-auto w-20 h-20 bg-ueu-blue/5 rounded-[28px] flex items-center justify-center mb-2 shadow-inner">
            <GraduationCap className="h-10 w-10 text-ueu-blue" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-ueu-navy uppercase leading-none">
            Admission Form
          </CardTitle>
          <CardDescription className="text-slate-400 font-black uppercase tracking-[3px] text-[10px]">
            Esa Unggul International College
          </CardDescription>
        </CardHeader>

        <CardContent className="px-12 pb-16 relative z-10">
          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-slate-50 border-t-ueu-blue rounded-2xl animate-spin mb-4"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Menyiapkan Formulir...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4 text-red-600 text-xs font-black uppercase tracking-widest">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                    First Name<span className="text-red-500">*</span>
                    </label>
                    <Input
                    placeholder="Nama Depan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
                    />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                    Last Name
                    </label>
                    <Input
                    placeholder="Nama Belakang"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
                    />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                  Alamat Email<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                  Nomor HP / WhatsApp<span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="0812XXXXXXXX"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhone(val);
                  }}
                  required
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                  Password Akun<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 pr-14 font-bold"
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

              {/* Admission Period */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                  Periode Pendaftaran<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={admissionPeriodId}
                    onChange={(e) => setAdmissionPeriodId(e.target.value)}
                    required
                    className="appearance-none w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white px-6 pr-12 text-sm font-bold focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 focus:outline-none transition-all cursor-pointer text-ueu-navy"
                  >
                    <option value="" disabled>Pilih periode</option>
                    {admissionPeriods.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
                </div>
              </div>

              {/* Program */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ueu-navy/60 ml-1">
                  Program Studi Pilihan<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={programId}
                    onChange={(e) => setProgramId(e.target.value)}
                    required
                    className="appearance-none w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white px-6 pr-12 text-sm font-bold focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 focus:outline-none transition-all cursor-pointer text-ueu-navy"
                  >
                    <option value="" disabled>Pilih program studi</option>
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
                </div>
              </div>

              {/* Submit */}
              <Button
                className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-[3px] shadow-xl shadow-blue-900/10 bg-ueu-blue text-white hover:bg-ueu-navy transition-all active:scale-95 mt-8"
                type="submit"
                disabled={loading}
                isLoading={loading}
              >
                Kirim Pendaftaran
              </Button>
            </form>
          )}

          {/* Link back to Login */}
          <div className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <p>
              {"Sudah punya akun? "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-ueu-blue hover:text-ueu-navy underline underline-offset-4 transition-colors"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};
