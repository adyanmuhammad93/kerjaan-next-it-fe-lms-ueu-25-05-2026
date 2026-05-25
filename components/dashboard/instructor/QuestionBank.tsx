
import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { QuizQuestion } from '../../../types';
import { questionBankService } from '../../../services/questionBankService';
import { useAuth } from '../../../hooks/useAuth';
import { QuestionEditorDialog } from './QuestionEditorDialog';

export const QuestionBank: React.FC = () => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    // Dialog State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchQuestions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await questionBankService.getQuestions(user.id, debouncedSearch);
            setQuestions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [user, debouncedSearch]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question? It will not be removed from quizzes where it's already used.")) return;
        try {
            await questionBankService.deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (e) {
            alert("Failed to delete question");
        }
    };

    const handleEdit = (q: QuizQuestion) => {
        setEditingQuestion(q);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setEditingQuestion(null);
        setIsEditorOpen(true);
    };

    // Helper to strip HTML for preview
    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 bg-[#F8FAFC] min-h-screen px-3 sm:px-4 lg:px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-ueu-blue/10 rounded-2xl">
                            <HelpCircle className="h-6 w-6 text-ueu-blue" />
                        </div>
                        <h2 className="text-2xl font-bold text-ueu-navy">Bank Soal</h2>
                    </div>
                    <p className="text-slate-500 font-medium ml-12">Kelola repositori pertanyaan kuis Anda untuk standarisasi penilaian.</p>
                </div>
                <Button 
                    onClick={handleCreate} 
                    className="bg-ueu-navy hover:bg-ueu-blue text-white rounded-xl h-12 px-6 shadow-md shadow-ueu-navy/10 transition-all duration-300 flex items-center gap-2 font-bold"
                >
                    <Plus className="h-5 w-5" /> Buat Pertanyaan Baru
                </Button>
            </div>

            <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="border-b border-slate-100 bg-[#F8FAFC]/50 p-6">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Cari pertanyaan atau kategori..." 
                                className="pl-11 h-12 bg-white border-slate-200 focus:border-ueu-blue focus:ring-ueu-blue rounded-xl shadow-sm placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-ueu-blue rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium animate-pulse">Menghimpun bank soal...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <HelpCircle className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="font-bold text-slate-800">Bank soal masih kosong</p>
                            <p className="text-sm">Mulai buat bank soal Anda untuk memudahkan pembuatan kuis.</p>
                            <Button 
                                variant="ghost" 
                                onClick={handleCreate} 
                                className="mt-6 text-ueu-blue hover:bg-ueu-blue/10 rounded-full font-bold transition-all"
                            >
                                Buat Pertanyaan Pertama Anda <Plus className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {questions.map(q => (
                                <div key={q.id} className="p-6 hover:bg-slate-50/70 transition-all flex gap-6 group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className={cn(
                                                "border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider",
                                                q.type === 'multiple' ? "bg-emerald-100 text-emerald-700" : "bg-blue-50 text-ueu-blue"
                                            )}>
                                                {q.type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {q.options.length} Opsi • Terakhir Diubah: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-base font-bold text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-ueu-blue transition-colors">
                                            {stripHtml(q.question) || <span className="italic text-slate-400">Pertanyaan Tanpa Judul</span>}
                                        </p>
                                        <div className="inline-flex items-center px-2 py-1 bg-slate-50 rounded-md text-[10px] text-slate-500 font-medium">
                                            <span className="font-black mr-1 uppercase">Kunci:</span> {
                                                q.type === 'text' 
                                                    ? q.options[0]?.text 
                                                    : q.options.filter(o => o.isCorrect).map(o => o.text).join(', ') || 'Belum diatur'
                                            }
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 rounded-full text-slate-400 hover:text-ueu-blue hover:bg-ueu-blue/10 transition-all" 
                                            onClick={() => handleEdit(q)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-9 w-9 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" 
                                            onClick={() => handleDelete(q.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="px-8 py-4 bg-[#F8FAFC]/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                    <span>Repositori Soal Terenkripsi</span>
                    <span className="text-ueu-blue">Total {questions.length} Pertanyaan</span>
                </div>
            </Card>

            <QuestionEditorDialog 
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                question={editingQuestion}
                instructorId={user?.id || ''}
                onSuccess={fetchQuestions}
            />
        </div>
    );
};
