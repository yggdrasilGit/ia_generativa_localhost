import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import Message from './Message'
import ChatInput from './ChatInput'
import ScrollButton from './ScrollButton'

export default function ChatWindow({ onSend, onStop }) {
    const bottomRef = useRef(null)
    const scrollRef = useRef(null)
    const [showScroll, setShowScroll] = useState(false)

    const conversations = useChatStore(s => s.conversations)
    const activeId = useChatStore(s => s.activeId)
    const isStreaming = useChatStore(s => s.isStreaming)
    const activeConv = conversations.find(c => c.id === activeId) || null
    const messages = activeConv?.messages || []

    // Auto-scroll ao receber chunks
    useEffect(() => {
        if (isStreaming) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isStreaming])

    // Mostrar botão "rolar para baixo"
    function handleScroll() {
        const el = scrollRef.current
        if (!el) return
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        setShowScroll(distFromBottom > 200)
    }

    function scrollToBottom() {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg)] relative">
            {messages.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col flex-1 items-center justify-center gap-4 text-[var(--muted)] px-4"
                >
                    <div className="text-6xl">🌳</div>
                    <h2 className="text-2xl font-bold text-[var(--text)]">Yggdrasil AI</h2>
                    <p className="text-sm text-center max-w-sm text-[var(--muted)]">
                        Seu assistente de IA local.<br />
                        Faça uma pergunta para começar.
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-4 max-w-md w-full">
                        {[
                            'Explique como funciona o TCP/IP',
                            'Escreva um código Python para ordenar uma lista',
                            'O que é uma rede neural?',
                            'Resolva: $\\int x^2 dx$',
                        ].map(s => (
                            <button
                                key={s}
                                onClick={() => onSend(s)}
                                className="text-left text-xs bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-[var(--text)] hover:border-[var(--primary)] transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((m, i) => (
                            <Message
                                key={m.id}
                                role={m.role}
                                content={m.content}
                                timestamp={m.timestamp}
                                confidence={m.confidence}
                                citations={m.citations}
                                webCitations={m.web_citations}
                                usedFallback={m.used_fallback}
                                isStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
                            />
                        ))}
                    </AnimatePresence>
                    <div ref={bottomRef} />
                </div>
            )}

            <ScrollButton visible={showScroll} onClick={scrollToBottom} />

            <ChatInput onSend={onSend} onStop={onStop} />
        </div>
    )
}
