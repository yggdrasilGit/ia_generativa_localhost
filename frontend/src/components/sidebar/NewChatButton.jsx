export default function NewChatButton({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="mx-3 mb-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
            <span className="text-lg leading-none">＋</span>
            Nova conversa
        </button>
    )
}
