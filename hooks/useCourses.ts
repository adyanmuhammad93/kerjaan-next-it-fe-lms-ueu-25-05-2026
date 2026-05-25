
import { useEffect, useState, useCallback } from 'react';
import { courseService } from '../services/courseService';
import { useStore } from '../store/useStore';
import { Course } from '../types';

export const useCourses = () => {
  const [loading, setLoading] = useState(false);
  const { courses, setCourses, addCourse: addCourseToStore, user, enrollCourse: enrollStore } = useStore();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      // Role-aware course fetch:
      // - Instructor: load owned + assigned courses only (avoids forbidden /courses listing).
      // - Others: keep existing full listing behavior.
      if (user?.role === 'instructor') {
        const [ownedCourses, assignedIds] = await Promise.all([
          courseService.getInstructorCourses(user.id),
          courseService.getInstructorAssignments(user.id),
        ]);

        const ownedIds = new Set(ownedCourses.map(c => c.id));
        const extraAssignedIds = assignedIds.filter(id => !ownedIds.has(id));

        const assignedCourses = await Promise.all(
          extraAssignedIds.map(async (courseId) => {
            try {
              return await courseService.getCourseById(courseId);
            } catch {
              return null;
            }
          })
        );

        const merged = [...ownedCourses, ...assignedCourses.filter(Boolean)];
        setCourses(merged as Course[]);
      } else {
        const data = await courseService.getAllCourses();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  }, [setCourses, user]);

  // Initial fetch
  useEffect(() => {
    if (courses.length === 0) {
        fetchCourses();
    }
  }, [fetchCourses, courses.length]);

  const createCourse = async (courseData: Partial<Course>) => {
    if (!user) throw new Error("Must be logged in");
    
    setLoading(true);
    try {
      const newCourse = await courseService.createCourse(courseData, user.id, user.name);
      addCourseToStore(newCourse);
      return newCourse;
    } finally {
      setLoading(false);
    }
  };

  const generateCourse = async (courseData: any) => {
    if (!user) throw new Error("Must be logged in");

    setLoading(true);
    try {
        const newCourse = await courseService.createGeneratedCourse(courseData, user.id, user.name);
        addCourseToStore(newCourse);
        return newCourse;
    } finally {
        setLoading(false);
    }
  };

  const enroll = async (courseId: string) => {
    if (!user) throw new Error("Must be logged in");
    setLoading(true);
    try {
        await courseService.enrollUser(user.id, courseId);
        enrollStore(courseId); // Update local store
        // Optionally refresh user data to get updated enrollments from DB source of truth
    } finally {
        setLoading(false);
    }
  };

  return { courses, loading, fetchCourses, createCourse, generateCourse, enroll };
};
