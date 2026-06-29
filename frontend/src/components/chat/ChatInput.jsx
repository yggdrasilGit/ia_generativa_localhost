import { useState, useRef } from 'react'
import { useChatStore } from '../../store/chatStore'

const PLACEHOLDER_TOOLS = [
    { icon: '📎', label: 'Anexar arquivo', disabled: true },
    { icon: '🎤', label: 'Voz', disabled: true },
    { icon: '🌐', label: 'Pesquisar na internet', disabled: true },
    { icon: '📚', label: 'Consultar biblioteca', disabled: true },
]

export default function ChatInput({ onSend, onStop }) {
    const [text, setText] = useState('')
    const textareaRef = useRef(null)
    const isStreaming = useChatStore(s => s.isStreaming)
    const model = useChatStore(s => s.model)
    const availableModels = useChatStore(s => s.availableModels)
    const setModel = useChatStore(s => s.setModel)

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
        }
    }

    function submit() {
        const msg = text.trim()
        if (!msg || isStreaming) return
        setText('')
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
        onSend(msg)
    }

    function handleInput(e) {
        const el = e.target
        setText(el.value)
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }

    return (
        <div className="px-4 md:px-[20%] py-3 border-t border-[var(--border)] bg-[var(--bg)]">
            {/* Seletor de modelo */}
            {availableModels.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[var(--muted)]">Modelo:</span>
                    <select
                        value={model}
                        onChange={e => setModel(e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-[var(--primary)]"
                    >
                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            )}

            {/* Botões de ferramentas */}
            <div className="flex items-center gap-1 mb-2">
                {PLACEHOLDER_TOOLS.map(t => (
                    <button
                        key={t.icon}
                        disabled={t.disabled}
                        title={`${t.label}${t.disabled ? ' (em breve)' : ''}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-base"
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            {/* Textarea + botão enviar */}
            <div className="flex items-end gap-2 bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--primary)] rounded-xl px-4 py-3 transition-colors">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Escreva sua pergunta…  (Enter para enviar, Shift+Enter para nova linha)"
                    value={text}
                    onInput={handleInput}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none resize-none text-[var(--text)] text-sm placeholder-[var(--muted)] max-h-48 overflow-y-auto leading-relaxed"
                />

                {/* Contador */}
                {text.length > 0 && (
                    <span className="text-[10px] text-[var(--muted)] self-end mb-0.5 flex-shrink-0">
                        {text.length}
                    </span>
                )}

                {/* Enviar / Parar */}
                {isStreaming ? (
                    <button
                        onClick={onStop}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Parar"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                    </button>
                ) : (
                    <button
                        onClick={submit}
                        disabled={!text.trim()}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                        title="Enviar"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                            <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                        </svg>
                    </button>
                )}
            </div>

            <p className="text-center text-[10px] text-[var(--muted)] mt-2">
                Yggdrasil AI pode cometer erros. Verifique informações importantes.
            </p>
        </div>
    )
}
