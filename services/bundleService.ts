import { apiClient } from './apiClient';
import { Bundle } from '../types';

const mapBundle = (b: any): Bundle => ({
  id: b.id,
  title: b.title,
  description: b.description,
  instructorId: b.instructor_id,
  price: Number(b.price ?? 0),
  thumbnailUrl: b.thumbnail_url,
  isPublished: b.is_published,
  courses: (b.courses || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    instructor: c.instructor_name,
    instructorId: c.instructor_id,
    description: c.description ?? '',
    price: Number(c.price ?? 0),
    rating: Number(c.rating ?? 0),
    ratingCount: Number(c.rating_count ?? 0),
    thumbnailUrl: c.thumbnail_url,
    category: c.category,
    syllabus: [],
    level: c.level,
    lastUpdated: c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '',
    isPublished: c.is_published,
  })),
  courseCount: b.course_count ?? (b.courses?.length || 0),
});

export const bundleService = {
  async getAllPublishedBundles(): Promise<Bundle[]> {
    const data = await apiClient.get<{ bundles: any[] }>('/bundles?published=true');
    return (data.bundles || []).map(mapBundle);
  },

  async getInstructorBundles(_instructorId: string): Promise<Bundle[]> {
    const data = await apiClient.get<{ bundles: any[] }>('/bundles/my');
    return (data.bundles || []).map(mapBundle);
  },

  async getBundleById(bundleId: string): Promise<Bundle | null> {
    try {
      const data = await apiClient.get<{ bundle: any }>(`/bundles/${bundleId}`);
      return data.bundle ? mapBundle(data.bundle) : null;
    } catch {
      return null;
    }
  },

  async createBundle(title: string, _instructorId: string): Promise<Bundle> {
    const data = await apiClient.post<{ bundle: any }>('/bundles', { title });
    return mapBundle(data.bundle);
  },

  async updateBundle(id: string, updates: Partial<Bundle>): Promise<void> {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.thumbnailUrl !== undefined) payload.thumbnailUrl = updates.thumbnailUrl;
    if (updates.isPublished !== undefined) payload.isPublished = updates.isPublished;
    await apiClient.patch(`/bundles/${id}`, payload);
  },

  async addCourseToBundle(bundleId: string, courseId: string): Promise<void> {
    try {
      await apiClient.post(`/bundles/${bundleId}/courses`, { courseId });
    } catch (e: any) {
      if (e.message?.includes('already')) return; // Ignore duplicates
      throw e;
    }
  },

  async removeCourseFromBundle(bundleId: string, courseId: string): Promise<void> {
    await apiClient.delete(`/bundles/${bundleId}/courses/${courseId}`);
  },

  async deleteBundle(bundleId: string): Promise<void> {
    await apiClient.delete(`/bundles/${bundleId}`);
  },

  async enrollBundle(_userId: string, bundleId: string): Promise<void> {
    await apiClient.post(`/bundles/${bundleId}/enroll`);
  },
};