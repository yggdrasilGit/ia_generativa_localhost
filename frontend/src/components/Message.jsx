import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function CodeBlock({ language, children }) {
    const [copied, setCopied] = useState(false)
    const code = String(children).trimEnd()

    function copy() {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="my-3 rounded-xl overflow-hidden border border-[#3a3a3a]">
            <div className="flex items-center justify-between bg-[#1a1a2e] px-4 py-1.5">
                <span className="text-xs text-[#8e8ea0] font-mono">{language || 'code'}</span>
                <button
                    onClick={copy}
                    className="text-[11px] border border-[#3a3a3a] text-[#8e8ea0] hover:border-emerald-500 hover:text-emerald-400 px-2 py-0.5 rounded transition-colors"
                >
                    {copied ? '✓ Copiado' : 'Copiar'}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={oneDark}
                customStyle={{ margin: 0, fontSize: '13px', lineHeight: '1.55', borderRadius: 0 }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    )
}

export default function Message({ role, content, isStreaming }) {
    const isUser = role === 'user'
    const isEmpty = !content && isStreaming

    return (
        <div className={`px-[20%] py-4 ${isUser ? '' : 'bg-white/[0.02] border-y border-[#3a3a3a]'}`}>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${isUser ? 'bg-[#5c5c8a]' : 'bg-emerald-600'
                    }`}>
                    {isUser ? '👤' : '🌳'}
                </div>
                <span className="text-sm font-semibold text-[#ececec]">
                    {isUser ? 'Você' : 'Yggdrasil AI'}
                </span>
            </div>

            {/* Content */}
            <div className="pl-9 text-[15px] leading-relaxed text-[#ececec]">
                {isEmpty ? (
                    <span>
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                    </span>
                ) : isUser ? (
                    <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                    <div className="prose">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline ? (
                                        <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                                    ) : (
                                        <code className={className} {...props}>{children}</code>
                                    )
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    )
}
