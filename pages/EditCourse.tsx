


import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  List, 
  Loader2,
  AlertTriangle,
  ExternalLink,
  Video,
  Lock,
  Award
} from 'lucide-react';
import { courseService } from '../services/courseService';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Course } from '../types';
import { LandingPageEditor } from '../components/edit-course/LandingPageEditor';
import { CurriculumEditor } from '../components/edit-course/CurriculumEditor';
import { LiveClassEditor } from '../components/edit-course/LiveClassEditor';
import { AccessSettingsEditor } from '../components/edit-course/AccessSettingsEditor';
import { CertificateSettingsEditor } from '../components/edit-course/CertificateSettingsEditor';
import { CoursePublishControl } from '../components/edit-course/CoursePublishControl';
import { Banner } from '../components/ui/Banner';

import { PageWrapper, LoadingScreen } from '../components/layout/PageWrapper';

export const EditCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'landing' | 'curriculum' | 'live' | 'access' | 'cert'>('landing');

  // Fetch Course Data
  const refreshCourse = async (showLoader = false) => {
    if (!courseId) return;
    
    if (showLoader) {
        setLoading(true);
    }
    
    if (showLoader) setError(null);

    try {
      const data = await courseService.getCourseById(courseId);
      if (!data) {
          throw new Error("Course not found");
      }
      setCourse(data);
    } catch (err: any) {
      console.error("Failed to load course", err);
      if (showLoader) {
          setError(err.message || "Failed to load course details. The ID might be invalid.");
      }
    } finally {
      if (showLoader) {
          setLoading(false);
      }
    }
  };

  useEffect(() => {
    refreshCourse(true);
  }, [courseId]);

  const handleSilentUpdate = () => refreshCourse(false);

  const getStatusBadge = () => {
      if (!course) return null;
      if (course.approvalStatus === 'pending') return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>;
      if (course.approvalStatus === 'rejected') return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      if (course.isPublished) return <Badge className="bg-green-100 text-green-800 border-green-200">Live</Badge>;
      return <Badge variant="secondary">Draft</Badge>;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !course) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center max-w-md">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
                <p className="text-muted-foreground mb-6">
                    {error || "The course you are looking for does not exist or you do not have permission to view it."}
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                </Button>
            </div>
        </div>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-slate-50 pb-20">
      {/* Course Studio Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/dashboard')} 
                    className="text-slate-500 hover:text-ueu-navy transition-colors font-bold"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                    <h1 className="text-lg font-black text-ueu-navy tracking-tight truncate max-w-[150px] md:max-w-md">
                        {course.title}
                    </h1>
                    {getStatusBadge()}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(`#/course/${course.id}`, '_blank')}
                className="hidden sm:flex border-2 border-slate-200 rounded-xl font-bold text-ueu-navy hover:bg-slate-50"
               >
                 <ExternalLink className="mr-2 h-4 w-4" /> Preview
               </Button>
               
               <CoursePublishControl course={course} onUpdate={handleSilentUpdate} />
            </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        
        {/* Status Banners */}
        {course.approvalStatus === 'rejected' && (
            <Banner 
                variant="error" 
                title="Course Rejected" 
                description="Your course was rejected by the admin team. Please review the content guidelines and update your course before resubmitting."
                className="mb-6"
            />
        )}
        
        {course.approvalStatus === 'pending' && (
            <Banner 
                variant="warning" 
                title="Under Review" 
                description="Your course is currently waiting for approval from the moderation team. You can still make edits, but they won't be live until approved."
                className="mb-6"
            />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
            {/* Sidebar Navigation */}
            <div className="space-y-3 lg:sticky lg:top-28 h-fit">
                <button
                    onClick={() => setActiveTab('landing')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        activeTab === 'landing' 
                        ? 'bg-ueu-navy text-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border border-transparent hover:border-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${activeTab === 'landing' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <LayoutDashboard className="h-4 w-4" />
                    </div>
                    Course Landing Page
                </button>
                <button
                    onClick={() => setActiveTab('curriculum')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        activeTab === 'curriculum' 
                        ? 'bg-ueu-navy text-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border border-transparent hover:border-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${activeTab === 'curriculum' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <List className="h-4 w-4" />
                    </div>
                    Curriculum
                </button>
                <button
                    onClick={() => setActiveTab('access')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        activeTab === 'access' 
                        ? 'bg-ueu-navy text-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border border-transparent hover:border-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${activeTab === 'access' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <Lock className="h-4 w-4" />
                    </div>
                    Access & Pricing
                </button>
                <button
                    onClick={() => setActiveTab('cert')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        activeTab === 'cert' 
                        ? 'bg-ueu-navy text-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 text-slate-500 border border-transparent hover:border-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${activeTab === 'cert' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <Award className="h-4 w-4" />
                    </div>
                    Certification
                </button>
                <button
                    onClick={() => setActiveTab('live')}
                    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[13px] font-bold tracking-tight transition-all duration-300 ${
                        activeTab === 'live' 
                        ? 'bg-ueu-navy text-white shadow-xl shadow-blue-900/10 scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent hover:border-slate-200'
                    }`}
                >
                    <div className={`p-2 rounded-xl ${activeTab === 'live' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <Video className="h-4 w-4" />
                    </div>
                    Live Schedule
                </button>
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'landing' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <LandingPageEditor course={course} onUpdate={handleSilentUpdate} />
                    </div>
                )}
                {activeTab === 'curriculum' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CurriculumEditor 
                            course={course} 
                            onUpdate={handleSilentUpdate} 
                            setCourse={setCourse}
                        />
                    </div>
                )}
                {activeTab === 'access' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <AccessSettingsEditor course={course} onUpdate={handleSilentUpdate} />
                    </div>
                )}
                {activeTab === 'cert' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CertificateSettingsEditor course={course} onUpdate={handleSilentUpdate} />
                    </div>
                )}
                {activeTab === 'live' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <LiveClassEditor course={course} />
                    </div>
                )}
            </div>
        </div>
      </div>
    </PageWrapper>
  );
};