import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ConversationItem({
    conv,
    isActive,
    onSelect,
    onDelete,
    onToggleFav,
    onRename,
    onTogglePinned,
    onToggleArchived,
}) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(conv.title)

    function submitRename() {
        const next = title.trim()
        if (!next || next === conv.title) {
            setEditing(false)
            setTitle(conv.title)
            return
        }
        onRename?.(next)
        setEditing(false)
    }

    return (
        <motion.li
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            onClick={onSelect}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[var(--surface)]' : 'hover:bg-[var(--surface-hover)]'
                }`}
        >
            {editing ? (
                <input
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={submitRename}
                    onKeyDown={e => {
                        if (e.key === 'Enter') submitRename()
                        if (e.key === 'Escape') {
                            setEditing(false)
                            setTitle(conv.title)
                        }
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 text-sm bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--text)]"
                />
            ) : (
                <span className="flex-1 truncate text-sm text-[var(--text)]">
                    {conv.pinned ? '📌 ' : ''}
                    {conv.archived ? '🗄️ ' : ''}
                    {conv.title}
                </span>
            )}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                    onClick={e => { e.stopPropagation(); setEditing(true) }}
                    className="p-1 text-xs text-[var(--muted)] hover:text-[var(--text)] rounded transition-colors"
                    title="Renomear"
                >
                    ✎
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onTogglePinned?.() }}
                    className={`p-1 text-xs rounded transition-colors ${conv.pinned ? 'text-emerald-400' : 'text-[var(--muted)] hover:text-emerald-400'}`}
                    title={conv.pinned ? 'Desafixar' : 'Fixar'}
                >
                    📌
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onToggleArchived?.() }}
                    className={`p-1 text-xs rounded transition-colors ${conv.archived ? 'text-blue-400' : 'text-[var(--muted)] hover:text-blue-400'}`}
                    title={conv.archived ? 'Desarquivar' : 'Arquivar'}
                >
                    🗄️
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onToggleFav() }}
                    className={`p-1 text-xs rounded transition-colors ${conv.favorite ? 'text-yellow-400' : 'text-[var(--muted)] hover:text-yellow-400'}`}
                    title={conv.favorite ? 'Remover favorito' : 'Favoritar'}
                >
                    ⭐
                </button>
                <button
                    onClick={e => { e.stopPropagation(); onDelete() }}
                    className="p-1 text-xs text-[var(--muted)] hover:text-red-400 rounded transition-colors"
                    title="Apagar"
                >
                    ✕
                </button>
            </div>
        </motion.li>
    )
}
