import assert from 'node:assert'
import {
  monthlyCashflow,
  expenseByCategory,
  portfolioSummary,
  netWorth,
  latestDelta,
  avgMonthlyExpense,
  type Tx,
  type Holding,
  type Account,
} from '../src/lib/finance/aggregate.ts'

const txs: Tx[] = [
  { amount: 6_000_000, type: 'income', category: 'Gaji', date: '2026-01-25' },
  { amount: 1_000_000, type: 'expense', category: 'Makan & Minum', date: '2026-01-05' },
  { amount: 500_000, type: 'expense', category: 'Transport', date: '2026-01-08' },
  { amount: 6_500_000, type: 'income', category: 'Gaji', date: '2026-02-25' },
  { amount: 2_000_000, type: 'expense', category: 'Makan & Minum', date: '2026-02-04' },
  { amount: 800_000, type: 'expense', category: 'Transport', date: '2026-02-09' },
  { amount: 700_000, type: 'income', category: 'Freelance', date: '2026-02-10' },
]

// monthlyCashflow: ordered, net = income - expense
const flow = monthlyCashflow(txs)
assert.equal(flow.length, 2, 'two months')
assert.deepEqual(flow.map((b) => b.month), ['2026-01', '2026-02'], 'sorted oldest first')
assert.equal(flow[0].income, 6_000_000)
assert.equal(flow[0].expense, 1_500_000)
assert.equal(flow[0].net, 4_500_000)
assert.equal(flow[1].income, 7_200_000, 'salary + freelance')
assert.equal(flow[1].net, 7_200_000 - 2_800_000)

// ordering must be chronological even when input is shuffled
const shuffled = monthlyCashflow([...txs].reverse())
assert.deepEqual(shuffled.map((b) => b.month), ['2026-01', '2026-02'], 'input order irrelevant')

// expenseByCategory: largest first, income excluded
const cats = expenseByCategory(txs)
assert.equal(cats[0].category, 'Makan & Minum')
assert.equal(cats[0].total, 3_000_000)
assert.equal(cats[1].category, 'Transport')
assert.equal(cats[1].total, 1_300_000)
assert.ok(!cats.some((c) => c.category === 'Gaji'), 'income never in expense breakdown')

const holdings: Holding[] = [
  { symbol: 'BBCA', name: 'Bank Central Asia', asset_class: 'stock', quantity: 100, avg_buy_price: 8000, current_price: 9000 },
  { symbol: 'BTC', name: 'Bitcoin', asset_class: 'crypto', quantity: 0.01, avg_buy_price: 1_000_000_000, current_price: 1_100_000_000 },
]
const port = portfolioSummary(holdings)
assert.equal(port.value, 900_000 + 11_000_000)
assert.equal(port.cost, 800_000 + 10_000_000)
assert.equal(port.pl, port.value - port.cost)
assert.ok(port.plPct > 0, 'profit is positive here')
assert.equal(port.byClass[0].assetClass, 'crypto', 'largest class first')

// portfolioSummary on empty holdings must not divide by zero
assert.deepEqual(portfolioSummary([]), { value: 0, cost: 0, pl: 0, plPct: 0, byClass: [] })

const accounts: Account[] = [
  { name: 'BCA', kind: 'bank', balance: 5_000_000 },
  { name: 'OVO', kind: 'ewallet', balance: 500_000 },
  { name: 'RDN', kind: 'investment', balance: 9_999_999 }, // must NOT double count
  { name: 'CC', kind: 'debt', balance: -2_000_000 },
]
const nw = netWorth(accounts, port.value)
assert.equal(nw.assets, 5_500_000 + port.value, 'investment account balance excluded from assets')
assert.equal(nw.debts, 2_000_000, 'debt magnitude, sign normalised')
assert.equal(nw.net, nw.assets - nw.debts)

const d = latestDelta(flow)
assert.ok(d)
assert.equal(d.last.month, '2026-02')
assert.equal(d.prev?.month, '2026-01')
assert.equal(d.expenseDeltaPct, ((2_800_000 - 1_500_000) / 1_500_000) * 100)

// first month has no predecessor -> null deltas, never NaN
const single = latestDelta(monthlyCashflow([txs[0]]))
assert.equal(single?.prev, null)
assert.equal(single?.expenseDeltaPct, null)

assert.equal(avgMonthlyExpense(flow), (1_500_000 + 2_800_000) / 2)
assert.equal(avgMonthlyExpense([]), 0, 'empty window -> 0, not NaN')

console.log('aggregate.ts: all checks passed')
