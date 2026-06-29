import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    cancelDocumentById,
    deleteDocumentById,
    listDocuments,
    normalizeDocuments,
    reindexDocuments,
    searchDocuments,
    uploadDocument,
} from '../services/api'
import { useUiStore } from '../store/uiStore'

const STAGES = ['uploaded', 'processing', 'ocr', 'embedding', 'indexed']
const STAGE_LABELS = {
    uploaded: 'Na fila',
    processing: 'Extraindo texto',
    ocr: 'OCR',
    embedding: 'Gerando vetores',
    indexed: 'Indexado',
    error: 'Erro',
    cancelled: 'Cancelado',
}
const ACTIVE_STATUSES = new Set(['uploaded', 'processing', 'ocr', 'embedding'])
const POLL_INTERVAL = 3000

function stageProgress(status) {
    const idx = STAGES.indexOf(status)
    if (idx === -1) return 0
    return Math.round((idx / (STAGES.length - 1)) * 100)
}

function statusColor(status) {
    if (status === 'indexed') return 'text-emerald-400'
    if (status === 'error') return 'text-red-400'
    if (status === 'cancelled') return 'text-zinc-400'
    if (ACTIVE_STATUSES.has(status)) return 'text-amber-400'
    return 'text-[var(--muted)]'
}

function statusBarColor(status) {
    if (status === 'indexed') return 'bg-emerald-500'
    if (status === 'error') return 'bg-red-500'
    return 'bg-amber-400'
}

function fmtDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString('pt-BR')
}

function ProgressBar({ status, chunks }) {
    const pct = stageProgress(status)
    const isActive = ACTIVE_STATUSES.has(status)
    const label = STAGE_LABELS[status] || status

    return (
        <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
                <span className={statusColor(status)}>{label}{isActive ? '…' : ''}</span>
                <span className="text-[var(--muted)]">
                    {status === 'indexed' ? `${chunks} chunks` : `${pct}%`}
                </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${statusBarColor(status)} ${isActive ? 'animate-pulse' : ''}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {/* Etapas */}
            <div className="flex justify-between mt-0.5">
                {STAGES.map((s) => {
                    const done = STAGES.indexOf(s) <= STAGES.indexOf(status)
                    const current = s === status
                    return (
                        <span
                            key={s}
                            className={`text-[9px] ${current ? statusColor(status) : done ? 'text-emerald-500' : 'text-[var(--border)]'}`}
                        >
                            {STAGE_LABELS[s]}
                        </span>
                    )
                })}
            </div>
        </div>
    )
}

