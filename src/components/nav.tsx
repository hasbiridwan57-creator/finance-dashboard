'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'

const NAV = [
  { label: 'Ringkasan', id: 'top' },
  { label: 'Rasio & Risiko', id: 'rasio-risiko' },
  { label: 'Arus Kas', id: 'arus-kas' },
  { label: 'Portofolio', id: 'portofolio' },
  { label: 'Anggaran', id: 'anggaran' },
  { label: 'Transaksi', id: 'transaksi' },
  { label: 'Trading Journal', id: 'trading-journal' },
] as const

export function SidebarNav() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [active, setActive] = useState(() => sp.get('view') || 'top')

  // Scroll-spy: highlight the nav item for the section currently in view.
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean,
    ) as HTMLElement[]
    if (!sections.length) return

    let raf = 0
    const compute = () => {
      raf = 0
      const line = window.scrollY + window.innerHeight * 0.28
      // Pick the section nearest the focus line — when two sections share an
      // offset (a panel nested inside a section), the first one wins.
      let current = sections[0].id
      let bestDist = Math.abs(sections[0].offsetTop - line)
      for (const s of sections) {
        const top = s.getBoundingClientRect().top + window.scrollY
        const dist = Math.abs(top - line)
        if (top <= line && dist <= bestDist) {
          current = s.id
          bestDist = dist
        }
      }
      setActive((prev) => (prev === current ? prev : current))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    compute()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const scrollTo = useCallback(
    (id: string) => {
      setActive(id)
      if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      // Keep `view` in sync so refresh preserves position context.
      const q = new URLSearchParams(sp.toString())
      if (id === 'top') q.delete('view')
      else q.set('view', id)
      router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    },
    [router, pathname, sp],
  )

  return (
    <nav className="mt-9 space-y-1">
      {NAV.map((n) => {
        const on = active === n.id
        return (
          <button
            key={n.id}
            onClick={() => scrollTo(n.id)}
            className={`group relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-200 ${
              on
                ? 'bg-white/[.06] font-medium text-white'
                : 'text-[#9aa0ac] hover:bg-white/[.03] hover:text-white'
            }`}
          >
            {/* Active indicator bar */}
            <span
              className={`absolute left-0 top-1/2 h-4 -translate-y-1/2 rounded-r-full bg-emerald-400 transition-all duration-300 ease-out ${
                on ? 'w-[3px] opacity-100' : 'w-0 opacity-0'
              }`}
            />
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                on ? 'bg-emerald-400' : 'bg-[#3a404c] group-hover:bg-[#5a616e]'
              }`}
            />
            {n.label}
          </button>
        )
      })}
    </nav>
  )
}

export function PeriodToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const current = Number(sp.get('months')) || 6
  const [optimisticMonths, setOptimisticMonths] = useState<number>(current)

  const setMonths = (m: number) => {
    setOptimisticMonths(m)
    const q = new URLSearchParams(sp.toString())
    q.set('months', String(m))
    startTransition(() => {
      router.push(`${pathname}?${q.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/[.10] bg-white/[.04] p-1 shadow-inner">
      {[3, 6, 12].map((m) => {
        const active = (isPending ? optimisticMonths : current) === m
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMonths(m)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 select-none ${
              active
                ? 'bg-emerald-500 text-[#052e1c] shadow-sm shadow-emerald-500/20'
                : 'text-[#9aa0ac] hover:bg-white/[.06] hover:text-white'
            }`}
          >
            {m} bln
          </button>
        )
      })}
    </div>
  )
}
