




import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Award, CheckCircle, Percent, Type, Calendar, ClipboardList, AlertCircle } from 'lucide-react';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { cn } from '../../lib/utils';

interface CertificateSettingsEditorProps {
    course: Course;
    onUpdate: () => void;
}

export const CertificateSettingsEditor: React.FC<CertificateSettingsEditorProps> = ({ course, onUpdate }) => {
    const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            enabled: course.certificateConfig?.enabled ?? true,
            minScore: course.certificateConfig?.minScore ?? 0,
            requireGradedAssignments: course.certificateConfig?.requireGradedAssignments ?? false,
            enforcePerQuiz: course.certificateConfig?.enforcePerQuiz ?? false,
            customTitle: course.certificateConfig?.customTitle || '',
            validityDays: course.certificateConfig?.validityDays || 0,
        }
    });

    const enabled = watch('enabled');

    const onSubmit = async (data: any) => {
        try {
            await courseService.updateCourse(course.id, {
                certificateConfig: {
                    enabled: data.enabled,
                    minScore: Number(data.minScore),
                    requireGradedAssignments: data.requireGradedAssignments,
                    enforcePerQuiz: data.enforcePerQuiz,
                    customTitle: data.customTitle,
                    validityDays: Number(data.validityDays)
                }
            });
            onUpdate();
            alert("Certificate settings updated successfully");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan pengaturan");
        }
    };

    return (
        <Card className="border-slate-200 shadow-xl rounded-[32px] overflow-hidden border">
            <CardHeader className="p-10 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500 p-4 rounded-2xl text-white shadow-lg shadow-amber-500/20 animate-in zoom-in-50 duration-500">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black text-ueu-navy tracking-tight">Pengaturan Sertifikat</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Atur aturan kelulusan dan tampilan sertifikat.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-10">
                <form id="certificate-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                    
                    <div className={cn(
                        "flex items-start gap-4 p-6 rounded-[28px] border transition-all duration-300",
                        enabled ? "bg-violet-50/50 border-violet-200 ring-2 ring-violet-500 shadow-lg shadow-violet-500/5" : "bg-slate-50 border-slate-100 shadow-inner"
                    )}>
                        <Checkbox 
                            id="cert-enabled" 
                            checked={enabled}
                            onCheckedChange={(val) => {
                                // useForm's register might need manual handling if we use shadcn checkbox nicely
                                // but for now let's just use what works
                            }}
                            {...register('enabled')} 
                            className="mt-1 h-6 w-6 rounded-lg data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500 transition-all border-2 border-slate-200"
                        />
                        <div className="space-y-1 flex-1">
                            <label htmlFor="cert-enabled" className="text-[15px] font-black text-ueu-navy leading-none cursor-pointer flex items-center justify-between">
                                Enable Certificate of Completion
                                {enabled && (
                                    <span className="bg-violet-500 text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black animate-pulse">AKTIF</span>
                                )}
                            </label>
                            <p className="text-[13px] text-slate-500 font-medium mt-2 leading-relaxed">
                                When enabled, students will automatically receive a certificate upon completing all lessons and meeting the requirements defined below.
                            </p>
                        </div>
                    </div>

                    {enabled && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                            
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-ueu-navy uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-[2px] bg-slate-200"></div>
                                    Issuance Rules
                                    <div className="flex-1 h-[2px] bg-slate-100"></div>
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="border border-slate-100 rounded-[28px] p-8 flex items-center justify-between bg-white shadow-sm hover:shadow-xl transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-500 p-4 rounded-2xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                <Percent className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <label className="text-[15px] font-black text-ueu-navy block tracking-tight">Nilai Kelulusan Minimum</label>
                                                <p className="text-xs text-slate-400 font-medium mt-1">Required score to pass quizzes.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 text-center font-black text-lg text-ueu-navy"
                                                min="0" 
                                                max="100" 
                                                {...register('minScore')} 
                                            />
                                            <span className="text-sm font-black text-slate-300">%</span>
                                        </div>
                                    </div>

                                    {/* Advanced Rules */}
                                    <div className="border border-slate-100 rounded-[28px] bg-white overflow-hidden divide-y divide-slate-50 shadow-sm">
                                        <div className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                                            <Checkbox 
                                                id="enforce-quiz" 
                                                {...register('enforcePerQuiz')} 
                                                className="mt-1 h-5 w-5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                            />
                                            <div className="space-y-1">
                                                <label htmlFor="enforce-quiz" className="text-[13px] font-bold text-ueu-navy leading-none cursor-pointer flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    Enforce Score on Each Quiz
                                                </label>
                                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-2 italic">
                                                    Jika dicentang, mahasiswa harus mencapai nilai minimum pada <strong className="text-slate-600">setiap kuis</strong>. 
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors group">
                                            <Checkbox 
                                                id="require-assign" 
                                                {...register('requireGradedAssignments')} 
                                                className="mt-1 h-5 w-5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                            />
                                            <div className="space-y-1">
                                                <label htmlFor="require-assign" className="text-[13px] font-bold text-ueu-navy leading-none cursor-pointer flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                                    Require Graded Assignments
                                                </label>
                                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-2 italic">
                                                    {`All assignments must be graded by an instructor before the certificate is issued.`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-ueu-navy uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="w-8 h-[2px] bg-slate-200"></div>
                                    Certificate Appearance
                                    <div className="flex-1 h-[2px] bg-slate-100"></div>
                                </h3>
                                
                                <div className="border border-slate-100 rounded-[32px] p-8 bg-slate-50/50 shadow-inner space-y-8">
                                    <div className="grid md:grid-cols-2 gap-10">
                                        <div className="space-y-3 group">
                                            <label className="text-[13px] font-black text-ueu-navy ml-1 flex items-center gap-2 uppercase tracking-tight group-hover:text-violet-500 transition-colors">
                                                <Type className="h-4 w-4" /> Judul Kustom
                                            </label>
                                            <Input 
                                                {...register('customTitle')} 
                                                placeholder="e.g. Certified React Professional" 
                                                className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-bold text-ueu-navy shadow-sm bg-white"
                                            />
                                            <p className="text-[10px] text-slate-400 font-bold ml-2 uppercase italic tracking-widest">Menggantikan judul bawaan "Sertifikat Penyelesaian".</p>
                                        </div>

                                        <div className="space-y-3 group">
                                            <label className="text-[13px] font-black text-ueu-navy ml-1 flex items-center gap-2 uppercase tracking-tight group-hover:text-violet-500 transition-colors">
                                                <Calendar className="h-4 w-4" /> Masa Berlaku (Hari)
                                            </label>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    min="0"
                                                    {...register('validityDays')} 
                                                    placeholder="365"
                                                    className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-bold text-ueu-navy bg-white"
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 font-bold pointer-events-none group-hover:text-violet-200 transition-colors">DAYS</div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold ml-2 uppercase italic tracking-widest">Isi 0 untuk masa berlaku seumur hidup.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
            <CardFooter className="flex justify-end p-10 bg-slate-50/50 border-t border-slate-100">
                <Button 
                    type="submit" 
                    form="certificate-form" 
                    isLoading={isSubmitting}
                    className="h-14 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-black px-10 transition-all active:scale-95 shadow-xl shadow-blue-900/10"
                >
                    Simpan Pengaturan
                </Button>
            </CardFooter>
        </Card>
    );
};