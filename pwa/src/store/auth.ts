import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  telegramUserId: number | null;
  login: (token: string, telegramUserId: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      telegramUserId: null,
      login: (token, telegramUserId) => set({ token, telegramUserId }),
      logout: () => set({ token: null, telegramUserId: null })
    }),
    {
      name: 'xopc-auth'
    }
  )
);
