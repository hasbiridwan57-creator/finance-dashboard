import { getDashboardData, type ActivityEvent } from '@/lib/finance/data'
import {
  monthlyCashflow,
  expenseByCategory,
  portfolioSummary,
  netWorth,
  latestDelta,
  avgMonthlyExpense,
} from '@/lib/finance/aggregate'
import { CashflowChart, CategoryChart, PortfolioChart, Sparkline } from '@/components/charts'
import { HoldingsTable } from '@/components/holdings-table'
import { SidebarNav, PeriodToggle } from '@/components/nav'
import { AddTransactionButton, AddAssetButton, ImportPortfolioButton, SignOutButton } from '@/components/auth-actions'
import { LiveRefresher } from '@/components/live-refresher'
import { formatIDR, formatCompact, formatMonth, formatPct, formatDay } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>
}) {
  const sp = await searchParams
  const MONTHS = Math.min(12, Math.max(3, Number(sp.months) || 6)) as 3 | 6 | 12

  const { transactions, holdings, accounts, demo, user, activity } = await getDashboardData()

  const flow = monthlyCashflow(transactions)
  const categories = expenseByCategory(transactions)
  const portfolio = portfolioSummary(holdings)
  const worth = netWorth(accounts, portfolio.value)
  const liquidCash = accounts
    .filter((a) => a.kind !== 'debt' && a.kind !== 'investment')
    .reduce((sum, a) => sum + a.balance, 0)
  const burn = avgMonthlyExpense(flow)

  const window = flow.slice(-MONTHS)
  const delta = latestDelta(window)
  // Net-worth trend: cumulative net cash flow anchored at current net worth.
  const nwTrend = (() => {
    const start = worth.net - flow.reduce((s, b) => s + b.net, 0)
    return window.reduce<number[]>((acc, b) => {
      acc.push((acc.length ? acc[acc.length - 1] : start) + b.net)
      return acc
    }, [])
  })()

  return (
    <div className="relative z-10 flex min-h-screen">
      <LiveRefresher />
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/[.06] bg-white/[.012] px-5 py-7 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-slate-950">
            H
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Finance</p>
            <p className="text-[10px] leading-tight text-[#646b78]">Hasbi Ridwan</p>
          </div>
        </div>

        <SidebarNav />

        <div className="mt-auto rounded-xl border border-white/[.06] bg-white/[.02] p-3.5">
          <p className="text-[10px] uppercase tracking-widest text-[#646b78]">Status data</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[11px] text-[#9aa0ac]">
              {demo ? 'Data contoh' : 'Live · Supabase'}
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#4a515e]">
            {accounts.length} akun · {holdings.length} instrumen
          </p>
          {user && (
            <div className="mt-3 border-t border-white/[.06] pt-3">
              <p className="mb-1.5 text-[10px] text-[#4a515e]">{user}</p>
              <SignOutButton />
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-6 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[.18em] text-emerald-400/90">
                Personal Finance
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-[#9aa0ac]">
                Net worth, arus kas, dan portofolio — semua di satu layar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {demo && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                  Data contoh
                </span>
              )}
              {user ? (
                <>
                  <AddAssetButton accounts={accounts} />
                  <ImportPortfolioButton />
                  <AddTransactionButton />
                </>
              ) : null}
              {user ? (
                <a
                  href="/auth"
                  className="rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-1.5 text-xs font-medium text-[#c9ced8] transition-colors hover:bg-white/[.06] hover:text-white"
                >
                  {user.split('@')[0]}
                </a>
              ) : (
                <a
                  href="/auth?mode=login"
                  className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-200"
                >
                  Masuk
                </a>
              )}
              <PeriodToggle />
            </div>
          </header>

          {!user && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.02] px-4 py-3 text-xs text-[#9aa0ac]">
              <span>Belum login — data tersimpan lokal di browser ini saja. Login untuk menyimpan permanen.</span>
              <a
                href="/auth?mode=signup"
                className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/15"
              >
                Daftar
              </a>
            </div>
          )}

          {/* Hero: net worth spotlight */}
          <section id="top" className="animate-rise mt-8 grid gap-4 rounded-3xl border border-white/[.06] bg-gradient-to-br from-white/[.045] to-transparent p-6 sm:p-7 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">
                Net Worth
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-white sm:text-5xl">
                {formatIDR(worth.net, { compact: true })}
              </p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <span className="text-[#646b78]">
                  Aset{' '}
                  <span className="ml-1 font-medium tabular-nums text-[#c9ced8]">
                    {formatIDR(worth.assets, { compact: true })}
                  </span>
                </span>
                <span className="text-[#646b78]">
                  Utang{' '}
                  <span className="ml-1 font-medium tabular-nums text-[#c9ced8]">
                    {formatIDR(worth.debts, { compact: true })}
                  </span>
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                <span className="text-[#646b78]">
                  Kas Likuid{' '}
                  <span className="ml-1 font-medium tabular-nums text-emerald-400">
                    {formatIDR(liquidCash, { compact: true })}
                  </span>
                </span>
                <span className="text-[#646b78]">
                  Investasi{' '}
                  <span className="ml-1 font-medium tabular-nums text-[#c9ced8]">
                    {formatIDR(portfolio.value, { compact: true })}
                  </span>
                </span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-[#646b78]">
                {worth.net >= 0
                  ? 'Posisi bersih positif. Pertahankan rasio utang di bawah 30% aset.'
                  : 'Masih defisit. Fokus melunasi kewajiban berbunga tinggi dulu.'}
              </p>
            </div>
            <div className="flex h-32 items-end lg:h-auto">
              <Sparkline values={nwTrend} />
            </div>
          </section>

          {/* Stat cards */}
          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Arus Kas Bulan Ini"
              value={delta ? formatIDR(delta.last.net, { compact: true }) : '—'}
              sub={
                delta?.incomeDeltaPct != null
                  ? `Pemasukan ${formatPct(delta.incomeDeltaPct)} vs bulan lalu`
                  : formatMonth(delta?.last.month ?? '')
              }
              tone={(delta?.last.net ?? 0) >= 0 ? 'up' : 'down'}
              spark={window.map((b) => b.net)}
            />
            <StatCard
              label="Pengeluaran Bulan Ini"
              value={delta ? formatIDR(delta.last.expense, { compact: true }) : '—'}
              sub={
                delta?.expenseDeltaPct != null
                  ? `${formatPct(delta.expenseDeltaPct)} vs bulan lalu · rata-rata ${formatCompact(burn)}/bln`
                  : `Rata-rata ${formatCompact(burn)}/bulan`
              }
              tone={(delta?.expenseDeltaPct ?? 0) <= 0 ? 'up' : 'down'}
              spark={window.map((b) => b.expense)}
            />
            <StatCard
              label="Portofolio"
              value={formatIDR(portfolio.value, { compact: true })}
              sub={`${portfolio.pl >= 0 ? 'Untung' : 'Rugi'} ${formatIDR(portfolio.pl, { compact: true })} (${formatPct(portfolio.plPct)})`}
              tone={portfolio.pl >= 0 ? 'up' : 'down'}
              spark={window.map((b) => b.income)}
            />
          </section>

          {/* Row: cash flow + category breakdown */}
          <section id="arus-kas" className="animate-rise stagger-1 mt-4 grid gap-4 lg:grid-cols-3 scroll-mt-6">
            <Panel
              title={`Arus Kas ${MONTHS} Bulan`}
              hint="Pemasukan vs pengeluaran per bulan"
              className="lg:col-span-2"
            >
              <CashflowChart buckets={window} />
            </Panel>
            <Panel title="Ke Mana Uang Pergi" hint="Total pengeluaran per kategori">
              <CategoryChart data={categories.slice(0, 7)} />
            </Panel>
          </section>

          {/* Row: allocation + holdings */}
          <section id="portofolio" className="animate-rise stagger-2 mt-4 grid gap-4 lg:grid-cols-3 scroll-mt-6">
            <Panel title="Alokasi Aset" hint="Nilai pasar per kelas aset">
              <PortfolioChart data={portfolio.byClass} costByClass={portfolio.costByClass} />
            </Panel>
            <Panel
              title="Kepemilikan"
              hint="Posisi & untung/rugi per instrumen · harga real-time"
              className="lg:col-span-2"
            >
              <HoldingsTable holdings={holdings} />
            </Panel>
          </section>

          {/* Row: budget bar + recent activity */}
          <section id="anggaran" className="animate-rise stagger-3 mt-4 grid gap-4 lg:grid-cols-3 scroll-mt-6">
            <Panel title="Progress Anggaran" hint={`Pengeluaran vs rata-rata ${MONTHS} bulan`}>
              <BudgetGauge spent={delta?.last.expense ?? 0} baseline={burn} />
            </Panel>
          </section>

          {/* Row: activity feed */}
          <section id="transaksi" className="animate-rise stagger-4 mt-4 scroll-mt-6">
            <Panel title="Aktivitas Terbaru" hint="Transaksi, saldo, dan investasi terbaru">
              <RecentActivity activity={activity} />
            </Panel>
          </section>

          <footer className="mt-10 pb-4 text-xs text-[#4a515e]">
            {transactions.length} transaksi · {holdings.length} instrumen · {accounts.length} akun
          </footer>
        </div>
      </main>
    </div>
  )
}

// --- Building blocks ------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  tone,
  spark,
}: {
  label: string
  value: string
  sub: string
  tone: 'up' | 'down'
  spark: number[]
}) {
  return (
    <div className="group animate-rise relative overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.025] p-5 transition-colors hover:border-white/[.10] hover:bg-white/[.04]">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">
          {label}
        </p>
        <span
          className={`h-1.5 w-1.5 rounded-full ${tone === 'up' ? 'bg-emerald-400' : 'bg-orange-400'}`}
        />
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tabular-nums ${tone === 'up' ? 'text-white' : 'text-orange-300'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#9aa0ac]">{sub}</p>
      <div className="mt-3.5">
        <Sparkline values={spark} />
      </div>
    </div>
  )
}

function Panel({
  title,
  hint,
  className = '',
  id,
  children,
}: {
  title: string
  hint?: string
  className?: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <div
      id={id}
      className={`animate-rise relative overflow-hidden rounded-2xl border border-white/[.06] bg-white/[.025] p-5 transition-colors hover:border-white/[.09] sm:p-6 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-[#646b78]">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function BudgetGauge({ spent, baseline }: { spent: number; baseline: number }) {
  const pct = baseline > 0 ? Math.min(100, (spent / baseline) * 100) : 0
  const over = spent > baseline
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {formatIDR(spent, { compact: true })}
          </p>
          <p className="text-xs text-[#646b78]">dari rata-rata {formatCompact(baseline)}/bln</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${over ? 'bg-orange-500/12 text-orange-300' : 'bg-emerald-500/12 text-emerald-300'}`}
        >
          {formatPct(pct - 100)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[.05]">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            over
              ? 'bg-gradient-to-r from-orange-500 to-orange-400'
              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#4a515e]">
        <span>0</span>
        <span>{formatCompact(baseline)}</span>
      </div>
      <p className="text-xs leading-relaxed text-[#646b78]">
        {over
          ? `Boros ${formatCompact(spent - baseline)} dari rata-rata bulanan.`
          : `Hemat ${formatCompact(baseline - spent)} dari rata-rata bulanan.`}
      </p>
    </div>
  )
}

function RecentActivity({ activity }: { activity: ActivityEvent[] }) {
  const recent = activity.slice(0, 15)
  return (
    <ul className="divide-y divide-white/[.045]">
      {recent.map((e, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:bg-white/[.02]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${
                e.kind === 'transaction'
                  ? e.tone === 'up'
                    ? 'bg-emerald-500/12 text-emerald-400'
                    : 'bg-white/[.05] text-[#9aa0ac]'
                  : e.kind === 'account'
                    ? 'bg-blue-500/12 text-blue-400'
                    : 'bg-violet-500/12 text-violet-400'
              }`}
            >
              {e.kind === 'transaction'
                ? e.tone === 'up'
                  ? '↑'
                  : '↓'
                : e.kind === 'account'
                  ? '₹'
                  : '◆'}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-[#e8eaee]">{e.label}</span>
              <span className="block truncate text-[11px] text-[#646b78]">
                {e.description}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="text-[11px] text-[#4a515e]">{formatDay(e.date)}</span>
            {e.amount != null && (
              <span
                className={`w-24 text-right font-medium tabular-nums ${
                  e.tone === 'up'
                    ? 'text-emerald-400'
                    : e.tone === 'down'
                      ? 'text-[#c9ced8]'
                      : 'text-blue-400'
                }`}
              >
                {e.tone === 'up' ? '+' : e.tone === 'down' ? '−' : ''}
                {formatIDR(e.amount, { compact: true })}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
