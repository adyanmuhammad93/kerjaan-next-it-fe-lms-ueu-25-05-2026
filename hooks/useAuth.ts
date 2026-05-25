/**
 * useAuth — thin wrapper over AuthContext.
 *
 * All components use this hook. Because auth is managed by a single
 * AuthProvider in App.tsx, calling this from Dashboard, Navbar, etc.
 * does NOT trigger additional session-restore loops.
 */
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const { loading, login, register, logout: contextLogout, bulkRegisterStudents } = useAuthContext();
  const { user } = useStore();
  const navigate = useNavigate();

  const logout = async () => {
    await contextLogout();
    navigate('/login');
  };

  return { user, loading, login, register, logout, bulkRegisterStudents };
};
