




import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Award, Download, ArrowLeft, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { courseService } from '../services/courseService';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import { Course, Certificate as CertificateType } from '../types';
import { cn } from '../lib/utils';

export const Certificate: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<Course | null>(null);
    const [certificate, setCertificate] = useState<CertificateType | null>(null);
    const [issuedDate, setIssuedDate] = useState<string | null>(null);
    const [expiryDate, setExpiryDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchCertificateData = async () => {
            if (!user || !courseId) return;

            try {
                const [cert, courseData] = await Promise.all([
                    courseService.getCertificate(user.id, courseId),
                    courseService.getCourseById(courseId, true)
                ]);

                if (!cert) {
                    navigate('/dashboard'); // Not issued yet
                    return;
                }

                setCertificate(cert);
                setCourse(courseData);
                setIssuedDate(new Date(cert.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }));
                if (cert.expiresAt) {
                    setExpiryDate(new Date(cert.expiresAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }));
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCertificateData();
    }, [user, courseId, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <LoadingScreen />;
    if (!course || !user || !certificate) return null;

    const verificationUrl = `${window.location.origin}/verify?code=${certificate.verificationCode}`;
    const certTitle = course.certificateConfig?.customTitle || "Certificate of Completion";
    
    // Status check
    const isExpired = certificate.expiresAt ? new Date(certificate.expiresAt) < new Date() : false;
    const isRevoked = certificate.revoked;

    return (
        <PageWrapper className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-4 print:bg-white print:p-0">
            {/* No-Print Header */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-8 print:hidden">
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
                <div className="flex gap-2">
                    {(isRevoked || isExpired) && (
                        <div className={cn("px-3 py-2 rounded-md flex items-center gap-2 text-sm font-bold", isRevoked ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-800")}>
                            {isRevoked ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {isRevoked ? "REVOKED" : "EXPIRED"}
                        </div>
                    )}
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Download className="mr-2 h-4 w-4" /> Download / Print
                    </Button>
                </div>
            </div>

            {/* Certificate Container */}
            <div className="w-full max-w-4xl bg-white aspect-[1.414/1] shadow-xl relative p-12 text-center border-8 border-double border-slate-200 print:shadow-none print:border-4 print:w-full print:h-screen overflow-hidden">
                
                {/* Revoked Watermark */}
                {isRevoked && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="border-8 border-red-500/30 text-red-500/30 text-9xl font-black uppercase tracking-widest -rotate-45 p-4 rounded-xl">
                            REVOKED
                        </div>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-slate-900"></div>
                <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-slate-900"></div>
                <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-slate-900"></div>
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-slate-900"></div>

                <div className="h-full flex flex-col items-center justify-center border-2 border-slate-100 p-8 relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <Award className="w-96 h-96" />
                    </div>

                    <div className="mb-8 relative z-10">
                        <Award className="h-24 w-24 text-amber-500 mx-auto mb-4" />
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 uppercase tracking-widest leading-tight">
                            {certTitle}
                        </h1>
                    </div>

                    <div className="space-y-2 mb-8 relative z-10">
                        <p className="text-lg text-slate-600 font-serif italic">This is to certify that</p>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 border-b-2 border-slate-300 pb-2 px-12 inline-block min-w-[400px]">
                            {user.name}
                        </h2>
                    </div>

                    <div className="space-y-2 mb-12 relative z-10">
                        <p className="text-lg text-slate-600 font-serif italic">Has successfully completed the course</p>
                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-blue-900 max-w-2xl mx-auto leading-tight">
                            {course.title}
                        </h3>
                    </div>

                    <div className="w-full flex justify-between items-end mt-auto px-12 relative z-10 pb-8">
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 border-t border-slate-400 pt-2 px-8">
                                {issuedDate}
                            </p>
                            <p className="text-sm text-slate-500 uppercase tracking-wide mt-1">Date Issued</p>
                        </div>

                        <div className="text-center">
                            <div className="mb-2 font-handwriting text-2xl text-slate-800 italic">
                                Esa Unggul Team
                            </div>
                            <p className="text-sm text-slate-500 uppercase tracking-wide border-t border-slate-400 pt-2 px-8">
                                Instructor / Platform
                            </p>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="absolute bottom-4 left-0 right-0 px-8 flex justify-between items-end text-xs text-slate-400 font-mono">
                        <div className="text-left space-y-1">
                            <p>Certificate ID: {certificate.verificationCode}</p>
                            <p>Verify at: esaunggul.ac.id/verify</p>
                            {expiryDate && <p className="text-slate-500 font-bold">Valid until: {expiryDate}</p>}
                        </div>
                        <div className="bg-white p-1">
                            <QRCodeSVG value={verificationUrl} size={64} />
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