export default function DocumentsPage() {
    const addToast = useUiStore((s) => s.addToast)
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [query, setQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [matches, setMatches] = useState([])
    const [title, setTitle] = useState('')
    const pollRef = useRef(null)

    const hasActive = useMemo(() => docs.some((d) => ACTIVE_STATUSES.has(d.status)), [docs])

    const loadDocs = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const rows = await listDocuments()
            setDocs(rows)
            // Toast quando algum documento terminou de indexar
            rows.forEach((row) => {
                if (row.status === 'indexed') {
                    setDocs((prev) => {
                        const old = prev.find((d) => d.id === row.id)
                        if (old && ACTIVE_STATUSES.has(old.status)) {
                            addToast({ type: 'success', message: `"${row.title}" indexado com ${row.total_chunks} chunks.` })
                        }
                        return prev
                    })
                }
            })
        } catch (err) {
            if (!silent) addToast({ type: 'error', message: err.message || 'Falha ao listar documentos.' })
        } finally {
            if (!silent) setLoading(false)
        }
    }, [addToast])

    // Carga inicial
    useEffect(() => {
        loadDocs()
    }, [loadDocs])

    // Polling automático enquanto houver documentos em processamento
    useEffect(() => {
        if (hasActive) {
            pollRef.current = setInterval(() => loadDocs(true), POLL_INTERVAL)
        } else {
            clearInterval(pollRef.current)
        }
        return () => clearInterval(pollRef.current)
    }, [hasActive, loadDocs])

    async function onUpload(e) {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            await uploadDocument({ file, title })
            addToast({ type: 'success', message: 'Upload recebido. Indexação iniciada.' })
            setTitle('')
            await loadDocs()
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha no upload.' })
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    async function onCancel(doc) {
        try {
            await cancelDocumentById(doc.id)
            setDocs((prev) => prev.map((d) => d.id === doc.id ? { ...d, status: 'cancelled' } : d))
            addToast({ type: 'info', message: `Processamento de "${doc.title}" cancelado.` })
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha ao cancelar processamento.' })
        }
    }

    async function onDelete(doc) {
        try {
            await deleteDocumentById(doc.id)
            setDocs((prev) => prev.filter((d) => d.id !== doc.id))
            addToast({ type: 'success', message: 'Documento removido.' })
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha ao remover documento.' })
        }
    }

    async function onReindex(doc) {
        try {
            await reindexDocuments(doc.id)
            addToast({ type: 'info', message: 'Reindexação iniciada.' })
            await loadDocs()
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha na reindexação.' })
        }
    }

    async function onNormalizeAll() {
        try {
            await normalizeDocuments()
            addToast({ type: 'info', message: 'Normalização em lote iniciada.' })
            await loadDocs()
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha ao normalizar biblioteca.' })
        }
    }

    async function onSearch(e) {
        e.preventDefault()
        const q = query.trim()
        if (!q) { setMatches([]); return }
        setSearching(true)
        try {
            const rows = await searchDocuments(q, { limit: 8 })
            setMatches(rows)
        } catch (err) {
            addToast({ type: 'error', message: err.message || 'Falha na busca semântica.' })
        } finally {
            setSearching(false)
        }
    }

    const indexedCount = useMemo(() => docs.filter((d) => d.status === 'indexed').length, [docs])

    return (
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)] p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Biblioteca de Documentos</h1>
                    <Link to="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Voltar ao chat</Link>
                </div>

                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                    <h2 className="font-semibold">Upload</h2>
                    <div className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
                        <label className="text-sm block">
                            Título (opcional)
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nome amigável do documento"
                                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 cursor-pointer disabled:opacity-60">
                            {uploading ? 'Enviando...' : 'Selecionar arquivo'}
                            <input disabled={uploading} type="file" className="hidden" accept=".pdf,.docx,.txt,.epub" onChange={onUpload} />
                        </label>
                    </div>
                    <p className="text-xs text-[var(--muted)]">Formatos: PDF, DOCX, TXT, EPUB. Após upload, a indexação roda em background.</p>
                </section>

                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Documentos ({docs.length})</h2>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[var(--muted)]">Indexados: {indexedCount}</p>
                            <button
                                onClick={onNormalizeAll}
                                disabled={docs.length === 0 || hasActive}
                                className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                            >
                                Normalizar biblioteca
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-[var(--muted)]">Carregando...</p>
                    ) : docs.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">Nenhum documento enviado ainda.</p>
                    ) : (
                        <div className="space-y-2">
                            {docs.map((d) => (
                                <div key={d.id} className="rounded-lg border border-[var(--border)] px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{d.title}</p>
                                            <p className="text-xs text-[var(--muted)] truncate">
                                                {d.filename} · {Math.round((d.size_bytes || 0) / 1024)} KB
                                            </p>
                                            {d.error_message && (
                                                <p className="text-xs text-red-400 mt-1 truncate" title={d.error_message}>
                                                    ⚠ {d.error_message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {ACTIVE_STATUSES.has(d.status) && (
                                                <button
                                                    onClick={() => onCancel(d)}
                                                    className="text-xs px-2 py-1 rounded border border-amber-500 hover:bg-amber-500/10 text-amber-400"
                                                >
                                                    Cancelar
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onReindex(d)}
                                                disabled={ACTIVE_STATUSES.has(d.status)}
                                                className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
                                            >
                                                Reindexar
                                            </button>
                                            <button
                                                onClick={() => onDelete(d)}
                                                disabled={ACTIVE_STATUSES.has(d.status)}
                                                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>
                                    <ProgressBar status={d.status} chunks={d.total_chunks} />
                                    <p className="text-[10px] text-[var(--muted)] mt-1">Atualizado: {fmtDate(d.updated_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                    <h2 className="font-semibold">Busca Semântica (pré-RAG)</h2>
                    <form onSubmit={onSearch} className="flex gap-2">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Pergunte algo para buscar nos documentos..."
                            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                        />
                        <button disabled={searching} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm px-4 py-2">
                            {searching ? 'Buscando...' : 'Buscar'}
                        </button>
                    </form>

                    {matches.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {matches.map((m) => (
                                <div key={m.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                                    <p className="text-xs text-[var(--muted)]">score: {m.score.toFixed(3)} · {m.metadata?.document_title || m.metadata?.filename || 'Documento'}</p>
                                    <p className="text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
