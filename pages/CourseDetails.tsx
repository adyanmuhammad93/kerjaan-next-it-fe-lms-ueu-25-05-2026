import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Globe, Award, CheckCircle, MessageSquare, Bot, Loader2, ChevronDown, PlayCircle, Lock, Calendar, Users, AlertCircle, Badge, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { createCourseAssistant } from '../services/geminiService';
import { Input } from '../components/ui/Input';
import { Course, CertificateWithCourse } from '../types';
import { courseService } from '../services/courseService';
import { ReviewSection } from '../components/ReviewSection';
import { useCurrency } from '../hooks/useCurrency';
import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/Dialog";

export const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isInCart, addToCart, enrollCourse } = useStore();
  const { formatPrice } = useCurrency();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Access Rule States
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [isFull, setIsFull] = useState(false);
  const [prerequisiteMet, setPrerequisiteMet] = useState(true);
  const [prereqTitle, setPrereqTitle] = useState('');
  const [isDateRestricted, setIsDateRestricted] = useState(false);
  
  // Status check for manual approval
  const [enrollmentStatus, setEnrollmentStatus] = useState<'active' | 'pending' | 'rejected' | null>(null);
  
  // Interaction States
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Dialogs
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Fetch Course Logic
  const fetchCourse = useCallback(async () => {
      if (!id) return;
      try {
          const data = await courseService.getCourseById(id, true);
          if (data) {
              setCourse(data);
              
              // 1. Check Capacity
              if (data.accessType === 'capacity') {
                  const count = await courseService.getCourseEnrollmentCount(data.id);
                  setEnrollmentCount(count);
                  if (data.accessConfig?.maxSeats && count >= data.accessConfig.maxSeats) {
                      setIsFull(true);
                  }
              }

              // 2. Check Date
              if (data.accessType === 'date' && data.accessConfig?.startDate) {
                  const releaseDate = new Date(data.accessConfig.startDate);
                  if (new Date() < releaseDate) {
                      setIsDateRestricted(true);
                  }
              }

              // 3. Check Prerequisite & Enrollment Status (If logged in)
              if (user) {
                  // Check status
                  const status = await courseService.getEnrollmentStatus(user.id, data.id);
                  setEnrollmentStatus(status);

                  if (data.accessType === 'prerequisite' && data.accessConfig?.prerequisiteCourseId) {
                      const certs = await courseService.getUserCertificates(user.id);
                      const hasCert = certs.some(c => c.courseId === data.accessConfig?.prerequisiteCourseId);
                      if (!hasCert) {
                          setPrerequisiteMet(false);
                          // Fetch title for UI
                          const prereq = await courseService.getCourseById(data.accessConfig.prerequisiteCourseId, true);
                          setPrereqTitle(prereq?.title || 'Required Course');
                      }
                  }
              } else if (data.accessType === 'prerequisite') {
                  setPrerequisiteMet(false); 
              }

              // Auto-expand modules
              setExpandedModules(new Set(data.syllabus.map(m => m.id)));
          }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  }, [id, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCourse();
  }, [fetchCourse]);

  const toggleModule = (moduleId: string) => {
      const newExpanded = new Set(expandedModules);
      if (newExpanded.has(moduleId)) {
          newExpanded.delete(moduleId);
      } else {
          newExpanded.add(moduleId);
      }
      setExpandedModules(newExpanded);
  };

  const handleAction = async () => {
      if (!course) return;
      if (!user) {
          navigate('/login');
          return;
      }

      const { accessType } = course;

      if (accessType === 'paid') {
          if (!isInCart(course.id)) {
              addToCart(course.id, 'course');
          }
          navigate('/checkout');
          return;
      }

      if (accessType === 'code') {
          setShowCodeDialog(true);
          return;
      }

      if (accessType === 'approval') {
          if (confirm("This course requires instructor approval. Send request?")) {
              setIsEnrolling(true);
              try {
                  await courseService.enrollUser(user.id, course.id, 'pending');
                  setEnrollmentStatus('pending');
                  alert("Request sent! You will be notified when approved.");
              } catch(e) { console.error(e); }
              setIsEnrolling(false);
          }
          return;
      }

      // Free, Capacity (if not full), Date (if passed), Prerequisite (if met)
      handleInstantEnroll();
  };

  const handleInstantEnroll = async () => {
      if (!course || !user) return;
      setIsEnrolling(true);
      try {
          await courseService.enrollUser(user.id, course.id);
          enrollCourse(course.id); // Update local store
          navigate(`/course/${course.id}/learn`);
      } catch (error) {
          console.error(error);
          alert("Enrollment failed. Please try again.");
      } finally {
          setIsEnrolling(false);
      }
  };

  const handleCodeSubmit = async () => {
      if (accessCodeInput !== course?.accessConfig?.accessCode) {
          setCodeError("Incorrect access code.");
          return;
      }
      setShowCodeDialog(false);
      handleInstantEnroll();
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !course) return;
    setIsAiLoading(true);
    setAiResponse(null);
    const answer = await createCourseAssistant(course, aiQuestion, user?.geminiApiKey);
    setAiResponse(answer);
    setIsAiLoading(false);
  };

  if (loading) return <LoadingScreen />;
  
  if (!course) {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-8 bg-slate-50/50 p-6">
            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-blue-900/5">
                <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-ueu-navy uppercase tracking-tight">Program Tidak Ditemukan</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">Tautan yang Anda ikuti mungkin rusak atau program telah ditarik dari publikasi.</p>
            </div>
            <Button onClick={() => navigate('/browse')} className="rounded-2xl bg-ueu-blue text-white px-10 h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/10">Jelajahi Program</Button>
        </div>
    );
  }

  // NOTE: isEnrolled only checks local store IDs, but status check above provides better fidelity
  const isEnrolledActive = enrollmentStatus === 'active';
  const alreadyInCart = isInCart(course.id);
  const totalLectures = course.syllabus.reduce((acc, module) => acc + module.lessons.length, 0);

  // Render Logic for Main Action Button
  const renderActionButton = () => {
      if (isEnrolledActive) {
          return (
            <Button className="w-full h-14 text-sm font-black uppercase tracking-widest bg-ueu-navy hover:bg-ueu-blue text-white shadow-xl shadow-blue-900/10 rounded-2xl" onClick={() => navigate(`/course/${course.id}/learn`)}>
                <PlayCircle className="mr-2 h-5 w-5" /> Go to Course
            </Button>
          );
      }

      if (enrollmentStatus === 'pending') {
          return <Button disabled className="w-full h-14 text-sm font-black uppercase tracking-widest bg-amber-100 text-amber-800 border-amber-200 opacity-100 rounded-2xl">Request Pending</Button>;
      }

      if (enrollmentStatus === 'rejected') {
          return <Button disabled className="w-full h-14 text-sm font-black uppercase tracking-widest bg-red-100 text-red-800 border-red-200 opacity-100 rounded-2xl">Request Rejected</Button>;
      }

      if (course.accessType === 'capacity' && isFull) {
          return <Button disabled className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-slate-200 text-slate-500">Class Full ({course.accessConfig?.maxSeats} / {course.accessConfig?.maxSeats})</Button>;
      }

      if (course.accessType === 'date' && isDateRestricted) {
          const dateStr = course.accessConfig?.startDate ? new Date(course.accessConfig.startDate).toLocaleDateString() : 'TBA';
          return <Button disabled className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-slate-200 text-slate-500">Opens on {dateStr}</Button>;
      }

      if (course.accessType === 'prerequisite' && !prerequisiteMet) {
          return (
              <div className="space-y-2">
                  <Button disabled className="w-full h-14 text-sm font-black uppercase tracking-widest bg-slate-200 text-slate-500 border-0 rounded-2xl">
                      <Lock className="mr-2 h-4 w-4" /> Locked
                  </Button>
                  <p className="text-xs text-red-600 font-bold text-center">
                      Required: {prereqTitle || 'Prerequisite Course'}
                  </p>
              </div>
          );
      }

      if (course.accessType === 'approval') {
          return (
              <Button className="w-full h-14 text-sm font-black uppercase tracking-widest bg-ueu-navy hover:bg-ueu-blue text-white shadow-xl shadow-blue-900/10 rounded-2xl" onClick={handleAction} isLoading={isEnrolling}>
                  Request to Join
              </Button>
          );
      }

      if (course.accessType === 'code') {
          return (
              <Button className="w-full h-14 text-sm font-black uppercase tracking-widest bg-slate-900 hover:bg-ueu-navy text-white shadow-xl shadow-slate-900/10 rounded-2xl" onClick={handleAction} isLoading={isEnrolling}>
                  <Lock className="mr-2 h-4 w-4" /> Enter Access Code
              </Button>
          );
      }

      if (course.accessType === 'paid') {
          return (
            <div className="space-y-4">
                <Button 
                    className="w-full h-14 text-sm font-black uppercase tracking-widest bg-ueu-blue hover:bg-ueu-navy text-white shadow-xl shadow-blue-900/10 rounded-2xl" 
                    onClick={handleAction}
                    disabled={alreadyInCart}
                >
                    {alreadyInCart ? 'Added to Cart' : 'Add to Cart'}
                </Button>
                <Button 
                    variant="outline" 
                    className="w-full h-14 text-sm font-black uppercase tracking-widest border-2 border-ueu-blue text-ueu-blue hover:bg-ueu-blue/5 rounded-2xl" 
                    onClick={() => {
                        if (!alreadyInCart) addToCart(course.id, 'course');
                        navigate('/checkout');
                    }}
                >
                    Buy Now
                </Button>
            </div>
          );
      }

      // Default (Free)
      return (
          <Button className="w-full h-14 text-sm font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/10 rounded-2xl" onClick={handleAction} isLoading={isEnrolling}>
              Enroll for Free
          </Button>
      );
  };

  return (
    <PageWrapper className="min-h-screen bg-slate-50/50 text-ueu-navy pb-32">
      {/* Header */}
      <div className="bg-ueu-navy text-white pt-24 pb-48 rounded-b-[64px] shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-ueu-blue/20 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-ueu-blue/20 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl space-y-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border border-white/30 font-black px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.2em] backdrop-blur-md">
                {course.category}
              </Badge>
              <Badge className="bg-ueu-blue text-white shadow-lg shadow-blue-900/40 border-none font-black px-4 py-1.5 rounded-full uppercase text-[10px] tracking-[0.2em]">
                {course.level}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] uppercase">{course.title}</h1>
            {course.subtitle && <p className="text-xl md:text-2xl text-blue-100/80 font-medium leading-relaxed max-w-2xl">{course.subtitle}</p>}
            
            <div className="flex flex-wrap items-center gap-8 text-sm pt-4">
              <div className="flex items-center gap-2">
                <div className="flex text-accent">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < Math.floor(course.rating) ? "fill-current" : "opacity-40")} />
                    ))}
                </div>
                <span className="font-black text-white">{course.rating}</span>
                <span className="text-white/60 uppercase tracking-widest text-[10px]">({course.ratingCount} ulasan)</span>
              </div>
              <div className="h-4 w-px bg-white/30"></div>
              <div className="text-white font-medium">Instruktur: <span className="font-black underline underline-offset-4 decoration-accent/60">{course.instructor}</span></div>
            </div>

            <div className="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/50 pt-4">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Update: {course.lastUpdated}</div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> {course.language || 'Bahasa Indonesia'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* AI Assistant Banner */}
          <div className="bg-white border border-slate-100 rounded-[48px] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ueu-blue/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex gap-6 relative z-10">
              <div className="bg-ueu-blue rounded-[20px] p-4 h-16 w-16 flex items-center justify-center text-white shrink-0 shadow-xl shadow-blue-900/20">
                <Bot className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-ueu-navy uppercase tracking-tight text-lg leading-snug">Bingung dengan program ini?</h3>
                <p className="text-sm text-slate-600 font-medium max-w-sm">Tanyakan AI Smart Assistant mengenai silabus, prasyarat, atau hasil pembelajaran secara instan.</p>
              </div>
            </div>
            <Button 
                onClick={() => setAiOpen(!aiOpen)} 
                className={cn(
                    "rounded-2xl px-10 h-14 font-black text-xs uppercase tracking-widest transition-all relative z-10 shrink-0",
                    aiOpen ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-ueu-blue text-white hover:bg-ueu-navy shadow-xl shadow-blue-900/10"
                )}
            >
              {aiOpen ? 'Tutup Asisten' : 'Mulai Chat AI'}
            </Button>
          </div>

          {aiOpen && (
            <div className="border-none rounded-[40px] p-10 bg-white shadow-2xl shadow-blue-900/10 animate-in fade-in slide-in-from-top-6 duration-500">
              <form onSubmit={handleAskAI} className="flex gap-4">
                <Input 
                  value={aiQuestion} 
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Contoh: Apa target utama pembelajaran ini?"
                  className="flex-1 rounded-2xl h-16 px-8 border-none bg-slate-100 text-ueu-navy font-bold focus:bg-white focus:ring-8 focus:ring-ueu-blue/5 transition-all text-sm placeholder:text-slate-400"
                  aria-label="Tanyakan AI"
                />
                <Button type="submit" isLoading={isAiLoading} className="rounded-2xl h-16 px-10 bg-ueu-navy hover:bg-ueu-blue shadow-xl shadow-blue-900/10 font-black uppercase text-xs tracking-widest">Kirim</Button>
              </form>
              {aiResponse && (
                <div className="mt-8 p-8 bg-slate-50 rounded-[32px] text-sm text-slate-600 leading-relaxed border-l-[12px] border-l-accent flex gap-6">
                  <div className="shrink-0 pt-1">
                     <Bot className="h-6 w-6 text-accent" />
                  </div>
                  <div className="space-y-4">
                      <h4 className="font-black text-ueu-navy uppercase tracking-[4px] text-[10px] opacity-40">AI Intelligence Response</h4>
                      <div className="font-medium text-base prose prose-slate max-w-none">
                        {aiResponse}
                      </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Learning Objectives */}
          <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-xl shadow-blue-900/5">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-ueu-blue/10 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-ueu-blue" />
                </div>
                <h2 className="text-2xl font-black text-ueu-navy uppercase tracking-tight">Hasil Pembelajaran</h2>
            </div>
            {course.learningObjectives && course.learningObjectives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {course.learningObjectives.map((objective, i) => (
                    <div key={i} className="flex gap-4 items-start group">
                      <div className="mt-1 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CheckCircle className="h-3.5 w-3.5 text-accent" />
                      </div>
                      <span className="text-slate-600 font-medium leading-relaxed">{objective}</span>
                    </div>
                  ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 italic font-medium">Belum ada target pembelajaran yang tercantum untuk program ini.</p>
            )}
          </div>

          {/* Syllabus */}
          <div className="space-y-8">
             <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-ueu-blue/10 flex items-center justify-center">
                        <PlayCircle className="h-5 w-5 text-ueu-blue" />
                    </div>
                    <h2 className="text-2xl font-black text-ueu-navy uppercase tracking-tight">Struktur Kurikulum</h2>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[3px] text-ueu-navy/60 bg-slate-200/50 px-4 py-2 rounded-full">
                    {course.syllabus.length} Modul • {totalLectures} Sesi
                </div>
             </div>
             
             {course.syllabus.length > 0 ? (
                 <div className="bg-white border border-slate-100 rounded-[40px] shadow-xl shadow-blue-900/5 overflow-hidden">
                    {course.syllabus.map((module, mIndex) => {
                        const isExpanded = expandedModules.has(module.id);
                        return (
                            <div key={module.id} className={cn("transition-all", mIndex !== 0 && "border-t border-slate-50")}>
                                <div 
                                    className={cn(
                                        "p-8 flex justify-between items-center cursor-pointer transition-all select-none group",
                                        isExpanded ? "bg-slate-50" : "bg-white hover:bg-slate-50"
                                    )}
                                    onClick={() => toggleModule(module.id)}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                                            isExpanded ? "bg-ueu-blue text-white shadow-blue-900/10 rotate-180" : "bg-white text-ueu-navy border border-slate-100 group-hover:scale-110"
                                        )}>
                                            <ChevronDown className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-ueu-navy uppercase tracking-tight text-lg">{module.title}</h4>
                                            <p className="text-[10px] font-black text-ueu-navy/40 uppercase tracking-widest mt-1">{module.lessons.length} Materi Pembelajaran</p>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="bg-white px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            {module.lessons.map(lesson => (
                                                <div key={lesson.id} className="p-5 rounded-3xl group flex items-center justify-between transition-all hover:bg-slate-50 active:scale-[0.99] border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-50 group-hover:bg-ueu-blue transition-colors">
                                                            {lesson.type === 'video' 
                                                                ? <PlayCircle className="h-5 w-5 text-ueu-blue group-hover:text-white transition-colors" /> 
                                                                : <MessageSquare className="h-5 w-5 text-ueu-blue group-hover:text-white transition-colors" />
                                                            }
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-ueu-navy text-base">{lesson.title}</span>
                                                            <p className="text-[10px] font-black text-ueu-navy/30 uppercase tracking-widest mt-0.5">{lesson.type}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-ueu-navy/50 font-black text-[10px] uppercase tracking-widest tabular-nums bg-slate-200/40 px-4 py-1.5 rounded-full">{lesson.duration || '0:00'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
             ) : (
                 <div className="p-12 text-center bg-slate-100/50 rounded-[48px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Struktur kurikulum saat ini belum tersedia.</p>
                 </div>
             )}
          </div>
          
          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-xl shadow-blue-900/5">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-accent" />
                    </div>
                    <h2 className="text-2xl font-black text-ueu-navy uppercase tracking-tight">Prasyarat Program</h2>
                </div>
                <div className="space-y-4">
                    {course.requirements.map((req, i) => (
                        <div key={i} className="flex gap-4 items-center bg-slate-100/50 p-6 rounded-3xl border border-slate-200/30">
                            <div className="w-2 h-2 rounded-full bg-accent shrink-0"></div>
                            <span className="text-slate-700 font-bold text-base leading-relaxed uppercase tracking-tight">{req}</span>
                        </div>
                    ))}
                </div>
              </div>
          )}

          {/* Reviews Section */}
          <div className="pt-12">
              <ReviewSection 
                courseId={course.id} 
                isEnrolled={!!isEnrolledActive} 
                onReviewAdded={fetchCourse} 
              />
          </div>

        </div>

        {/* Sidebar Sticky Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border-none rounded-[56px] shadow-2xl shadow-blue-900/10 overflow-hidden">
             <div className="aspect-video bg-slate-100 relative group cursor-pointer overflow-hidden border-b-4 border-accent">
                {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
                        <PlayCircle className="h-16 w-16 mb-4 opacity-10" />
                        <span className="font-black uppercase tracking-widest text-[10px]">Preview tidak tersedia</span>
                    </div>
                )}
                {!isEnrolledActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ueu-navy/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                        <div className="bg-white rounded-3xl p-6 shadow-2xl transform transition-transform group-hover:scale-110 duration-700">
                            <PlayCircle className="h-10 w-10 text-ueu-navy" />
                        </div>
                    </div>
                )}
             </div>
             <div className="p-12 space-y-8 text-center md:text-left">
                <div className="text-4xl font-black text-ueu-navy uppercase tracking-tight">
                    {course.accessType === 'free' ? <span className="text-accent underline decoration-accent/20">Gratis</span> : formatPrice(course.price)}
                </div>
                
                <div className="pt-2">
                    {renderActionButton()}
                </div>
                                 <div className="flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[3px] text-slate-500">
                   <ShieldCheck className="h-4 w-4" /> Jaminan Mutu Akademik
                </div>
                
                <div className="pt-8 space-y-6 border-t border-slate-100">
                   <h5 className="text-[10px] font-black uppercase tracking-[4px] text-slate-400 px-1 mb-2">Benefit Program</h5>
                   
                   <div className="flex items-center gap-5 group">
                      <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 transition-all group-hover:rotate-12">
                        <Award className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Sertifikat Digital Kolektif</span>
                   </div>
                   
                   <div className="flex items-center gap-5 group">
                      <div className="h-10 w-10 rounded-2xl bg-ueu-blue/10 flex items-center justify-center shrink-0 transition-all group-hover:-rotate-12">
                        <Globe className="h-5 w-5 text-ueu-blue" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">Akses Internasional Lifetime</span>
                   </div>

                   {course.accessType === 'capacity' && (
                       <div className="flex items-center gap-5 group">
                          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0 transition-all group-hover:scale-110">
                            <Users className="h-5 w-5 text-accent" />
                          </div>
                          <span className="text-sm font-bold text-accent uppercase tracking-tight">
                            {course.accessConfig?.maxSeats ? `${enrollmentCount} / ${course.accessConfig.maxSeats} Kursi Terisi` : 'Kuota Terbatas'}
                          </span>
                       </div>
                   )}
                   
                   {course.accessType === 'date' && (
                       <div className="flex items-center gap-5 group">
                          <div className="h-10 w-10 rounded-2xl bg-ueu-blue/10 flex items-center justify-center shrink-0 transition-all group-hover:scale-110">
                            <Calendar className="h-5 w-5 text-ueu-blue" />
                          </div>
                          <span className="text-sm font-bold text-ueu-blue uppercase tracking-tight">
                            Dibuka: {course.accessConfig?.startDate || 'Segera'}
                          </span>
                       </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog} >
          <DialogContent className="rounded-[48px] p-12 border-none shadow-2xl bg-white max-w-lg">
              <DialogHeader className="mb-8">
                  <div className="w-16 h-16 bg-ueu-blue rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/20">
                     <Lock className="h-8 w-8 text-white" />
                  </div>
                  <DialogTitle className="text-3xl font-black text-ueu-navy uppercase tracking-tight">Kode Akses Dibutuhkan</DialogTitle>
                  <DialogDescription className="text-base text-slate-600 font-medium leading-relaxed">
                    Program ini bersifat terbatas (Private). Silakan masukkan kode akses resmi yang dikirimkan melalui email universitas Anda.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                  <Input 
                    value={accessCodeInput}
                    onChange={(e) => {setAccessCodeInput(e.target.value); setCodeError('');}}
                    className="rounded-2xl h-16 px-8 border-none bg-slate-50 text-ueu-navy font-black tracking-[4px] text-lg focus:bg-white focus:ring-8 focus:ring-ueu-blue/5 transition-all"
                    placeholder="KODE-AKSES-ANDA"
                  />
                  {codeError && (
                      <div className="mt-4 flex items-center gap-2 text-red-500 px-2 font-black text-[10px] uppercase tracking-widest">
                          <AlertCircle className="h-4 w-4" />
                          <span>{codeError}</span>
                      </div>
                  )}
              </div>
              <DialogFooter className="mt-10 gap-4">
                  <Button variant="ghost" className="rounded-2xl h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-ueu-navy transition-all" onClick={() => setShowCodeDialog(false)}>Batal</Button>
                  <Button className="rounded-2xl h-14 px-10 bg-ueu-blue text-white shadow-xl shadow-blue-900/10 font-black text-xs uppercase tracking-widest hover:bg-ueu-navy transition-all active:scale-95" onClick={handleCodeSubmit}>Verifikasi Kode</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};