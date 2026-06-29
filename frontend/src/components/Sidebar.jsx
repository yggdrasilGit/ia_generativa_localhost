import { useState } from 'react'

export default function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, wsStatus }) {
    const statusColor = {
        connected: 'bg-emerald-500',
        disconnected: 'bg-yellow-500',
        error: 'bg-red-500',
    }[wsStatus] || 'bg-gray-500'

    const statusLabel = {
        connected: 'WebSocket',
        disconnected: 'Reconectando…',
        error: 'Erro WS',
    }[wsStatus] || ''

    return (
        <aside className="flex flex-col w-64 min-w-[220px] bg-[#171717] border-r border-[#3a3a3a]">
            {/* Logo */}
            <div className="px-4 py-5 text-lg font-bold tracking-tight">
                Yggdrasil <span className="text-emerald-500">AI</span>
            </div>

            {/* Nova conversa */}
            <button
                onClick={onNew}
                className="mx-3 mb-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
                <span className="text-lg leading-none">＋</span>
                Nova conversa
            </button>

            {/* Lista */}
            {conversations.length > 0 && (
                <div className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-widest text-[#8e8ea0]">
                    Recentes
                </div>
            )}
            <ul className="flex-1 overflow-y-auto px-2 space-y-0.5">
                {conversations.map(c => (
                    <li
                        key={c.id}
                        onClick={() => onSelect(c.id)}
                        className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${c.id === activeId ? 'bg-[#2f2f2f]' : 'hover:bg-[#252525]'
                            }`}
                    >
                        <span className="flex-1 truncate text-sm text-[#ececec]">{c.title}</span>
                        <button
                            onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                            className="opacity-0 group-hover:opacity-100 ml-1 text-[#8e8ea0] hover:text-red-400 transition-all text-xs px-1"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#3a3a3a] flex items-center gap-2 text-[11px] text-[#8e8ea0]">
                <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                <span>v0.1 · {statusLabel}</span>
            </div>
        </aside>
    )
}
