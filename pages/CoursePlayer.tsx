








import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    PlayCircle, CheckCircle, Lock, Menu, ChevronLeft, ChevronRight,
    FileText, HelpCircle, ClipboardList, Loader2, ArrowLeft, MoreVertical,
    Maximize2, Minimize2, MessageSquare, Download, Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { courseService } from '../services/courseService';
import { assignmentService } from '../services/assignmentService';
import { Course, Lesson, Module, Prerequisite } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { LessonDiscussion } from '../components/player/LessonDiscussion';
import { LessonResources } from '../components/player/LessonResources';
import { QuizPlayer } from '../components/player/QuizPlayer';
import { AssignmentPlayer } from '../components/player/AssignmentPlayer';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { ContentRenderer } from '../components/ui/ContentRenderer';
import { CompletionModal } from '../components/player/CompletionModal';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/DropdownMenu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/ui/Tooltip";

export const CoursePlayer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Query Params
    const targetLessonId = searchParams.get('lessonId');

    // Data State
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
    const [submissions, setSubmissions] = useState<any[]>([]); // Store grades for validation

    // UI State
    const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
    const [activeTab, setActiveTab] = useState<'overview' | 'discussion' | 'resources'>('overview');
    const [isCinemaMode, setIsCinemaMode] = useState(false);

    // Completion State
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [issuingCertificate, setIssuingCertificate] = useState(false);
    const [eligibility, setEligibility] = useState<any>(null);

    // Refs for scrolling
    const activeLessonRef = useRef<HTMLButtonElement>(null);

    // 1. Fetch Course & Progress
    useEffect(() => {
        const fetchCourseData = async () => {
            if (!id || !user) return;
            try {
                const [courseData, progress, subData] = await Promise.all([
                    courseService.getCourseById(id, true),
                    courseService.getStudentProgress(user.id, id),
                    assignmentService.getStudentSubmissions(user.id) // Needed for grade checks
                ]);

                if (!courseData) {
                    navigate('/dashboard');
                    return;
                }

                setCourse(courseData);
                setCompletedLessonIds(new Set(progress));
                setSubmissions(subData);

                // Determine initial active lesson
                const allLessons = courseData.syllabus.flatMap(m => m.lessons);
                let targetLesson: Lesson | undefined;

                if (targetLessonId) {
                    // 1. Priority: URL param
                    targetLesson = allLessons.find(l => l.id === targetLessonId);
                }

                if (!targetLesson && allLessons.length > 0) {
                    // 2. Priority: First uncompleted lesson (in-progress course)
                    targetLesson = allLessons.find(l => !progress.includes(l.id));

                    // 3. Fallback: First lesson (course not started, or return to start on re-visit)
                    if (!targetLesson) {
                        targetLesson = allLessons[0];
                    }
                }

                if (targetLesson) {
                    setActiveLesson(targetLesson);
                    // Find which module this lesson belongs to
                    const parentModule = courseData.syllabus.find(m => m.lessons.some(l => l.id === targetLesson!.id));
                    if (parentModule) setActiveModuleId(parentModule.id);
                }

            } catch (error) {
                console.error(error);
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchCourseData();
    }, [id, user?.id, navigate, targetLessonId]);
    // NOTE: Use `user?.id` (stable primitive) NOT `user` (new object ref every re-render)
    //       Using the full `user` object caused this effect to re-run on every state change,
    //       resetting the active lesson unexpectedly.

    // 2. Auto-scroll to active lesson in sidebar
    useEffect(() => {
        if (sidebarOpen && activeLessonRef.current) {
            activeLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeLesson, sidebarOpen]);

    // --- ACCESS CONTROL LOGIC ---
    const checkAccess = (prerequisites?: Prerequisite[]): { allowed: boolean; reason?: string } => {
        if (!prerequisites || prerequisites.length === 0) return { allowed: true };

        for (const rule of prerequisites) {
            if (rule.type === 'completion') {
                // Check if target ID is in completedLessons OR if target is a Module (check if all its lessons are complete)
                const targetMod = course?.syllabus.find(m => m.id === rule.targetId);
                if (targetMod) {
                    const allLessonsComplete = targetMod.lessons.every(l => completedLessonIds.has(l.id));
                    if (!allLessonsComplete) return { allowed: false, reason: `Complete Module: ${targetMod.title}` };
                } else if (rule.targetId && !completedLessonIds.has(rule.targetId)) {
                    return { allowed: false, reason: `Complete prerequisite lesson first` };
                }
            }
            if (rule.type === 'grade') {
                const sub = submissions.find(s => s.lessonId === rule.targetId);
                const score = sub?.grade || 0;
                if (score < (rule.minScore || 0)) {
                    return { allowed: false, reason: `Score ${rule.minScore}%+ on previous quiz` };
                }
            }
            if (rule.type === 'date') {
                if (rule.date && new Date() < new Date(rule.date)) {
                    return { allowed: false, reason: `Available on ${new Date(rule.date).toLocaleDateString()}` };
                }
            }
        }
        return { allowed: true };
    };

    // Handlers
    const handleLessonComplete = async (lessonId: string, completed: boolean) => {
        if (!user || !course) return;

        const wasCompleted = completedLessonIds.has(lessonId);

        // Optimistic UI update
        const newCompleted = new Set(completedLessonIds);
        if (completed) {
            newCompleted.add(lessonId);
        } else {
            // Should theoretically allow unchecking, but logic for cert revocation is complex
            // For now, allow checking only for completion flow check
            return;
        }
        setCompletedLessonIds(newCompleted);

        try {
            await courseService.markLessonComplete(user.id, lessonId, course.id);

            // Check for Course Completion
            if (completed && !wasCompleted) {
                const allLessons = course.syllabus.flatMap(m => m.lessons);
                const totalPublishedLessons = allLessons.length;

                if (newCompleted.size === totalPublishedLessons) {
                    // ALL LESSONS COMPLETE -> TRIGGER CERTIFICATE LOGIC
                    checkCertificateEligibility(course);
                }
            }

        } catch (e) {
            console.error("Failed to update progress", e);
            // Revert on failure
            if (!wasCompleted) {
                const reverted = new Set(completedLessonIds);
                reverted.delete(lessonId);
                setCompletedLessonIds(reverted);
            }
        }
    };

    const checkCertificateEligibility = async (currentCourse: Course) => {
        if (!user) return;
        const config = currentCourse.certificateConfig;

        // 1. Is Certificate Enabled?
        if (!config?.enabled) {
            // Just show completion, no certificate
            setEligibility({ eligible: false, reason: "Certificates are not enabled for this course." });
            setShowCompletionModal(true);
            return;
        }

        setShowCompletionModal(true);
        setIssuingCertificate(true);

        try {
            const performance = await assignmentService.getStudentCoursePerformance(user.id, currentCourse.id);
            const minScore = config.minScore || 0;

            // 2. Check Min Score Requirement (Average)
            if (minScore > 0 && !config.enforcePerQuiz) {
                if (performance.averageScore < minScore) {
                    setEligibility({
                        eligible: false,
                        reason: `Your average quiz score is ${performance.averageScore}%. You need at least ${minScore}% average to earn the certificate.`,
                        currentScore: performance.averageScore,
                        minScore: minScore
                    });
                    setIssuingCertificate(false);
                    return;
                }
            }

            // 3. Check Enforce Per Quiz
            if (config.enforcePerQuiz && minScore > 0) {
                const failedQuizzes = performance.quizGrades.filter((q: any) => q.grade < minScore);
                if (failedQuizzes.length > 0) {
                    setEligibility({
                        eligible: false,
                        reason: `You have ${failedQuizzes.length} quiz(zes) below the required passing grade of ${minScore}%.`,
                        currentScore: performance.averageScore,
                        minScore: minScore
                    });
                    setIssuingCertificate(false);
                    return;
                }
            }

            // 4. Check Graded Assignments
            if (config.requireGradedAssignments) {
                // Count total assignment lessons in course
                const allLessons = currentCourse.syllabus.flatMap(m => m.lessons);
                const assignmentCount = allLessons.filter(l => l.type === 'assignment').length;

                if (assignmentCount > 0) {
                    if (performance.gradedAssignmentsCount < assignmentCount) {
                        setEligibility({
                            eligible: false,
                            reason: `You must have all ${assignmentCount} assignments graded by an instructor to receive your certificate. Currently ${performance.gradedAssignmentsCount} graded.`,
                        });
                        setIssuingCertificate(false);
                        return;
                    }
                }
            }

            // 5. Issue Certificate
            await courseService.issueCertificate(user.id, currentCourse.id);
            setEligibility({ eligible: true });
        } catch (e) {
            console.error("Certificate check failed", e);
            setEligibility({ eligible: false, reason: "An error occurred while generating your certificate." });
        } finally {
            setIssuingCertificate(false);
        }
    };

    const handleSaveQuiz = async (score: number, answers: any) => {
        if (!user || !activeLesson) return;
        // Submit quiz
        const sub = await assignmentService.submitQuiz(activeLesson.id, user.id, score, answers);

        // Update local submissions cache to reflect new grade immediately for prerequisites
        setSubmissions(prev => {
            const exists = prev.findIndex(s => s.lessonId === activeLesson.id);
            const newSub = { ...sub, lessonId: activeLesson.id, grade: score };
            if (exists >= 0) {
                const updated = [...prev];
                updated[exists] = newSub;
                return updated;
            }
            return [...prev, newSub];
        });

        // If passed, mark lesson as complete
        // If there's a min score rule, we might strictly check that, but typically 70% is standard 'pass' for UI
        if (score >= 70) {
            handleLessonComplete(activeLesson.id, true);
        }
    };

    const navigateLesson = (direction: 'next' | 'prev') => {
        if (!course || !activeLesson) return;
        const allLessons = course.syllabus.flatMap(m => m.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);

        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= 0 && newIndex < allLessons.length) {
            const nextLesson = allLessons[newIndex];

            // Check access for next lesson
            const moduleOfNext = course.syllabus.find(m => m.lessons.some(l => l.id === nextLesson.id));
            const moduleAccess = checkAccess(moduleOfNext?.prerequisites);
            const lessonAccess = checkAccess(nextLesson.prerequisites);

            if (!moduleAccess.allowed || !lessonAccess.allowed) {
                alert(`Locked: ${moduleAccess.reason || lessonAccess.reason}`);
                return;
            }

            setActiveLesson(nextLesson);

            // Update active module if changed
            if (moduleOfNext) setActiveModuleId(moduleOfNext.id);

            window.scrollTo(0, 0);
        }
    };

    if (loading) return <LoadingScreen />;

    if (!course || !activeLesson) return null;

    const allLessons = course.syllabus.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === allLessons.length - 1;
    const isLessonCompleted = completedLessonIds.has(activeLesson.id);
    const progressPercentage = Math.round((completedLessonIds.size / allLessons.length) * 100);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <PageWrapper>
        <TooltipProvider>
            <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar Navigation */}
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full",
                        isCinemaMode && "lg:hidden" // Hide in cinema mode
                    )}
                >
                    {/* Sidebar Header */}
                    <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mb-3 -ml-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                        </Button>
                        <h2 className="font-bold text-slate-900 leading-tight line-clamp-2 mb-4" title={course.title}>
                            {course.title}
                        </h2>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{progressPercentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modules List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {course.syllabus.map((module, mIndex) => {
                            const isModuleActive = activeModuleId === module.id;
                            const moduleAccess = checkAccess(module.prerequisites);

                            return (
                                <div key={module.id} className="border-b border-slate-50 last:border-0">
                                    {/* Module Header */}
                                    <div
                                        className={cn(
                                            "px-5 py-4 flex justify-between items-center group transition-colors",
                                            moduleAccess.allowed ? "cursor-pointer hover:bg-slate-50" : "cursor-not-allowed opacity-60 bg-slate-50/50"
                                        )}
                                        onClick={() => moduleAccess.allowed && setActiveModuleId(isModuleActive ? null : module.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Section {mIndex + 1}
                                                </div>
                                                {!moduleAccess.allowed && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Lock className="h-3 w-3 text-amber-500" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{moduleAccess.reason}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div className="font-semibold text-sm text-slate-800 group-hover:text-indigo-700 transition-colors">
                                                {module.title}
                                            </div>
                                        </div>
                                        <div className={cn("text-slate-400 transition-transform duration-200", isModuleActive && "rotate-180")}>
                                            <ChevronLeft className="h-4 w-4 -rotate-90" />
                                        </div>
                                    </div>

                                    {/* Lessons List */}
                                    <div className={cn("overflow-hidden transition-all duration-300", isModuleActive && moduleAccess.allowed ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
                                        <div className="py-1">
                                            {module.lessons.map((lesson, lIndex) => {
                                                const isActive = activeLesson.id === lesson.id;
                                                const isCompleted = completedLessonIds.has(lesson.id);
                                                const lessonAccess = checkAccess(lesson.prerequisites);

                                                // Icon Selection
                                                let Icon = PlayCircle;
                                                if (lesson.type === 'quiz') Icon = HelpCircle;
                                                if (lesson.type === 'article') Icon = FileText;
                                                if (lesson.type === 'assignment') Icon = ClipboardList;
                                                if (!lessonAccess.allowed) Icon = Lock;

                                                return (
                                                    <button
                                                        key={lesson.id}
                                                        ref={isActive ? activeLessonRef : null}
                                                        onClick={() => {
                                                            if (lessonAccess.allowed) {
                                                                setActiveLesson(lesson);
                                                                if (window.innerWidth < 1024) setSidebarOpen(false);
                                                                window.scrollTo(0, 0);
                                                            }
                                                        }}
                                                        disabled={!lessonAccess.allowed}
                                                        className={cn(
                                                            "w-full flex items-start gap-3 px-5 py-3 text-left transition-all relative",
                                                            isActive
                                                                ? "bg-indigo-50 text-indigo-900"
                                                                : "text-slate-600 hover:bg-slate-50",
                                                            !lessonAccess.allowed && "opacity-60 cursor-not-allowed hover:bg-transparent"
                                                        )}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r" />
                                                        )}

                                                        <div className={cn("mt-0.5", isActive ? "text-indigo-600" : isCompleted ? "text-green-500" : !lessonAccess.allowed ? "text-amber-500" : "text-slate-400")}>
                                                            {isCompleted ? (
                                                                <CheckCircle className="h-4 w-4 fill-current" />
                                                            ) : (
                                                                !lessonAccess.allowed ? <Lock className="h-4 w-4" /> : <div className="h-4 w-4 rounded-full border-2 border-current" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn("text-sm leading-snug mb-1", isActive ? "font-semibold" : "font-medium")}>
                                                                {lesson.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs opacity-70">
                                                                {!lessonAccess.allowed ? (
                                                                    <span className="text-amber-600 font-medium">{lessonAccess.reason}</span>
                                                                ) : (
                                                                    <>
                                                                        <Icon className="h-3 w-3" />
                                                                        <span>{lesson.duration}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-all duration-300">

                    {/* Top Navigation Bar */}
                    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm shrink-0">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
                                <Menu className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hidden lg:flex text-slate-400 hover:text-slate-600" onClick={toggleSidebar}>
                                {sidebarOpen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                            </Button>

                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                            <div className="flex flex-col justify-center min-w-0">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Current Lesson</span>
                                <h1 className="font-bold text-slate-900 truncate text-sm sm:text-base leading-tight">
                                    {activeLesson.title}
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="hidden md:flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateLesson('prev')}
                                    disabled={isFirst}
                                    className="text-slate-500"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigateLesson('next')}
                                    disabled={isLast}
                                    className="text-slate-500"
                                >
                                    Next <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>

                            {activeLesson.type !== 'quiz' && activeLesson.type !== 'assignment' && (
                                <Button
                                    size="sm"
                                    onClick={() => handleLessonComplete(activeLesson.id, !isLessonCompleted)}
                                    variant={isLessonCompleted ? "outline" : "default"}
                                    className={cn(
                                        "gap-2 transition-all min-w-[140px]",
                                        isLessonCompleted ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100" : "bg-slate-900 text-white hover:bg-slate-800"
                                    )}
                                >
                                    {isLessonCompleted ? (
                                        <>
                                            <CheckCircle className="h-4 w-4" /> Completed
                                        </>
                                    ) : (
                                        <>
                                            <div className="h-4 w-4 rounded-full border-2 border-white/40 mr-1" /> Mark Complete
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* Mobile Menu Dropdown */}
                            <div className="md:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5 text-slate-500" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => navigateLesson('prev')} disabled={isFirst}>
                                            <ChevronLeft className="h-4 w-4 mr-2" /> Previous Lesson
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => navigateLesson('next')} disabled={isLast}>
                                            <ChevronRight className="h-4 w-4 mr-2" /> Next Lesson
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    {/* Content Scroller */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50">
                        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

                            {/* Media Player Container */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                                {/* Video Player */}
                                {activeLesson.type === 'video' && (
                                    <div className="aspect-video bg-slate-900 relative group">
                                        {activeLesson.videoUrl ? (
                                            <video
                                                src={activeLesson.videoUrl}
                                                controls
                                                className="w-full h-full"
                                                onEnded={() => handleLessonComplete(activeLesson.id, true)}
                                                controlsList="nodownload"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-2">
                                                <PlayCircle className="h-12 w-12 opacity-50" />
                                                <p>Video content unavailable</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Article Reader */}
                                {activeLesson.type === 'article' && (
                                    <div className="p-8 md:p-12 max-w-3xl mx-auto">
                                        <div className="mb-8 pb-4 border-b border-slate-100">
                                            <Badge variant="secondary" className="mb-3 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Article</Badge>
                                            <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeLesson.title}</h1>
                                            <p className="text-slate-500 text-sm flex items-center gap-2">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">READING TIME</span>
                                                {activeLesson.duration}
                                            </p>
                                        </div>
                                        <div className="prose prose-slate prose-lg max-w-none">
                                            <ContentRenderer content={activeLesson.content || ''} />
                                        </div>
                                        <div className="mt-12 pt-8 border-t flex justify-center">
                                            <Button
                                                size="lg"
                                                onClick={() => handleLessonComplete(activeLesson.id, true)}
                                                className={cn("px-8 rounded-full", isLessonCompleted ? "bg-green-600 hover:bg-green-700" : "")}
                                                disabled={isLessonCompleted}
                                            >
                                                {isLessonCompleted ? "Read & Completed" : "I've Finished Reading"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Quiz Interface */}
                                {activeLesson.type === 'quiz' && (
                                    <div className="p-6 md:p-10 bg-slate-50/50 min-h-[500px] flex items-center justify-center">
                                        <div className="w-full max-w-3xl">
                                            <QuizPlayer
                                                lessonId={activeLesson.id}
                                                quizContent={activeLesson.content || '{}'}
                                                onComplete={() => handleLessonComplete(activeLesson.id, true)}
                                                onSaveResult={handleSaveQuiz}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Assignment Interface */}
                                {activeLesson.type === 'assignment' && (
                                    <div className="p-6 md:p-10">
                                        <AssignmentPlayer
                                            lessonId={activeLesson.id}
                                            content={activeLesson.content || ''}
                                            onComplete={() => handleLessonComplete(activeLesson.id, true)}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Lower Content Tabs */}
                            <div className="space-y-6">
                                <div className="border-b border-slate-200">
                                    <nav className="flex gap-6" aria-label="Tabs">
                                        <button
                                            onClick={() => setActiveTab('overview')}
                                            className={cn(
                                                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                                activeTab === 'overview'
                                                    ? "border-indigo-600 text-indigo-600"
                                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            Overview
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('resources')}
                                            className={cn(
                                                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                                activeTab === 'resources'
                                                    ? "border-indigo-600 text-indigo-600"
                                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            Resources
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('discussion')}
                                            className={cn(
                                                "pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                                activeTab === 'discussion'
                                                    ? "border-indigo-600 text-indigo-600"
                                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            Discussion
                                        </button>
                                    </nav>
                                </div>

                                <div className="min-h-[200px]">
                                    {activeTab === 'overview' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <h3 className="text-lg font-bold text-slate-900 mb-2">About this lesson</h3>
                                            <div className="prose prose-sm text-slate-600 max-w-none">
                                                {activeLesson.type === 'video' ? (
                                                    activeLesson.content ? (
                                                        <ContentRenderer content={activeLesson.content} className="prose-base" />
                                                    ) : (
                                                        <p className="italic text-slate-400">No description provided for this lesson.</p>
                                                    )
                                                ) : (
                                                    <p>Review the content above to complete this lesson.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'resources' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <LessonResources lessonId={activeLesson.id} />
                                        </div>
                                    )}

                                    {activeTab === 'discussion' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[500px]">
                                            <LessonDiscussion lessonId={activeLesson.id} />
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </main>

                <CompletionModal
                    open={showCompletionModal}
                    onClose={() => setShowCompletionModal(false)}
                    courseId={course.id}
                    courseTitle={course.title}
                    loading={issuingCertificate}
                    eligibility={eligibility}
                />
            </div>
        </TooltipProvider>
        </PageWrapper>
    );
};