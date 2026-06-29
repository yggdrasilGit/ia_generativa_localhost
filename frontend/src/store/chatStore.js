import { create } from 'zustand'
import { persist } from 'zustand/middleware'

let counter = 1

export const useChatStore = create(
    persist(
        (set, get) => ({
            conversations: [],
            activeId: null,
            selectedProjectId: null,
            isStreaming: false,
            wsStatus: 'disconnected',
            model: '',
            availableModels: [],
            lastResponseMs: null,
            lastTokenCount: null,

            // ── Modelo ────────────────────────────────────────────────────────
            setModel: (model) => set({ model }),
            setAvailableModels: (list) => set({ availableModels: list }),
            setLastMeta: ({ ms, tokens }) => set({ lastResponseMs: ms, lastTokenCount: tokens }),

            // ── WS ────────────────────────────────────────────────────────────
            setWsStatus: (wsStatus) => set({ wsStatus }),
            setIsStreaming: (isStreaming) => set({ isStreaming }),

            // ── Conversas ─────────────────────────────────────────────────────
            activeConv: () => get().conversations.find(c => c.id === get().activeId) || null,

            newConversation: () => {
                const id = `conv-${Date.now()}`
                set(s => ({
                    conversations: [
                        { id, title: `Nova conversa`, messages: [], createdAt: Date.now(), favorite: false },
                        ...s.conversations,
                    ],
                    activeId: id,
                }))
                return id
            },

            deleteConversation: (id) =>
                set(s => ({
                    conversations: s.conversations.filter(c => c.id !== id),
                    activeId: s.activeId === id ? (s.conversations[1]?.id || null) : s.activeId,
                })),

            toggleFavorite: (id) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === id ? { ...c, favorite: !c.favorite } : c
                    ),
                })),

            setActiveId: (activeId) => set({ activeId }),
            setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),

            setConversations: (conversations) =>
                set((s) => ({
                    conversations,
                    activeId: conversations.some(c => c.id === s.activeId)
                        ? s.activeId
                        : (conversations[0]?.id ?? null),
                })),

            setConversationMessages: (convId, messages) =>
                set((s) => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId ? { ...c, messages } : c
                    ),
                })),

            upsertConversation: (conversation) =>
                set((s) => {
                    const exists = s.conversations.some(c => c.id === conversation.id)
                    if (exists) {
                        return {
                            conversations: s.conversations.map(c =>
                                c.id === conversation.id ? { ...c, ...conversation } : c
                            ),
                        }
                    }
                    return { conversations: [conversation, ...s.conversations] }
                }),

            addMessage: (convId, msg) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId ? { ...c, messages: [...c.messages, msg] } : c
                    ),
                })),

            appendChunk: (convId, msgId, chunk) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId
                            ? {
                                ...c,
                                messages: c.messages.map(m =>
                                    m.id === msgId ? { ...m, content: m.content + chunk } : m
                                ),
                            }
                            : c
                    ),
                })),

            updateMessageContent: (convId, msgId, content) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId
                            ? {
                                ...c,
                                messages: c.messages.map(m =>
                                    m.id === msgId ? { ...m, content } : m
                                ),
                            }
                            : c
                    ),
                })),

            updateMessageMeta: (convId, msgId, patch) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId
                            ? {
                                ...c,
                                messages: c.messages.map(m =>
                                    m.id === msgId ? { ...m, ...patch } : m
                                ),
                            }
                            : c
                    ),
                })),

            setConversationTitle: (convId, title) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === convId ? { ...c, title } : c
                    ),
                })),

            clearConversation: (id) =>
                set(s => ({
                    conversations: s.conversations.map(c =>
                        c.id === id ? { ...c, messages: [] } : c
                    ),
                })),
        }),
        {
            name: 'yggdrasil-chat',
            partialize: (s) => ({
                conversations: s.conversations,
                activeId: s.activeId,
                selectedProjectId: s.selectedProjectId,
                model: s.model,
            }),
        }
    )
)
