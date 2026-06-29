import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import ThemeToggle from '../ui/ThemeToggle'
import { Link } from 'react-router-dom'

export default function TopBar({ onMenuClick, onLogout }) {
    const model = useChatStore(s => s.model)
    const lastMs = useChatStore(s => s.lastResponseMs)
    const lastTokens = useChatStore(s => s.lastTokenCount)
    const isStreaming = useChatStore(s => s.isStreaming)
    const user = useAuthStore(s => s.user)

    return (
        <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)] h-12 flex-shrink-0">
            {/* Menu hamburguer (mobile) */}
            <button
                onClick={onMenuClick}
                className="md:hidden text-[var(--muted)] hover:text-[var(--text)] transition-colors mr-3"
                title="Menu"
            >
                ☰
            </button>

            {/* Modelo */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--muted)] text-xs">Modelo:</span>
                <span className="font-semibold text-[var(--text)]">{model || '—'}</span>
                {isStreaming && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Gerando…" />
                )}
            </div>

            {/* Métricas */}
            <div className="flex items-center gap-4 ml-auto mr-4">
                {lastMs !== null && (
                    <div className="text-[11px] text-[var(--muted)]">
                        ⏱ {(lastMs / 1000).toFixed(1)}s
                    </div>
                )}
                {lastTokens !== null && (
                    <div className="text-[11px] text-[var(--muted)]">
                        🔤 {lastTokens} tokens
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                {user && (
                    <span className="hidden md:inline text-xs text-[var(--muted)] max-w-40 truncate">
                        {user.name}
                    </span>
                )}
                <Link
                    to="/documents"
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2"
                    title="Documentos"
                >
                    Documentos
                </Link>
                <Link
                    to="/profile"
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2"
                    title="Perfil"
                >
                    Perfil
                </Link>
                <button
                    onClick={onLogout}
                    className="text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2"
                    title="Sair"
                >
                    Sair
                </button>
                <ThemeToggle />
            </div>
        </header>
    )
}
