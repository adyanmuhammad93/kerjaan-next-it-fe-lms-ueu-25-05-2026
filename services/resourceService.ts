import { apiClient } from './apiClient';
import { Resource } from '../types';

export const resourceService = {
  async getResourcesByLesson(lessonId: string): Promise<Resource[]> {
    const data = await apiClient.get<{ resources: any[] }>(`/assignments/lessons/${lessonId}/resources`);
    return (data.resources || []).map((r: any) => ({
      id: r.id,
      lessonId: r.lesson_id,
      title: r.title,
      fileUrl: r.file_url,
      fileType: r.file_type,
      fileSize: r.file_size,
    }));
  },

  async addResource(lessonId: string, file: File, title: string): Promise<Resource> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('lessonId', lessonId);
    const data = await apiClient.upload<{ resource: any }>('/assignments/resources', formData);
    const r = data.resource;
    return {
      id: r.id,
      lessonId: r.lesson_id,
      title: r.title,
      fileUrl: r.file_url,
      fileType: r.file_type,
      fileSize: r.file_size,
    };
  },

  async deleteResource(id: string): Promise<void> {
    await apiClient.delete(`/assignments/resources/${id}`);
  },
};