
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Trophy, Award, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface CompletionModalProps {
    open: boolean;
    onClose: () => void;
    courseId: string;
    courseTitle: string;
    loading: boolean;
    eligibility?: {
        eligible: boolean;
        reason?: string;
        currentScore?: number;
        minScore?: number;
    };
}

export const CompletionModal: React.FC<CompletionModalProps> = ({ 
    open, onClose, courseId, courseTitle, loading, eligibility 
}) => {
    const navigate = useNavigate();

    // Default to eligible if not provided (backward compatibility)
    const isEligible = eligibility?.eligible ?? true;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader className="flex flex-col items-center gap-4 pt-6">
                    {isEligible ? (
                        <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                            <Trophy className="h-10 w-10 text-yellow-600" />
                        </div>
                    ) : (
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                            <Award className="h-10 w-10 text-slate-400" />
                        </div>
                    )}
                    
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        {isEligible ? "Congratulations!" : "Course Completed!"}
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-600 text-base">
                        You have finished all lessons in <strong>{courseTitle}</strong>.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-6 flex flex-col gap-3">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50 p-4 rounded-lg">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-medium">Generating your certificate...</span>
                        </div>
                    ) : isEligible ? (
                        <div className="bg-green-50 text-green-800 p-4 rounded-lg border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <Award className="h-6 w-6 text-green-600 shrink-0" />
                            <div className="text-left">
                                <p className="font-bold text-sm">Certificate Issued</p>
                                <p className="text-xs opacity-90">Your certificate is ready for download.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200 text-left animate-in fade-in">
                            <div className="flex gap-3 mb-2">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="font-bold text-sm">Certificate Eligibility</p>
                            </div>
                            <p className="text-sm opacity-90 mb-2">{eligibility?.reason}</p>
                            {eligibility?.minScore !== undefined && (
                                <div className="flex justify-between text-xs font-semibold bg-white/50 p-2 rounded">
                                    <span>Current Avg: {eligibility.currentScore}%</span>
                                    <span>Required: {eligibility.minScore}%</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
                    {isEligible ? (
                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 text-base" 
                            onClick={() => navigate(`/certificate/${courseId}`)}
                            disabled={loading}
                        >
                            View Certificate
                        </Button>
                    ) : (
                        <Button 
                            className="w-full" 
                            variant="outline"
                            onClick={onClose}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Review & Retake Quizzes
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
