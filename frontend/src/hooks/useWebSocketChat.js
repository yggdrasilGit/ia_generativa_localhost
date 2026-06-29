/**
 * useWebSocketChat — conecta ao /ws/chat e gerencia streaming via Zustand.
 */
import { useRef, useCallback, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { addConversationMessage, createConversation, ragChat, updateConversation } from '../services/api'

const WS_URL = `ws://${window.location.hostname}:8000/ws/chat`

export function useWebSocketChat() {
  const wsRef = useRef(null)
  const pendingRef = useRef({ convId: null, msgId: null, t0: null, assistantContent: '', model: null })

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  function connect() {
    try {
      const ws = new WebSocket(WS_URL)
      ws.onopen = () => useChatStore.getState().setWsStatus('connected')
      ws.onclose = () => {
        useChatStore.getState().setWsStatus('disconnected')
        setTimeout(connect, 3000)
      }
      ws.onerror = () => useChatStore.getState().setWsStatus('error')
      ws.onmessage = handleMessage
      wsRef.current = ws
    } catch {
      useChatStore.getState().setWsStatus('error')
    }
  }

  function handleMessage(event) {
    const data = JSON.parse(event.data)
    const { convId, msgId, t0 } = pendingRef.current

    if (data.type === 'chunk') {
      useChatStore.getState().appendChunk(convId, msgId, data.content)
      pendingRef.current.assistantContent += data.content
      return
    }

    if (data.type === 'done') {
      const elapsed = Date.now() - t0
      useChatStore.getState().setIsStreaming(false)
      useChatStore.getState().setLastMeta({ ms: elapsed, tokens: data.tokens || null })

      if (convId && pendingRef.current.assistantContent) {
        addConversationMessage(convId, {
          role: 'assistant',
          content: pendingRef.current.assistantContent,
          model: pendingRef.current.model || undefined,
          tokens: data.tokens || null,
          elapsed_ms: elapsed,
        }).catch(() => { })
      }

      pendingRef.current = { convId: null, msgId: null, t0: null, assistantContent: '', model: null }
      return
    }

    if (data.type === 'error') {
      useChatStore.getState().updateMessageContent(convId, msgId, `❌ ${data.content}`)
      useChatStore.getState().setIsStreaming(false)
      pendingRef.current = { convId: null, msgId: null, t0: null, assistantContent: '', model: null }
    }
  }

  const sendMessage = useCallback(async (content, model) => {
    const store = useChatStore.getState()
    let convId = store.activeId
    const projectId = store.selectedProjectId

    if (!convId) {
      const title = content.slice(0, 40) + (content.length > 40 ? '…' : '')
      const created = await createConversation({
        title,
        project_id: projectId || null,
        model: model || null,
        favorite: false,
        archived: false,
        pinned: false,
      })

      convId = created.id
      store.upsertConversation({
        id: created.id,
        title: created.title,
        model: created.model,
        projectId: created.project_id,
        favorite: created.favorite,
        archived: created.archived,
        pinned: created.pinned,
        createdAt: created.created_at,
        updatedAt: created.updated_at,
        messages: [],
      })
      store.setActiveId(convId)
    }

    const conv = useChatStore.getState().conversations.find((c) => c.id === convId)
    const isFirstMessage = !conv || conv.messages.length === 0

    const userMsgId = `msg-${Date.now()}-u`
    store.addMessage(convId, {
      id: userMsgId,
      role: 'user',
      content,
      timestamp: Date.now(),
    })

    if (isFirstMessage) {
      const title = content.slice(0, 40) + (content.length > 40 ? '…' : '')
      store.setConversationTitle(convId, title)
      updateConversation(convId, {
        title,
        project_id: conv?.projectId || projectId || null,
        model: model || conv?.model || null,
        favorite: !!conv?.favorite,
        archived: !!conv?.archived,
        pinned: !!conv?.pinned,
      }).catch(() => { })
    }

    const asstMsgId = `msg-${Date.now()}-a`
    store.addMessage(convId, {
      id: asstMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    store.setIsStreaming(true)
    pendingRef.current = { convId, msgId: asstMsgId, t0: Date.now(), assistantContent: '', model: model || null }

    addConversationMessage(convId, {
      role: 'user',
      content,
      model: model || undefined,
    }).catch(() => { })

    await sendViaRag(content, model, projectId, convId, asstMsgId)
  }, [])

  async function sendViaRag(question, model, projectId, convId, asstMsgId) {
    try {
      const t0 = Date.now()
      const data = await ragChat({
        question,
        top_k: 5,
        model: model || undefined,
        project_id: projectId || null,
        rerank: true,
        web_fallback: true,
      })

      useChatStore.getState().updateMessageContent(convId, asstMsgId, data.answer || '')
      useChatStore.getState().updateMessageMeta(convId, asstMsgId, {
        citations: data.citations || [],
        web_citations: data.web_citations || [],
        confidence: data.confidence || 'baixa',
        used_fallback: data.used_fallback || false,
      })

      pendingRef.current.assistantContent = data.answer || ''
      useChatStore.getState().setIsStreaming(false)
      useChatStore.getState().setLastMeta({ ms: Date.now() - t0, tokens: null })

      if (pendingRef.current.assistantContent) {
        addConversationMessage(convId, {
          role: 'assistant',
          content: pendingRef.current.assistantContent,
          model: model || undefined,
          elapsed_ms: Date.now() - t0,
        }).catch(() => { })
      }
      pendingRef.current = { convId: null, msgId: null, t0: null, assistantContent: '', model: null }
    } catch (err) {
      useChatStore.getState().updateMessageContent(convId, asstMsgId, `❌ Erro: ${err.message}`)
      useChatStore.getState().setIsStreaming(false)
      pendingRef.current = { convId: null, msgId: null, t0: null, assistantContent: '', model: null }
    }
  }

  const stopStreaming = useCallback(() => {
    useChatStore.getState().setIsStreaming(false)
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }
    setTimeout(connect, 100)
  }, [])

  return { sendMessage, stopStreaming }
}
