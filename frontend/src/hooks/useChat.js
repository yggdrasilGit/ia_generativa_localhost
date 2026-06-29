import { useState, useRef, useCallback } from 'react'
import { streamChat } from '../services/api'

let convCounter = 1

export function useChat() {
    const [conversations, setConversations] = useState([])
    const [activeId, setActiveId] = useState(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const abortRef = useRef(false)

    const activeConv = conversations.find(c => c.id === activeId) || null

    const newConversation = useCallback(() => {
        const id = `conv-${Date.now()}`
        const conv = { id, title: `Conversa ${convCounter++}`, messages: [] }
        setConversations(prev => [conv, ...prev])
        setActiveId(id)
        return id
    }, [])

    const deleteConversation = useCallback((id) => {
        setConversations(prev => prev.filter(c => c.id !== id))
        setActiveId(prev => (prev === id ? null : prev))
    }, [])

    const sendMessage = useCallback(async (content, model) => {
        let convId = activeId
        if (!convId) {
            convId = `conv-${Date.now()}`
            const title = content.slice(0, 40)
            const conv = { id: convId, title, messages: [] }
            setConversations(prev => [conv, ...prev])
            setActiveId(convId)
        }

        const userMsg = { id: `u-${Date.now()}`, role: 'user', content }
        const assistantId = `a-${Date.now()}`
        const assistantMsg = { id: assistantId, role: 'assistant', content: '' }

        setConversations(prev =>
            prev.map(c =>
                c.id === convId
                    ? { ...c, messages: [...c.messages, userMsg, assistantMsg] }
                    : c
            )
        )

        setIsStreaming(true)
        abortRef.current = false

        try {
            // Constrói histórico completo para contexto
            const allMessages = [
                ...((conversations.find(c => c.id === convId)?.messages) || []),
                userMsg,
            ].map(m => ({ role: m.role, content: m.content }))

            await streamChat(
                allMessages,
                (chunk) => {
                    if (abortRef.current) return
                    setConversations(prev =>
                        prev.map(c =>
                            c.id === convId
                                ? {
                                    ...c,
                                    messages: c.messages.map(m =>
                                        m.id === assistantId
                                            ? { ...m, content: m.content + chunk }
                                            : m
                                    ),
                                }
                                : c
                        )
                    )
                },
                model,
            )
        } catch (err) {
            setConversations(prev =>
                prev.map(c =>
                    c.id === convId
                        ? {
                            ...c,
                            messages: c.messages.map(m =>
                                m.id === assistantId
                                    ? { ...m, content: `❌ Erro: ${err.message}` }
                                    : m
                            ),
                        }
                        : c
                )
            )
        } finally {
            setIsStreaming(false)
        }
    }, [activeId, conversations])

    const stopStreaming = useCallback(() => {
        abortRef.current = true
        setIsStreaming(false)
    }, [])

    return {
        conversations,
        activeConv,
        activeId,
        isStreaming,
        newConversation,
        deleteConversation,
        sendMessage,
        stopStreaming,
        setActiveId,
    }
}
