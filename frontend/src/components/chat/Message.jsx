import { useState } from 'react'
import { motion } from 'framer-motion'
import Markdown from './Markdown'
import Typing from './Typing'
import MessageActions from './MessageActions'
import { ragChunk, ragChunkWindow } from '../../services/api'

function formatTime(ts) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Message({ role, content, isStreaming, timestamp, onRegenerate, confidence, citations, webCitations, usedFallback }) {
    const isUser = role === 'user'
    const isEmpty = !content && isStreaming
    const [openCitation, setOpenCitation] = useState(null)
    const [citationContent, setCitationContent] = useState('')
    const [citationLoading, setCitationLoading] = useState(false)
    const [citationError, setCitationError] = useState('')
    const [citationWindow, setCitationWindow] = useState([])

    async function handleOpenCitation(citation) {
        setOpenCitation(citation)
        setCitationContent(citation.excerpt || '')
        setCitationError('')
        setCitationLoading(true)
        setCitationWindow([])
        try {
            const [chunkData, windowData] = await Promise.all([
                ragChunk(citation.chunk_id),
                ragChunkWindow(citation.chunk_id, 1),
            ])
            setCitationContent(chunkData.content || citation.excerpt || '')
            setCitationWindow(Array.isArray(windowData.items) ? windowData.items : [])
        } catch {
            try {
                const data = await ragChunk(citation.chunk_id)
                setCitationContent(data.content || citation.excerpt || '')
            } catch {
                setCitationError('Nao foi possivel carregar o trecho completo.')
            }
        } finally {
            setCitationLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`group px-4 md:px-[20%] py-5 ${isUser ? '' : 'bg-[var(--surface-alt)] border-y border-[var(--border)]'
                }`}
        >
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${isUser ? 'bg-[#5c5c8a]' : 'bg-emerald-600'
                    }`}>
                    {isUser ? '👤' : '🌳'}
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">
                    {isUser ? 'Você' : 'Yggdrasil AI'}
                </span>
                {timestamp && (
                    <span className="text-[11px] text-[var(--muted)] ml-1">{formatTime(timestamp)}</span>
                )}
            </div>

            {/* Content */}
            <div className="pl-9 text-[15px] leading-relaxed text-[var(--text)]">
                {isEmpty ? (
                    <Typing />
                ) : isUser ? (
                    <p className="whitespace-pre-wrap">{content}</p>
                ) : (
                    <Markdown content={content} />
                )}
            </div>

            {!isUser && !isEmpty && role === 'assistant' && (confidence || citations?.length || webCitations?.length) && (
                <div className="pl-9 mt-3 space-y-2">
                    {confidence && (
                        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${usedFallback
                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'
                            }`}>
                            {usedFallback ? '🌐' : '📚'}
                            {usedFallback ? 'Resposta via internet' : 'Resposta via documentos'}
                            <span className="font-semibold text-[var(--text)]">· confiança {confidence}</span>
                        </div>
                    )}

                    {Array.isArray(citations) && citations.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-[var(--muted)]">📚 Fontes dos documentos</div>
                            <div className="grid gap-2">
                                {citations.map((c) => (
                                    <div key={c.chunk_id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-xs text-[var(--text)]">
                                                <span className="font-medium">{c.title || c.source}</span>
                                                {c.page ? ` - pag. ${c.page}` : ''}
                                                <span className="ml-2 text-[var(--muted)]">score {c.score}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenCitation(c)}
                                                className="text-xs px-2 py-1 rounded-md border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)]"
                                            >
                                                Ver trecho original
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {Array.isArray(webCitations) && webCitations.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-[var(--muted)]">🌐 Fontes da internet</div>
                            <div className="grid gap-2">
                                {webCitations.map((w, i) => (
                                    <div key={i} className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5">
                                        <a
                                            href={w.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-medium text-blue-400 hover:underline block truncate"
                                        >
                                            {w.title || w.url}
                                        </a>
                                        {w.excerpt && (
                                            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed line-clamp-3">{w.excerpt}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {openCitation && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpenCitation(null)}>
                    <div
                        className="w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <h3 className="text-sm font-semibold text-[var(--text)]">
                                {openCitation.title || openCitation.source}
                                {openCitation.page ? ` - pag. ${openCitation.page}` : ''}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setOpenCitation(null)}
                                className="text-xs px-2 py-1 rounded-md border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)]"
                            >
                                Fechar
                            </button>
                        </div>
                        <div className="text-xs text-[var(--muted)] mb-2">Chunk: {openCitation.chunk_id} | Score: {openCitation.score}</div>
                        <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                            {citationLoading ? 'Carregando trecho completo...' : citationContent}
                        </p>
                        {!citationLoading && citationWindow.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="text-xs font-semibold text-[var(--muted)]">Contexto expandido</div>
                                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                                    {citationWindow.map((item) => (
                                        <div key={item.chunk_id} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2">
                                            <div className="text-[11px] text-[var(--muted)] mb-1">
                                                {item.relation === 'previous' ? 'Anterior' : item.relation === 'next' ? 'Próximo' : 'Atual'}
                                                {' '}| chunk {item.chunk_index}
                                                {item.page ? ` | pag. ${item.page}` : ''}
                                            </div>
                                            <p className="text-xs leading-relaxed text-[var(--text)] whitespace-pre-wrap">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {citationError && (
                            <p className="mt-2 text-xs text-red-400">{citationError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            {!isEmpty && content && (
                <div className="pl-9">
                    <MessageActions
                        content={content}
                        isAssistant={!isUser}
                        onRegenerate={onRegenerate}
                    />
                </div>
            )}
        </motion.div>
    )
}
