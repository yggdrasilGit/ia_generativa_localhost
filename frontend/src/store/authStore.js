import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set) => ({
            accessToken: null,
            refreshToken: null,
            user: null,

            setSession: ({ accessToken, refreshToken, user }) =>
                set({ accessToken, refreshToken, user }),

            setTokens: ({ accessToken, refreshToken }) =>
                set((s) => ({
                    accessToken: accessToken ?? s.accessToken,
                    refreshToken: refreshToken ?? s.refreshToken,
                })),

            setUser: (user) => set({ user }),
            clearSession: () => set({ accessToken: null, refreshToken: null, user: null }),
        }),
        { name: 'yggdrasil-auth' }
    )
)
