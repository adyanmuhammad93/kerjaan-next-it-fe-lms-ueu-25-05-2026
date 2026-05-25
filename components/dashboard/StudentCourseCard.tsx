
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Award } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { cn } from '../../lib/utils';

interface StudentCourseCardProps {
    course: Course;
    userId: string;
}

export const StudentCourseCard: React.FC<StudentCourseCardProps> = ({ course, userId }) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [certificateLoading, setCertificateLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const fullCourse = await courseService.getCourseById(course.id, true);
        if (!fullCourse) {
             if(isMounted) setLoading(false);
             return;
        }

        const totalLessons = fullCourse.syllabus.reduce((acc, m) => acc + m.lessons.length, 0);
        
        if (totalLessons === 0) {
           if(isMounted) {
               setProgress(0);
               setLoading(false);
           }
           return;
        }

        const completedLessonIds = await courseService.getStudentProgress(userId, course.id);
        const percent = Math.round((completedLessonIds.length / totalLessons) * 100);
        
        if(isMounted) {
            setProgress(percent);
            setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load progress", error);
        if(isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [course.id, userId]);

  const handleCertificateClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (certificateLoading) return;

    setCertificateLoading(true);
    try {
        const existingCertificate = await courseService.getCertificate(userId, course.id);
        if (existingCertificate) {
            navigate(`/certificate/${course.id}`);
            return;
        }

        if (progress < 100) {
            window.alert('Selesaikan semua materi mata kuliah terlebih dahulu untuk menerbitkan sertifikat.');
            return;
        }

        await courseService.issueCertificate(userId, course.id);
        navigate(`/certificate/${course.id}`);
    } catch (error) {
        console.error('Failed to issue certificate', error);

        const existingCertificate = await courseService.getCertificate(userId, course.id);
        if (existingCertificate) {
            navigate(`/certificate/${course.id}`);
            return;
        }

        window.alert('Sertifikat belum dapat diterbitkan. Pastikan semua persyaratan mata kuliah sudah terpenuhi.');
    } finally {
        setCertificateLoading(false);
    }
  };

  return (
      <div 
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 cursor-pointer h-full active:scale-[0.98]"
      onClick={() => navigate(`/course/${course.id}/learn`)}
    >
        <div className="h-48 w-full overflow-hidden bg-slate-100 relative">
            <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-ueu-navy/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <div className="bg-white rounded-full p-4 shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-500">
                    <PlayCircle className="h-8 w-8 text-ueu-blue" />
                </div>
            </div>
            <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-ueu-navy hover:bg-white border-0 backdrop-blur-md px-3 font-bold text-xs rounded-full shadow-sm">
                    {progress}% Selesai
                </Badge>
            </div>
            {progress === 100 && (
                <div className="absolute bottom-4 left-4 bg-pathway-gold text-ueu-navy text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 border border-white/20 animate-bounce">
                    <Award className="h-3 w-3" /> SELESAI
                </div>
            )}
        </div>
        <div className="p-6 flex flex-col flex-1">
            <div className="mb-3">
                <Badge className="text-[10px] px-3 py-1 font-black text-ueu-blue bg-ueu-blue/10 border-none rounded-full uppercase tracking-widest">{course.category}</Badge>
            </div>
            <h3 className="font-bold text-xl leading-tight line-clamp-1 mb-1 text-ueu-navy group-hover:text-ueu-blue transition-colors tracking-tight">{course.title}</h3>
            <p className="text-xs text-muted-foreground font-medium italic mb-6">Oleh: {course.instructor}</p>
            
            <div className="mt-auto space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[1px] text-ueu-navy/60">
                        <span>Progres Belajar</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-ueu-blue to-ueu-navy h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="lg" className="w-[80%] bg-ueu-blue hover:bg-ueu-navy font-bold rounded-xl shadow-md h-12 transition-all">
                        {progress > 0 ? 'Lanjutkan' : 'Mulai'}
                    </Button>
                    <Button 
                        size="icon" 
                        variant="outline" 
                        className="flex-1 rounded-xl border-border h-12 bg-white text-ueu-navy hover:bg-slate-50 transition-all active:scale-95"
                        title="Lihat Sertifikat" 
                        type="button"
                        isLoading={certificateLoading}
                        onClick={handleCertificateClick}
                    >
                        {!certificateLoading && (
                            <Award className={cn("h-5 w-5", progress === 100 ? "text-pathway-gold fill-pathway-gold" : "text-slate-300")} />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};
