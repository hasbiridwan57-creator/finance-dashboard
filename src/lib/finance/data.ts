import { createClient } from '@/lib/supabase/server'
import { generateTransactions, generateHoldings, generateAccounts } from '@/lib/seed-data'
import { applyLivePrices } from '@/lib/finance/prices'
import type { Tx, Holding, Account } from '@/lib/finance/aggregate'

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
      .select('amount, type, date, categories(name)')
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

  const transactions: Tx[] = (txRes.data ?? []).map((r) => ({
    amount: Number(r.amount),
    type: r.type as Tx['type'],
    // PostgREST returns the joined row as an object (or array, depending on the
    // relationship it infers) — accept both shapes.
    category: (Array.isArray(r.categories) ? r.categories[0]?.name : (r.categories as { name: string } | null)?.name) ?? 'Lainnya',
    date: r.date as string,
  }))

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
      description: 'Transaksi',
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
