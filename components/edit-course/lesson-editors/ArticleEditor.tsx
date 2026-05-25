import React from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Trash2 } from 'lucide-react';
import { courseService } from '../../../services/courseService';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { Card, CardContent } from '../../ui/Card';

export const ArticleEditor: React.FC<any> = ({ lesson, onCancel, onSave, onDelete }) => {
    const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            title: lesson.title,
            isPublished: lesson.isPublished,
            content: lesson.content || ''
        }
    });

    React.useEffect(() => {
        register('content', { required: true });
    }, [register]);

    const content = watch('content');

    const onSubmit = async (data: any) => {
        try {
            await courseService.updateLesson(lesson.id, {
                ...data,
                // Simple estimate: HTML string length is roughly text length + tags. 
                duration: `${Math.ceil((data.content?.length || 0) / 1000)} min read` 
            });
            await onSave({
                ...data,
                duration: `${Math.ceil((data.content?.length || 0) / 1000)} min read`
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="bg-emerald-100 p-2 rounded-lg">
                        <FileText className="h-5 w-5 text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">Article Content</h4>
                        <p className="text-xs text-slate-500">Write reading materials for your students</p>
                     </div>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-red-500 h-9 px-3 hover:text-red-600 hover:bg-red-50 transition-colors">
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Article
                 </Button>
             </div>

             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-slate-200 shadow-xl rounded-[28px] overflow-hidden border">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-2 block ml-1">Article Title</label>
                            <Input 
                                {...register('title', { required: true })} 
                                className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold text-lg text-ueu-navy"
                                placeholder="e.g. Deep Dive into React Hooks"
                            />
                        </div>

                        <div className="p-6 bg-white">
                            <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-3 block ml-1">Article Body</label>
                            <div className="rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-ueu-blue/5 focus-within:border-ueu-blue overflow-hidden transition-all">
                                <RichTextEditor 
                                    value={content || ''} 
                                    onChange={(val) => setValue('content', val, { shouldDirty: true, shouldTouch: true, shouldValidate: true })} 
                                    placeholder="Write your article here..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                id="isPublished"
                                {...register('isPublished')} 
                                className="w-5 h-5 rounded-md border-slate-300 text-ueu-blue focus:ring-ueu-blue transition-all" 
                            />
                        </div>
                        <span className="text-sm font-bold text-ueu-navy group-hover:text-ueu-blue transition-colors">Publish and notify students</span>
                    </label>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-ueu-navy transition-all">
                            Discard
                        </Button>
                        <Button type="submit" className="flex-[2] sm:flex-none h-12 px-10 rounded-xl bg-ueu-navy hover:bg-ueu-blue text-white font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg shadow-blue-900/20" isLoading={isSubmitting}>
                            Save Article
                        </Button>
                    </div>
                </div>
             </form>
        </div>
    );
};
