/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { useStore } from '../store/useStore';

interface AuthContextValue {
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    admissionPeriodId: string;
    programId: string;
  }) => Promise<{ user: any; session: any }>;
  logout: () => Promise<void>;
  bulkRegisterStudents: (admissionPeriodId: string, programId: string) => Promise<{ success: number; errors: Array<{ email: string; error: string }> }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider — wraps the entire app. Restores session exactly once on mount.
 * All components call useAuth() to get login/logout methods without triggering
 * another session-restore effect.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const { setUser } = useStore();

  // Single session-restore effect that runs once when the app boots
  useEffect(() => {
    const restore = async () => {
      // If an access token is already in memory, login() was just called — skip restore
      if (apiClient.getAccessToken()) {
        setLoading(false);
        return;
      }

      // Check for impersonation state
      const { originalAdminUser } = useStore.getState();
      if (originalAdminUser) {
        setLoading(false);
        return;
      }

      try {
        // Exchange the HttpOnly refresh cookie for a fresh access token
        await apiClient.refresh();
        // Fetch the full user profile now that we have a valid token
        const user = await authService.getCurrentUser();
        setUser(user);
      } catch {
        // No valid refresh cookie — the user is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []); // runs once on app boot

  const login = useCallback(async (email: string, password: string) => {
    try {
      await authService.signIn(email, password);
      const user = await authService.getCurrentUser();
      setUser(user);
      return user;
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    }
  }, [setUser]);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    firstName: string;
    middleName?: string;
    lastName?: string;
    phone: string;
    admissionPeriodId: string;
    programId: string;
  }) => {
    try {
      const { user, session } = await authService.signUp(data);
      if (session) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
      return { user, session };
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    await authService.signOut();
    useStore.getState().logout();
    // Navigation is done by the caller (Dashboard, Navbar, etc.)
  }, []);

  const bulkRegisterStudents = useCallback((admissionPeriodId: string, programId: string) => authService.bulkRegisterStudents(admissionPeriodId, programId), []);

  return (
    <AuthContext.Provider value={{ loading, login, register, logout, bulkRegisterStudents }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
};
