// Pure aggregation: turn raw rows into the four dashboard answers.
// No DB, no React — so it is directly testable.

export interface Tx {
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
}

export interface Holding {
  id?: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  current_price: number
  /** True when current_price was fetched from a live market source. */
  live?: boolean
  created_at?: string | null
}

export interface Account {
  name: string
  kind: 'bank' | 'ewallet' | 'investment' | 'cash' | 'debt'
  balance: number
  institution?: string | null
  created_at?: string | null
}

export interface MonthBucket {
  month: string
  income: number
  expense: number
  net: number
}

/** Cash flow per month, oldest first. */
export function monthlyCashflow(txs: Tx[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const t of txs) {
    const month = t.date.slice(0, 7)
    let b = map.get(month)
    if (!b) {
      b = { month, income: 0, expense: 0, net: 0 }
      map.set(month, b)
    }
    if (t.type === 'income') b.income += t.amount
    else b.expense += t.amount
  }
  return [...map.values()]
    .map((b) => ({ ...b, net: b.income - b.expense }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/** Expense totals per category, largest first. */
export function expenseByCategory(txs: Tx[]): { category: string; total: number }[] {
  const map = new Map<string, number>()
  for (const t of txs) {
    if (t.type !== 'expense') continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}

/** Portfolio: value, cost basis, unrealised P/L. */
export function portfolioSummary(holdings: Holding[]) {
  let value = 0
  let cost = 0
  const byClass = new Map<string, number>()
  const costByClass = new Map<string, number>()

  for (const h of holdings) {
    const v = h.quantity * h.current_price
    const c = h.quantity * h.avg_buy_price
    value += v
    cost += c
    byClass.set(h.asset_class, (byClass.get(h.asset_class) ?? 0) + v)
    costByClass.set(h.asset_class, (costByClass.get(h.asset_class) ?? 0) + c)
  }

  const pl = value - cost
  return {
    value,
    cost,
    pl,
    plPct: cost > 0 ? (pl / cost) * 100 : 0,
    byClass: [...byClass.entries()]
      .map(([assetClass, total]) => ({ assetClass, total }))
      .sort((a, b) => b.total - a.total),
    costByClass: [...costByClass.entries()]
      .map(([assetClass, total]) => ({ assetClass, total }))
      .sort((a, b) => b.total - a.total),
  }
}

/** Net worth = non-debt balances + portfolio value − debt balances. */
export function netWorth(accounts: Account[], portfolioValue: number) {
  let assets = portfolioValue
  let debts = 0
  for (const a of accounts) {
    if (a.kind === 'debt') debts += Math.abs(a.balance)
    else if (a.kind === 'investment') continue // already counted via holdings
    else assets += a.balance
  }
  return { assets, debts, net: assets - debts }
}

/** Latest month vs the previous one, for the delta badges. */
export function latestDelta(buckets: MonthBucket[]) {
  if (buckets.length === 0) return null
  const last = buckets[buckets.length - 1]
  const prev = buckets.length > 1 ? buckets[buckets.length - 2] : null
  return {
    last,
    prev,
    expenseDeltaPct:
      prev && prev.expense > 0 ? ((last.expense - prev.expense) / prev.expense) * 100 : null,
    incomeDeltaPct:
      prev && prev.income > 0 ? ((last.income - prev.income) / prev.income) * 100 : null,
  }
}

/** Average monthly expense over the whole window — the burn rate baseline. */
export function avgMonthlyExpense(buckets: MonthBucket[]): number {
  if (buckets.length === 0) return 0
  return buckets.reduce((s, b) => s + b.expense, 0) / buckets.length
}
