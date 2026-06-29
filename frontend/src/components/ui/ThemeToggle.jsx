import { useThemeStore, applyTheme } from '../../store/themeStore'

const THEMES = [
    { value: 'dark', label: '🌙' },
    { value: 'light', label: '☀️' },
    { value: 'auto', label: '🖥' },
]

export default function ThemeToggle() {
    const { theme, setTheme } = useThemeStore()

    function cycle() {
        const idx = THEMES.findIndex(t => t.value === theme)
        const next = THEMES[(idx + 1) % THEMES.length]
        setTheme(next.value)
    }

    const current = THEMES.find(t => t.value === theme)

    return (
        <button
            onClick={cycle}
            title={`Tema: ${theme} (clique para trocar)`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface)] transition-colors text-base"
        >
            {current?.label}
        </button>
    )
}
