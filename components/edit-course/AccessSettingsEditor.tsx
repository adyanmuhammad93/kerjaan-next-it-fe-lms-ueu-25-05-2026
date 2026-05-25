
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Globe, Lock, DollarSign, Calendar, Users, FileCheck, ShieldAlert, Check
} from 'lucide-react';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { cn } from '../../lib/utils';
import { Combobox } from '../ui/Combobox';

interface AccessSettingsEditorProps {
    course: Course;
    onUpdate: () => void;
}

const ACCESS_TYPES = [
    { id: 'free', label: 'Akses Terbuka / Gratis', icon: Globe, desc: 'Tanpa batasan. Siapa pun bisa mendaftar langsung.' },
    { id: 'paid', label: 'Require Purchase', icon: DollarSign, desc: 'User must purchase via checkout.' },
    { id: 'code', label: 'Kode Akses', icon: Lock, desc: 'Pengguna harus memasukkan kode rahasia untuk bergabung.' },
    { id: 'prerequisite', label: 'Mata Kuliah Prasyarat', icon: FileCheck, desc: 'Pengguna harus menyelesaikan mata kuliah lain terlebih dahulu.' },
    { id: 'date', label: 'Berdasarkan Tanggal', icon: Calendar, desc: 'Mata kuliah dibuka pada tanggal tertentu.' },
    { id: 'capacity', label: 'Seat Limit', icon: Users, desc: 'Limit the number of enrolled students.' },
    { id: 'approval', label: 'Manual Approval', icon: ShieldAlert, desc: 'Instructor must approve each enrollment.' },
];

