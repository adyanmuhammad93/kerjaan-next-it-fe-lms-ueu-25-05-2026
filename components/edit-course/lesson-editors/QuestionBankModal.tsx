
import React, { useState, useEffect } from 'react';
import { Search, Check, Loader2, Trash2, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { questionBankService } from '../../../services/questionBankService';
import { useAuth } from '../../../hooks/useAuth';
import { QuizQuestion } from '../../../types';
import { Badge } from '../../ui/Badge';

interface QuestionBankModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (questions: QuizQuestion[]) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({ open, onOpenChange, onImport }) => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchQuestions = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await questionBankService.getQuestions(user.id, search);
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchQuestions();
            setSelectedIds(new Set());
        }
    }, [open, search]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleImport = () => {
        const selectedQuestions = questions.filter(q => selectedIds.has(q.id));
        // Clone to give them new IDs for the quiz context so they are independent
        const clonedQuestions = selectedQuestions.map(q => ({
            ...q,
            id: crypto.randomUUID(),
            options: q.options.map(o => ({ ...o, id: crypto.randomUUID() }))
        }));
        onImport(clonedQuestions);
        onOpenChange(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Remove this question from your bank?")) return;
        try {
            await questionBankService.deleteQuestion(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (selectedIds.has(id)) {
                const newSet = new Set(selectedIds);
                newSet.delete(id);
                setSelectedIds(newSet);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to strip HTML
    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Question Bank</DialogTitle>
                    <DialogDescription>Reuse questions from your personal library.</DialogDescription>
                </DialogHeader>
                
                <div className="relative my-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search your questions..." 
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto border rounded-md p-2 space-y-2 min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <HelpCircle className="h-8 w-8 mb-2 opacity-20" />
                            <p>No questions found in bank.</p>
                        </div>
                    ) : (
                        questions.map(q => (
                            <div 
                                key={q.id} 
                                className={`p-3 border rounded-lg cursor-pointer transition-all flex items-start gap-3 hover:bg-slate-50 ${selectedIds.has(q.id) ? 'border-primary ring-1 ring-primary bg-indigo-50/30' : 'border-slate-200'}`}
                                onClick={() => toggleSelection(q.id)}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${selectedIds.has(q.id) ? 'bg-primary border-primary' : 'border-slate-300 bg-white'}`}>
                                    {selectedIds.has(q.id) && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm font-medium line-clamp-2">{stripHtml(q.question) || "Untitled Question"}</p>
                                        <Badge variant="outline" className="text-[10px] uppercase shrink-0">{q.type}</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{q.options.length} Options</p>
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(q.id, e)}
                                    className="text-slate-400 hover:text-red-500 p-1 hover:bg-white rounded"
                                    title="Delete from bank"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <div className="text-xs text-muted-foreground self-center mr-auto">
                        {selectedIds.size} selected
                    </div>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleImport} disabled={selectedIds.size === 0}>
                        Import Selected
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
