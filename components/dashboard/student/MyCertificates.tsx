
import React, { useEffect, useState } from 'react';
import { Award, Download, ExternalLink, Loader2, Trophy, Search, BookOpen, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/courseService';
import { CertificateWithCourse } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

export const MyCertificates: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [certificates, setCertificates] = useState<CertificateWithCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificates = async () => {
            if (!user) return;
            try {
                const data = await courseService.getUserCertificates(user.id);
                setCertificates(data);
            } catch (error) {
                console.error("Failed to load certificates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, [user]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[10px] font-black text-ueu-navy uppercase tracking-[2px] animate-pulse">Memuat Sertifikat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 bg-transparent">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-ueu-navy tracking-tight">E-Sertifikat</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mt-1">Verifikasi dan unduh kredensial yang telah Anda raih.</p>
                </div>
                <Badge className="px-5 py-2.5 rounded-full bg-ueu-blue/5 text-ueu-blue font-black text-[10px] uppercase tracking-widest border-none shadow-sm shadow-blue-900/5">
                    {certificates.length} Total Sertifikat
                </Badge>
            </div>

            {certificates.length === 0 ? (
                <Card className="rounded-[40px] border border-slate-100 shadow-sm bg-white overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                            <Trophy className="h-12 w-12 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-ueu-navy mb-3">Belum Ada Sertifikat</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mb-10 font-bold text-sm">
                            Selesaikan modul perkuliahan Anda untuk mendapatkan sertifikat kelulusan pertama.
                        </p>
                        <Button 
                            onClick={() => navigate('/browse')} 
                            className="rounded-2xl bg-ueu-blue hover:bg-ueu-navy text-white px-12 h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95"
                        >
                            Cari Mata Kuliah
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert) => (
                        <div 
                            key={cert.id} 
                            className="group relative bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-700 flex flex-col border border-slate-100 translate-y-0 hover:-translate-y-4"
                        >
                            {/* Certificate Preview Top */}
                            <div className="h-44 bg-ueu-navy relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"></div>
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-ueu-blue/40 to-transparent"></div>
                                
                                <div className="text-center z-10 p-6 transform group-hover:scale-110 transition-transform duration-700">
                                    <div className="relative">
                                        <Award className="h-16 w-16 text-yellow-400 mx-auto mb-3 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                                        <div className="absolute -top-2 -right-4 bg-accent text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg border-2 border-white/10 group-hover:bg-white group-hover:text-accent transition-colors">Verified</div>
                                    </div>
                                    <div className="text-white font-black tracking-[0.3em] text-xl">CERTIFICATE</div>
                                    <div className="text-ueu-blue text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-70">Official ASU Credential</div>
                                </div>
                                
                                {/* Decorative elements */}
                                <div className="absolute bottom-[-30%] right-[-10%] w-40 h-40 bg-ueu-blue/20 rounded-full blur-3xl"></div>
                            </div>
                            
                            <div className="p-8 flex-1 flex flex-col bg-white">
                                <div className="mb-6">
                                    <Badge className="rounded-full border-none bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-[2px] mb-4 py-1.5 px-4">
                                        ID: {cert.id.substring(0, 8).toUpperCase()}
                                    </Badge>
                                    <h3 className="font-black text-base text-ueu-navy leading-snug mb-2 line-clamp-2 min-h-[3rem] group-hover:text-ueu-blue transition-colors" title={cert.courseTitle}>
                                        {cert.courseTitle}
                                    </h3>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-ueu-blue transition-colors">
                                            <BookOpen className="h-4 w-4 text-ueu-blue group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengampu</p>
                                            <p className="text-sm font-bold text-ueu-navy">{cert.instructorName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Terbit</p>
                                            <p className="text-sm font-bold text-ueu-navy">{format(new Date(cert.issuedAt), 'dd MMMM yyyy')}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <Button 
                                        variant="outline" 
                                        className="rounded-2xl border-2 border-ueu-blue text-ueu-blue hover:bg-ueu-blue hover:text-white font-black h-12 text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        onClick={() => navigate(`/certificate/${cert.courseId}`)}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" /> Lihat
                                    </Button>
                                    <Button 
                                        className="rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-black h-12 text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-2"
                                        onClick={() => navigate(`/certificate/${cert.courseId}`)}
                                    >
                                        <Download className="h-3.5 w-3.5" /> Unduh
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
