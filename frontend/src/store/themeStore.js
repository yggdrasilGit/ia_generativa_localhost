import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'dark', // 'dark' | 'light' | 'auto'
            setTheme: (theme) => {
                set({ theme })
                applyTheme(theme)
            },
        }),
        { name: 'yggdrasil-theme' }
    )
)

export function applyTheme(theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'auto' && prefersDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}
