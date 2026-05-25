import { apiClient } from './apiClient';
import { Submission } from '../types';

const mapSubmission = (data: any): Submission => ({
  id: data.id,
  lessonId: data.lesson_id,
  userId: data.user_id,
  fileUrl: data.file_url,
  content: data.content,
  grade: data.grade,
  feedback: data.feedback,
  submittedAt: data.submitted_at,
  updatedAt: data.updated_at,
});

export const assignmentService = {
  async getSubmission(lessonId: string, _userId: string): Promise<Submission | null> {
    try {
      const data = await apiClient.get<{ submission: any }>(`/assignments/${lessonId}/my-submission`);
      return data.submission ? mapSubmission(data.submission) : null;
    } catch {
      return null;
    }
  },

  async submitAssignment(lessonId: string, _userId: string, file?: File, content?: string): Promise<Submission> {
    const formData = new FormData();
    formData.append('lessonId', lessonId);
    if (file) formData.append('file', file);
    if (content) formData.append('content', content);
    const data = await apiClient.upload<{ submission: any }>('/assignments/submit', formData);
    return mapSubmission(data.submission);
  },

  async submitQuiz(lessonId: string, _userId: string, score: number, answers: any): Promise<Submission> {
    const data = await apiClient.post<{ submission: any }>('/assignments/quiz', {
      lessonId,
      grade: score,
      content: JSON.stringify(answers),
    });
    return mapSubmission(data.submission);
  },

  async getInstructorSubmissions(_instructorId: string) {
    const data = await apiClient.get<{ submissions: any[] }>('/assignments/instructor');
    return (data.submissions || []).map((item: any) => ({
      id: item.id,
      studentName: item.student_name || 'Unknown Student',
      studentEmail: item.student_email,
      studentAvatar: item.student_avatar,
      lessonTitle: item.lesson_title,
      lessonType: item.lesson_type,
      courseTitle: item.course_title,
      submittedAt: item.submitted_at,
      grade: item.grade,
      feedback: item.feedback,
      fileUrl: item.file_url,
      content: item.content,
    }));
  },

  async getStudentSubmissions(_userId: string) {
    const data = await apiClient.get<{ submissions: any[] }>('/assignments/my');
    return (data.submissions || []).map((item: any) => ({
      id: item.id,
      lessonId: item.lesson_id,
      lessonTitle: item.lesson_title,
      lessonType: item.lesson_type,
      courseId: item.course_id,
      courseTitle: item.course_title,
      courseThumbnail: item.course_thumbnail,
      grade: item.grade,
      feedback: item.feedback,
      submittedAt: item.submitted_at,
      status: item.grade !== null
        ? (item.lesson_type === 'quiz' && item.grade < 70 ? 'failed' : 'passed')
        : 'pending',
    }));
  },

  async gradeSubmission(submissionId: string, grade: number, feedback: string): Promise<void> {
    await apiClient.patch(`/assignments/grade/${submissionId}`, { grade, feedback });
  },

  async getStudentCoursePerformance(_userId: string, courseId: string) {
    const data = await apiClient.get<any>(`/assignments/performance/${courseId}`);
    return {
      averageScore: data.averageScore ?? 0,
      completedQuizzes: data.completedQuizzes ?? 0,
      quizGrades: data.quizGrades ?? [],
      totalAssignmentsSubmitted: data.totalAssignmentsSubmitted ?? 0,
      gradedAssignmentsCount: data.gradedAssignmentsCount ?? 0,
    };
  },

  _mapSubmission: mapSubmission,
};