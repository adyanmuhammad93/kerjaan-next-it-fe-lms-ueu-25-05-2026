import { apiClient } from './apiClient';

export const settingsService = {
  async getSetting(key: string): Promise<any> {
    try {
      const data = await apiClient.get<{ key: string; value: any }>(`/settings/${key}`);
      return data.value ?? null;
    } catch {
      return null;
    }
  },

  async updateSetting(key: string, value: any): Promise<void> {
    await apiClient.put(`/settings/${key}`, { value });
  },
};
