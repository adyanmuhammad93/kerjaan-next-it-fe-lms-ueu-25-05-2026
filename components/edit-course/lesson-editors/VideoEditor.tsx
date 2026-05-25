import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Video, Trash2, Upload, Link as LinkIcon, Check, X, FolderOpen } from 'lucide-react';
import { courseService } from '../../../services/courseService';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Card, CardContent } from '../../ui/Card';
import { AssetSelectorModal } from '../../AssetSelectorModal';

export const VideoEditor: React.FC<any> = ({ lesson, onCancel, onSave, onDelete }) => {
    const [uploadMode, setUploadMode] = useState<'url' | 'upload' | 'asset'>('url');
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm({
        defaultValues: {
            title: lesson.title,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            isPublished: lesson.isPublished,
            content: lesson.content
        }
    });

    const onSubmit = async (data: any) => {
        try {
            setUploading(true);
            let finalVideoUrl = data.videoUrl;

            // Handle file upload if in upload mode and file is selected
            if (uploadMode === 'upload' && file) {
                finalVideoUrl = await courseService.uploadFile(file);
            }

            await courseService.updateLesson(lesson.id, {
                ...data,
                videoUrl: finalVideoUrl
            });
            await onSave();
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="bg-blue-100 p-2 rounded-lg">
                        <Video className="h-5 w-5 text-blue-600" />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">Video Lesson</h4>
                        <p className="text-xs text-slate-500">Provide video content for your students</p>
                     </div>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-red-500 h-9 px-3 hover:text-red-600 hover:bg-red-50 transition-colors">
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Video
                 </Button>
             </div>

             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-slate-200 shadow-xl rounded-[28px] overflow-hidden border">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-2 block ml-1">Lesson Title</label>
                            <Input 
                                {...register('title', { required: true })} 
                                className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold text-lg text-ueu-navy"
                                placeholder="e.g. Setting up your workspace"
                            />
                        </div>

                        <div className="p-6 bg-white space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider block ml-1">Video Source</label>
                                <div className="flex border rounded-2xl p-1.5 bg-slate-100 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('upload')}
                                        className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all duration-300 ${uploadMode === 'upload' ? 'bg-white shadow-md text-ueu-blue' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Upload className="h-3.5 w-3.5" /> Upload File
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('asset')}
                                        className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all duration-300 ${uploadMode === 'asset' ? 'bg-white shadow-md text-ueu-blue' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" /> Assets Repo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadMode('url')}
                                        className={`flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all duration-300 ${uploadMode === 'url' ? 'bg-white shadow-md text-ueu-blue' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <LinkIcon className="h-3.5 w-3.5" /> External URL
                                    </button>
                                </div>
                            </div>

                            {uploadMode === 'url' ? (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <Input 
                                        {...register('videoUrl')} 
                                        placeholder="https://youtube.com/watch?v=..." 
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1">Supports YouTube, Vimeo, and direct MP4 links.</p>
                                </div>
                            ) : uploadMode === 'asset' ? (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50/50 transition-colors group">
                                        <Input {...register('videoUrl')} type="hidden" />
                                        {watch('videoUrl') ? (
                                            <div className="space-y-3">
                                                <div className="text-sm font-bold text-ueu-blue truncate max-w-sm mx-auto">{watch('videoUrl')}</div>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAssetModalOpen(true)} className="rounded-xl">
                                                    Change Asset
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                    <FolderOpen className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(true)} className="rounded-xl px-6 h-11 font-bold">
                                                        Browse Your Assets
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                    <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-10 text-center hover:bg-slate-50/50 hover:border-ueu-blue/30 transition-all group">
                                        {file ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                                                    <Check className="h-6 w-6" />
                                                </div>
                                                <div className="text-sm font-bold text-slate-700">{file.name}</div>
                                                <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline font-bold">
                                                    Remove file
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="mx-auto w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-ueu-blue group-hover:bg-blue-50 transition-all">
                                                    <Upload className="h-7 w-7" />
                                                </div>
                                                <div className="text-sm">
                                                    <label htmlFor="video-file-upload" className="font-bold text-ueu-blue cursor-pointer hover:underline">
                                                        Click to upload
                                                    </label> 
                                                    <span className="text-slate-400 ml-1">or drag and drop video file</span>
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-tight text-slate-300">MP4, WebM (Recommended under 100MB)</p>
                                                <input
                                                    id="video-file-upload"
                                                    type="file"
                                                    accept="video/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider block ml-1">Video Duration</label>
                                    <Input 
                                        {...register('duration')} 
                                        placeholder="e.g. 10:30" 
                                        className="h-12 rounded-xl border-slate-200 font-bold"
                                    />
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input 
                                                type="checkbox" 
                                                {...register('isPublished')} 
                                                className="w-5 h-5 rounded border-slate-300 text-ueu-blue focus:ring-ueu-blue transition-all" 
                                            />
                                            <span className="text-sm font-bold text-ueu-navy group-hover:text-ueu-blue transition-colors truncate">Publish this lesson</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider block ml-1">Video Description</label>
                                <Textarea 
                                    {...register('content')} 
                                    placeholder="Add any additional notes or context about this video..." 
                                    className="min-h-[100px] rounded-2xl border-slate-200 focus:border-ueu-blue transition-all p-4 text-sm font-medium"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={uploading || isSubmitting} className="h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-ueu-navy transition-all">
                        Discard
                    </Button>
                    <Button type="submit" className="h-12 px-10 rounded-xl bg-ueu-navy hover:bg-ueu-blue text-white font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg shadow-blue-900/20" isLoading={uploading || isSubmitting}>
                        {uploading ? 'Processing...' : 'Save Video Lesson'}
                    </Button>
                </div>
            </form>

            <AssetSelectorModal
                isOpen={isAssetModalOpen}
                onClose={() => setIsAssetModalOpen(false)}
                onSelect={(asset) => {
                    setValue('videoUrl', asset.fileUrl, { shouldDirty: true });
                    setIsAssetModalOpen(false);
                }}
            />
        </div>
    );
};