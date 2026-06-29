import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function onSubmit(e) {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('As senhas não conferem')
            return
        }

        setLoading(true)
        try {
            await register({ name, email, password, confirm_password: confirmPassword })
            navigate('/')
        } catch (err) {
            setError(err.message || 'Falha no cadastro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-[var(--bg)] px-4">
            <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
                <h1 className="text-xl font-bold text-[var(--text)]">Criar conta</h1>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha forte" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar senha" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button disabled={loading} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white">
                    {loading ? 'Criando...' : 'Criar conta'}
                </button>
                <div className="text-xs text-[var(--muted)]">
                    Já tem conta? <Link to="/login" className="hover:text-[var(--text)]">Entrar</Link>
                </div>
            </form>
        </div>
    )
}
