import { useEffect, useRef } from 'react'
import Message from './Message'
import InputBar from './InputBar'

export default function ChatWindow({
    conversation,
    isStreaming,
    onSend,
    onStop,
    models,
    model,
    onModelChange,
}) {
    const bottomRef = useRef(null)
    const messages = conversation?.messages || []

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="flex flex-col flex-1 overflow-hidden bg-[#212121]">
            {messages.length === 0 ? (
                <div className="flex flex-col flex-1 items-center justify-center gap-3 text-[#8e8ea0]">
                    <h2 className="text-2xl font-bold text-[#ececec]">🌳 Yggdrasil AI</h2>
                    <p className="text-sm text-center max-w-sm">
                        Seu assistente de IA local.<br />
                        Faça uma pergunta para começar.
                    </p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    {messages.map((m, i) => (
                        <Message
                            key={m.id}
                            role={m.role}
                            content={m.content}
                            isStreaming={isStreaming && i === messages.length - 1 && m.role === 'assistant'}
                        />
                    ))}
                    <div ref={bottomRef} />
                </div>
            )}

            <InputBar
                onSend={onSend}
                isStreaming={isStreaming}
                onStop={onStop}
                models={models}
                model={model}
                onModelChange={onModelChange}
            />
        </div>
    )
}
