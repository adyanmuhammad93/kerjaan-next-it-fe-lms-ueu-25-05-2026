
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Course, User, CartItem, Currency, CurrencyCode } from '../types';

interface StoreState {
  user: User | null;
  originalAdminUser: User | null; // For Impersonation
  courses: Course[];
  searchQuery: string;
  cart: CartItem[]; // List of Items
  currency: CurrencyCode;
  fxRates: { usd_idr: number; updatedAt?: string | null };
  
  // State Setters
  setUser: (user: User | null) => void;
  setCourses: (courses: Course[]) => void;
  setSearchQuery: (query: string) => void;
  setCurrency: (code: string) => void;
  setFxRates: (rates: { usd_idr: number; updatedAt?: string | null }) => void;
  
  // Local Actions
  enrollCourse: (courseId: string) => void;
  addCourse: (course: Course) => void;
  addToCart: (id: string, type: 'course' | 'bundle') => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  
  // Impersonation Actions
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
  
  // Deprecated but kept for compatibility during refactor, maps to new actions or no-ops
  login: (email: string) => void; 
  logout: () => void;
  initStore: () => void;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'IDR', symbol: 'Rp', locale: 'id-ID' },
];

const supportedCurrencyCodes = new Set<CurrencyCode>(['USD', 'IDR']);

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      originalAdminUser: null,
      courses: [],
      searchQuery: '',
      cart: [],
      currency: 'USD',
      fxRates: { usd_idr: 15800, updatedAt: null },

      setUser: (user) => set({ user }),
      
      setCourses: (courses) => set({ courses }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setCurrency: (code: string) => set({ currency: supportedCurrencyCodes.has(code as CurrencyCode) ? (code as CurrencyCode) : 'USD' }),

      setFxRates: (rates) => set({ fxRates: rates }),

      enrollCourse: (courseId: string) => {
        set((state) => {
            if (!state.user) return state;
            return {
                user: {
                    ...state.user,
                    enrolledCourseIds: [...state.user.enrolledCourseIds, courseId]
                },
                cart: state.cart.filter(item => item.id !== courseId)
            };
        });
      },

      addCourse: (course: Course) => {
        set((state) => ({ courses: [course, ...state.courses] }));
      },

      addToCart: (id: string, type: 'course' | 'bundle') => {
        set((state) => {
            if (state.cart.some(item => item.id === id)) return state;
            return { cart: [...state.cart, { id, type }] };
        });
      },

      removeFromCart: (id: string) => {
        set((state) => ({ cart: state.cart.filter(item => item.id !== id) }));
      },

      clearCart: () => set({ cart: [] }),

      isInCart: (id: string) => {
          return get().cart.some(item => item.id === id);
      },

      startImpersonation: (targetUser: User) => {
          set((state) => {
              // If already impersonating, don't overwrite originalAdminUser
              const adminUser = state.originalAdminUser || state.user;
              return {
                  originalAdminUser: adminUser,
                  user: targetUser
              };
          });
      },

      stopImpersonation: () => {
          set((state) => ({
              user: state.originalAdminUser,
              originalAdminUser: null
          }));
      },
      
      // Legacy / Placeholder for components not yet refactored to hooks
      login: () => { console.warn("Use useAuth hook instead"); },
      logout: () => { set({ user: null, originalAdminUser: null }); },
      initStore: () => { /* No-op, managed by hooks now */ }
    }),
    {
      name: 'esaunggul-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!supportedCurrencyCodes.has((state as any).currency)) state.setCurrency('USD');
      },
      // Only persist non-sensitive UI state.
      // Auth (user, tokens) is managed via HttpOnly cookies + in-memory tokens.
      partialize: (state) => ({
        cart: state.cart,
        currency: supportedCurrencyCodes.has(state.currency) ? state.currency : 'USD',
        fxRates: state.fxRates,
      }),
    }
  )
);
