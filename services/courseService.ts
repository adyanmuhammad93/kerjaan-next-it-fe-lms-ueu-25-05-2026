import { apiClient } from './apiClient';
import { Course, Module, Lesson, Certificate, CertificateWithCourse, Review } from '../types';

// ─── Mappers (snake_case DB → camelCase app) ─────────────────────────────────
const mapToCourse = (data: any): Course => ({
  id: data.id,
  title: data.title,
  subtitle: data.subtitle,
  instructor: data.instructor_name || data.instructor,
  instructorId: data.instructor_id || data.instructorId,
  description: data.description,
  price: Number(data.price ?? 0),
  rating: Number(data.rating ?? 0),
  ratingCount: Number(data.rating_count ?? data.ratingCount ?? 0),
  thumbnailUrl: data.thumbnail_url || data.thumbnailUrl,
  category: data.category,
  level: data.level,
  language: data.language,
  learningObjectives: data.learning_objectives || data.learningObjectives || [],
  requirements: data.requirements || [],
  lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : '',
  syllabus: (data.modules || data.syllabus || []).map(mapToModule).sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)),
  isPublished: data.is_published ?? data.isPublished ?? false,
  approvalStatus: data.approval_status || data.approvalStatus || (data.is_published ? 'approved' : 'draft'),
  accessType: data.access_type || data.accessType || 'paid',
  accessConfig: data.access_config || data.accessConfig || {},
  certificateConfig: data.certificate_config || data.certificateConfig || { enabled: true, minScore: 0, requireGradedAssignments: false, enforcePerQuiz: false },
  lessonCount: data.lesson_count ?? data.lessonCount,
});

const mapToModule = (data: any): Module => ({
  id: data.id,
  title: data.title,
  orderIndex: data.order_index ?? data.orderIndex,
  prerequisites: data.prerequisites || [],
  lessons: data.lessons ? data.lessons.map(mapToLesson).sort((a: any, b: any) => (a.orderIndex || 0) - (b.orderIndex || 0)) : [],
});

const mapToLesson = (data: any): Lesson => ({
  id: data.id,
  title: data.title,
  duration: data.duration || '0:00',
  type: data.type,
  content: data.content,
  videoUrl: data.video_url || data.videoUrl,
  isPublished: data.is_published ?? data.isPublished ?? false,
  orderIndex: data.order_index ?? data.orderIndex,
  prerequisites: data.prerequisites || [],
});

const mapCertificate = (data: any): Certificate => ({
  id: data.id,
  userId: data.user_id || data.userId,
  courseId: data.course_id || data.courseId,
  issuedAt: data.issued_at || data.issuedAt,
  verificationCode: data.verification_code || data.verificationCode,
  expiresAt: data.expires_at || data.expiresAt,
  revoked: data.revoked,
  revokedReason: data.revoked_reason || data.revokedReason,
});

