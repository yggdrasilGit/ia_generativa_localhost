import { useAuthStore } from '../store/authStore'

const API_BASE = ''

function formatErrorMessage(data, status) {
    if (typeof data === 'string') return data

    const detail = data?.detail
    if (typeof detail === 'string') return detail

    if (Array.isArray(detail)) {
        const first = detail[0]
        if (typeof first === 'string') return first
        const msg = first?.msg
        if (msg) return msg
    }

    return `HTTP ${status}`
}

async function rawFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, options)
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const data = isJson ? await res.json() : await res.text()
    return { res, data }
}

export async function apiFetch(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
    const state = useAuthStore.getState()
    const token = state.accessToken

    const reqHeaders = { ...headers }
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && !isFormData) reqHeaders['Content-Type'] = 'application/json'
    if (auth && token) reqHeaders.Authorization = `Bearer ${token}`

    const payload = body === undefined ? undefined : (isFormData ? body : JSON.stringify(body))

    let { res, data } = await rawFetch(path, {
        method,
        headers: reqHeaders,
        body: payload,
    })

    if (auth && res.status === 401 && state.refreshToken) {
        const refreshed = await refreshAccessToken(state.refreshToken)
        if (refreshed?.access_token) {
            useAuthStore.getState().setTokens({
                accessToken: refreshed.access_token,
                refreshToken: refreshed.refresh_token,
            })

            const retryHeaders = { ...reqHeaders, Authorization: `Bearer ${refreshed.access_token}` }
                ; ({ res, data } = await rawFetch(path, {
                    method,
                    headers: retryHeaders,
                    body: payload,
                }))
        }
    }

    if (!res.ok) {
        const msg = formatErrorMessage(data, res.status)
        throw new Error(msg)
    }
    return data
}

export async function refreshAccessToken(refreshToken) {
    const { res, data } = await rawFetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    return data
}
