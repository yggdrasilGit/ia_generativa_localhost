import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { listAudit, listConversations, listProjects, listSessions, revokeSessionById } from '../services/api'
import { fetchMe } from '../services/auth'
import { useUiStore } from '../store/uiStore'

function fmtDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleString('pt-BR')
}

export default function ProfilePage() {
    const user = useAuthStore(s => s.user)
    const [sessions, setSessions] = useState([])
    const [audit, setAudit] = useState([])
    const [stats, setStats] = useState({ conversations: 0, projects: 0 })
    const [loading, setLoading] = useState(true)
    const addToast = useUiStore(s => s.addToast)

    useEffect(() => {
        let mounted = true

        async function load() {
            setLoading(true)
            try {
                await fetchMe().catch(() => { })
                const [conv, proj, sess, log] = await Promise.all([
                    listConversations(),
                    listProjects(),
                    listSessions(),
                    listAudit(30),
                ])
                if (!mounted) return
                setStats({ conversations: conv.length, projects: proj.length })
                setSessions(sess)
                setAudit(log)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [])

    const activeSessions = useMemo(() => sessions.filter(s => !s.expired), [sessions])

    async function handleRevoke(id) {
        try {
            await revokeSessionById(id)
            setSessions(prev => prev.filter(s => s.id !== id))
            addToast({ type: 'success', message: 'Sessão encerrada.' })
        } catch {
            addToast({ type: 'error', message: 'Falha ao encerrar sessão.' })
        }
    }

    return (
        <div className="min-h-dvh bg-[var(--bg)] p-4 md:p-8 text-[var(--text)]">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Perfil</h1>
                    <Link to="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Voltar ao chat</Link>
                </div>

                <section className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                        <h2 className="font-semibold">Dados do usuário</h2>
                        <p className="text-sm"><span className="text-[var(--muted)]">Nome:</span> {user?.name || '—'}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Email:</span> {user?.email || '—'}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Idioma:</span> {user?.language || 'pt-BR'}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Tema:</span> {user?.theme || 'dark'}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Cadastro:</span> {fmtDate(user?.created_at)}</p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2">
                        <h2 className="font-semibold">Resumo</h2>
                        <p className="text-sm"><span className="text-[var(--muted)]">Conversas:</span> {stats.conversations}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Projetos:</span> {stats.projects}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Sessões ativas:</span> {activeSessions.length}</p>
                        <p className="text-sm"><span className="text-[var(--muted)]">Armazenamento:</span> em breve</p>
                    </div>
                </section>

                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <h2 className="font-semibold mb-3">Sessões ativas</h2>
                    {loading ? (
                        <p className="text-sm text-[var(--muted)]">Carregando...</p>
                    ) : activeSessions.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">Nenhuma sessão ativa.</p>
                    ) : (
                        <div className="space-y-2">
                            {activeSessions.map((s) => (
                                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
                                    <div>
                                        <p className="text-sm">{s.device || 'Dispositivo desconhecido'} · {s.ip || 'IP n/a'}</p>
                                        <p className="text-xs text-[var(--muted)]">Último acesso: {fmtDate(s.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(s.id)}
                                        className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        Encerrar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <h2 className="font-semibold mb-3">Auditoria recente</h2>
                    {loading ? (
                        <p className="text-sm text-[var(--muted)]">Carregando...</p>
                    ) : audit.length === 0 ? (
                        <p className="text-sm text-[var(--muted)]">Sem eventos registrados.</p>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {audit.map((a) => (
                                <div key={a.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                                    <p className="text-sm font-medium">{a.action}</p>
                                    <p className="text-xs text-[var(--muted)]">{a.details || '—'}</p>
                                    <p className="text-xs text-[var(--muted)] mt-1">{fmtDate(a.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
