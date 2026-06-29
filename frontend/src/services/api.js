import { apiFetch } from './apiClient'

const BASE_URL = import.meta.env.DEV ? '' : ''

export async function streamChat(messages, onChunk, model) {
    const body = { messages }
    if (model) body.model = model

    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        onChunk(chunk)
    }
}

export async function fetchModels() {
    try {
        const res = await fetch('/api/models')
        const data = await res.json()
        return data.models || []
    } catch {
        return []
    }
}

export async function listConversations() {
    return apiFetch('/conversations')
}

export async function createConversation(payload) {
    return apiFetch('/conversations', { method: 'POST', body: payload })
}

export async function updateConversation(id, payload) {
    return apiFetch(`/conversations/${id}`, { method: 'PUT', body: payload })
}

export async function deleteConversationById(id) {
    return apiFetch(`/conversations/${id}`, { method: 'DELETE' })
}

export async function fetchMessages(conversationId) {
    return apiFetch(`/messages/${conversationId}`)
}

export async function addConversationMessage(conversationId, payload) {
    return apiFetch(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: payload,
    })
}

export async function fetchSettings() {
    return apiFetch('/settings')
}

export async function putSettings(payload) {
    return apiFetch('/settings', { method: 'PUT', body: payload })
}

export async function listProjects() {
    return apiFetch('/projects')
}

export async function createProject(payload) {
    return apiFetch('/projects', { method: 'POST', body: payload })
}

export async function updateProject(id, payload) {
    return apiFetch(`/projects/${id}`, { method: 'PUT', body: payload })
}

export async function deleteProjectById(id) {
    return apiFetch(`/projects/${id}`, { method: 'DELETE' })
}

export async function listSessions() {
    return apiFetch('/sessions')
}

export async function revokeSessionById(id) {
    return apiFetch(`/sessions/${id}`, { method: 'DELETE' })
}

export async function listAudit(limit = 100) {
    return apiFetch(`/audit?limit=${limit}`)
}

export async function uploadDocument({ file, projectId = null, title = '' }) {
    const form = new FormData()
    form.append('file', file)
    if (projectId !== null && projectId !== undefined) form.append('project_id', String(projectId))
    if (title && title.trim()) form.append('title', title.trim())
    return apiFetch('/documents/upload', { method: 'POST', body: form })
}

export async function listDocuments(projectId = null) {
    const suffix = projectId ? `?project_id=${projectId}` : ''
    return apiFetch(`/documents/list${suffix}`)
}

export async function deleteDocumentById(id) {
    return apiFetch(`/documents/${id}`, { method: 'DELETE' })
}

export async function cancelDocumentById(id) {
    return apiFetch(`/documents/${id}/cancel`, { method: 'POST' })
}

export async function reindexDocuments(documentId = null) {
    if (documentId === null || documentId === undefined) {
        return apiFetch('/documents/reindex', { method: 'POST' })
    }
    return apiFetch(`/documents/reindex?document_id=${documentId}`, { method: 'POST' })
}

export async function normalizeDocuments(documentId = null) {
    if (documentId === null || documentId === undefined) {
        return apiFetch('/documents/normalize', { method: 'POST' })
    }
    return apiFetch(`/documents/normalize?document_id=${documentId}`, { method: 'POST' })
}

export async function searchDocuments(query, { limit = 8, projectId = null, documentId = null } = {}) {
    const params = new URLSearchParams({ q: query, limit: String(limit) })
    if (projectId !== null && projectId !== undefined) params.set('project_id', String(projectId))
    if (documentId !== null && documentId !== undefined) params.set('document_id', String(documentId))
    return apiFetch(`/documents/search?${params.toString()}`)
}

export async function ragSearch(payload) {
    return apiFetch('/rag/search', { method: 'POST', body: payload })
}

export async function ragChat(payload) {
    return apiFetch('/rag/chat', { method: 'POST', body: payload })
}

export async function ragWebSearch(query, maxResults = 5) {
    return apiFetch('/rag/web-search', { method: 'POST', body: { query, max_results: maxResults } })
}

export async function ragSources(projectId = null) {
    const suffix = projectId ? `?project_id=${projectId}` : ''
    return apiFetch(`/rag/sources${suffix}`)
}

export async function ragChunk(chunkId) {
    return apiFetch(`/rag/chunks/${encodeURIComponent(chunkId)}`)
}

export async function ragChunkWindow(chunkId, radius = 1) {
    return apiFetch(`/rag/chunks/${encodeURIComponent(chunkId)}/window?radius=${radius}`)
}
