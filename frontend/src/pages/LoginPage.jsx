import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function onSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login({ email, password })
            navigate(location.state?.from || '/')
        } catch (err) {
            setError(err.message || 'Falha no login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-[var(--bg)] px-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
                <h1 className="text-xl font-bold text-[var(--text)]">Entrar no Yggdrasil AI</h1>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                    required
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                    required
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button disabled={loading} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white">
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                <div className="text-xs text-[var(--muted)] flex justify-between">
                    <Link to="/register" className="hover:text-[var(--text)]">Criar conta</Link>
                    <Link to="/forgot-password" className="hover:text-[var(--text)]">Esqueci senha</Link>
                </div>
            </form>
        </div>
    )
}
