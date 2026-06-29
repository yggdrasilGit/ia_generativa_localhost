import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useChatStore } from '../../store/chatStore'
import ConversationItem from './ConversationItem'
import NewChatButton from './NewChatButton'

export default function Sidebar({
    isOpen,
    onClose,
    onNew,
    onDelete,
    onToggleFavorite,
    onRenameConversation,
    onTogglePinned,
    onToggleArchived,
    projects = [],
    selectedProjectId = null,
    onSelectProject,
    onCreateProject,
    onDeleteProject,
}) {
    const [search, setSearch] = useState('')
    const [showFavOnly, setShowFavOnly] = useState(false)
    const [showPinnedOnly, setShowPinnedOnly] = useState(false)
    const [showArchivedOnly, setShowArchivedOnly] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')

    const conversations = useChatStore(s => s.conversations)
    const activeId = useChatStore(s => s.activeId)
    const wsStatus = useChatStore(s => s.wsStatus)
    const model = useChatStore(s => s.model)
    const setActiveId = useChatStore(s => s.setActiveId)
    const deleteConversation = useChatStore(s => s.deleteConversation)
    const toggleFavorite = useChatStore(s => s.toggleFavorite)
    const newConversation = useChatStore(s => s.newConversation)

    const filtered = conversations
        .filter(c => !selectedProjectId || c.projectId === selectedProjectId)
        .filter(c => !showFavOnly || c.favorite)
        .filter(c => !showPinnedOnly || c.pinned)
        .filter(c => !showArchivedOnly || c.archived)
        .filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()))

    const statusColor = { connected: 'bg-emerald-500', disconnected: 'bg-yellow-500', error: 'bg-red-500' }[wsStatus] || 'bg-gray-500'
    const statusLabel = { connected: 'Conectado', disconnected: 'Reconectando…', error: 'Erro WS' }[wsStatus] || ''

    return (
        <>
            {/* Overlay mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ x: isOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed md:relative md:translate-x-0 z-30 flex flex-col w-64 min-h-0 h-full bg-[var(--sidebar)] border-r border-[var(--border)]"
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-4">
                    <span className="text-lg font-bold tracking-tight text-[var(--text)]">
                        Yggdrasil <span className="text-emerald-500">AI</span>
                    </span>
                    <button onClick={onClose} className="md:hidden text-[var(--muted)] hover:text-[var(--text)] transition-colors">✕</button>
                </div>

                <NewChatButton onClick={() => { (onNew || newConversation)(); onClose() }} />

                {/* Projetos */}
                <div className="px-3 mb-2 space-y-2">
                    <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Projetos</div>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        <button
                            onClick={() => onSelectProject?.(null)}
                            className={`w-full text-left text-xs px-2 py-1 rounded ${selectedProjectId === null ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}
                        >
                            Todos
                        </button>
                        {projects.map((p) => (
                            <div key={p.id} className="group flex items-center gap-1">
                                <button
                                    onClick={() => onSelectProject?.(p.id)}
                                    className={`flex-1 text-left text-xs px-2 py-1 rounded truncate ${selectedProjectId === p.id ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'}`}
                                >
                                    {p.name}
                                </button>
                                <button
                                    onClick={() => onDeleteProject?.(p)}
                                    className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--muted)] hover:text-red-400 px-1"
                                    title="Excluir projeto"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1">
                        <input
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Novo projeto"
                            className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs rounded px-2 py-1"
                        />
                        <button
                            onClick={() => {
                                const name = newProjectName.trim()
                                if (!name) return
                                onCreateProject?.(name)
                                setNewProjectName('')
                            }}
                            className="text-xs px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Busca */}
                <div className="px-3 mb-2">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar conversas…"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[var(--primary)] placeholder-[var(--muted)]"
                    />
                </div>

                {/* Filtro favoritos */}
                <div className="px-3 mb-2 flex gap-2">
                    <button
                        onClick={() => setShowFavOnly(false)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${!showFavOnly ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setShowFavOnly(true)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${showFavOnly ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                    >
                        ⭐ Favoritos
                    </button>
                    <button
                        onClick={() => setShowPinnedOnly(v => !v)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${showPinnedOnly ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                    >
                        📌 Fixadas
                    </button>
                    <button
                        onClick={() => setShowArchivedOnly(v => !v)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${showArchivedOnly ? 'bg-emerald-600 text-white' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                    >
                        🗄️ Arquivadas
                    </button>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
                    <AnimatePresence>
                        {filtered.length === 0 && (
                            <p className="text-[11px] text-[var(--muted)] text-center mt-6 px-4">
                                {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa ainda.'}
                            </p>
                        )}
                        {filtered.map(c => (
                            <ConversationItem
                                key={c.id}
                                conv={c}
                                isActive={c.id === activeId}
                                onSelect={() => { setActiveId(c.id); onClose() }}
                                onDelete={() => (onDelete ? onDelete(c) : deleteConversation(c.id))}
                                onToggleFav={() => (onToggleFavorite ? onToggleFavorite(c) : toggleFavorite(c.id))}
                                onRename={(title) => onRenameConversation?.(c, title)}
                                onTogglePinned={() => onTogglePinned?.(c)}
                                onToggleArchived={() => onToggleArchived?.(c)}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-[var(--border)] space-y-1.5">
                    {/* Status WS */}
                    <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                        <span>{statusLabel}</span>
                    </div>
                    {/* Modelo */}
                    {model && (
                        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                            <span>🧠</span>
                            <span className="truncate">{model}</span>
                        </div>
                    )}
                    {/* Configurações (placeholder) */}
                    <Link
                        to="/settings"
                        className="w-full flex items-center gap-2 text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    >
                        <span>⚙️</span>
                        <span>Configurações</span>
                    </Link>
                </div>
            </motion.aside>
        </>
    )
}
