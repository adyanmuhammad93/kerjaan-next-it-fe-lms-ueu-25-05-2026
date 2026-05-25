
import React from 'react';
import { Star, BarChart, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Course } from '../types';
import { Badge } from './ui/Badge';
import { useCurrency } from '../hooks/useCurrency';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { formatPrice } = useCurrency();
  // Use pre-calculated lessonCount from API if available, fallback to syllabus length (which is usually empty for list views now)
  const lessonCount = course.lessonCount ?? (course.syllabus?.reduce((acc, m) => acc + m.lessons.length, 0) || 0);

  return (
    <Link 
      to={`/course/${course.id}`} 
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20"
    >
      {/* Thumbnail Container */}
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="bg-white/90 text-slate-900 backdrop-blur-sm shadow-sm font-medium text-[10px] h-6">
                {course.category}
            </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex justify-between items-start mb-2">
             <h3 className="line-clamp-2 text-base font-black uppercase tracking-tight text-ueu-navy group-hover:text-ueu-blue transition-colors">
                {course.title}
             </h3>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1">
            By <span className="text-ueu-navy">{course.instructor}</span>
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
             <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-2.5 py-1 rounded-lg">
                <span className="font-black">{course.rating}</span>
                <Star className="h-3 w-3 fill-current" />
                <span className="text-accent/60">({course.ratingCount})</span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <BarChart className="h-3 w-3 text-ueu-blue" />
                <span>{course.level}</span>
             </div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg">
                <BookOpen className="h-3 w-3 text-ueu-blue" />
                <span>{lessonCount} Materi</span>
             </div>
        </div>
        
        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xl font-black text-ueu-navy">{formatPrice(course.price)}</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ueu-blue group-hover:bg-ueu-blue group-hover:text-white px-4 py-2 rounded-xl transition-all border-2 border-ueu-blue/10 group-hover:border-ueu-blue">Lihat Program</span>
        </div>
      </div>
    </Link>
  );
};
