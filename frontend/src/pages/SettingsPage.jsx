import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSettings, putSettings } from '../services/api'
import { useThemeStore, applyTheme } from '../store/themeStore'
import { useUiStore } from '../store/uiStore'

export default function SettingsPage() {
    const [form, setForm] = useState({
        theme: 'dark',
        language: 'pt-BR',
        default_model: 'qwen3:0.6b',
        temperature: 0.7,
        top_p: 0.9,
        default_prompt: '',
        layout: 'comfortable',
        shortcuts: '',
    })
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const setTheme = useThemeStore(s => s.setTheme)
    const addToast = useUiStore(s => s.addToast)

    useEffect(() => {
        fetchSettings()
            .then((data) => setForm({
                theme: data.theme,
                language: data.language,
                default_model: data.default_model,
                temperature: data.temperature,
                top_p: data.top_p,
                default_prompt: data.default_prompt || '',
                layout: data.layout,
                shortcuts: data.shortcuts || '',
            }))
            .catch(() => { })
    }, [])

    function setField(key, value) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    async function onSubmit(e) {
        e.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            await putSettings({
                ...form,
                temperature: Number(form.temperature),
                top_p: Number(form.top_p),
            })
            setTheme(form.theme)
            applyTheme(form.theme)
            setMessage('Configurações salvas com sucesso.')
            addToast({ type: 'success', message: 'Configurações salvas.' })
        } catch {
            setMessage('Falha ao salvar configurações.')
            addToast({ type: 'error', message: 'Falha ao salvar configurações.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-dvh bg-[var(--bg)] p-4 md:p-8 text-[var(--text)]">
            <form onSubmit={onSubmit} className="max-w-3xl mx-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Configurações</h1>
                    <Link to="/" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Voltar ao chat</Link>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    <label className="text-sm">Tema
                        <select value={form.theme} onChange={e => setField('theme', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                            <option value="dark">dark</option>
                            <option value="light">light</option>
                            <option value="auto">auto</option>
                        </select>
                    </label>

                    <label className="text-sm">Idioma
                        <input value={form.language} onChange={e => setField('language', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
                    </label>

                    <label className="text-sm">Modelo padrão
                        <input value={form.default_model} onChange={e => setField('default_model', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
                    </label>

                    <label className="text-sm">Layout
                        <select value={form.layout} onChange={e => setField('layout', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2">
                            <option value="comfortable">comfortable</option>
                            <option value="compact">compact</option>
                        </select>
                    </label>

                    <label className="text-sm">Temperatura
                        <input type="number" min="0" max="2" step="0.1" value={form.temperature} onChange={e => setField('temperature', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
                    </label>

                    <label className="text-sm">Top-p
                        <input type="number" min="0" max="1" step="0.05" value={form.top_p} onChange={e => setField('top_p', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
                    </label>
                </div>

                <label className="text-sm block">Prompt padrão
                    <textarea value={form.default_prompt} onChange={e => setField('default_prompt', e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" />
                </label>

                <label className="text-sm block">Atalhos
                    <input value={form.shortcuts} onChange={e => setField('shortcuts', e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2" placeholder="ex: ctrl+enter" />
                </label>

                {message && <p className="text-sm text-[var(--muted)]">{message}</p>}

                <button disabled={saving} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-4 py-2 text-sm font-semibold">
                    {saving ? 'Salvando...' : 'Salvar configurações'}
                </button>
            </form>
        </div>
    )
}
