
import React, { useState, useEffect } from 'react';
import { Star, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courseService';
import { Review } from '../types';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { cn } from '../lib/utils';

interface ReviewSectionProps {
    courseId: string;
    isEnrolled: boolean;
    onReviewAdded?: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ courseId, isEnrolled, onReviewAdded }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    // Form State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [userHasReviewed, setUserHasReviewed] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await courseService.getReviews(courseId);
                setReviews(data);
                if (user) {
                    setUserHasReviewed(data.some(r => r.userId === user.id));
                }
            } catch (error) {
                console.error("Failed to load reviews", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [courseId, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || rating === 0) return;
        
        setSubmitting(true);
        try {
            await courseService.addReview(user.id, courseId, rating, comment);
            
            // Optimistic update
            const newReview: Review = {
                id: 'temp-' + Date.now(),
                userId: user.id,
                userName: user.name,
                rating,
                comment,
                createdAt: new Date().toLocaleDateString()
            };
            setReviews([newReview, ...reviews]);
            setUserHasReviewed(true);
            setComment('');
            setRating(0);

            // Notify parent to refresh course stats (rating count/avg)
            if (onReviewAdded) {
                onReviewAdded();
            }
        } catch (error) {
            console.error("Failed to submit review", error);
            alert("Failed to post review. You might have already reviewed this course.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="py-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading reviews...</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold">Student Feedback</h2>

            {/* Review Form (Only for enrolled users who haven't reviewed) */}
            {isEnrolled && !userHasReviewed && (
                <div className="bg-slate-50 p-6 rounded-lg border">
                    <h3 className="font-semibold mb-4">Leave a Rating</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={cn(
                                            "h-8 w-8 transition-colors",
                                            (hoverRating || rating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <Textarea 
                            placeholder="Tell us about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                            className="bg-white"
                        />
                        <Button type="submit" disabled={submitting || rating === 0} isLoading={submitting}>
                            Post Review
                        </Button>
                    </form>
                </div>
            )}

            {/* Review List */}
            <div className="space-y-6">
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0 animate-in fade-in">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                    <UserIcon className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold">{review.userName}</div>
                                        <div className="text-xs text-muted-foreground">{review.createdAt}</div>
                                    </div>
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-current" : "text-slate-200")} />
                                        ))}
                                    </div>
                                    <p className="text-slate-700 text-sm mt-2">{review.comment}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No reviews yet. Be the first to rate this course!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
