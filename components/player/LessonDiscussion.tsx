
import React, { useState, useEffect } from 'react';
import { Send, Reply, Trash2, MoreVertical, MessageCircle } from 'lucide-react';
import { discussionService } from '../../services/discussionService';
import { Comment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

interface LessonDiscussionProps {
    lessonId: string;
}

interface CommentItemProps {
    comment: Comment;
    isReply?: boolean;
    currentUserId?: string;
    replyingTo: string | null;
    setReplyingTo: (id: string | null) => void;
    replyContent: string;
    setReplyContent: (content: string) => void;
    onDelete: (id: string) => void;
    onSubmitReply: (parentId: string) => void;
    isSubmitting: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    isReply = false, 
    currentUserId,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    onDelete,
    onSubmitReply,
    isSubmitting
}) => (
    <div className={cn("group flex gap-4", isReply ? "ml-12 mt-6 pl-4 border-l-2 border-slate-100" : "mt-8")}>
        <div className="flex-shrink-0">
            <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border shadow-sm",
                comment.userRole === 'instructor' 
                    ? "bg-indigo-600 text-white border-indigo-600" 
                    : "bg-white text-slate-600 border-slate-200"
            )}>
                {comment.userName.charAt(0)}
            </div>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{comment.userName}</span>
                    {comment.userRole === 'instructor' && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-wide">Instructor</span>
                    )}
                    <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                </div>
                {currentUserId === comment.userId && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-full text-slate-400">
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Comment
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {comment.content}
            </div>

            {!isReply && (
                <div className="mt-3">
                    <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
                    >
                        <Reply className="h-3.5 w-3.5" /> Reply
                    </button>
                </div>
            )}

            {replyingTo === comment.id && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg animate-in fade-in slide-in-from-top-2 border border-slate-200">
                    <Textarea 
                        value={replyContent} 
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.userName}...`}
                        className="min-h-[80px] text-sm mb-3 bg-white resize-none focus:ring-indigo-500"
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => onSubmitReply(comment.id)} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">Reply</Button>
                    </div>
                </div>
            )}
        </div>
    </div>
);

export const LessonDiscussion: React.FC<LessonDiscussionProps> = ({ lessonId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        try {
            const data = await discussionService.getComments(lessonId);
            setComments(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchComments();
    }, [lessonId]);

    const handleSubmit = async (parentId: string | null = null) => {
        if (!user) return;
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        setIsSubmitting(true);
        try {
            await discussionService.createComment(lessonId, user.id, content, parentId);
            if (parentId) {
                setReplyingTo(null);
                setReplyContent('');
            } else {
                setNewComment('');
            }
            fetchComments();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await discussionService.deleteComment(id);
            fetchComments();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2"></div>
                        Loading discussion...
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                            <MessageCircle className="h-8 w-8" />
                        </div>
                        <h3 className="font-semibold text-slate-900">Start the conversation</h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                            Have questions about this lesson? Post them here to discuss with instructors and other students.
                        </p>
                    </div>
                ) : (
                    <div className="pb-6">
                        <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2">
                            Discussion <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{comments.length} comments</span>
                        </h3>
                        {comments.map((comment) => (
                            <div key={comment.id}>
                                <CommentItem 
                                    comment={comment} 
                                    currentUserId={user?.id}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyContent={replyContent}
                                    setReplyContent={setReplyContent}
                                    onDelete={handleDelete}
                                    onSubmitReply={handleSubmit}
                                    isSubmitting={isSubmitting}
                                />
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="space-y-4">
                                        {comment.replies.map(reply => (
                                            <CommentItem 
                                                key={reply.id} 
                                                comment={reply} 
                                                isReply 
                                                currentUserId={user?.id}
                                                replyingTo={replyingTo}
                                                setReplyingTo={setReplyingTo}
                                                replyContent={replyContent}
                                                setReplyContent={setReplyContent}
                                                onDelete={handleDelete}
                                                onSubmitReply={handleSubmit}
                                                isSubmitting={isSubmitting}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="relative">
                    <Textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your question or comment here..."
                        className="pr-14 min-h-[60px] resize-none focus:ring-indigo-500 bg-white shadow-sm border-slate-200"
                        autoComplete="off"
                    />
                    <Button 
                        size="icon" 
                        className="absolute right-2 bottom-2 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-md transition-transform hover:scale-105"
                        onClick={() => handleSubmit(null)}
                        disabled={!newComment.trim() || isSubmitting}
                    >
                        <Send className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
