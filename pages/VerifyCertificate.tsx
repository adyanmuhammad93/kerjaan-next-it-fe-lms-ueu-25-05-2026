


import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Award, Loader2, Calendar, User, AlertTriangle, ShieldAlert } from 'lucide-react';
import { courseService } from '../services/courseService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CertificateWithCourse } from '../types';
import { cn } from '../lib/utils';

import { PageWrapper } from '../components/layout/PageWrapper';

export const VerifyCertificate: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialCode = searchParams.get('code') || '';
    const [code, setCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CertificateWithCourse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (initialCode) {
            handleVerify(initialCode);
        }
    }, [initialCode]);

    const handleVerify = async (codeToVerify: string) => {
        if (!codeToVerify.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setSearched(true);

        try {
            const data = await courseService.verifyCertificate(codeToVerify);
            if (data) {
                setResult(data);
            } else {
                setError("Certificate not found. Please check the code and try again.");
            }
        } catch (e) {
            setError("An error occurred during verification.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (cert: CertificateWithCourse) => {
        if (cert.revoked) {
            return (
                <div className="flex flex-col items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg justify-center border border-red-100 w-full">
                    <ShieldAlert className="h-8 w-8" />
                    <span className="font-bold text-lg">REVOKED</span>
                    {cert.revokedReason && <span className="text-sm text-red-800">Reason: {cert.revokedReason}</span>}
                </div>
            );
        }
        
        if (cert.expiresAt && new Date(cert.expiresAt) < new Date()) {
            return (
                <div className="flex flex-col items-center gap-2 text-orange-600 bg-orange-50 p-4 rounded-lg justify-center border border-orange-100 w-full">
                    <AlertTriangle className="h-8 w-8" />
                    <span className="font-bold text-lg">EXPIRED</span>
                    <span className="text-sm">This certificate expired on {new Date(cert.expiresAt).toLocaleDateString()}.</span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg justify-center w-full border border-green-100">
                <CheckCircle className="h-5 w-5" />
                <span className="font-bold text-sm">Valid Certificate</span>
            </div>
        );
    };

    return (
        <PageWrapper>
        <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-6 pb-24">
            <div className="w-full max-w-xl space-y-12">
                <div className="text-center space-y-4">
                    <div className="bg-white p-5 rounded-[28px] shadow-2xl shadow-blue-900/5 inline-block mb-2">
                        <Award className="h-12 w-12 text-ueu-blue" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-ueu-navy tracking-tight uppercase">Verifikasi Sertifikat</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Validasi keaslian kredensial akademik Global Platform.</p>
                    </div>
                </div>

                <Card className="shadow-2xl shadow-blue-900/10 border-none rounded-[48px] overflow-hidden bg-white">
                    <CardContent className="p-10 space-y-8">
                        <div className="flex gap-4">
                            <Input 
                                placeholder="CONTOH: CERT-1234-ABCD" 
                                value={code} 
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="uppercase font-black tracking-[2px] h-16 rounded-2xl border-slate-100 bg-slate-50 text-ueu-navy focus:bg-white focus:ring-4 focus:ring-ueu-blue/5 transition-all text-sm px-6"
                            />
                            <Button 
                                onClick={() => handleVerify(code)} 
                                disabled={loading || !code.trim()}
                                className="h-16 w-16 rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex-shrink-0"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
                            </Button>
                        </div>

                        {searched && !loading && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-700 pt-8 border-t border-slate-50">
                                {error ? (
                                    <div className="flex items-center gap-4 text-red-600 bg-red-50 p-6 rounded-2xl border border-red-100 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                                        <XCircle className="h-6 w-6 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                ) : result ? (
                                    <div className="space-y-10">
                                        
                                        {getStatusBadge(result)}
                                        
                                        <div className="grid gap-8 pt-2">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Kredensial</p>
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                                                        <p className="font-black text-sm text-ueu-navy uppercase tracking-tight">{result.customTitle || "Certificate of Completion"}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Diterbitkan Untuk</p>
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                            <User className="h-4 w-4 text-ueu-blue" />
                                                        </div>
                                                        <p className="font-black text-sm text-ueu-navy uppercase tracking-tight">{result.studentName || 'Student'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mata Kuliah / Kompetensi</p>
                                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50">
                                                    <p className="font-black text-base text-ueu-navy uppercase tracking-tight leading-snug">{result.courseTitle}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tanggal Terbit</p>
                                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50 flex items-center gap-3">
                                                        <Calendar className="h-4 w-4 text-slate-400" />
                                                        <p className="text-xs font-black text-ueu-navy uppercase tracking-widest">
                                                            {new Date(result.issuedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {result.expiresAt && !result.revoked && (
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Berlaku Hingga</p>
                                                        <div className={cn(
                                                            "p-4 rounded-2xl border flex items-center gap-3",
                                                            new Date(result.expiresAt) < new Date() 
                                                                ? "bg-red-50 border-red-100" 
                                                                : "bg-slate-50 border-slate-100/50"
                                                        )}>
                                                            <Calendar className={cn("h-4 w-4", new Date(result.expiresAt) < new Date() ? "text-red-500" : "text-slate-400")} />
                                                            <p className={cn("text-xs font-black uppercase tracking-widest", new Date(result.expiresAt) < new Date() ? "text-red-600" : "text-ueu-navy")}>
                                                                {new Date(result.expiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instruktur Pengampu</p>
                                                <div className="bg-slate-50/50 p-4 rounded-2xl flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-ueu-blue"></div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{result.instructorName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <div className="text-center text-[10px] font-black uppercase tracking-[4px] text-slate-300">
                    Esa Unggul Global Platform Verification System
                </div>
            </div>
        </div>
        </PageWrapper>
    );
};
