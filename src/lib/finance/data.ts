import { createClient } from '@/lib/supabase/server'
import { generateTransactions, generateHoldings, generateAccounts } from '@/lib/seed-data'
import { applyLivePrices } from '@/lib/finance/prices'
import fs from 'fs'
import path from 'path'
import type { Tx, Holding, Account, TradeEntry } from '@/lib/finance/aggregate'

export interface DashboardData {
  transactions: Tx[]
  holdings: Holding[]
  accounts: Account[]
  /** True when Supabase is not configured and demo data is being served. */
  demo: boolean
  /** Authenticated user email, when signed in. */
  user: string | null
  /** Unified activity feed: transactions + account/holdings additions, newest first. */
  activity: ActivityEvent[]
}

export interface ActivityEvent {
  date: string
  kind: 'transaction' | 'account' | 'holding'
  label: string
  description: string
  amount: number | null
  tone: 'up' | 'down' | 'neutral'
}

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Single read path for the dashboard.
 * Signed-in user -> own rows (RLS-enforced).
 * Anonymous -> shared demo dataset (user_id IS NULL).
 * No Supabase configured -> deterministic demo data.
 */
export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabase) return demoData(null)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Jika tidak login, tampilkan dashboard kosong (nol)
  if (!user) {
    return {
      transactions: [],
      holdings: [],
      accounts: [],
      demo: false,
      user: null,
      activity: [],
    }
  }

  const [txRes, holdRes, accRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, date, description, categories(name)')
      .order('date', { ascending: false }),
    supabase
      .from('holdings')
      .select('id, symbol, name, asset_class, quantity, avg_buy_price, current_price, created_at')
      .order('symbol', { ascending: true }),
    supabase
      .from('accounts')
      .select('name, kind, balance, institution, created_at')
      .order('name', { ascending: true }),
  ])

  // Any read failure falls back rather than rendering an empty dashboard.
  if (txRes.error || holdRes.error || accRes.error) return demoData(user?.email ?? null)

  const transactions: Tx[] = (txRes.data ?? []).map((r) => {
    const rawCategory = (Array.isArray(r.categories) ? r.categories[0]?.name : (r.categories as { name: string } | null)?.name) ?? null
    const desc = typeof r.description === 'string' ? r.description : ''
    let category = rawCategory
    if (!category || category === 'Lainnya') {
      if (/dividen|kupon/i.test(desc)) category = 'Dividen & Kupon'
      else if (/bunga|yield/i.test(desc)) category = 'Bunga & Yield'
      else category = rawCategory ?? 'Lainnya'
    }
    return {
      amount: Number(r.amount),
      type: r.type as Tx['type'],
      category,
      date: r.date as string,
      description: desc,
    }
  })

  const holdings: Holding[] = (holdRes.data ?? []).map((h) => ({
    id: h.id,
    symbol: h.symbol,
    name: h.name,
    asset_class: h.asset_class,
    quantity: Number(h.quantity),
    avg_buy_price: Number(h.avg_buy_price),
    current_price: Number(h.current_price),
    created_at: h.created_at as string | null,
  }))
  const accounts: Account[] = (accRes.data ?? []).map((a) => ({
    name: a.name,
    kind: a.kind as Account['kind'],
    balance: Number(a.balance),
    institution: a.institution as string | null,
    created_at: a.created_at as string | null,
  }))

  // Live market prices for the portfolio (Yahoo for stocks, CoinGecko for crypto).
  const priced = await applyLivePrices(holdings)

  // Unified activity feed: transactions + new accounts + new holdings.
  const activity: ActivityEvent[] = [
    ...transactions.map<ActivityEvent>((t) => ({
      date: t.date,
      kind: 'transaction',
      label: t.category,
      description: t.description || 'Transaksi',
      amount: t.amount,
      tone: t.type === 'income' ? 'up' : 'down',
    })),
    ...accounts.map<ActivityEvent>((a) => ({
      date: a.created_at?.slice(0, 10) ?? '',
      kind: 'account',
      label: a.name,
      description: 'Saldo awal',
      amount: a.balance,
      tone: 'neutral',
    })),
    ...priced.map<ActivityEvent>((h) => ({
      // created_at is not selected on holdings; use today as approximation.
      date: new Date().toISOString().slice(0, 10),
      kind: 'holding',
      label: h.symbol,
      description: 'Investasi ditambah',
      amount: h.quantity * h.avg_buy_price,
      tone: 'neutral',
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return {
    transactions,
    holdings: priced,
    accounts,
    demo: false,
    user: user?.email ?? null,
    activity,
  }
}

function demoData(user: string | null): DashboardData {
  const transactions = generateTransactions()
  const holdings = generateHoldings()
  const accounts = generateAccounts()
  const activity: ActivityEvent[] = [
    ...transactions.map((t) => ({
      date: t.date,
      kind: 'transaction' as const,
      label: t.category,
      description: 'Transaksi',
      amount: t.amount,
      tone: (t.type === 'income' ? 'up' : 'down') as 'up' | 'down',
    })),
    ...accounts.map((a) => ({
      date: new Date().toISOString().slice(0, 10),
      kind: 'account' as const,
      label: a.name,
      description: 'Saldo awal',
      amount: a.balance,
      tone: 'neutral' as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  return {
    transactions,
    holdings,
    accounts,
    demo: true,
    user,
    activity,
  }
}

// Local view models used by the dashboard components.
export type DemoAccount = ReturnType<typeof generateAccounts>[number]
export type DemoHolding = ReturnType<typeof generateHoldings>[number]

// ---------------------------------------------------------------------------
// Smart Money Trading Journal source.
// Reads the local paper-trade ledger when present; otherwise serves a
// deterministic dataset so the journal panel is always populated (Vercel has
// no access to ../smart-money-tracker).
// ---------------------------------------------------------------------------
const SMT_FALLBACK: TradeEntry[] = [
  { id: 'smt-001', timestamp: '2026-09-22T09:15:00+07:00', symbol: 'BBCA.JK', side: 'BUY', entryPrice: 9_450, exitPrice: 9_975, quantity: 500, pnl: 262_500, strategy: 'Smart Money Accumulation (Institutional Footprint)' },
  { id: 'smt-002', timestamp: '2026-09-25T10:05:00+07:00', symbol: 'BMRI.JK', side: 'LONG', entryPrice: 5_800, exitPrice: 6_125, quantity: 1_000, pnl: 325_000, strategy: 'Breakout Retest + Volume Confirmation' },
  { id: 'smt-003', timestamp: '2026-09-29T14:30:00+07:00', symbol: 'BTC', side: 'BUY', entryPrice: 1_062_000_000, exitPrice: 1_118_500_000, quantity: 0.05, pnl: 2_825_000, strategy: 'Liquidity Sweep Reclaim (Higher Timeframe)' },
  { id: 'smt-004', timestamp: '2026-10-01T09:45:00+07:00', symbol: 'TLKM.JK', side: 'SELL', entryPrice: 3_180, exitPrice: 3_020, quantity: 2_000, pnl: -320_000, strategy: 'Failed Breakout — Cut Loss Discipline' },
  { id: 'smt-005', timestamp: '2026-10-03T11:20:00+07:00', symbol: 'ETH', side: 'LONG', entryPrice: 61_500_000, exitPrice: 64_950_000, quantity: 0.4, pnl: 1_380_000, strategy: 'Smart Money Divergence (Spot CVD vs Price)' },
  { id: 'smt-006', timestamp: '2026-10-07T15:10:00+07:00', symbol: 'ASII.JK', side: 'BUY', entryPrice: 4_850, exitPrice: 5_150, quantity: 1_500, pnl: 450_000, strategy: 'Order Block Mitigation Bounce' },
  { id: 'smt-007', timestamp: '2026-10-09T20:40:00+07:00', symbol: 'SOL', side: 'SHORT', entryPrice: 3_350_000, exitPrice: 3_512_000, quantity: 4, pnl: -648_000, strategy: 'Mean Reversion Short — Stopped Out on Squeeze' },
  { id: 'smt-008', timestamp: '2026-10-13T09:05:00+07:00', symbol: 'BBCA.JK', side: 'BUY', entryPrice: 9_800, exitPrice: 10_275, quantity: 800, pnl: 380_000, strategy: 'Relative Strength vs IHSG Rotation' },
]

/** Tolerant parse of a raw ledger line into a TradeEntry. */
function normaliseTrade(raw: unknown): TradeEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.symbol !== 'string') return null
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date().toISOString(),
    symbol: r.symbol,
    side: (typeof r.side === 'string' ? r.side.toUpperCase() : 'BUY') as TradeEntry['side'],
    entryPrice: num(r.entryPrice ?? r.entry_price),
    exitPrice: num(r.exitPrice ?? r.exit_price),
    quantity: num(r.quantity ?? r.qty),
    pnl: num(r.pnl),
    strategy: typeof r.strategy === 'string' ? r.strategy : undefined,
  }
}

/**
 * Server-side trade source for the Smart Money journal. Never returns 404 —
 * a deterministic dataset keeps the panel alive in serverless deploys.
 */
export const SMT_LEDGER_PATH = path.join(process.cwd(), '../smart-money-tracker/data/paper_trade_ledger.jsonl')

export function readAllSmtTrades(): TradeEntry[] {
  try {
    if (fs.existsSync(SMT_LEDGER_PATH)) {
      const lines = fs
        .readFileSync(SMT_LEDGER_PATH, 'utf-8')
        .trim()
        .split('\n')
        .filter((l) => l.trim() !== '')
      const trades = lines
        .map((line) => {
          try {
            return normaliseTrade(JSON.parse(line))
          } catch {
            return null
          }
        })
        .filter((t): t is TradeEntry => t !== null)
      if (trades.length > 0) return trades
    }
  } catch {
    // fall through
  }
  return [...SMT_FALLBACK]
}

export function saveSmtTrades(trades: TradeEntry[]): void {
  try {
    const dir = path.dirname(SMT_LEDGER_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const content = trades.map((t) => JSON.stringify(t)).join('\n') + '\n'
    fs.writeFileSync(SMT_LEDGER_PATH, content, 'utf-8')
  } catch (err) {
    console.warn('saveSmtTrades: ledger write skipped (read-only filesystem or serverless)', err)
  }
}

export async function getSmtTrades(): Promise<TradeEntry[]> {
  const all = readAllSmtTrades()
  return all.slice(0, 50)
}