// ─── Service ──────────────────────────────────────────────────────────────────
export const courseService = {
  // ── Listing & searching ────────────────────────────────────────────────────
  async getAllCourses(): Promise<Course[]> {
    const data = await apiClient.get<any>('/courses?limit=200');
    return (Array.isArray(data) ? data : data.courses || []).map(mapToCourse);
  },

  async getPaginatedCourses(page: number = 1, limit: number = 10, search: string = '') {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const data = await apiClient.get<any>(`/courses?${params}`);
    const coursesArray = data.data || data.courses || [];
    return {
      data: coursesArray.map((d: any) => ({ ...mapToCourse(d), instructorEmail: d.instructor_email || d.instructorEmail })),
      total: data.total || 0,
      page,
      limit,
      totalPages: data.total ? Math.ceil(data.total / limit) : 0,
    };
  },

  async getCourseById(id: string, _publishedOnly: boolean = false): Promise<Course | null> {
    try {
      const data = await apiClient.get<any>(`/courses/${id}`);
      if (!data || data.error) return null;
      
      // Handle both { course: ... } and direct object just in case
      const courseData = data.course || data;
      if (!courseData || !courseData.id) return null;
      
      const course = mapToCourse(courseData);
      course.lessonCount = course.syllabus.reduce((acc, m) => acc + m.lessons.length, 0);
      return course;
    } catch {
      return null;
    }
  },

  async getInstructorCourses(instructorId: string): Promise<Course[]> {
    const data = await apiClient.get<{ courses: any[] }>(`/courses?instructorId=${instructorId}&limit=200`);
    return (data.courses || []).map(mapToCourse);
  },

  // ── Course CRUD ────────────────────────────────────────────────────────────
  async createCourse(courseData: Partial<Course>, _instructorId: string, _instructorName: string): Promise<Course> {
    const data = await apiClient.post<any>('/courses', {
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      price: courseData.price,
      category: courseData.category,
      thumbnailUrl: courseData.thumbnailUrl,
      level: courseData.level || 'Beginner',
      learningObjectives: courseData.learningObjectives || [],
      requirements: courseData.requirements || [],
      accessType: courseData.accessType || 'paid',
    });
    
    // Handle both wrapped and unwrapped backend response
    const actualCourse = data.course || data;
    return mapToCourse(actualCourse);
  },

  async updateCourse(id: string, courseData: Partial<Course>): Promise<void> {
    await apiClient.patch(`/courses/${id}`, {
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      price: courseData.price,
      category: courseData.category,
      thumbnailUrl: courseData.thumbnailUrl,
      level: courseData.level,
      language: courseData.language,
      learningObjectives: courseData.learningObjectives,
      requirements: courseData.requirements,
      accessType: courseData.accessType,
      accessConfig: courseData.accessConfig,
      certificateConfig: courseData.certificateConfig,
      isPublished: courseData.isPublished,
    });
  },

  async approveCourse(id: string): Promise<void> {
    await apiClient.patch(`/courses/${id}/approve`);
  },

  async rejectCourse(id: string): Promise<void> {
    await apiClient.patch(`/courses/${id}/reject`);
  },

  async deleteCourse(id: string): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  },

  // ── Modules ────────────────────────────────────────────────────────────────
  async createModule(courseId: string, title: string, orderIndex: number): Promise<Module> {
    const data = await apiClient.post<any>(`/courses/${courseId}/modules`, { title, orderIndex });
    return mapToModule(data.module || data);
  },

  async updateModule(moduleId: string, updates: Partial<Module> | string): Promise<void> {
    const payload = typeof updates === 'string' ? { title: updates } : updates;
    await apiClient.patch(`/courses/modules/${moduleId}`, payload);
  },

  async deleteModule(moduleId: string): Promise<void> {
    await apiClient.delete(`/courses/modules/${moduleId}`);
  },

  async reorderModules(updates: { id: string; orderIndex: number }[]): Promise<void> {
    await apiClient.patch('/courses/modules/reorder', { updates });
  },

  // ── Lessons ────────────────────────────────────────────────────────────────
  async createLesson(
    moduleId: string,
    title: string,
    orderIndex: number,
    type: 'video' | 'article' | 'quiz' | 'assignment' = 'video',
  ): Promise<Lesson> {
    const data = await apiClient.post<any>(`/courses/modules/${moduleId}/lessons`, {
      title, orderIndex, type,
    });
    return mapToLesson(data.lesson || data);
  },

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<void> {
    await apiClient.patch(`/courses/lessons/${lessonId}`, {
      title: updates.title,
      content: updates.content,
      videoUrl: updates.videoUrl,
      duration: updates.duration,
      isPublished: updates.isPublished,
      prerequisites: updates.prerequisites,
    });
  },

  async updateLessonStatusBatch(lessonIds: string[], isPublished: boolean): Promise<void> {
    if (lessonIds.length === 0) return;
    await apiClient.patch('/courses/lessons/batch-status', { lessonIds, isPublished });
  },

  async reorderLessons(updates: { id: string; orderIndex: number; moduleId: string }[]): Promise<void> {
    await apiClient.patch('/courses/lessons/reorder', { updates });
  },

  async deleteLesson(lessonId: string): Promise<void> {
    await apiClient.delete(`/courses/lessons/${lessonId}`);
  },

  // ── Progress ───────────────────────────────────────────────────────────────
  async markLessonComplete(_userId: string, lessonId: string, courseId: string): Promise<void> {
    await apiClient.post(`/courses/${courseId}/progress`, { lessonId });
  },

  async getStudentProgress(_userId: string, courseId: string): Promise<string[]> {
    const data = await apiClient.get<{ completedLessonIds: string[] }>(`/courses/${courseId}/progress`);
    return data.completedLessonIds || [];
  },

  // ── Enrollments ────────────────────────────────────────────────────────────
  async enrollUser(_userId: string, courseId: string, status: 'active' | 'pending' = 'active'): Promise<boolean> {
    await apiClient.post('/enrollments', { courseId, status });
    return true;
  },

  async adminEnrollUser(userId: string, courseId: string, status: 'active' | 'pending' = 'active'): Promise<boolean> {
    const payload = { userId, courseId, status };
    const attempts = [
      () => apiClient.patch('/enrollments/admin/status', payload),
      () => apiClient.post('/enrollments/admin', payload),
      () => apiClient.post('/admin/enrollments', payload),
      () => apiClient.post(`/users/${userId}/enrollments`, { courseId, status }),
      () => apiClient.post('/enrollments', payload),
    ];
    let lastError: any = null;

    for (const attempt of attempts) {
      try {
        await attempt();
        return true;
      } catch (e: any) {
        lastError = e;
        if (e.message?.toLowerCase().includes('already')) return true;
      }
    }

    throw lastError;
  },

  async getEnrollmentStatus(_userId: string, courseId: string): Promise<'active' | 'pending' | 'rejected' | null> {
    try {
      const data = await apiClient.get<{ status: string }>(`/enrollments/status/${courseId}`);
      return (data.status as any) || null;
    } catch {
      return null;
    }
  },

  async updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'rejected'): Promise<void> {
    await apiClient.patch(`/enrollments/${enrollmentId}`, { status });
  },

  async getCourseEnrollmentCount(courseId: string): Promise<number> {
    const data = await apiClient.get<{ count: number }>(`/courses/${courseId}/enrollment-count`);
    return data.count || 0;
  },

  // ── Instructor stats ───────────────────────────────────────────────────────
  async getInstructorStats(_instructorId: string) {
    const data = await apiClient.get<{ stats: any[] }>('/courses/instructor/stats');
    return data.stats || [];
  },

  async getEnrolledStudents(_instructorId: string) {
    const data = await apiClient.get<{ students: any[] }>('/enrollments/my-students');
    return (data.students || []).map((item: any) => ({
      id: item.id,
      enrollmentId: item.enrollment_id || item.enrollmentId || item.id,
      studentId: item.student_id || item.studentId || item.user_id || item.userId,
      name: item.name || item.student_name || item.studentName || 'Unknown Student',
      email: item.email || item.student_email || item.studentEmail || 'N/A',
      courseId: item.course_id || item.courseId,
      courseTitle: item.course_title || item.courseTitle,
      price: Number(item.price || 0),
      enrolledAt: item.enrolled_at ? new Date(item.enrolled_at).toLocaleDateString() : '',
      enrolledAtISO: item.enrolled_at || item.enrolledAt,
      status: (item.status || item.enrollment_status || item.enrollmentStatus)?.toLowerCase?.(),
    }));
  },

  async getInstructorStudentProgress(_instructorId: string, courseId?: string) {
    const params = courseId ? `?courseId=${courseId}` : '';
    const data = await apiClient.get<{ progress: any[] }>(`/courses/instructor/student-progress${params}`);
    return (data.progress || []) as Array<{
      enrollment_id: string; student_id: string; student_name: string; student_email: string;
      course_id: string; course_title: string; enrolled_at: string; enrollment_status: string;
      total_lessons: number; completed_lessons: number; progress_pct: number;
      best_quiz_score: number; last_active: string | null; has_certificate: boolean;
    }>;
  },

  async getAllStudentProgress(filters?: {
    courseId?: string; instructorId?: string;
    statusFilter?: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
    search?: string; enrolledFrom?: string; enrolledTo?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.courseId) params.set('courseId', filters.courseId);
    if (filters?.instructorId) params.set('instructorId', filters.instructorId);
    if (filters?.statusFilter) params.set('statusFilter', filters.statusFilter);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.enrolledFrom) params.set('enrolledFrom', filters.enrolledFrom);
    if (filters?.enrolledTo) params.set('enrolledTo', filters.enrolledTo);
    const data = await apiClient.get<{ progress: any[] }>(`/courses/admin/student-progress?${params}`);
    return (data.progress || []) as Array<{
      enrollment_id: string; student_id: string; student_name: string; student_email: string;
      course_id: string; course_title: string; instructor_id: string; instructor_name: string;
      enrolled_at: string; enrollment_status: string; total_lessons: number;
      completed_lessons: number; progress_pct: number; best_score: number;
      last_active: string | null; has_certificate: boolean;
    }>;
  },

  // ── Course assignments (admin) ─────────────────────────────────────────────
  async getInstructorAssignments(instructorId: string): Promise<string[]> {
    const data = await apiClient.get<{ courseIds: string[] }>(`/courses/assignments/instructor/${instructorId}`);
    return data.courseIds || [];
  },

  async updateInstructorAssignments(instructorId: string, courseIds: string[]): Promise<void> {
    await apiClient.put(`/courses/assignments/instructor/${instructorId}`, { courseIds });
  },

  // ── Certificates ───────────────────────────────────────────────────────────
  async issueCertificate(_userId: string, courseId: string): Promise<Certificate> {
    const data = await apiClient.post<{ certificate: any }>(`/certificates/issue`, { courseId });
    return mapCertificate(data.certificate);
  },

  async getCertificate(_userId: string, courseId: string): Promise<Certificate | null> {
    try {
      const data = await apiClient.get<{ certificate: any }>(`/certificates/my/${courseId}`);
      return data.certificate ? mapCertificate(data.certificate) : null;
    } catch {
      return null;
    }
  },

  async verifyCertificate(code: string): Promise<CertificateWithCourse | null> {
    try {
      const data = await apiClient.get<{ certificate: any }>(`/certificates/verify/${code}`);
      if (!data.certificate) return null;
      const c = data.certificate;
      return {
        ...mapCertificate(c),
        courseTitle: c.course_title || c.courseTitle,
        courseThumbnail: c.course_thumbnail || c.courseThumbnail,
        instructorName: c.instructor_name || c.instructorName,
        studentName: c.student_name || c.studentName,
        customTitle: c.custom_title || c.customTitle,
      };
    } catch {
      return null;
    }
  },

  async getUserCertificates(_userId: string): Promise<CertificateWithCourse[]> {
    const data = await apiClient.get<{ certificates: any[] }>('/certificates/my');
    return (data.certificates || []).map((item: any) => ({
      ...mapCertificate(item),
      courseTitle: item.course_title || item.courseTitle,
      courseThumbnail: item.course_thumbnail || item.courseThumbnail,
      instructorName: item.instructor_name || item.instructorName,
      customTitle: item.custom_title || item.customTitle,
    }));
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  async getReviews(courseId: string): Promise<Review[]> {
    const data = await apiClient.get<{ reviews: any[] }>(`/courses/${courseId}/reviews`);
    return (data.reviews || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id || item.userId,
      userName: item.user_name || item.userName || 'Anonymous',
      rating: item.rating,
      comment: item.comment,
      createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
    }));
  },

  async addReview(_userId: string, courseId: string, rating: number, comment: string): Promise<void> {
    await apiClient.post(`/courses/${courseId}/reviews`, { rating, comment });
  },

  // ── File upload ────────────────────────────────────────────────────────────
  async uploadFile(file: File, _folder: string = 'course_content'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const data = await apiClient.upload<{ asset: { file_url: string } }>('/assets/upload', formData);
    return data.asset.file_url;
  },

  // ── AI-generated course ────────────────────────────────────────────────────
  async createGeneratedCourse(courseData: any, instructorId: string, instructorName: string): Promise<Course> {
    const newCourse = await this.createCourse({
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      price: courseData.price,
      category: courseData.category,
      level: courseData.level,
      learningObjectives: courseData.learningObjectives,
      requirements: courseData.requirements,
      thumbnailUrl: `https://picsum.photos/400/225?random=${Math.floor(Math.random() * 1000)}`,
      isPublished: false,
    }, instructorId, instructorName);

    const courseId = newCourse.id;

    if (courseData.modules && Array.isArray(courseData.modules)) {
      for (let i = 0; i < courseData.modules.length; i++) {
        const mod = courseData.modules[i];
        const newModule = await this.createModule(courseId, mod.title, i);

        if (mod.lessons && Array.isArray(mod.lessons)) {
          for (let j = 0; j < mod.lessons.length; j++) {
            const lesson = mod.lessons[j];
            const createdLesson = await this.createLesson(newModule.id, lesson.title, j, lesson.type);

            if (lesson.content) {
              await this.updateLesson(createdLesson.id, {
                content: lesson.content,
                duration: lesson.duration || (lesson.type === 'article' ? '5 min read' : '10 min quiz'),
              });
            }
          }
        }
      }
    }

    const fullCourse = await this.getCourseById(courseId);
    if (!fullCourse) throw new Error('Failed to fetch generated course');
    return fullCourse;
  },
};