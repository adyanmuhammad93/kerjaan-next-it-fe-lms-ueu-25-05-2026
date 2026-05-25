import { apiClient } from './apiClient';
import { QuizQuestion } from '../types';

export const questionBankService = {
  async getQuestions(_instructorId: string, search: string = ''): Promise<QuizQuestion[]> {
    // instructorId ignored — backend filters by JWT user
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await apiClient.get<{ questions: any[] }>(`/question-bank${params}`);
    return (data.questions || []).map((q: any) => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
    }));
  },

  async saveQuestion(_instructorId: string, question: QuizQuestion): Promise<void> {
    await apiClient.post('/question-bank', {
      question: question.question,
      type: question.type,
      options: question.options,
    });
  },

  async updateQuestion(id: string, updates: Partial<QuizQuestion>): Promise<void> {
    await apiClient.patch(`/question-bank/${id}`, updates);
  },

  async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete(`/question-bank/${id}`);
  },
};
