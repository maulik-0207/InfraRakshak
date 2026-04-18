import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'SCHOOL' | 'SCHOOL_STAFF' | 'DEO' | 'ADMIN_STAFF' | 'CONTRACTOR' | null;

interface UserDetails {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface AuthState {
  token: string | null;
  role: Role;
  user: UserDetails | null;
  isAuthenticated: boolean;
  setAuth: (token: string, role: string, user: UserDetails) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, role, user) => set({ 
        token, 
        role: role.toUpperCase() as Role, 
        user, 
        isAuthenticated: true 
      }),
      logout: () => set({ token: null, role: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
