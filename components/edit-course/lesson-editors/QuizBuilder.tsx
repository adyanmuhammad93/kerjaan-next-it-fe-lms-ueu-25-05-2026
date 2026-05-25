
import React, { useState, useEffect } from 'react';
import { HelpCircle, Trash2, X, Plus, Check, Type, GripVertical, ChevronDown, ChevronUp, Copy, AlertCircle, Save, BookOpen, Archive } from 'lucide-react';
import { courseService } from '../../../services/courseService';
import { questionBankService } from '../../../services/questionBankService';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Checkbox } from '../../ui/Checkbox';
import { Card, CardContent } from '../../ui/Card';
import { QuizData, QuizQuestion } from '../../../types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { cn } from '../../../lib/utils';
import { QuestionBankModal } from './QuestionBankModal';

// Helper to strip HTML for preview
const stripHtml = (html: string) => {
   if (!html) return "";
   const tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
};

export const QuizBuilder: React.FC<any> = ({ lesson, onCancel, onSave, onDelete }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(lesson.title);
    const [isPublished, setIsPublished] = useState(lesson.isPublished || false);
    
    // Parse initial questions from lesson content
    const parseQuestions = (content: string | undefined): QuizQuestion[] => {
        try {
            const parsed = content ? JSON.parse(content).questions : [];
            return Array.isArray(parsed) ? parsed.map((q: any) => ({ ...q, type: q.type || 'single' })) : [];
        } catch {
            return [];
        }
    };

    const [questions, setQuestions] = useState<QuizQuestion[]>(() => parseQuestions(lesson.content));
    const [saving, setSaving] = useState(false);
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
    
    // Bank Modal State
    const [isBankOpen, setIsBankOpen] = useState(false);
    
    // Track questions marked to be saved to bank
    const [questionsToBank, setQuestionsToBank] = useState<Set<string>>(new Set());

    // Sync state with prop changes
    useEffect(() => {
        setQuestions(parseQuestions(lesson.content));
    }, [lesson.content]);

    const handleAddQuestion = () => {
        const newId = crypto.randomUUID();
        const newQuestion: QuizQuestion = { 
            id: newId, 
            question: '', 
            type: 'single', 
            options: [
                { id: crypto.randomUUID(), text: '', isCorrect: false },
                { id: crypto.randomUUID(), text: '', isCorrect: false }
            ] 
        };
        setQuestions([...questions, newQuestion]);
        setExpandedQuestionId(newId); // Auto-expand new question
    };

    const handleImportQuestions = (newQuestions: QuizQuestion[]) => {
        setQuestions([...questions, ...newQuestions]);
    };

    // Keep individual save for immediate action
    const handleSaveToBank = async (e: React.MouseEvent, q: QuizQuestion) => {
        e.stopPropagation();
        if (!user) return;
        if (!q.question.trim()) {
            alert("Question text is empty.");
            return;
        }
        
        try {
            await questionBankService.saveQuestion(user.id, q);
            alert("Question saved to your bank!");
        } catch (err: any) {
            alert("Failed to save: " + err.message);
        }
    };

    const toggleSaveToBank = (qId: string) => {
        const newSet = new Set(questionsToBank);
        if (newSet.has(qId)) {
            newSet.delete(qId);
        } else {
            newSet.add(qId);
        }
        setQuestionsToBank(newSet);
    };

    const handleDuplicateQuestion = (e: React.MouseEvent, q: QuizQuestion) => {
        e.stopPropagation();
        const newId = crypto.randomUUID();
        const duplicatedQuestion: QuizQuestion = {
            ...q,
            id: newId,
            question: q.question + ' (Copy)',
            options: q.options.map(o => ({ ...o, id: crypto.randomUUID() }))
        };
        setQuestions([...questions, duplicatedQuestion]);
        setExpandedQuestionId(newId);
    };

    const handleUpdateQuestion = (qId: string, content: string) => {
        setQuestions(questions.map(q => q.id === qId ? { ...q, question: content } : q));
    };

    const handleUpdateQuestionType = (qId: string, type: 'single' | 'multiple' | 'text') => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            let updatedOptions = q.options;
            if (type === 'text' && q.options.length === 0) {
                 updatedOptions = [{ id: crypto.randomUUID(), text: '', isCorrect: true }];
            } else if (type === 'text' && q.options.length > 0) {
                 updatedOptions = [q.options[0]];
                 updatedOptions[0].isCorrect = true;
            } else if (type === 'single') {
                 let foundCorrect = false;
                 updatedOptions = q.options.map(o => {
                     if (o.isCorrect && !foundCorrect) {
                         foundCorrect = true;
                         return o;
                     }
                     return { ...o, isCorrect: false };
                 });
            }
            return { ...q, type, options: updatedOptions };
        }));
    };

    const handleDeleteQuestion = (e: React.MouseEvent, qId: string) => {
        e.stopPropagation();
        if (questions.length === 1 && questions[0].question.length > 0) {
            if(!confirm("Delete the only question?")) return;
        }
        setQuestions(questions.filter(q => q.id !== qId));
        // Remove from bank set if deleted
        if (questionsToBank.has(qId)) {
            const newSet = new Set(questionsToBank);
            newSet.delete(qId);
            setQuestionsToBank(newSet);
        }
    };

    const handleAddOption = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: [...q.options, { id: crypto.randomUUID(), text: '', isCorrect: false }]
            };
        }));
    };

    const handleUpdateOption = (qId: string, oId: string, text: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: q.options.map(o => o.id === oId ? { ...o, text } : o)
            };
        }));
    };
    
    const handleUpdateTextAnswer = (qId: string, text: string) => {
        setQuestions(questions.map(q => {
             if (q.id !== qId) return q;
             const newOptions = q.options.length > 0 ? [...q.options] : [{ id: crypto.randomUUID(), text: '', isCorrect: true }];
             newOptions[0].text = text;
             newOptions[0].isCorrect = true;
             return { ...q, options: newOptions };
        }));
    };

    const handleSetCorrectOption = (qId: string, oId: string) => {
        setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            if (q.type === 'multiple') {
                return {
                    ...q,
                    options: q.options.map(o => o.id === oId ? { ...o, isCorrect: !o.isCorrect } : o)
                };
            }
            return {
                ...q,
                options: q.options.map(o => ({ ...o, isCorrect: o.id === oId }))
            };
        }));
    };

    const handleDeleteOption = (qId: string, oId: string) => {
         setQuestions(questions.map(q => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: q.options.filter(o => o.id !== oId)
            };
        }));
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        
        const items = Array.from(questions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setQuestions(items);
    };

    const toggleExpand = (id: string) => {
        setExpandedQuestionId(expandedQuestionId === id ? null : id);
    };

    const handleSave = async () => {
        if (!user) return;

        // Validation
        const invalidQuestion = questions.find(q => {
            if (q.type === 'text') return !q.options[0]?.text;
            return false;
        });

        if (invalidQuestion) {
            alert("Please ensure all text answer questions have a valid answer.");
            return;
        }

        setSaving(true);
        try {
            // 1. Process Bank Saves
            const bankPromises = questions
                .filter(q => questionsToBank.has(q.id) && q.question.trim().length > 0)
                .map(q => questionBankService.saveQuestion(user.id, q));

            if (bankPromises.length > 0) {
                await Promise.all(bankPromises);
                setQuestionsToBank(new Set()); // Clear queue after saving
            }

            // 2. Save Lesson Content
            const quizData: QuizData = { questions };
            const updates = {
                title,
                isPublished,
                content: JSON.stringify(quizData),
                duration: `${Math.max(5, questions.length * 2)} min quiz`
            };

            await courseService.updateLesson(lesson.id, updates);
            await onSave(updates); // Pass updates back for optimistic UI
        } catch (e) {
            console.error(e);
            alert("Failed to save quiz");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     <div className="bg-amber-100 p-2 rounded-lg">
                        <HelpCircle className="h-5 w-5 text-amber-600" />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800 tracking-tight">Assessment Builder</h4>
                        <p className="text-xs text-slate-500">Create quizzes and knowledge checks</p>
                     </div>
                 </div>
                 <Button type="button" variant="ghost" size="sm" onClick={onDelete} className="text-red-500 h-9 px-3 hover:text-red-600 hover:bg-red-50 transition-colors">
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Quiz
                 </Button>
             </div>

             <div className="space-y-6">
                <Card className="border-slate-200 shadow-xl rounded-[28px] overflow-hidden border">
                    <CardContent className="p-0">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <label className="text-[11px] font-black uppercase text-ueu-navy/40 tracking-wider mb-2 block ml-1">Quiz Title</label>
                                <Input 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="h-14 rounded-2xl border-slate-200 focus:border-ueu-blue focus:ring-4 focus:ring-ueu-blue/5 transition-all px-6 font-bold text-lg text-ueu-navy"
                                    placeholder="e.g. Mid-term Assessment"
                                />
                            </div>
                            <div className="md:w-64 pt-6 md:pt-0">
                                <div className="p-3 bg-white rounded-2xl border border-slate-200 h-14 flex items-center">
                                    <label className="flex items-center gap-3 cursor-pointer group w-full">
                                        <Checkbox 
                                            id="publish-quiz"
                                            checked={isPublished} 
                                            onCheckedChange={(checked) => setIsPublished(checked as boolean)}
                                            className="w-5 h-5 rounded-md border-slate-300 text-ueu-blue focus:ring-ueu-blue transition-all" 
                                        />
                                        <span className="text-[11px] font-black uppercase text-ueu-navy/50 group-hover:text-ueu-blue transition-colors">Publish Quiz</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="quiz-questions">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {questions.map((q, index) => {
                                const isExpanded = expandedQuestionId === q.id;
                                const questionText = stripHtml(q.question);
                                const hasCorrectAnswer = q.type === 'text' 
                                    ? !!q.options[0]?.text 
                                    : q.options.some(o => o.isCorrect);

                                return (
                                    <Draggable key={q.id} draggableId={q.id} index={index}>
                                        {(provided) => (
                                            <div 
                                                ref={provided.innerRef} 
                                                {...provided.draggableProps} 
                                                className={cn(
                                                    "border rounded-lg bg-white transition-all shadow-sm",
                                                    isExpanded ? "ring-2 ring-primary/10 border-primary/30" : "hover:border-slate-300"
                                                )}
                                            >
                                                {/* Header Row */}
                                                <div 
                                                    className="flex items-center gap-3 p-3 cursor-pointer select-none"
                                                    onClick={() => toggleExpand(q.id)}
                                                >
                                                    <div 
                                                        {...provided.dragHandleProps} 
                                                        className="text-slate-300 hover:text-slate-500 p-1 cursor-grab active:cursor-grabbing"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <GripVertical className="h-4 w-4" />
                                                    </div>
                                                    
                                                    <div className="flex flex-col flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Q{index + 1}</span>
                                                            <span className={cn("text-sm font-medium truncate", !questionText && "text-slate-400 italic")}>
                                                                {questionText || "Empty Question"}
                                                            </span>
                                                        </div>
                                                        {!isExpanded && (
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                                <span className="capitalize">{q.type.replace('_', ' ')}</span>
                                                                <span>•</span>
                                                                <span>{q.options.length} Options</span>
                                                                {questionsToBank.has(q.id) && (
                                                                    <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1 rounded">
                                                                        <Archive className="h-3 w-3" /> Queued for Bank
                                                                    </span>
                                                                )}
                                                                {!hasCorrectAnswer && (
                                                                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1 rounded">
                                                                        <AlertCircle className="h-3 w-3" /> No answer set
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                                            onClick={(e) => handleSaveToBank(e, q)}
                                                            title="Save to Bank (Immediately)"
                                                        >
                                                            <Save className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                            onClick={(e) => handleDuplicateQuestion(e, q)}
                                                            title="Duplicate"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                            onClick={(e) => handleDeleteQuestion(e, q.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Expanded Body */}
                                                {isExpanded && (
                                                    <div className="p-4 pt-2 border-t bg-slate-50/50 rounded-b-lg animate-in slide-in-from-top-1 duration-200">
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center relative z-20">
                                                                    <label className="text-xs font-medium uppercase text-muted-foreground">Question Text</label>
                                                                    <select 
                                                                        className="h-8 text-xs rounded border border-input bg-white px-2 py-1"
                                                                        value={q.type}
                                                                        onChange={(e) => handleUpdateQuestionType(q.id, e.target.value as any)}
                                                                    >
                                                                        <option value="single">Single Choice</option>
                                                                        <option value="multiple">Multiple Choice</option>
                                                                        <option value="text">Text Answer</option>
                                                                    </select>
                                                                </div>
                                                                {/* Added margin-top to prevent overlap with floating toolbar of RTE */}
                                                                <div className="mt-12">
                                                                    <RichTextEditor 
                                                                        value={q.question} 
                                                                        onChange={(val) => handleUpdateQuestion(q.id, val)}
                                                                        placeholder="Type your question here..."
                                                                        className="bg-white min-h-[100px]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <label className="text-xs font-medium uppercase text-muted-foreground">
                                                                    {q.type === 'text' ? 'Accepted Answer' : 'Answer Options'}
                                                                </label>
                                                                
                                                                {q.type === 'text' ? (
                                                                    <div className="flex flex-col gap-2 p-3 bg-white border rounded-md">
                                                                        <div className="flex items-center gap-2">
                                                                            <Type className="h-4 w-4 text-slate-400 shrink-0" />
                                                                            <Input 
                                                                                value={q.options[0]?.text || ''} 
                                                                                onChange={(e) => handleUpdateTextAnswer(q.id, e.target.value)}
                                                                                placeholder="Enter the correct text answer"
                                                                                className="border-0 shadow-none focus-visible:ring-0 px-0"
                                                                            />
                                                                        </div>
                                                                        <p className="text-[10px] text-muted-foreground border-t pt-2">
                                                                            Student answer must match this text (case-insensitive).
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {q.options.map((option, idx) => (
                                                                            <div key={option.id} className="flex items-center gap-2 group/opt">
                                                                                <div 
                                                                                    onClick={() => handleSetCorrectOption(q.id, option.id)}
                                                                                    className={cn(
                                                                                        "cursor-pointer w-6 h-6 flex items-center justify-center border transition-all shrink-0",
                                                                                        q.type === 'single' ? "rounded-full" : "rounded-md",
                                                                                        option.isCorrect 
                                                                                            ? "bg-green-600 border-green-600 text-white shadow-sm" 
                                                                                            : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                                                                                    )}
                                                                                    title="Mark as correct"
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5" />
                                                                                </div>
                                                                                
                                                                                <div className="flex-1 relative">
                                                                                    <Input 
                                                                                        value={option.text} 
                                                                                        onChange={(e) => handleUpdateOption(q.id, option.id, e.target.value)}
                                                                                        className={cn(
                                                                                            "h-9 text-sm pr-8 bg-white",
                                                                                            option.isCorrect && "border-green-200 bg-green-50/30"
                                                                                        )}
                                                                                        placeholder={`Option ${idx + 1}`}
                                                                                    />
                                                                                    <button 
                                                                                        onClick={() => handleDeleteOption(q.id, option.id)} 
                                                                                        className="absolute right-2 top-2.5 text-slate-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        
                                                                        <Button 
                                                                            variant="outline" 
                                                                            size="sm" 
                                                                            onClick={() => handleAddOption(q.id)}
                                                                            className="w-full border-dashed text-slate-500 hover:text-primary hover:border-primary/50 mt-2 h-8 text-xs"
                                                                        >
                                                                            <Plus className="h-3 w-3 mr-1" /> Add Option
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-4 border-t flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox 
                                                                        id={`save-bank-${q.id}`}
                                                                        checked={questionsToBank.has(q.id)}
                                                                        onCheckedChange={() => toggleSaveToBank(q.id)}
                                                                    />
                                                                    <label 
                                                                        htmlFor={`save-bank-${q.id}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600 cursor-pointer select-none"
                                                                    >
                                                                        Save to Question Bank
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {questions.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50">
                    <HelpCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No questions added yet.</p>
                    <div className="flex justify-center gap-3">
                        <Button onClick={handleAddQuestion} variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Create New
                        </Button>
                        <Button onClick={() => setIsBankOpen(true)} variant="outline">
                            <BookOpen className="mr-2 h-4 w-4" /> Import from Bank
                        </Button>
                    </div>
                </div>
            )}

            {questions.length > 0 && (
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleAddQuestion} className="flex-1 border-dashed py-6 text-slate-600 hover:text-primary hover:border-primary/50 hover:bg-slate-50">
                        <Plus className="h-5 w-5 mr-2" /> Add Question
                    </Button>
                    <Button variant="outline" onClick={() => setIsBankOpen(true)} className="flex-1 border-dashed py-6 text-slate-600 hover:text-primary hover:border-primary/50 hover:bg-slate-50">
                        <BookOpen className="h-5 w-5 mr-2" /> Import from Bank
                    </Button>
                </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-6">
                <Button type="button" variant="ghost" onClick={onCancel}>Discard Changes</Button>
                <Button type="button" onClick={handleSave} isLoading={saving} className="min-w-[120px]">
                    Save Quiz
                </Button>
            </div>

            <QuestionBankModal 
                open={isBankOpen} 
                onOpenChange={setIsBankOpen} 
                onImport={handleImportQuestions} 
            />
        </div>
    );
};
