import { useState } from 'react'

export default function MessageActions({ content, onRegenerate, isAssistant }) {
    const [copied, setCopied] = useState(false)

    function copy() {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={copy}
                className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2 py-0.5 rounded hover:bg-[var(--surface)]"
                title="Copiar mensagem"
            >
                {copied ? (
                    <><span>✓</span><span>Copiado</span></>
                ) : (
                    <><span>⎘</span><span>Copiar</span></>
                )}
            </button>
            {isAssistant && onRegenerate && (
                <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2 py-0.5 rounded hover:bg-[var(--surface)]"
                    title="Regenerar resposta"
                >
                    <span>↻</span><span>Regenerar</span>
                </button>
            )}
        </div>
    )
}
