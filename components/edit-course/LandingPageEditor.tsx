
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, ImageIcon, Check, X, Upload, ChevronDown } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { categoryService } from '../../services/categoryService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Course, Category, Asset } from '../../types';
import { ListInput } from './ListInput';
import { TreeSelect } from '../ui/TreeSelect';
import { AssetSelectorModal } from '../AssetSelectorModal';

export const LandingPageEditor: React.FC<{ course: Course, onUpdate: () => void }> = ({ course, onUpdate }) => {
    const { register, handleSubmit, setValue, watch, formState: { isSubmitting, isDirty } } = useForm({
        defaultValues: {
            title: course.title,
            subtitle: course.subtitle || '',
            description: course.description,
            category: course.category,
            level: course.level,
            language: course.language || 'English',
            price: course.price,
            thumbnailUrl: course.thumbnailUrl
        }
    });

    const thumbnailUrl = watch('thumbnailUrl');
    const selectedCategory = watch('category');

    const [thumbMode, setThumbMode] = useState<'url' | 'upload'>('url');
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const [learningObjectives, setLearningObjectives] = useState<string[]>(course.learningObjectives || []);
    const [requirements, setRequirements] = useState<string[]>(course.requirements || []);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const categoryTree = React.useMemo(() => categoryService.buildCategoryTree(categories), [categories]);

    useEffect(() => {
        categoryService.getCategories().then(data => setCategories(data.filter(c => c.status !== 'inactive'))).catch(console.error);
        register('category'); // Ensure it's registered
    }, [register]);

    const onSubmit = async (data: any) => {
        try {
            let finalThumbnailUrl = data.thumbnailUrl;
            if (thumbMode === 'upload' && thumbFile) {
                setUploadingThumb(true);
                try {
                    finalThumbnailUrl = await courseService.uploadFile(thumbFile, 'thumbnails');
                } catch (e) {
                    console.error("Thumbnail upload failed", e);
                } finally {
                    setUploadingThumb(false);
                }
            }

            await courseService.updateCourse(course.id, {
                ...data,
                thumbnailUrl: finalThumbnailUrl,
                learningObjectives,
                requirements
            });
            onUpdate();
        } catch (error) {
            console.error("Gagal memperbarui mata kuliah", error);
        }
    };

    return (
        <Card className="border-slate-200 shadow-xl rounded-[32px] overflow-hidden border">
            <CardHeader className="p-10 bg-slate-50/50">
                <CardTitle className="text-2xl font-black text-ueu-navy tracking-tight">Halaman Landing Mata Kuliah</CardTitle>
                <CardDescription className="text-slate-500 font-medium">Informasi ini akan terlihat oleh mahasiswa di halaman detail mata kuliah.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-ueu-navy ml-1">Judul Mata Kuliah <span className="text-red-500">*</span></label>
                        <Input 
                            {...register('title', { required: true })} 
                            className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-ueu-navy ml-1">Subjudul Mata Kuliah</label>
                        <Input 
                            {...register('subtitle')} 
                            placeholder="Insert your course subtitle" 
                            className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium placeholder:text-slate-300"
                        />
                        <p className="text-[11px] text-slate-400 font-medium ml-1">A brief summary of your course (max 120 chars).</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[13px] font-bold text-ueu-navy ml-1">Deskripsi <span className="text-red-500">*</span></label>
                        <Textarea 
                            {...register('description', { required: true })} 
                            rows={5} 
                            placeholder="Insert your course description" 
                            className="rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all p-6 font-medium placeholder:text-slate-300 min-h-[150px]"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Category <span className="text-red-500">*</span></label>
                            <TreeSelect
                                data={categoryTree}
                                value={selectedCategory}
                                onChange={(val) => setValue('category', val, { shouldValidate: true })}
                                placeholder="Select category..."
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Level</label>
                            <div className="relative group">
                                <select
                                    className="flex h-14 w-full rounded-2xl border border-slate-200 bg-background px-6 py-2 text-sm font-medium ring-offset-background transition-all appearance-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/5 focus-visible:border-violet-500 text-ueu-navy"
                                    {...register('level')}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-violet-500 transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Language</label>
                            <div className="relative group">
                                <select
                                    className="flex h-14 w-full rounded-2xl border border-slate-200 bg-background px-6 py-2 text-sm font-medium ring-offset-background transition-all appearance-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/5 focus-visible:border-violet-500 text-ueu-navy"
                                    {...register('language')}
                                >
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Portuguese">Portuguese</option>
                                    <option value="Indonesian">Indonesian</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-violet-500 transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Harga <span className="text-red-500">*</span></label>
                            <Input 
                                type="number" 
                                step="0.01" 
                                {...register('price', { required: true, min: 0 })} 
                                className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium"
                            />
                        </div>
                    </div>

                    {/* Thumbnail Section */}
                    <div className="space-y-6 border border-slate-100 rounded-3xl p-8 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                            <label className="text-[13px] font-bold text-ueu-navy ml-1">Thumbnail Mata Kuliah <span className="text-red-500">*</span></label>
                            <div className="flex border border-slate-200 rounded-xl p-1 bg-white shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setThumbMode('upload')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${thumbMode === 'upload' ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setThumbMode('url')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${thumbMode === 'url' ? 'bg-violet-100 text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    URL
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                            <div className="aspect-video bg-slate-100 rounded-[24px] overflow-hidden flex items-center justify-center border border-slate-200 relative shadow-inner">
                                {thumbnailUrl || (thumbFile && URL.createObjectURL(thumbFile)) ? (
                                    <img
                                        src={thumbMode === 'upload' && thumbFile ? URL.createObjectURL(thumbFile) : thumbnailUrl}
                                        alt="Pratinjau Thumbnail"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="h-8 w-8 text-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center">
                                {thumbMode === 'url' ? (
                                    <div className="animate-in fade-in slide-in-from-left-2">
                                        <Input 
                                            {...register('thumbnailUrl')} 
                                            placeholder="https://..." 
                                            className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all px-6 font-medium"
                                        />
                                        <p className="text-[11px] text-slate-400 font-medium mt-3 ml-1 leading-relaxed">Ensure the image is hosted on a reliable server for optimal loading speeds.</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-right-2">
                                        <div className="group relative border-2 border-dashed border-slate-200 rounded-[24px] p-8 text-center hover:bg-white hover:border-violet-400 transition-all cursor-pointer bg-slate-50/50">
                                            {thumbFile ? (
                                                <div className="flex items-center justify-center gap-2 text-violet-600 font-bold text-sm">
                                                    <Check className="h-4 w-4" /> {thumbFile.name}
                                                    <button type="button" onClick={() => setThumbFile(null)} className="ml-2 w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="mx-auto w-10 h-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                                        <Upload className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-bold text-ueu-navy">Click to upload brand assets</span>
                                                        <p className="text-[11px] text-slate-400 font-medium mt-1">Recommended size: 1280x720 (16:9)</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setThumbFile(e.target.files[0]);
                                                                setValue('thumbnailUrl', '');
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-10 space-y-10">
                        <ListInput
                            label="What will students learn?"
                            placeholder="e.g. Build full-stack applications"
                            items={learningObjectives}
                            onChange={setLearningObjectives}
                        />

                        <ListInput
                            label="Requirements"
                            placeholder="e.g. Basic understanding of HTML"
                            items={requirements}
                            onChange={setRequirements}
                        />
                    </div>

                    <div className="flex justify-end pt-10 border-t border-slate-100">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || uploadingThumb} 
                            isLoading={isSubmitting || uploadingThumb}
                            className="h-14 rounded-2xl bg-ueu-navy hover:bg-ueu-blue text-white font-bold px-10 transition-all active:scale-95 shadow-xl shadow-blue-900/10 min-w-[200px]"
                        >
                            <Save className="mr-2 h-4 w-4" /> Simpan Draf Mata Kuliah
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
