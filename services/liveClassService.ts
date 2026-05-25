import { apiClient } from './apiClient';
import { LiveClass } from '../types';

const mapLiveClass = (item: any): LiveClass => ({
  id: item.id,
  courseId: item.course_id,
  courseTitle: item.course_title,
  title: item.title,
  description: item.description,
  startTime: item.start_time,
  endTime: item.end_time,
  platform: item.platform,
  meetingUrl: item.meeting_url,
});

export const liveClassService = {
  async getLiveClassesByCourse(courseId: string): Promise<LiveClass[]> {
    const data = await apiClient.get<{ liveClasses: any[] }>(`/live-classes/course/${courseId}`);
    return (data.liveClasses || []).map(mapLiveClass);
  },

  async createLiveClass(
    courseId: string,
    _instructorId: string,
    classData: Omit<LiveClass, 'id' | 'courseId'>,
  ): Promise<LiveClass> {
    const data = await apiClient.post<{ liveClass: any }>('/live-classes', {
      courseId,
      title: classData.title,
      description: classData.description,
      startTime: classData.startTime,
      endTime: classData.endTime,
      platform: classData.platform,
      meetingUrl: classData.meetingUrl,
    });
    return mapLiveClass(data.liveClass);
  },

  async deleteLiveClass(id: string): Promise<void> {
    await apiClient.delete(`/live-classes/${id}`);
  },

  async getSchedule(_userId: string, _role: 'student' | 'instructor' | 'admin'): Promise<LiveClass[]> {
    // Backend reads role from JWT and filters accordingly
    const data = await apiClient.get<{ liveClasses: any[] }>('/live-classes/schedule');
    return (data.liveClasses || []).map(mapLiveClass);
  },
};