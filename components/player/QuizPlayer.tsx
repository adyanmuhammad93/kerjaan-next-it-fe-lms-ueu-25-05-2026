
import React, { useState, useMemo, useEffect } from 'react';
import { QuizData, QuizQuestion } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';

export interface QuizPlayerProps {
    lessonId: string;
    quizContent: string;
    onComplete: () => void;
    onSaveResult?: (score: number, answers: any) => Promise<void>;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ lessonId, quizContent, onComplete, onSaveResult }) => {
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const quizData: QuizData = useMemo(() => {
        try {
            const parsed = JSON.parse(quizContent);
            return parsed;
        } catch {
            return { questions: [] };
        }
    }, [quizContent]);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!user) return;
            try {
                const submission = await assignmentService.getSubmission(lessonId, user.id);
                if (submission) {
                    setScore(submission.grade || 0);
                    if (submission.content) {
                        try {
                            setAnswers(JSON.parse(submission.content));
                        } catch (e) {
                            console.error("Failed to parse previous answers");
                        }
                    }
                    setFeedback(submission.feedback || null);
                    setSubmitted(true);
                }
            } catch (error) {
                console.error("Failed to load quiz submission", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [lessonId, user]);

    if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

    if (!quizData.questions || quizData.questions.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No questions in this quiz.</div>;
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

    const handleSingleSelect = (optionId: string) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentQuestion.id]: optionId });
    };

    const handleMultipleSelect = (optionId: string) => {
        if (submitted) return;
        const currentAns = (answers[currentQuestion.id] as string[]) || [];
        if (currentAns.includes(optionId)) {
            setAnswers({ ...answers, [currentQuestion.id]: currentAns.filter(id => id !== optionId) });
        } else {
            setAnswers({ ...answers, [currentQuestion.id]: [...currentAns, optionId] });
        }
    };

    const handleTextAnswer = (text: string) => {
        if (submitted) return;
        setAnswers({ ...answers, [currentQuestion.id]: text });
    };

    const calculateScore = () => {
        let correctCount = 0;
        quizData.questions.forEach(q => {
            const userAnswer = answers[q.id];
            
            if (q.type === 'single') {
                const correctOption = q.options.find(o => o.isCorrect);
                if (correctOption && userAnswer === correctOption.id) correctCount++;
            } else if (q.type === 'multiple') {
                const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);
                const userIds = (userAnswer as string[]) || [];
                // Check if all correct IDs are selected and no extra IDs
                if (correctOptionIds.length === userIds.length && correctOptionIds.every(id => userIds.includes(id))) {
                    correctCount++;
                }
            } else if (q.type === 'text') {
                const correctText = q.options.find(o => o.isCorrect)?.text || '';
                if (String(userAnswer || '').trim().toLowerCase() === correctText.trim().toLowerCase()) {
                    correctCount++;
                }
            }
        });
        return Math.round((correctCount / quizData.questions.length) * 100);
    };

    const handleSubmitQuiz = async () => {
        const finalScore = calculateScore();
        setScore(finalScore);
        
        setIsSaving(true);
        try {
            if (onSaveResult) {
                await onSaveResult(finalScore, answers);
            }
            
            setSubmitted(true);
            setFeedback(null); // Clear old feedback on retry/submit
            if (finalScore >= 70) {
                onComplete();
            }
        } catch (error: any) {
            console.error(error);
            alert("Failed to save result: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setFeedback(null);
        setCurrentQuestionIndex(0);
        setScore(0);
    };

    if (!started && !submitted) {
        return (
            <Card className="w-full max-w-2xl mx-auto mt-10 text-center p-8">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Ready to test your knowledge?</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground mb-4">
                    This quiz contains {quizData.questions.length} questions. You need 70% to pass.
                </CardContent>
                <CardFooter className="justify-center">
                    <Button size="lg" onClick={() => setStarted(true)}>Start Quiz</Button>
                </CardFooter>
            </Card>
        );
    }

    if (submitted) {
        const passed = score >= 70;
        return (
            <Card className="w-full max-w-2xl mx-auto mt-10 shadow-lg border-2 border-slate-100">
                <CardHeader className="text-center pb-2">
                    <div className={cn("mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm", passed ? "bg-green-100" : "bg-red-100")}>
                        {passed ? <Trophy className="h-12 w-12 text-green-600" /> : <XCircle className="h-12 w-12 text-red-600" />}
                    </div>
                    <CardTitle className="text-4xl font-bold mb-2">{score}%</CardTitle>
                    <div className={cn("text-lg font-medium", passed ? "text-green-600" : "text-red-600")}>
                        {passed ? "Passed" : "Failed"}
                    </div>
                </CardHeader>
                <CardContent className="text-center text-slate-500 pb-8 space-y-6">
                    <p>
                        {passed ? "Congratulations! You have mastered this lesson." : "Don't give up! Review the material and try again."}
                    </p>

                    {feedback && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left max-w-lg mx-auto">
                            <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Instructor Feedback
                            </h4>
                            <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{feedback}</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center gap-4 border-t bg-slate-50/50 p-6">
                    {!passed && (
                        <Button variant="outline" size="lg" onClick={handleRetry} className="bg-white">
                            <RefreshCw className="mr-2 h-4 w-4" /> Retry Quiz
                        </Button>
                    )}
                    {passed && (
                        <Button size="lg" onClick={onComplete} className="bg-green-600 hover:bg-green-700">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                    className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
                    style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                />
            </div>

            <Card className="border-slate-200 shadow-md">
                <CardHeader className="border-b bg-slate-50/50 pb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
                        {currentQuestion.type === 'multiple' && <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">Multiple Choice</span>}
                    </div>
                    {/* Render HTML content safely since RichTextEditor produces HTML */}
                    <div 
                        className="text-xl font-medium text-slate-900 leading-relaxed prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{ __html: currentQuestion.question }} 
                    />
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-4">
                    {currentQuestion.type === 'text' ? (
                        <Input 
                            placeholder="Type your answer here..." 
                            value={answers[currentQuestion.id] as string || ''}
                            onChange={(e) => handleTextAnswer(e.target.value)}
                            autoFocus
                            className="text-lg p-6"
                        />
                    ) : (
                        <div className="grid gap-3">
                            {currentQuestion.options.map((option) => {
                                const isSelected = currentQuestion.type === 'single' 
                                    ? answers[currentQuestion.id] === option.id
                                    : ((answers[currentQuestion.id] as string[]) || []).includes(option.id);
                                
                                return (
                                    <div 
                                        key={option.id}
                                        onClick={() => currentQuestion.type === 'single' ? handleSingleSelect(option.id) : handleMultipleSelect(option.id)}
                                        className={cn(
                                            "flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:bg-slate-50 group",
                                            isSelected 
                                                ? "border-indigo-600 bg-indigo-50/30 shadow-sm" 
                                                : "border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 transition-colors",
                                            isSelected 
                                                ? "border-indigo-600 bg-indigo-600" 
                                                : "border-slate-300 bg-white group-hover:border-slate-400"
                                        )}>
                                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className={cn("text-base", isSelected ? "font-medium text-indigo-900" : "text-slate-700")}>{option.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-between border-t p-6 bg-slate-50/30">
                    <Button 
                        variant="ghost" 
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="text-slate-500"
                    >
                        Previous
                    </Button>
                    {isLastQuestion ? (
                        <Button onClick={handleSubmitQuiz} isLoading={isSaving} size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700">
                            Submit Quiz
                        </Button>
                    ) : (
                        <Button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} size="lg" className="px-8">
                            Next Question
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};
