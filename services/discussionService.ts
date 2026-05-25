import { apiClient } from './apiClient';
import { Comment } from '../types';

export const discussionService = {
  async getComments(lessonId: string): Promise<Comment[]> {
    const data = await apiClient.get<{ comments: any[] }>(`/discussions/${lessonId}`);
    return (data.comments || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      userName: c.user_name || 'Anonymous',
      userRole: c.user_role,
      lessonId: c.lesson_id,
      parentId: c.parent_id,
      content: c.content,
      createdAt: c.created_at,
      replies: (c.replies || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name || 'Anonymous',
        userRole: r.user_role,
        lessonId: r.lesson_id,
        parentId: r.parent_id,
        content: r.content,
        createdAt: r.created_at,
        replies: [],
      })),
    }));
  },

  async createComment(
    lessonId: string,
    _userId: string,
    content: string,
    parentId: string | null = null,
  ): Promise<Comment> {
    const data = await apiClient.post<{ comment: any }>(`/discussions/${lessonId}`, {
      content,
      parentId,
    });
    const c = data.comment;
    return {
      id: c.id,
      userId: c.user_id,
      userName: c.user_name || 'Anonymous',
      userRole: c.user_role,
      lessonId: c.lesson_id,
      parentId: c.parent_id,
      content: c.content,
      createdAt: c.created_at,
      replies: [],
    };
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/discussions/comment/${commentId}`);
  },
};
