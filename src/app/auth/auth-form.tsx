'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          })
        : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      // Bahasa Indonesia, bukan raw Supabase English.
      setError(
        error.message.includes('Invalid login')
          ? 'Email atau password salah.'
          : error.message.includes('already')
            ? 'Email sudah terdaftar. Coba masuk.'
            : error.message.includes('Password should be')
              ? 'Password minimal 6 karakter.'
              : error.message
      )
      return
    }

    // signUp with email confirmation OFF → session langsung ada.
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kamu@email.com"
          className="w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40 focus:bg-white/[.05]"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          className="w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40 focus:bg-white/[.05]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-lg bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-[#052e1c] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Memproses…' : mode === 'signup' ? 'Daftar' : 'Masuk'}
      </button>
    </form>
  )
}
