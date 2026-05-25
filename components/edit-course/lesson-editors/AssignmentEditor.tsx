import React from 'react';
import { useForm } from 'react-hook-form';
import { ClipboardList, Trash2, Info, Calendar, Trophy, FileUp } from 'lucide-react';
import { courseService } from '../../../services/courseService';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { Card, CardContent } from '../../ui/Card';

export const AssignmentEditor: React.FC<any> = ({ lesson, onCancel, onSave, onDelete }) => {
    const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            title: lesson.title,
            isPublished: lesson.isPublished,
            content: lesson.content || '',
            points: lesson.points || 100,
            dueDate: lesson.dueDate || '',
            submissionType: lesson.submissionType || 'both'
        }
    });

    const content = watch('content');

    const onSubmit = async (data: any) => {
        try {
            await courseService.updateLesson(lesson.id, {
                ...data,
                duration: 'Assignment' 
            });
            await onSave();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="bg-purple-100 p-2 rounded-lg">
                        <ClipboardList className="h-5 w-5 text-purple-600" />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">Assignment Settings</h4>
                        <p className="text-xs text-slate-500">Configure task details and requirements</p>
                     </div>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-red-500 h-9 px-3 hover:text-red-600 hover:bg-red-50 transition-colors">
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Assignment
                 </Button>
             </div>

             <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card className="border-slate-200 shadow-xl rounded-[28px] overflow-hidden border">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-2 block ml-1">Assignment Title</label>
                            <Input 
                                {...register('title', { required: true })} 
                                className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold text-lg text-ueu-navy"
                                placeholder="e.g. Final Project Report"
                            />
                        </div>

                        <div className="p-6 bg-white">
                            <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-3 block ml-1">Task Instructions</label>
                            <div className="rounded-2xl border border-slate-200 focus-within:ring-4 focus-within:ring-ueu-blue/5 focus-within:border-ueu-blue overflow-hidden transition-all">
                                <RichTextEditor 
                                    value={content} 
                                    onChange={(val) => setValue('content', val, { shouldDirty: true, shouldTouch: true })}
                                    placeholder="Explain the task, steps for completion, and evaluation criteria..."
                                />
                            </div>
                            <div className="flex items-start gap-2 mt-3 px-1 text-[11px] text-slate-400 font-medium italic">
                                <Info className="h-3.5 w-3.5 mt-0.5 text-ueu-blue" />
                                <span>Clearly define what the student needs to submit and how it will be graded.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-ueu-navy/50 tracking-wider flex items-center gap-2 ml-1">
                            <div className="p-1.5 bg-amber-100 rounded-md">
                                <Trophy className="h-3 w-3 text-amber-600" />
                            </div>
                            Max Points
                        </label>
                        <Input 
                            type="number" 
                            {...register('points')} 
                            className="h-12 rounded-xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-4 font-bold text-ueu-navy"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-ueu-navy/50 tracking-wider flex items-center gap-2 ml-1">
                            <div className="p-1.5 bg-red-100 rounded-md">
                                <Calendar className="h-3 w-3 text-red-600" />
                            </div>
                            Due Date
                        </label>
                        <Input 
                            type="date" 
                            {...register('dueDate')} 
                            className="h-12 rounded-xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-4 font-bold text-ueu-navy"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-ueu-navy/50 tracking-wider flex items-center gap-2 ml-1">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                <FileUp className="h-3 w-3 text-ueu-blue" />
                            </div>
                            Submission
                        </label>
                        <select 
                            {...register('submissionType')}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-ueu-navy focus:outline-none focus:ring-4 focus:ring-ueu-blue/5 focus:border-ueu-blue appearance-none transition-all cursor-pointer shadow-sm shadow-blue-900/5"
                        >
                            <option value="text">Rich Text Only</option>
                            <option value="file">File Upload Only</option>
                            <option value="both">Text & File Upload</option>
                        </select>
                    </div>
                </div>

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
                        <span className="text-sm font-bold text-ueu-navy group-hover:text-ueu-blue transition-colors">Make assignment visible to students</span>
                    </label>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-ueu-navy transition-all">
                            Discard
                        </Button>
                        <Button type="submit" className="flex-[2] sm:flex-none h-12 px-10 rounded-xl bg-ueu-navy hover:bg-ueu-blue text-white font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg shadow-blue-900/20" isLoading={isSubmitting}>
                            Save Assignment
                        </Button>
                    </div>
                </div>
             </form>
        </div>
    );
};
