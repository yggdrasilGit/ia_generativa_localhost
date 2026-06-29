import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollButton({ visible, onClick }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={onClick}
                    className="fixed bottom-32 right-8 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--primary)] shadow-lg transition-colors z-20"
                    title="Rolar para baixo"
                >
                    ↓
                </motion.button>
            )}
        </AnimatePresence>
    )
}
