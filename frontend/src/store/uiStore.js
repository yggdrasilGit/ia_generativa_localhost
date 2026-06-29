import { create } from 'zustand'

let toastId = 1

export const useUiStore = create((set) => ({
    toasts: [],
    addToast: ({ type = 'info', message, duration = 2600 }) => {
        const id = toastId++
        set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, duration)
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
