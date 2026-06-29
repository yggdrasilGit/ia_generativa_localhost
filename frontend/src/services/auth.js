import { apiFetch } from './apiClient'
import { useAuthStore } from '../store/authStore'

export async function register(payload) {
    const tokens = await apiFetch('/auth/register', { method: 'POST', body: payload, auth: false })
    const me = await apiFetch('/users/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        auth: false,
    })
    useAuthStore.getState().setSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user: me,
    })
    return me
}

export async function login(payload) {
    const tokens = await apiFetch('/auth/login', { method: 'POST', body: payload, auth: false })
    const me = await apiFetch('/users/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        auth: false,
    })
    useAuthStore.getState().setSession({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        user: me,
    })
    return me
}

export async function logout() {
    const { refreshToken } = useAuthStore.getState()
    try {
        if (refreshToken) {
            await apiFetch('/auth/logout', {
                method: 'POST',
                body: { refresh_token: refreshToken },
            })
        }
    } finally {
        useAuthStore.getState().clearSession()
    }
}

export async function forgotPassword(email) {
    return apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
    })
}

export async function resetPassword(payload) {
    return apiFetch('/auth/reset-password', {
        method: 'POST',
        body: payload,
        auth: false,
    })
}

export async function fetchMe() {
    const me = await apiFetch('/users/me')
    useAuthStore.getState().setUser(me)
    return me
}
