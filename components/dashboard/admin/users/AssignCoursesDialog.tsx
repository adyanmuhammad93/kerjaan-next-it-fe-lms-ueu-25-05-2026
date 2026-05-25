import React, { useState, useEffect } from 'react';
import { Course } from '../../../../types';
import { courseService } from '../../../../services/courseService';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { Search, Loader2, BookOpen, User, CheckCircle2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../../../ui/Dialog';
import { Checkbox } from '../../../ui/Checkbox';
import { Badge } from '../../../ui/Badge';

export interface AssignCoursesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    instructor: any | null; // Profile from UserListTable
    onAssignmentComplete: () => void;
}

export const AssignCoursesDialog: React.FC<AssignCoursesDialogProps> = ({
    isOpen,
    onClose,
    instructor,
    onAssignmentComplete
}) => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
    const [initialCourseIds, setInitialCourseIds] = useState<Set<string>>(new Set());

    // Fetch all available courses
    useEffect(() => {
        if (isOpen && instructor) {
            const fetchCourses = async () => {
                setLoading(true);
                try {
                    // Get a large list of courses to pick from
                    const resp = await courseService.getPaginatedCourses(1, 100);
                    setCourses(resp.data);

                    // Fetch current assignments
                    const assignedCourseIds = await courseService.getInstructorAssignments(instructor.id);

                    // Pre-select courses that already belong to this instructor (owned or assigned)
                    const owned = resp.data.filter(c => c.instructorId === instructor.id).map(c => c.id);
                    const initialSelected = new Set([...owned, ...assignedCourseIds]);

                    setSelectedCourseIds(initialSelected);
                    setInitialCourseIds(initialSelected);
                } catch (error) {
                    console.error('Failed to fetch courses:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchCourses();
        } else {
            // Reset when closed
            setCourses([]);
            setSelectedCourseIds(new Set());
            setInitialCourseIds(new Set());
            setSearchQuery('');
        }
    }, [isOpen, instructor]);

    if (!instructor) return null;

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleCourseSelection = (courseId: string) => {
        const newSelection = new Set(selectedCourseIds);
        if (newSelection.has(courseId)) {
            newSelection.delete(courseId);
        } else {
            newSelection.add(courseId);
        }
        setSelectedCourseIds(newSelection);
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            // We only save assignments for courses they DO NOT own.
            // Owned courses are tied to them via courses.instructor_id.
            const owned = courses.filter(c => c.instructorId === instructor.id).map(c => c.id);
            const assignedToSave = Array.from(selectedCourseIds).filter(id => !owned.includes(id));

            await courseService.updateInstructorAssignments(instructor.id, assignedToSave);

            onAssignmentComplete();
            onClose();
        } catch (error) {
            console.error('Failed to assign courses:', error);
            alert('Failed to save assignments');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-50">
                <div className="bg-white border-b px-6 py-5">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            Assign Courses
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-1.5">
                            Manage course assignments for instructor <span className="font-semibold text-slate-800">{instructor.full_name || instructor.email}</span>.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <Input
                            placeholder="Search courses by title..."
                            className="pl-9 bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Available Courses</span>
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                {selectedCourseIds.size} selected
                            </span>
                        </div>

                        <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-12 flex flex-col justify-center items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-3" />
                                    <p className="text-sm text-slate-500">Loading courses...</p>
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <BookOpen className="h-10 w-10 text-slate-200 mb-3" />
                                    <p className="text-slate-500 font-medium">No courses found</p>
                                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
                                </div>
                            ) : (
                                filteredCourses.map(course => {
                                    const isSelected = selectedCourseIds.has(course.id);
                                    const isOwned = course.instructorId === instructor.id;
                                    const isInitial = initialCourseIds.has(course.id);

                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => !isOwned && toggleCourseSelection(course.id)}
                                            className={`flex items-center p-3 transition-all duration-200 ${isOwned ? 'cursor-not-allowed opacity-80 bg-slate-50' : 'cursor-pointer'} ${isSelected && !isOwned ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : !isOwned ? 'hover:bg-slate-50' : ''}`}
                                        >
                                            <div className="mr-4 ml-1 flex-shrink-0">
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={isOwned}
                                                    onCheckedChange={() => !isOwned && toggleCourseSelection(course.id)}
                                                    className={`transition-colors h-5 w-5 ${isSelected ? 'border-indigo-600 data-[state=checked]:bg-indigo-600' : 'border-slate-300 data-[state=unchecked]:bg-white'} ${isOwned ? 'opacity-50' : ''}`}
                                                />
                                            </div>

                                            <div className="h-12 w-20 bg-slate-100 rounded-md overflow-hidden mr-4 shrink-0 hidden sm:block border border-slate-200 relative">
                                                {course.thumbnailUrl ? (
                                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                                        <BookOpen className="h-5 w-5 text-slate-300" />
                                                    </div>
                                                )}
                                                {isSelected && !isOwned && (
                                                    <div className="absolute inset-0 bg-indigo-600/10 mix-blend-multiply" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className={`text-sm font-medium truncate mb-0.5 ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                    {course.title}
                                                </p>
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <User className="h-3 w-3 mr-1" />
                                                    <span className="truncate">{course.instructor}</span>
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0">
                                                {isOwned ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-normal shadow-sm">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Owner
                                                    </Badge>
                                                ) : isInitial && isSelected ? (
                                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-normal shadow-sm">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Assigned
                                                    </Badge>
                                                ) : isSelected ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal shadow-sm">
                                                        To Assign
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white border-t px-6 py-4">
                    <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
                        <div className="text-sm text-slate-500 hidden sm:block">
                            {selectedCourseIds.size > 0 ? (
                                <span>Assigning <strong className="text-indigo-600">{selectedCourseIds.size}</strong> courses</span>
                            ) : 'No courses selected'}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} disabled={submitting} className="border-slate-200 hover:bg-slate-50">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={submitting || loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Assignments'
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
