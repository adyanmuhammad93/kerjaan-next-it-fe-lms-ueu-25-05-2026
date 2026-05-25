
import React, { useState, useEffect } from 'react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Textarea } from '../../../ui/Textarea';
import { 
    CheckCircle, X, Download, FileText, User, 
    Calendar, HelpCircle, AlertCircle, Save 
} from 'lucide-react';
import { assignmentService } from '../../../../services/assignmentService';
import { cn } from '../../../../lib/utils';
import { Dialog, DialogContent } from '../../../ui/Dialog';
import { Badge } from '../../../ui/Badge';

interface GradingModalProps {
    submission: any;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, open, onClose, onSuccess }) => {
    const [grade, setGrade] = useState<number | string>('');
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (submission) {
            setGrade(submission.grade !== undefined && submission.grade !== null ? submission.grade : '');
            setFeedback(submission.feedback || '');
        }
    }, [submission]);

    const handleSave = async () => {
        if (!submission) return;
        setSaving(true);
        try {
            const gradeNum = grade === '' ? 0 : Number(grade);
            await assignmentService.gradeSubmission(submission.id, gradeNum, feedback);
            onSuccess();
            onClose();
        } catch (error) {
            alert("Failed to save grade");
        } finally {
            setSaving(false);
        }
    };

    if (!submission) return null;

    const isQuiz = submission.lessonType === 'quiz';
    const quizData = isQuiz && submission.content ? JSON.parse(submission.content) : null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {submission.studentName.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">{submission.studentName}</h3>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <span>{submission.courseTitle}</span>
                                <span>•</span>
                                <span>{submission.lessonTitle}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5 text-slate-500" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Content */}
                    <div className="flex-1 bg-slate-50 overflow-y-auto p-6 md:p-8 border-r">
                        <div className="max-w-3xl mx-auto space-y-6">
                            
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                <Calendar className="h-3.5 w-3.5" />
                                Submitted {new Date(submission.submittedAt).toLocaleString()}
                            </div>

                            {isQuiz ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-white rounded-lg border shadow-sm flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Quiz Result</h4>
                                            <p className="text-sm text-slate-500">Auto-graded based on answers.</p>
                                        </div>
                                        <div className="text-3xl font-bold text-indigo-600">{submission.grade}%</div>
                                    </div>
                                    
                                    {/* Detailed Quiz Answers would go here if we stored question text too, 
                                        but typically we just store IDs. For now, showing raw or simplified view. */}
                                    {quizData && (
                                        <div className="bg-white rounded-lg border p-4">
                                            <h5 className="font-medium mb-3 border-b pb-2">Response Data</h5>
                                            <pre className="text-xs text-slate-600 overflow-auto max-h-96 whitespace-pre-wrap font-mono bg-slate-50 p-2 rounded">
                                                {JSON.stringify(quizData, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {submission.content && (
                                        <div className="bg-white rounded-lg border shadow-sm p-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-500" />
                                                Text Submission
                                            </h4>
                                            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                                                {submission.content}
                                            </div>
                                        </div>
                                    )}

                                    {submission.fileUrl && (
                                        <div className="bg-white rounded-lg border shadow-sm p-6">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                <Download className="h-4 w-4 text-slate-500" />
                                                Attachment
                                            </h4>
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                                                <span className="text-sm truncate max-w-[200px] text-slate-600">attached_file</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => window.open(submission.fileUrl, '_blank')}
                                                >
                                                    Download File
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Grading */}
                    <div className="w-80 bg-white flex flex-col border-l shrink-0">
                        <div className="p-6 border-b">
                            <h4 className="font-bold text-lg mb-1">Evaluation</h4>
                            <p className="text-sm text-muted-foreground">Assign a grade and feedback.</p>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">Score (0-100)</label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        max="100" 
                                        value={grade} 
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="pr-12 text-lg font-bold"
                                    />
                                    <span className="absolute right-3 top-2.5 text-slate-400 font-medium">/ 100</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-900">Feedback</label>
                                <Textarea 
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Write constructive feedback for the student..."
                                    className="min-h-[200px] resize-none text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-slate-50 mt-auto">
                            <Button className="w-full" onClick={handleSave} isLoading={saving}>
                                <Save className="mr-2 h-4 w-4" /> Save Grade
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