export const AccessSettingsEditor: React.FC<AccessSettingsEditorProps> = ({ course, onUpdate }) => {
    const [selectedType, setSelectedType] = useState(course.accessType || 'paid');
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    
    const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            price: course.price,
            accessCode: course.accessConfig?.accessCode || '',
            prerequisiteCourseId: course.accessConfig?.prerequisiteCourseId || '',
            startDate: course.accessConfig?.startDate || '',
            maxSeats: course.accessConfig?.maxSeats || 100
        }
    });

    useEffect(() => {
        if (selectedType === 'prerequisite') {
            courseService.getAllCourses().then(courses => {
                setAllCourses(courses.filter(c => c.id !== course.id));
            });
        }
    }, [selectedType, course.id]);

    const onSubmit = async (data: any) => {
        try {
            const updates: Partial<Course> = {
                accessType: selectedType as any,
                price: selectedType === 'paid' ? Number(data.price) : 0, // Force 0 if not paid type
                accessConfig: {}
            };

            // Build config based on type
            if (selectedType === 'code') updates.accessConfig!.accessCode = data.accessCode;
            if (selectedType === 'prerequisite') updates.accessConfig!.prerequisiteCourseId = data.prerequisiteCourseId;
            if (selectedType === 'date') updates.accessConfig!.startDate = data.startDate;
            if (selectedType === 'capacity') updates.accessConfig!.maxSeats = Number(data.maxSeats);

            await courseService.updateCourse(course.id, updates);
            onUpdate();
            alert("Pengaturan akses berhasil diperbarui");
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan pengaturan");
        }
    };

    return (
        <Card className="border-slate-200 shadow-xl rounded-[32px] overflow-hidden border">
            <CardHeader className="p-10 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-2xl font-black text-ueu-navy tracking-tight">Aturan Akses Mata Kuliah</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Atur siapa yang dapat melihat dan mendaftar ke mata kuliah Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
                <form id="access-form" onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ACCESS_TYPES.map((type) => {
                            const Icon = type.icon;
                            const isSelected = selectedType === type.id;
                            return (
                                <div 
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id as any)}
                                    className={cn(
                                        "relative flex flex-col items-start gap-4 p-6 rounded-[28px] border cursor-pointer transition-all hover:shadow-xl group",
                                        isSelected 
                                            ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-500 shadow-xl shadow-violet-500/10" 
                                            : "border-slate-100 hover:border-violet-200 bg-white"
                                    )}
                                >
                                    <div className={cn(
                                        "p-3 rounded-2xl shrink-0 transition-all group-hover:scale-110", 
                                        isSelected ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-slate-50 text-slate-400"
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className={cn("font-bold text-sm tracking-tight", isSelected ? "text-ueu-navy" : "text-slate-700")}>
                                            {type.label}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed">
                                            {type.desc}
                                        </p>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-4 right-4 animate-in zoom-in-50 duration-300">
                                            <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center text-white shadow-md">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Dynamic Configuration Fields */}
                    <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-100 shadow-inner">
                        <h3 className="text-sm font-black text-ueu-navy mb-8 flex items-center gap-3 uppercase tracking-widest">
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full"></div>
                            Configuration: <span className="text-violet-500">{ACCESS_TYPES.find(t => t.id === selectedType)?.label}</span>
                        </h3>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {selectedType === 'free' && (
                                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 italic">
                                    <Globe className="h-5 w-5 text-violet-500 shrink-0" />
                                    <p className="text-sm text-slate-500 font-medium">
                                        This course will be listed as <strong className="text-ueu-navy font-black">FREE</strong>. Students can enroll immediately without payment or approval.
                                    </p>
                                </div>
                            )}

                            {selectedType === 'paid' && (
                                <div className="max-w-xs space-y-3">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Harga</label>
                                    <div className="relative">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                                        <Input 
                                            type="number" 
                                            step="0.01" 
                                            {...register('price', { required: true, min: 0 })} 
                                            className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all pl-10 pr-6 font-bold text-lg text-ueu-navy"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'code' && (
                                <div className="max-w-sm space-y-3">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Kode Akses Rahasia</label>
                                    <Input 
                                        {...register('accessCode', { required: true })} 
                                        placeholder="e.g. VIP2024" 
                                        className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-bold tracking-widest uppercase placeholder:text-slate-200"
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium ml-1">Share this code with specific users.</p>
                                </div>
                            )}

                            {selectedType === 'prerequisite' && (
                                <div className="max-w-md space-y-3">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Mata Kuliah Prasyarat</label>
                                    <Combobox 
                                        options={allCourses.map(c => ({ label: c.title, value: c.id }))}
                                        value={watch('prerequisiteCourseId')}
                                        onChange={(val) => setValue('prerequisiteCourseId', val)}
                                        placeholder="Select required course..."
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium ml-1">Users must complete this course before enrolling.</p>
                                </div>
                            )}

                            {selectedType === 'date' && (
                                <div className="max-w-xs space-y-3">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Release Date</label>
                                    <Input 
                                        type="date" 
                                        {...register('startDate', { required: true })} 
                                        className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-bold"
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium ml-1">Enrollment is locked until this date.</p>
                                </div>
                            )}

                            {selectedType === 'capacity' && (
                                <div className="max-w-xs space-y-3">
                                    <label className="text-[13px] font-bold text-ueu-navy ml-1 block">Maximum Seats</label>
                                    <Input 
                                        type="number" 
                                        {...register('maxSeats', { required: true, min: 1 })} 
                                        className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-bold"
                                    />
                                    <p className="text-[11px] text-slate-400 font-medium ml-1">Enrollment closes automatically when full.</p>
                                </div>
                            )}

                            {selectedType === 'approval' && (
                                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 italic">
                                    <ShieldAlert className="h-5 w-5 text-violet-500 shrink-0" />
                                    <p className="text-sm text-slate-500 font-medium">
                                        Students will click <strong className="text-ueu-navy">"Request to Join"</strong>. You will need to approve them in the <strong>Students</strong> tab before they can access content.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </form>
            </CardContent>
            <CardFooter className="flex justify-end p-10 bg-slate-50/30 border-t border-slate-100">
                <Button 
                    type="submit" 
                    form="access-form" 
                    isLoading={isSubmitting}
                    className="h-14 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-bold px-10 transition-all active:scale-95 shadow-xl shadow-blue-900/10"
                >
                    Simpan Aturan Akses
                </Button>
            </CardFooter>
        </Card>
    );
};
