import React, { useState, useEffect } from 'react';
import { ClipboardList, Upload, CheckCircle, Clock, FileText } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { Submission } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { RichTextEditor } from '../ui/RichTextEditor';

export const AssignmentPlayer: React.FC<{ lessonId: string, content: string, onComplete: () => void }> = ({ lessonId, content, onComplete }) => {
    const { user } = useAuth();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [textSub, setTextSub] = useState('');

    useEffect(() => {
        const fetchSub = async () => {
            if (!user) return;
            try {
                const data = await assignmentService.getSubmission(lessonId, user.id);
                if (data) {
                    setSubmission(data);
                    setTextSub(data.content || '');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSub();
    }, [lessonId, user]);

    const handleSubmit = async () => {
        if (!user) return;
        setUploading(true);
        try {
            const result = await assignmentService.submitAssignment(lessonId, user.id, file || undefined, textSub);
            setSubmission(result);
            onComplete();
        } catch (e) {
            alert("Submission failed");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="border p-8 rounded-lg bg-slate-50">
                <h3 className="flex items-center gap-2 text-indigo-700 mb-4 font-semibold">
                    <ClipboardList className="h-6 w-6" /> Instructions
                </h3>
                <RichTextEditor value={content} readOnly />
            </div>

            <Card className={submission ? "border-green-200 bg-green-50/30" : ""}>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-1">Your Submission</h3>
                        <p className="text-sm text-muted-foreground">Upload your work or type your answer below.</p>
                    </div>

                    {submission && (
                        <div className="flex items-center gap-4 bg-white p-4 rounded border">
                            <div className="bg-green-100 p-2 rounded-full text-green-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-green-800">Submitted on {new Date(submission.submittedAt).toLocaleDateString()}</p>
                                <p className="text-xs text-slate-500">Status: {submission.grade !== undefined ? 'Graded' : 'Pending Review'}</p>
                            </div>
                            {submission.grade !== undefined && (
                                <Badge className="ml-auto text-lg px-3 bg-indigo-600">{submission.grade}/100</Badge>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Text Submission</label>
                            <Textarea 
                                value={textSub} 
                                onChange={(e) => setTextSub(e.target.value)} 
                                placeholder="Type your answer here..."
                                disabled={!!submission}
                                className="bg-white"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">File Attachment</label>
                            {submission?.fileUrl ? (
                                <div className="flex items-center gap-2 p-2 bg-white border rounded">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <a href={submission.fileUrl} target="_blank" className="text-sm text-blue-600 underline">View Attached File</a>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input 
                                        type="file" 
                                        onChange={(e) => setFile(e.target.files?.[0] || null)} 
                                        className="bg-white"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {!submission && (
                        <div className="flex justify-end">
                            <Button onClick={handleSubmit} disabled={uploading || (!file && !textSub)} isLoading={uploading}>
                                <Upload className="mr-2 h-4 w-4" /> Submit Assignment
                            </Button>
                        </div>
                    )}
                    
                    {submission && submission.feedback && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
                            <h4 className="font-bold text-yellow-800 mb-1">Instructor Feedback</h4>
                            <p className="text-sm text-yellow-900">{submission.feedback}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};