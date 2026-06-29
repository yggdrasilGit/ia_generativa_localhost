import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useThemeStore } from '../../store/themeStore'

export default function CodeBlock({ language, children }) {
    const [copied, setCopied] = useState(false)
    const theme = useThemeStore(s => s.theme)
    const isDark = theme !== 'light'
    const code = String(children).trimEnd()

    function copy() {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function download() {
        const ext = language || 'txt'
        const blob = new Blob([code], { type: 'text/plain' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `code.${ext}`
        a.click()
        URL.revokeObjectURL(a.href)
    }

    return (
        <div className="my-3 rounded-xl overflow-hidden border border-[var(--border)]">
            <div className="flex items-center justify-between bg-[var(--surface-2)] px-4 py-1.5">
                <span className="text-xs text-[var(--muted)] font-mono">{language || 'code'}</span>
                <div className="flex gap-2">
                    <button
                        onClick={copy}
                        className="text-[11px] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] px-2 py-0.5 rounded transition-colors"
                    >
                        {copied ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <button
                        onClick={download}
                        className="text-[11px] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] px-2 py-0.5 rounded transition-colors"
                        title="Baixar"
                    >
                        ↓
                    </button>
                </div>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={isDark ? oneDark : oneLight}
                customStyle={{ margin: 0, fontSize: '13px', lineHeight: '1.6', borderRadius: 0 }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    )
}
