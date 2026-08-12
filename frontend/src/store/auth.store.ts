import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface UserData {
  email: string;
  first_name: string;
  is_staff?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  
  login: (access: string, refresh: string, user: UserData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (access, refresh, user) => {
        // Store tokens securely (for CSR/SSR compatibility, we might also use cookies)
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
          Cookies.set('access_token', access, { secure: true, sameSite: 'strict' });
        }
        
        set({ isAuthenticated: true, user });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          Cookies.remove('access_token');
        }
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'auth-storage',
      // Faqat user ma'lumotlarini persist qilamiz
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);
