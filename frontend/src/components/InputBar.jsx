import { useState } from 'react'

export default function InputBar({ onSend, isStreaming, onStop, models, model, onModelChange }) {
    const [text, setText] = useState('')

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
        onSend(msg)
    }

    function handleInput(e) {
        const el = e.target
        setText(el.value)
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }

    return (
        <div className="px-[20%] py-4 border-t border-[#3a3a3a] bg-[#212121]">
            {/* Seletor de modelo */}
            {models.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[#8e8ea0]">Modelo:</span>
                    <select
                        value={model}
                        onChange={e => onModelChange(e.target.value)}
                        className="bg-[#2f2f2f] border border-[#3a3a3a] text-[#ececec] text-xs rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-emerald-500"
                    >
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
            )}

            {/* Input */}
            <div className="flex items-end gap-2 bg-[#2f2f2f] border border-[#3a3a3a] focus-within:border-emerald-600 rounded-xl px-4 py-3 transition-colors">
                <textarea
                    rows={1}
                    placeholder="Envie uma mensagem… (Enter para enviar)"
                    value={text}
                    onInput={handleInput}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="flex-1 bg-transparent border-none outline-none resize-none text-[#ececec] text-sm placeholder-[#8e8ea0] max-h-48 overflow-y-auto font-sans leading-relaxed"
                />
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

            <p className="text-center text-[11px] text-[#8e8ea0] mt-2">
                Yggdrasil AI pode cometer erros. Verifique informações importantes.
            </p>
        </div>
    )
}
