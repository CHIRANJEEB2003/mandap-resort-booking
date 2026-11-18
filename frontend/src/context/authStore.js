import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,

      setAuth: ({ user, token, refreshToken }) => set({ user, token, refreshToken }),

      logout: () => {
        set({ user: null, token: null, refreshToken: null });
        api.post('/auth/logout').catch(() => {});
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
          return data;
        } catch {
          get().logout();
        }
      },
    }),
    { name: 'mandap-auth' }
  )
);
