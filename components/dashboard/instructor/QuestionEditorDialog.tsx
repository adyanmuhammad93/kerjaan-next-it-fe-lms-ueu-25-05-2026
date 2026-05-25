
import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, X, Type } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { QuizQuestion } from '../../../types';
import { questionBankService } from '../../../services/questionBankService';
import { cn } from '../../../lib/utils';

interface QuestionEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    question?: QuizQuestion | null;
    instructorId: string;
    onSuccess: () => void;
}

export const QuestionEditorDialog: React.FC<QuestionEditorDialogProps> = ({ 
    open, 
    onOpenChange, 
    question, 
    instructorId, 
    onSuccess 
}) => {
    const [formData, setFormData] = useState<QuizQuestion>({
        id: '',
        question: '',
        type: 'single',
        options: []
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            if (question) {
                setFormData({ ...question });
            } else {
                // Reset for new question
                setFormData({
                    id: crypto.randomUUID(), // Temp ID
                    question: '',
                    type: 'single',
                    options: [
                        { id: crypto.randomUUID(), text: '', isCorrect: false },
                        { id: crypto.randomUUID(), text: '', isCorrect: false }
                    ]
                });
            }
        }
    }, [open, question]);

    const handleTypeChange = (type: 'single' | 'multiple' | 'text') => {
        let updatedOptions = formData.options;
        if (type === 'text') {
             // For text, we only need one "option" acting as the correct answer key
             updatedOptions = [{ id: crypto.randomUUID(), text: updatedOptions[0]?.text || '', isCorrect: true }];
        } else if (type === 'single') {
             // Ensure only one is correct if switching to single
             let foundCorrect = false;
             updatedOptions = updatedOptions.map(o => {
                 if (o.isCorrect && !foundCorrect) {
                     foundCorrect = true;
                     return o;
                 }
                 return { ...o, isCorrect: false };
             });
             // If fewer than 2 options when coming from text, add one
             if (updatedOptions.length < 2) {
                 updatedOptions.push({ id: crypto.randomUUID(), text: '', isCorrect: false });
             }
        }
        setFormData({ ...formData, type, options: updatedOptions });
    };

    const handleOptionChange = (id: string, text: string) => {
        setFormData({
            ...formData,
            options: formData.options.map(o => o.id === id ? { ...o, text } : o)
        });
    };

    const handleCorrectChange = (id: string) => {
        if (formData.type === 'multiple') {
            setFormData({
                ...formData,
                options: formData.options.map(o => o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)
            });
        } else {
            setFormData({
                ...formData,
                options: formData.options.map(o => ({ ...o, isCorrect: o.id === id }))
            });
        }
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [...formData.options, { id: crypto.randomUUID(), text: '', isCorrect: false }]
        });
    };

    const removeOption = (id: string) => {
        setFormData({
            ...formData,
            options: formData.options.filter(o => o.id !== id)
        });
    };

    const handleSave = async () => {
        if (!formData.question.trim()) {
            alert("Question text cannot be empty.");
            return;
        }
        if (formData.type !== 'text' && formData.options.length < 2) {
            alert("Multiple choice questions must have at least 2 options.");
            return;
        }

        setSaving(true);
        try {
            if (question) {
                // Update
                await questionBankService.updateQuestion(question.id, {
                    question: formData.question,
                    type: formData.type,
                    options: formData.options
                });
            } else {
                // Create
                await questionBankService.saveQuestion(instructorId, formData);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            alert(error.message || "Failed to save question");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-0 rounded-[32px] shadow-2xl overflow-hidden bg-white text-slate-800">
                <DialogHeader className="p-8 pb-4 bg-[#F8FAFC]/50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-[#0078C1] bg-opacity-10 rounded-xl">
                            <Plus className="h-5 w-5 text-[#0078C1]" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-[#003366]">
                            {question ? 'Sunting Pertanyaan' : 'Buat Pertanyaan Baru'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500 font-medium ml-11">
                        {question ? 'Perbarui detail pertanyaan dalam bank soal Anda.' : 'Tambahkan pertanyaan baru ke bank soal pribadi Anda.'}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto pr-4 pl-8 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#0078C1]"></div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipe Pertanyaan</label>
                            </div>
                            <select 
                                className="h-11 text-sm rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-1 font-bold text-[#003366] focus:ring-2 focus:ring-[#0078C1]/20 outline-none transition-all cursor-pointer min-w-[200px]"
                                value={formData.type}
                                onChange={(e) => handleTypeChange(e.target.value as any)}
                            >
                                <option value="single">Pilihan Tunggal</option>
                                <option value="multiple">Pilihan Majemuk</option>
                                <option value="text">Jawaban Teks</option>
                            </select>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#0078C1]"></div>
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Teks Pertanyaan</label>
                            </div>
                            <RichTextEditor 
                                value={formData.question}
                                onChange={(val) => setFormData({ ...formData, question: val })}
                                placeholder="Tuliskan pertanyaan Anda di sini..."
                                className="min-h-[160px] rounded-[24px] border border-slate-100 bg-[#F8FAFC] p-4 text-[#003366] font-medium shadow-inner focus-within:bg-white focus-within:border-[#0078C1] transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#0078C1]"></div>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                {formData.type === 'text' ? 'Kunci Jawaban' : 'Opsi Jawaban'}
                            </label>
                        </div>

                        {formData.type === 'text' ? (
                            <div className="flex items-center gap-3 p-4 border border-[#0078C1]/10 rounded-[20px] bg-[#F8FAFC] shadow-sm">
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                    <Type className="h-4 w-4 text-[#0078C1]" />
                                </div>
                                <Input 
                                    value={formData.options[0]?.text || ''}
                                    onChange={(e) => handleOptionChange(formData.options[0]?.id, e.target.value)}
                                    placeholder="Masukkan teks jawaban yang benar"
                                    className="bg-white border-transparent focus:border-[#0078C1] focus:ring-[#0078C1] rounded-xl h-11 font-bold text-[#003366]"
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {formData.options.map((opt, idx) => (
                                    <div key={opt.id} className="flex items-center gap-3 group">
                                        <button
                                            type="button"
                                            onClick={() => handleCorrectChange(opt.id)}
                                            className={cn(
                                                "w-8 h-8 flex items-center justify-center border transition-all shrink-0 shadow-sm",
                                                formData.type === 'single' ? "rounded-full" : "rounded-xl",
                                                opt.isCorrect 
                                                    ? "bg-[#0078C1] border-[#0078C1] text-white ring-4 ring-[#0078C1]/10" 
                                                    : "bg-white border-slate-200 text-transparent hover:border-[#0078C1]"
                                            )}
                                            title="Tandai sebagai benar"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 relative">
                                            <Input 
                                                value={opt.text}
                                                onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                                                placeholder={`Opsi Jawaban ${idx + 1}`}
                                                className={cn(
                                                    "h-12 px-5 font-bold transition-all border-slate-100",
                                                    opt.isCorrect 
                                                        ? "bg-[#F0FDFA] border-emerald-200 text-[#003366] rounded-2xl" 
                                                        : "bg-[#F8FAFC] rounded-2xl focus:bg-white focus:border-[#0078C1]/30"
                                                )}
                                            />
                                        </div>
                                        <Button 
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeOption(opt.id)}
                                            className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="w-full h-14 border-dashed border-2 border-slate-200 bg-white hover:bg-[#F8FAFC] hover:border-[#0078C1] hover:text-[#0078C1] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group" 
                                    onClick={addOption}
                                >
                                    <div className="p-1 bg-slate-100 group-hover:bg-[#0078C1]/10 rounded-lg transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    Tambah Opsi Lainnya
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 px-8 border-t border-slate-100 bg-[#F8FAFC]/30 flex flex-row items-center justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="h-12 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 hover:text-[#003366] transition-all"
                    >
                        Batalkan
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={handleSave} 
                            isLoading={saving}
                            className="h-12 px-10 rounded-2xl bg-[#003366] hover:bg-[#0078C1] text-white font-bold transition-all shadow-lg shadow-[#003366]/20"
                        >
                            Simpan Pertanyaan
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
