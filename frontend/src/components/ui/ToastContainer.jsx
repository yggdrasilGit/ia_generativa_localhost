import { AnimatePresence, motion } from 'framer-motion'
import { useUiStore } from '../../store/uiStore'

const styleByType = {
    success: 'border-emerald-500/60 bg-emerald-900/30 text-emerald-200',
    error: 'border-red-500/60 bg-red-900/30 text-red-200',
    info: 'border-sky-500/60 bg-sky-900/30 text-sky-200',
}

export default function ToastContainer() {
    const toasts = useUiStore((s) => s.toasts)
    const removeToast = useUiStore((s) => s.removeToast)

    return (
        <div className="fixed bottom-4 right-4 z-[999] space-y-2 w-[min(92vw,360px)] pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.button
                        key={t.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        onClick={() => removeToast(t.id)}
                        className={`pointer-events-auto w-full text-left rounded-lg border px-3 py-2 text-sm ${styleByType[t.type] || styleByType.info}`}
                    >
                        {t.message}
                    </motion.button>
                ))}
            </AnimatePresence>
        </div>
    )
}
