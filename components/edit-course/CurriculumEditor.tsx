


import React, { useState, useEffect } from 'react';
import { 
  Check, X, Trash2, Video, FileText, HelpCircle, Pencil, Plus, Eye, EyeOff, Loader2, ChevronDown, GripVertical, MoreVertical, ClipboardList, Maximize2, Minimize2, ArrowLeft, Lock
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';
import { Course, Module, Lesson, Prerequisite } from '../../types';
import { cn } from '../../lib/utils';
import { VideoEditor } from './lesson-editors/VideoEditor';
import { ArticleEditor } from './lesson-editors/ArticleEditor';
import { QuizBuilder } from './lesson-editors/QuizBuilder';
import { AssignmentEditor } from './lesson-editors/AssignmentEditor';
import { ResourcesManager } from './ResourcesManager';
import { PrerequisiteSelector } from './PrerequisiteSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/AlertDialog";
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const LessonEditorSwitcher: React.FC<any> = (props) => {
    const { lesson } = props;
    if (lesson.type === 'quiz') return <QuizBuilder {...props} />;
    if (lesson.type === 'article') return <ArticleEditor {...props} />;
    if (lesson.type === 'assignment') return <AssignmentEditor {...props} />;
    return <VideoEditor {...props} />;
}

const getLessonTypeIcon = (type: string, className: string) => {
    switch (type) {
        case 'video': return <Video className={className} />;
        case 'article': return <FileText className={className} />;
        case 'quiz': return <HelpCircle className={className} />;
        case 'assignment': return <ClipboardList className={className} />;
        default: return <FileText className={className} />;
    }
}

export const CurriculumEditor: React.FC<{ 
    course: Course, 
    onUpdate: () => void,
    setCourse: React.Dispatch<React.SetStateAction<Course | null>>
}> = ({ course, onUpdate, setCourse }) => {
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
    const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    
    // Module Editing State
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [tempModuleTitle, setTempModuleTitle] = useState("");

    // Module Expansion State
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Deletion Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'lesson' | 'module' } | null>(null);

    // Full Screen Editor State
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Prerequisite Editing State
    const [prereqTarget, setPrereqTarget] = useState<{id: string, type: 'module'|'lesson', rules: Prerequisite[]} | null>(null);

    const [hasInitializedExpansion, setHasInitializedExpansion] = useState(false);

    // Initialize with all modules expanded when data arrives
    useEffect(() => {
        if (course?.syllabus && course.syllabus.length > 0 && !hasInitializedExpansion) {
            setExpandedModules(new Set(course.syllabus.map(m => m.id)));
            setHasInitializedExpansion(true);
        }
    }, [course?.syllabus, hasInitializedExpansion]);

    // Reset full screen when changing active lesson
    useEffect(() => {
        setIsFullScreen(false);
    }, [editingLessonId]);

    const toggleModule = (moduleId: string) => {
        const newSet = new Set(expandedModules);
        if (newSet.has(moduleId)) {
            newSet.delete(moduleId);
        } else {
            newSet.add(moduleId);
        }
        setExpandedModules(newSet);
    };

    const handleAddModule = async () => {
        if (!newModuleTitle.trim()) return;
        try {
            const newModule = await courseService.createModule(course.id, newModuleTitle, course.syllabus.length);
            
            // Update local state immediately
            setCourse(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    syllabus: [...prev.syllabus, { ...newModule, lessons: [] }]
                };
            });

            // Ensure new module is expanded
            setExpandedModules(prev => {
                const next = new Set(prev);
                next.add(newModule.id);
                return next;
            });

            setNewModuleTitle('');
            setIsAddingModule(false);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteModule = (id: string) => {
        setDeleteConfirm({ id, type: 'module' });
    };

    const startEditingModule = (module: Module, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingModuleId(module.id);
        setTempModuleTitle(module.title);
    };

    const saveModuleTitle = async () => {
        if (!editingModuleId || !tempModuleTitle.trim()) return;
        
        // Optimistic UI Update
        const updatedSyllabus = course.syllabus.map(m => 
            m.id === editingModuleId ? { ...m, title: tempModuleTitle } : m
        );
        setCourse(prev => prev ? { ...prev, syllabus: updatedSyllabus } : null);
        
        const idToUpdate = editingModuleId;
        setEditingModuleId(null);
        
        try {
            await courseService.updateModule(idToUpdate, { title: tempModuleTitle });
            onUpdate();
        } catch (error) {
            console.error(error);
            onUpdate();
        }
    };

    const handleAddLesson = async (moduleId: string, lessonCount: number, type: 'video' | 'article' | 'quiz' | 'assignment') => {
        try {
            const newLesson = await courseService.createLesson(moduleId, `New ${type} Lesson`, lessonCount, type);
            
            // Update local state immediately
            setCourse(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    syllabus: prev.syllabus.map(m => 
                        m.id === moduleId 
                        ? { ...m, lessons: [...m.lessons, newLesson] }
                        : m
                    )
                };
            });

            // Ensure module is expanded when adding a lesson
            const newExpanded = new Set(expandedModules);
            newExpanded.add(moduleId);
            setExpandedModules(newExpanded);
            onUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteLesson = (lessonId: string) => {
        setDeleteConfirm({ id: lessonId, type: 'lesson' });
    };

    const executeDelete = async () => {
        if (!deleteConfirm) return;
        const { id, type } = deleteConfirm;
        setDeleteConfirm(null); // Close dialog immediately

        if (type === 'module') {
             try {
                 await courseService.deleteModule(id);
                 onUpdate();
             } catch (error) {
                 console.error(error);
                 alert("Gagal menghapus modul");
             }
        } else {
             // Lesson Deletion with Optimistic Update
             try {
                const updatedSyllabus = course.syllabus.map(m => ({
                    ...m,
                    lessons: m.lessons.filter(l => l.id !== id)
                }));
                setCourse(prev => prev ? { ...prev, syllabus: updatedSyllabus } : null);
                
                if (editingLessonId === id) {
                    setEditingLessonId(null);
                }

                await courseService.deleteLesson(id);
                onUpdate(); // Silent refresh
            } catch (error: any) {
                console.error("Gagal menghapus pelajaran", error);
                alert(`Gagal menghapus pelajaran: ${error.message}`);
                onUpdate(); // Revert
            }
        }
    };

    const handleToggleLessonPublish = async (lesson: Lesson) => {
        try {
            // Optimistic update
            const updatedSyllabus = course.syllabus.map(m => ({
                ...m,
                lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l)
            }));
            setCourse(prev => prev ? { ...prev, syllabus: updatedSyllabus } : null);

            await courseService.updateLesson(lesson.id, { isPublished: !lesson.isPublished });
            onUpdate();
        } catch (error) {
            console.error(error);
            onUpdate();
        }
    };

    const savePrerequisites = async (rules: Prerequisite[]) => {
        if (!prereqTarget) return;
        
        try {
            if (prereqTarget.type === 'module') {
                await courseService.updateModule(prereqTarget.id, { prerequisites: rules });
            } else {
                await courseService.updateLesson(prereqTarget.id, { prerequisites: rules });
            }
            onUpdate();
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan prasyarat");
        }
    };

    const toggleLessonSelection = (id: string) => {
        const newSelected = new Set(selectedLessons);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedLessons(newSelected);
    };

    const toggleModuleSelection = (module: Module) => {
        const moduleLessonIds = module.lessons.map(l => l.id);
        if (moduleLessonIds.length === 0) return;

        const allSelected = moduleLessonIds.every(id => selectedLessons.has(id));
        const newSelected = new Set(selectedLessons);
        
        if (allSelected) {
            moduleLessonIds.forEach(id => newSelected.delete(id));
        } else {
            moduleLessonIds.forEach(id => newSelected.add(id));
        }
        setSelectedLessons(newSelected);
    }

    const handleBatchUpdate = async (publish: boolean) => {
        setIsUpdatingStatus(true);
        try {
            await courseService.updateLessonStatusBatch(Array.from(selectedLessons), publish);
            setSelectedLessons(new Set()); // Clear selection after action
            onUpdate();
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdatingStatus(false);
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, type } = result;

        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        if (type === 'module') {
            const newSyllabus: Module[] = Array.from(course.syllabus);
            const [removed] = newSyllabus.splice(source.index, 1);
            newSyllabus.splice(destination.index, 0, removed);

            // Optimistic update
            setCourse(prev => prev ? { ...prev, syllabus: newSyllabus } : null);

            // API Call
            const updates = newSyllabus.map((mod, index) => ({
                id: mod.id,
                orderIndex: index
            }));
            
            try {
                await courseService.reorderModules(updates);
            } catch (e) {
                console.error(e);
                onUpdate();
            }
        }

        if (type === 'lesson') {
            const sourceModuleId = source.droppableId;
            const destModuleId = destination.droppableId;

            const newSyllabus: Module[] = [...course.syllabus];
            const sourceModuleIndex = newSyllabus.findIndex(m => m.id === sourceModuleId);
            const destModuleIndex = newSyllabus.findIndex(m => m.id === destModuleId);

            const sourceModule = newSyllabus[sourceModuleIndex];
            const destModule = newSyllabus[destModuleIndex];

            const sourceLessons: Lesson[] = Array.from(sourceModule.lessons);
            const [movedLesson] = sourceLessons.splice(source.index, 1);

            let updates: { id: string; orderIndex: number; moduleId: string }[] = [];

            if (sourceModuleId === destModuleId) {
                sourceLessons.splice(destination.index, 0, movedLesson);
                newSyllabus[sourceModuleIndex] = { ...sourceModule, lessons: sourceLessons };
                
                // Update Order for same module
                sourceLessons.forEach((l, index) => {
                     updates.push({ id: l.id, orderIndex: index, moduleId: sourceModuleId });
                });
            } else {
                const destLessons: Lesson[] = Array.from(destModule.lessons);
                destLessons.splice(destination.index, 0, movedLesson);
                newSyllabus[sourceModuleIndex] = { ...sourceModule, lessons: sourceLessons };
                newSyllabus[destModuleIndex] = { ...destModule, lessons: destLessons };

                // Update Order for source and dest modules
                sourceLessons.forEach((l, index) => {
                     updates.push({ id: l.id, orderIndex: index, moduleId: sourceModuleId });
                });
                destLessons.forEach((l, index) => {
                     updates.push({ id: l.id, orderIndex: index, moduleId: destModuleId });
                });
            }

            setCourse(prev => prev ? { ...prev, syllabus: newSyllabus } : null);

            try {
                await courseService.reorderLessons(updates);
            } catch (e) {
                console.error(e);
                onUpdate();
            }
        }
    };

    return (
        <div className="space-y-10 pb-32 relative max-w-6xl mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-ueu-navy tracking-tight uppercase">Arsitektur Kurikulum</h2>
                    <p className="text-slate-500 font-medium mt-1">Rancang alur belajar Anda. Seret dan lepas modul/pelajaran untuk mengurutkan ulang.</p>
                </div>
            </div>

            <div className="space-y-10">
                {course.syllabus.length === 0 && !isAddingModule && (
                    <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-50/50 hover:bg-slate-50 transition-all group animate-in zoom-in duration-1000">
                        <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center mx-auto mb-8 border border-white group-hover:scale-110 transition-transform">
                            <Plus className="h-10 w-10 text-violet-500 group-hover:rotate-90 transition-transform duration-300" />
                        </div>
                        <h3 className="text-2xl font-black text-ueu-navy mb-2 tracking-tight uppercase">Mulai membangun mata kuliah Anda</h3>
                        <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">Buat bagian pertama untuk mulai menambahkan video, artikel, dan kuis.</p>
                        <Button onClick={() => setIsAddingModule(true)} className="h-16 px-10 rounded-[28px] bg-ueu-navy hover:bg-ueu-blue text-white font-black shadow-2xl shadow-blue-900/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
                            <Plus className="mr-3 h-5 w-5" /> Buat Bagian Pertama
                        </Button>
                    </div>
                )}
                
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="modules-list" type="module">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                                {course.syllabus.map((module, mIndex) => {
                                    const moduleLessonIds = module.lessons.map(l => l.id);
                                    const allSelected = moduleLessonIds.length > 0 && moduleLessonIds.every(id => selectedLessons.has(id));
                                    const someSelected = moduleLessonIds.some(id => selectedLessons.has(id));
                                    const isExpanded = expandedModules.has(module.id);
                                    const hasPrerequisites = module.prerequisites && module.prerequisites.length > 0;

                                    return (
                                        <Draggable key={module.id} draggableId={module.id} index={mIndex}>
                                            {(provided) => (
                                                <div 
                                                    ref={provided.innerRef} 
                                                    {...provided.draggableProps} 
                                                    className={cn(
                                                        "bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500",
                                                        isExpanded ? "ring-2 ring-violet-500/10 shadow-2xl shadow-violet-500/10" : "hover:shadow-xl hover:border-violet-100"
                                                    )}
                                                >
                                                    {/* Module Header */}
                                                    <div 
                                                        className={cn(
                                                            "flex items-center p-6 cursor-pointer group/header transition-colors duration-300",
                                                            isExpanded ? "bg-slate-50/80 border-b border-slate-100" : "hover:bg-slate-50/50"
                                                        )}
                                                        onClick={() => toggleModule(module.id)}
                                                    >
                                                        <div 
                                                            {...provided.dragHandleProps} 
                                                            className="mr-4 p-2 rounded-xl text-slate-300 hover:text-ueu-navy hover:bg-white transition-all cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-100 hover:shadow-sm"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            {editingModuleId === module.id ? (
                                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <Input 
                                                                        value={tempModuleTitle} 
                                                                        onChange={(e) => setTempModuleTitle(e.target.value)}
                                                                        className="h-12 max-w-md bg-white shadow-xl rounded-2xl border-violet-200 focus:border-violet-500 font-bold"
                                                                        autoFocus
                                                                        placeholder="Masukkan judul modul"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') saveModuleTitle();
                                                                            if (e.key === 'Escape') setEditingModuleId(null);
                                                                        }}
                                                                    />
                                                                    <div className="flex gap-1 ml-1">
                                                                        <Button size="sm" onClick={saveModuleTitle} className="h-10 w-10 p-0 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 transition-all"><Check className="h-4 w-4 text-white" /></Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => setEditingModuleId(null)} className="h-10 w-10 p-0 rounded-xl text-slate-400"><X className="h-4 w-4" /></Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                    <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                                                        <input 
                                                                            type="checkbox"
                                                                            checked={allSelected}
                                                                            disabled={module.lessons.length === 0}
                                                                            ref={input => { if (input) input.indeterminate = someSelected && !allSelected; }}
                                                                            onChange={() => toggleModuleSelection(module)}
                                                                            className="w-5 h-5 rounded-lg border-slate-200 text-violet-600 focus:ring-violet-500 cursor-pointer transition-all border-2"
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                           <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                                                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bagian {mIndex + 1}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3 group/title">
                                                                            <span className="font-black text-ueu-navy truncate text-lg tracking-tight group-hover/header:text-violet-600 transition-colors uppercase">{module.title}</span>
                                                                            <button 
                                                                                onClick={(e) => startEditingModule(module, e)}
                                                                                className="opacity-0 group-hover/title:opacity-100 p-2 hover:bg-violet-50 rounded-xl transition-all text-slate-300 hover:text-violet-600 border border-transparent hover:border-violet-100"
                                                                            >
                                                                                <Pencil className="h-3 w-3" />
                                                                            </button>
                                                                            {hasPrerequisites && (
                                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 rounded-full gap-1.5 font-bold text-[10px] uppercase shadow-sm">
                                                                                    <Lock className="h-3 w-3" /> Terkunci
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 pl-6 border-l border-slate-100 ml-4">
                                                            <div className="hidden sm:flex items-center mr-4">
                                                                <div className="flex -space-x-1.5">
                                                                    {module.lessons.length > 0 ? (
                                                                        Array.from({ length: Math.min(module.lessons.length, 3) }).map((_, i) => (
                                                                            <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                                                                {getLessonTypeIcon(module.lessons[i].type, "h-2 w-2 text-slate-400")}
                                                                            </div>
                                                                        ))
                                                                    ) : null}
                                                                </div>
                                                                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest ml-3">
                                                                    {module.lessons.length} {module.lessons.length === 1 ? 'Item' : 'Items'}
                                                                </span>
                                                            </div>

                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm" onClick={(e) => e.stopPropagation()}>
                                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                                                                    <button 
                                                                        onClick={(e) => startEditingModule(module, e)}
                                                                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-ueu-navy hover:bg-violet-50 hover:text-violet-600 rounded-xl flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Pencil className="h-4 w-4" /> Ubah Nama Bagian
                                                                    </button>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); setPrereqTarget({ id: module.id, type: 'module', rules: module.prerequisites || [] }); }}
                                                                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-ueu-navy hover:bg-violet-50 hover:text-violet-600 rounded-xl flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Lock className="h-4 w-4" /> Restrictions
                                                                    </button>
                                                                    <div className="h-px bg-slate-50 my-1"></div>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                                                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" /> Hapus Bagian
                                                                    </button>
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                className="h-10 w-10 p-0 rounded-2xl"
                                                            >
                                                                <ChevronDown className={cn("h-5 w-5 text-slate-300 transition-transform duration-500", isExpanded && "rotate-180 text-violet-500")} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Module Content */}
                                                    {isExpanded && (
                                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                                            <Droppable droppableId={module.id} type="lesson">
                                                                {(provided) => (
                                                                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-white min-h-[50px]">
                                                                        {module.lessons.length === 0 ? (
                                                                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                                                                No lessons in this module yet.
                                                                            </div>
                                                                        ) : (
                                                                            <div className="divide-y divide-slate-100">
                                                                                {module.lessons.map((lesson, lIndex) => {
                                                                                    const isSelected = selectedLessons.has(lesson.id);
                                                                                    const isEditing = editingLessonId === lesson.id;
                                                                                    
                                                                                    if (isEditing) {
                                                                                        return (
                                                                                            <Draggable key={lesson.id} draggableId={lesson.id} index={lIndex} isDragDisabled>
                                                                                                {(provided) => (
                                                                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                                                        {isFullScreen ? (
                                                                                                            <>
                                                                                                                <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50 text-center text-slate-400 text-sm mb-4">
                                                                                                                    <Maximize2 className="h-5 w-5 mx-auto mb-2 opacity-50" />
                                                                                                                    Editing <strong>{lesson.title}</strong> in full screen mode...
                                                                                                                </div>
                                                                                                                
                                                                                                                <div className="fixed inset-0 z-[100] bg-slate-100 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                                                                                                                    {/* Full Screen Header */}
                                                                                                                    <div className="bg-white border-b sticky top-0 z-20 px-4 md:px-8 h-16 flex items-center justify-between shadow-sm shrink-0">
                                                                                                                        <div className="flex items-center gap-4">
                                                                                                                            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(false)}>
                                                                                                                                <ArrowLeft className="h-5 w-5 text-slate-500" />
                                                                                                                            </Button>
                                                                                                                            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                                                                                                                            <div>
                                                                                                                                <h3 className="font-bold text-slate-900 line-clamp-1 text-sm sm:text-base">{lesson.title}</h3>
                                                                                                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                                                                                    <Badge variant="outline" className="text-[10px] px-1 h-4">{lesson.type}</Badge>
                                                                                                                                    <span>Editing Content</span>
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                        <Button size="sm" variant="outline" onClick={() => setIsFullScreen(false)} className="gap-2">
                                                                                                                            <Minimize2 className="h-4 w-4" /> <span className="hidden sm:inline">Exit Full Screen</span>
                                                                                                                        </Button>
                                                                                                                    </div>

                                                                                                                    {/* Editor Content */}
                                                                                                                    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                                                                                                                        <Card className="shadow-sm border-slate-200">
                                                                                                                            <CardContent className="p-6 md:p-8">
                                                                                                                                <LessonEditorSwitcher 
                                                                                                                                    lesson={lesson} 
                                                                                                                                    onCancel={() => setEditingLessonId(null)}
                                                                                                                                    onSave={async (updates?: Partial<Lesson>) => {
                                                                                                                                        if (updates) {
                                                                                                                                            const updatedSyllabus = course.syllabus.map(m => ({
                                                                                                                                                ...m,
                                                                                                                                                lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, ...updates } : l)
                                                                                                                                            }));
                                                                                                                                            setCourse(prev => prev ? { ...prev, syllabus: updatedSyllabus } : null);
                                                                                                                                        }
                                                                                                                                        setEditingLessonId(null);
                                                                                                                                        // Do not fetch on update here to rely on optimistic update
                                                                                                                                    }}
                                                                                                                                    onDelete={() => handleDeleteLesson(lesson.id)}
                                                                                                                                />
                                                                                                                            </CardContent>
                                                                                                                        </Card>

                                                                                                                        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                                                                                                                            <ResourcesManager lessonId={lesson.id} />
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </>
                                                                                                        ) : (
                                                                                                            <div className="p-4 bg-slate-50/50 border-l-4 border-primary animate-in fade-in space-y-4">
                                                                                                                <div className="flex justify-end -mb-2">
                                                                                                                    <Button 
                                                                                                                        size="sm" 
                                                                                                                        variant="ghost" 
                                                                                                                        onClick={() => setIsFullScreen(true)}
                                                                                                                        className="h-6 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2"
                                                                                                                    >
                                                                                                                        <Maximize2 className="h-3 w-3 mr-1.5" /> Full Screen
                                                                                                                    </Button>
                                                                                                                </div>
                                                                                                                <LessonEditorSwitcher 
                                                                                                                    lesson={lesson} 
                                                                                                                    onCancel={() => setEditingLessonId(null)}
                                                                                                                    onSave={async (updates?: Partial<Lesson>) => {
                                                                                                                        if (updates) {
                                                                                                                            const updatedSyllabus = course.syllabus.map(m => ({
                                                                                                                                ...m,
                                                                                                                                lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, ...updates } : l)
                                                                                                                            }));
                                                                                                                            setCourse(prev => prev ? { ...prev, syllabus: updatedSyllabus } : null);
                                                                                                                        }
                                                                                                                        setEditingLessonId(null);
                                                                                                                        // Do not fetch on update here to rely on optimistic update
                                                                                                                    }}
                                                                                                                    onDelete={() => handleDeleteLesson(lesson.id)}
                                                                                                                />
                                                                                                                
                                                                                                                <ResourcesManager lessonId={lesson.id} />
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </Draggable>
                                                                                        );
                                                                                    }

                                                                                    return (
                                                                                        <Draggable key={lesson.id} draggableId={lesson.id} index={lIndex}>
                                                                                            {(provided) => (
                                                                                                <div 
                                                                                                    ref={provided.innerRef}
                                                                                                    {...provided.draggableProps}
                                                                                                    className={cn(
                                                                                                        "group flex items-center justify-between p-4 pl-5 hover:bg-slate-50 transition-all border-b border-slate-100 last:border-0",
                                                                                                        isSelected && "bg-blue-50/50"
                                                                                                    )}
                                                                                                >
                                                                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                                                                        <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-slate-200 group-hover:text-slate-300">
                                                                                                            <GripVertical className="h-4 w-4" />
                                                                                                        </div>
                                                                                                        <input 
                                                                                                            type="checkbox" 
                                                                                                            checked={isSelected}
                                                                                                            onChange={() => toggleLessonSelection(lesson.id)}
                                                                                                            className="w-5 h-5 rounded border-slate-300 text-ueu-blue focus:ring-ueu-blue cursor-pointer transition-all"
                                                                                                        />
                                                                                                        
                                                                                                        <div 
                                                                                                            onClick={() => setEditingLessonId(lesson.id)}
                                                                                                            className="flex items-center gap-3 flex-1 cursor-pointer min-w-0 py-1"
                                                                                                        >
                                                                                                            <div className={cn(
                                                                                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm",
                                                                                                                lesson.type === 'video' ? "bg-blue-50 border-blue-100 text-blue-600" :
                                                                                                                lesson.type === 'article' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                                                                                                                lesson.type === 'quiz' ? "bg-amber-50 border-amber-100 text-amber-600" :
                                                                                                                "bg-purple-50 border-purple-100 text-purple-600"
                                                                                                            )}>
                                                                                                                {lesson.type === 'video' && <Video className="h-4 w-4" />}
                                                                                                                {lesson.type === 'article' && <FileText className="h-4 w-4" />}
                                                                                                                {lesson.type === 'quiz' && <HelpCircle className="h-4 w-4" />}
                                                                                                                {lesson.type === 'assignment' && <ClipboardList className="h-4 w-4" />}
                                                                                                            </div>
                                                                                                            
                                                                                                            <div className="flex-1 min-w-0">
                                                                                                                <div className="flex items-center gap-3">
                                                                                                                    <span className="font-bold text-slate-700 truncate group-hover:text-ueu-blue transition-colors text-sm uppercase tracking-tight">
                                                                                                                        {lesson.title}
                                                                                                                    </span>
                                                                                                                    <Badge 
                                                                                                                        variant="outline" 
                                                                                                                        className={cn(
                                                                                                                            "text-[10px] h-5 px-1.5 py-0 font-medium border",
                                                                                                                            lesson.isPublished 
                                                                                                                                ? "bg-green-50 text-green-700 border-green-200" 
                                                                                                                                : "bg-slate-100 text-slate-500 border-slate-200"
                                                                                                                        )}
                                                                                                                    >
                                                                                                                        {lesson.isPublished ? "Published" : "Draft"}
                                                                                                                    </Badge>
                                                                                                                </div>
                                                                                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                                                                                                                    <span className="opacity-60">{lesson.type}</span>
                                                                                                                    <span className="opacity-30">•</span>
                                                                                                                    <span className="opacity-60 text-ueu-navy font-bold">{lesson.duration || '0:00'}</span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                                                                                                        {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                                                                                                            <Lock className="h-3 w-3 text-amber-500 mr-2" />
                                                                                                        )}
                                                                                                        <Button 
                                                                                                            size="sm" 
                                                                                                            type="button"
                                                                                                            variant="ghost" 
                                                                                                            className={cn(
                                                                                                                "h-9 w-9 p-0 rounded-xl transition-all", 
                                                                                                                lesson.isPublished ? "text-green-600 hover:text-green-700 hover:bg-green-100" : "text-slate-400 hover:text-slate-600"
                                                                                                            )}
                                                                                                            onClick={(e) => { e.stopPropagation(); handleToggleLessonPublish(lesson); }}
                                                                                                            title={lesson.isPublished ? "Unpublish Lesson" : "Publish Lesson"}
                                                                                                        >
                                                                                                            {lesson.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                                                                        </Button>

                                                                                                        <Button 
                                                                                                            size="sm" 
                                                                                                            type="button"
                                                                                                            variant="ghost" 
                                                                                                            className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-ueu-blue hover:bg-blue-50 transition-all"
                                                                                                            onClick={() => setEditingLessonId(lesson.id)}
                                                                                                            title="Edit Content"
                                                                                                        >
                                                                                                            <Pencil className="h-4 w-4" />
                                                                                                        </Button>

                                                                                                        <Popover>
                                                                                                            <PopoverTrigger asChild>
                                                                                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                                                                                                </Button>
                                                                                                            </PopoverTrigger>
                                                                                                            <PopoverContent align="end" className="w-48 p-1">
                                                                                                                <button 
                                                                                                                    onClick={(e) => { e.stopPropagation(); setPrereqTarget({ id: lesson.id, type: 'lesson', rules: lesson.prerequisites || [] }); }}
                                                                                                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-slate-100 rounded flex items-center gap-2"
                                                                                                                >
                                                                                                                    <Lock className="h-3.5 w-3.5" /> Restrictions
                                                                                                                </button>
                                                                                                                <button 
                                                                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}
                                                                                                                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
                                                                                                                >
                                                                                                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                                                                                                </button>
                                                                                                            </PopoverContent>
                                                                                                        </Popover>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </Draggable>
                                                                                    );
                                                                                })}
                                                                                {provided.placeholder}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                            
                                                            {/* Add Lesson Actions */}
                                                            <div className="bg-slate-50/50 p-8 flex justify-center border-t border-slate-100 flex-wrap gap-5">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="lg"
                                                                    className="flex-1 max-w-[200px] h-24 rounded-[24px] bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-200 text-ueu-navy hover:text-ueu-blue group/btn transition-all shadow-sm hover:shadow-md flex-col gap-1 py-4"
                                                                    onClick={() => handleAddLesson(module.id, module.lessons.length, 'video')}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                                                                        <Video className="h-5 w-5 text-blue-600" />
                                                                    </div>
                                                                    <span className="font-black uppercase tracking-widest text-[10px]">Video Content</span>
                                                                </Button>

                                                                <Button 
                                                                    variant="outline" 
                                                                    size="lg"
                                                                    className="flex-1 max-w-[200px] h-24 rounded-[24px] bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 text-ueu-navy hover:text-emerald-700 group/btn transition-all shadow-sm hover:shadow-md flex-col gap-1 py-4"
                                                                    onClick={() => handleAddLesson(module.id, module.lessons.length, 'article')}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                                                                        <FileText className="h-5 w-5 text-emerald-600" />
                                                                    </div>
                                                                    <span className="font-black uppercase tracking-widest text-[10px]">Reading Material</span>
                                                                </Button>

                                                                <Button 
                                                                    variant="outline" 
                                                                    size="lg"
                                                                    className="flex-1 max-w-[200px] h-24 rounded-[24px] bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-200 text-ueu-navy hover:text-amber-700 group/btn transition-all shadow-sm hover:shadow-md flex-col gap-1 py-4"
                                                                    onClick={() => handleAddLesson(module.id, module.lessons.length, 'quiz')}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                                                                        <HelpCircle className="h-5 w-5 text-amber-600" />
                                                                    </div>
                                                                    <span className="font-black uppercase tracking-widest text-[10px]">Knowledge Check</span>
                                                                </Button>

                                                                <Button 
                                                                    variant="outline" 
                                                                    size="lg"
                                                                    className="flex-1 max-w-[200px] h-24 rounded-[24px] bg-white hover:bg-purple-50 border-slate-200 hover:border-purple-200 text-ueu-navy hover:text-purple-700 group/btn transition-all shadow-sm hover:shadow-md flex-col gap-1 py-4"
                                                                    onClick={() => handleAddLesson(module.id, module.lessons.length, 'assignment')}
                                                                >
                                                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-1 group-hover/btn:scale-110 transition-transform">
                                                                        <ClipboardList className="h-5 w-5 text-purple-600" />
                                                                    </div>
                                                                    <span className="font-black uppercase tracking-widest text-[10px]">Hands-on Task</span>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}

                                {/* Add Module Bagian */}
                                {isAddingModule ? (
                                    <Card className="border-dashed border-2 border-indigo-200 shadow-none bg-indigo-50/30 animate-in fade-in slide-in-from-bottom-2">
                                        <CardContent className="p-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                            <div className="flex-1 w-full">
                                                <label className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1.5 block">Judul Modul Baru</label>
                                                <Input 
                                                    placeholder="e.g., Introduction to Advanced Concepts" 
                                                    value={newModuleTitle} 
                                                    onChange={(e) => setNewModuleTitle(e.target.value)}
                                                    autoFocus
                                                    className="bg-white"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAddModule();
                                                        if (e.key === 'Escape') setIsAddingModule(false);
                                                    }}
                                                />
                                            </div>
                                            <div className="flex gap-2 mt-2 sm:mt-6 w-full sm:w-auto">
                                                <Button onClick={handleAddModule} className="flex-1 sm:flex-none">Simpan Modul</Button>
                                                <Button variant="ghost" onClick={() => setIsAddingModule(false)} className="flex-1 sm:flex-none">Batal</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    course.syllabus.length > 0 && (
                                        <div className="flex justify-center pt-10 pb-20">
                                            <Button 
                                                variant="outline" 
                                                className="h-16 px-10 rounded-[28px] border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-500 hover:text-violet-500 hover:bg-violet-50 transition-all font-black uppercase tracking-widest text-xs group"
                                                onClick={() => setIsAddingModule(true)}
                                            >
                                                <Plus className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> Tambah Bagian Baru
                                            </Button>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {/* Sticky Action Toolbar */}
            {selectedLessons.size > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-ueu-navy/95 backdrop-blur-xl text-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] px-8 py-5 flex items-center gap-10 z-50 animate-in slide-in-from-bottom-12 border border-white/20 ring-1 ring-white/10">
                    <div className="text-sm font-black border-r border-white/10 pr-6 flex items-center gap-3">
                        <span className="bg-violet-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">{selectedLessons.size}</span>
                        <span className="hidden sm:inline uppercase tracking-widest text-[10px]">Items Selected</span>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBatchUpdate(true)}
                            className="text-white hover:text-green-400 hover:bg-white/5 h-10 px-4 rounded-xl font-bold gap-2"
                            disabled={isUpdatingStatus}
                        >
                           {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                           Publish
                        </Button>
                        <Button 
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBatchUpdate(false)}
                            className="text-white hover:text-red-400 hover:bg-white/5 h-10 px-4 rounded-xl font-bold gap-2"
                            disabled={isUpdatingStatus}
                        >
                           {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
                           Unpublish
                        </Button>
                    </div>
                    <button 
                        onClick={() => setSelectedLessons(new Set())}
                        className="ml-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/20 text-white/50 hover:text-white transition-all active:scale-90"
                        title="Clear selection"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {deleteConfirm?.type === 'lesson' 
                      ? "This action cannot be undone. This will permanently delete this lesson and remove it from the course curriculum."
                      : "This action cannot be undone. This will permanently delete this module and ALL lessons contained within it."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700">
                    Delete {deleteConfirm?.type === 'module' ? 'Module' : 'Lesson'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {prereqTarget && (
                <PrerequisiteSelector 
                    open={!!prereqTarget}
                    onOpenChange={(val) => !val && setPrereqTarget(null)}
                    course={course}
                    targetId={prereqTarget.id}
                    targetType={prereqTarget.type}
                    existingRules={prereqTarget.rules}
                    onSave={savePrerequisites}
                />
            )}
        </div>
    );
};
