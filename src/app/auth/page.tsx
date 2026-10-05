import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from './auth-form'

export const metadata = { title: 'Masuk — Finance Dashboard' }

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; redirect_to?: string }>
}) {
  const sp = await searchParams
  const mode = sp.mode === 'signup' ? 'signup' : 'login'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in? Go straight to the dashboard.
  if (user) redirect(sp.redirect_to || '/')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#07080a] px-5">
      {/* Ambient glow — same family as the dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.18), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,.14), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-sm font-semibold tracking-tight text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] bg-white/[.03] text-emerald-400">
            H
          </span>
          Finance Dashboard
        </Link>

        <div className="rounded-2xl border border-white/[.07] bg-[#0e1015]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-white">
            {mode === 'signup' ? 'Buat akun baru' : 'Masuk ke akunmu'}
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#9aa0ac]">
            {mode === 'signup'
              ? 'Data keuanganmu akan terisi otomatis dengan contoh realistis.'
              : 'Lanjut melacak keuanganmu.'}
          </p>

          <div className="mt-6">
            <AuthForm mode={mode} />
          </div>

          <div className="mt-5 border-t border-white/[.06] pt-5">
            <p className="text-center text-[12px] text-[#646b78]">
              {mode === 'signup' ? (
                <>
                  Sudah punya akun?{' '}
                  <a
                    href="/auth?mode=login"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Masuk
                  </a>
                </>
              ) : (
                <>
                  Belum punya akun?{' '}
                  <a
                    href="/auth?mode=signup"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Daftar
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#4a515e]">
          Tanpa login, kamu melihat dataset contoh yang sama.
          <br />
          Data kamu hanya bisa dilihat oleh akunmu sendiri.
        </p>
      </div>
    </div>
  )
}
