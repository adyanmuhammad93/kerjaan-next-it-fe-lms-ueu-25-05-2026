import { apiClient } from './apiClient';
import { User, AdmissionPeriod, Program } from '../types';

export const authService = {
  async signUp(data: {
    email: string;
    password: string;
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    admissionPeriodId: string;
    programId: string;
    role?: 'student' | 'instructor' | 'admin';
  }) {
    const fullName = [data.firstName, data.middleName, data.lastName].filter(Boolean).join(' ');
    const result = await apiClient.post('/auth/register', {
      email: data.email,
      password: data.password,
      fullName,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      phone: data.phone,
      admissionPeriodId: data.admissionPeriodId,
      programId: data.programId,
      role: data.role || 'student',
    });
    if (result.accessToken) apiClient.setAccessToken(result.accessToken);
    return { user: result.user, session: result.accessToken ? {} : null };
  },

  async signIn(email: string, password: string) {
    const data = await apiClient.post('/auth/login', { email, password });
    if (data.accessToken) apiClient.setAccessToken(data.accessToken);
    return data;
  },

  async signOut() {
    await apiClient.post('/auth/logout').catch(() => {});
    apiClient.setAccessToken(null);
  },

  async forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string) {
    return apiClient.post('/auth/reset-password', { token, newPassword });
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = await apiClient.get('/auth/me');
      return data.user || null;
    } catch {
      return null;
    }
  },

  async updateProfile(userId: string, updates: { fullName?: string; role?: 'student' | 'instructor' | 'admin'; avatarUrl?: string; geminiApiKey?: string }) {
    await apiClient.patch('/auth/profile', {
      fullName: updates.fullName,
      avatarUrl: updates.avatarUrl,
      geminiApiKey: updates.geminiApiKey,
    });
  },

  async updatePassword(password: string) {
    // Requires currentPassword in the new API — this legacy method is kept for compatibility
    // but the UI should be updated to supply currentPassword
    throw new Error('Use auth/change-password endpoint with currentPassword');
  },

  async adminChangeUserPassword(userId: string, newPassword: string) {
    await apiClient.patch(`/users/${userId}`, { newPassword });
  },

  async deleteUser(userId: string) {
    await apiClient.delete(`/users/${userId}`);
  },

  async getUserDetailsForImpersonation(userId: string): Promise<User> {
    const data = await apiClient.post(`/auth/impersonate/${userId}`);
    return data.user;
  },

  async getPaginatedUsers(
    page = 1,
    limit = 10,
    search = '',
    filters?: { role?: string; sortBy?: string; sortDir?: 'asc' | 'desc'; hasEnrollments?: boolean }
  ) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      ...(filters?.role && { role: filters.role }),
      ...(filters?.sortBy && { sortBy: filters.sortBy }),
      ...(filters?.sortDir && { sortDir: filters.sortDir }),
      ...(filters?.hasEnrollments && { hasEnrollments: 'true' }),
    });
    return apiClient.get(`/users?${params.toString()}`);
  },

  async bulkRegisterStudents(admissionPeriodId: string, programId: string): Promise<{ success: number; errors: Array<{ email: string; error: string }> }> {
    const studentData = this.generateStudentData();
    const results = { success: 0, errors: [] as Array<{ email: string; error: string }> };
    for (const s of studentData) {
      try {
        const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ');
        await apiClient.post('/auth/register', {
          email: s.email,
          password: s.password,
          fullName,
          firstName: s.firstName,
          lastName: s.lastName,
          phone: s.phone,
          admissionPeriodId,
          programId,
          role: 'student',
        });
        results.success++;
        await new Promise(r => setTimeout(r, 200));
      } catch (e: any) {
        results.errors.push({ email: s.email, error: e.message });
      }
    }
    return results;
  },

  generateStudentData(): Array<{ email: string; password: string; firstName: string; lastName: string; phone: string }> {
    const firstNames = ['Ahmad', 'Budi', 'Cindy', 'Dewi', 'Eko', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Joko', 'Kartika', 'Lia', 'Maya', 'Nina', 'Oki', 'Putri', 'Rina', 'Sari', 'Toni', 'Wati'];
    const lastNames = ['Santoso', 'Pratama', 'Wijaya', 'Sari', 'Kusuma', 'Hadi', 'Nugroho', 'Putra', 'Setiawan', 'Darmawan'];
    const students = [];
    for (let i = 1; i <= 100; i++) {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      students.push({
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@esaunggul.ac.id`,
        password: `asdzxc123`,
        firstName: fn,
        lastName: ln,
        phone: `08${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
    }
    return students;
  },

  // --- Admission Form Reference Data ---

  async getAdmissionPeriods(): Promise<AdmissionPeriod[]> {
    try {
      const data = await apiClient.get('/admission-periods?onlyOpen=true');
      if (data && data.periods) {
        return data.periods.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          startDate: p.start_date,
          endDate: p.end_date,
          registrationOpen: p.registration_open,
        }));
      }
    } catch (e) {
      console.warn('Backend not available, using mock admission periods');
    }

    // Mock data fallback for UX flow testing
    return [
      { id: 'period-2024-genap', name: 'Semester Genap 2024/2025', code: '20242', registrationOpen: true },
      { id: 'period-2025-ganjil', name: 'Semester Ganjil 2025/2026', code: '20251', registrationOpen: true },
    ];
  },

  async getPrograms(): Promise<Program[]> {
    try {
      const data = await apiClient.get('/programs?onlyActive=true');
      if (data && data.programs) {
        return data.programs.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          description: p.description,
          isActive: p.is_active,
        }));
      }
    } catch (e) {
      console.warn('Backend not available, using mock programs');
    }

    // Mock data fallback for UX flow testing
    return [
      { id: 'prog-inf', name: 'S1 Teknik Informatika (International)', code: 'INF-INT', isActive: true },
      { id: 'prog-dkv', name: 'S1 Desain Komunikasi Visual (International)', code: 'DKV-INT', isActive: true },
      { id: 'prog-man', name: 'S1 Manajemen (International)', code: 'MAN-INT', isActive: true },
      { id: 'prog-psy', name: 'S1 Psikologi (International)', code: 'PSY-INT', isActive: true },
    ];
  },
};