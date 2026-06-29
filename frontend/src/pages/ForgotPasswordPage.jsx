import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../services/auth'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [token, setToken] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function requestReset(e) {
        e.preventDefault()
        setError('')
        setMessage('')
        try {
            const data = await forgotPassword(email)
            setMessage(`Token de recuperação (modo dev): ${data.reset_token || 'enviado'}`)
        } catch (err) {
            setError(err.message || 'Erro ao solicitar recuperação')
        }
    }

    async function submitReset(e) {
        e.preventDefault()
        setError('')
        setMessage('')
        try {
            await resetPassword({ token, new_password: newPassword, confirm_password: confirmPassword })
            setMessage('Senha redefinida com sucesso. Faça login.')
        } catch (err) {
            setError(err.message || 'Erro ao redefinir senha')
        }
    }

    return (
        <div className="min-h-dvh grid place-items-center bg-[var(--bg)] px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
                <form onSubmit={requestReset} className="space-y-3">
                    <h1 className="text-lg font-bold text-[var(--text)]">Recuperar senha</h1>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                    <button className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Gerar token</button>
                </form>

                <form onSubmit={submitReset} className="space-y-3">
                    <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" required />
                    <button className="w-full rounded-lg bg-[var(--text)] text-[var(--bg)] hover:opacity-90 px-3 py-2 text-sm font-semibold">Redefinir senha</button>
                </form>

                {message && <p className="text-xs text-emerald-500 break-words">{message}</p>}
                {error && <p className="text-xs text-red-400">{error}</p>}

                <Link to="/login" className="text-xs text-[var(--muted)] hover:text-[var(--text)]">Voltar ao login</Link>
            </div>
        </div>
    )
}
