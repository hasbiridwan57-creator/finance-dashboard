import assert from 'node:assert'
import {
  monthlyCashflow,
  expenseByCategory,
  portfolioSummary,
  netWorth,
  latestDelta,
  avgMonthlyExpense,
  financialRatios,
  portfolioRiskMetrics,
  rebalanceDrift,
  passiveIncomeMetrics,
  stressTestPortfolio,
  topUpAllocation,
  calculateDivestmentNet,
  benchmarkAndAlphaMetrics,
  tradingJournalMetrics,
  type TradeEntry,
  type Tx,
  type Holding,
  type Account,
} from '../../src/lib/finance/aggregate'

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
assert.deepEqual(portfolioSummary([]), { value: 0, cost: 0, pl: 0, plPct: 0, byClass: [], costByClass: [] })

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

// --- QUANTITATIVE ENGINE TESTS ---
const ratios = financialRatios(nw, 5_500_000, port.value, flow)
assert.equal(ratios.burnRate, 2_150_000, 'exact burn rate: (1.5M + 2.8M)/2')
assert.ok(Math.abs(ratios.runwayMonths! - (5_500_000 / 2_150_000)) < 0.001, 'exact runway months')
assert.equal(ratios.savingsRatePct, ((7_200_000 - 2_800_000) / 7_200_000) * 100, 'exact savings rate')
assert.equal(ratios.debtToAssetPct, (2_000_000 / nw.assets) * 100, 'exact debt to asset')

const risk = portfolioRiskMetrics(holdings)
// holdings:
// BBCA: 100 * 9000 = 900,000
// BTC: 0.01 * 1,100,000,000 = 11,000,000
// Total = 11,900,000
// BTC share = 11M / 11.9M = 0.9243697... (92.44%)
// BBCA share = 0.9M / 11.9M = 0.07563... (7.56%)
// HHI = (11/11.9)^2 + (0.9/11.9)^2 = 0.85445 + 0.00572 = 0.86017...
assert.equal(risk.weights.length, 2, 'risk weights array length')
assert.equal(risk.weights[0].symbol, 'BTC')
assert.equal(risk.weights[1].symbol, 'BBCA')
assert.ok(Math.abs(risk.weights[0].weightPct - (11_000_000 / 11_900_000) * 100) < 0.001, 'exact BTC weight')
assert.ok(Math.abs(risk.weights[1].weightPct - (900_000 / 11_900_000) * 100) < 0.001, 'exact BBCA weight')
assert.ok(risk.weights[0].concentrated === true, 'BTC concentrated > 25%')
assert.ok(risk.weights[1].concentrated === false, 'BBCA not concentrated')
assert.ok(Math.abs(risk.hhi - (((11/11.9)**2) + ((0.9/11.9)**2))) < 0.001, 'exact HHI')
assert.equal(risk.concentrationLevel, 'High', 'HHI > 0.30 -> High concentration')
assert.equal(risk.topHolding?.symbol, 'BTC', 'top holding is BTC')

const drift = rebalanceDrift(port.byClass, port.value, { stock: 45, crypto: 20, bond: 15, mutual_fund: 10, gold: 10 })
// port.value = 11,900,000
// crypto actual = 11,000,000 (92.44%), target 20% -> drift +72.44% -> OVERWEIGHT
// stock actual = 900,000 (7.56%), target 45% -> drift -37.44% -> UNDERWEIGHT
const cryptoDrift = drift.find((d) => d.assetClass === 'crypto')!
assert.ok(cryptoDrift, 'crypto drift exists')
assert.equal(cryptoDrift.status, 'OVERWEIGHT')
assert.ok(Math.abs(cryptoDrift.actualPct - (11_000_000 / 11_900_000) * 100) < 0.001, 'exact crypto actualPct')
assert.ok(Math.abs(cryptoDrift.driftPct - ((11_000_000 / 11_900_000) * 100 - 20)) < 0.001, 'exact crypto driftPct')
assert.equal(cryptoDrift.targetValue, (20 / 100) * 11_900_000, 'exact crypto targetValue: 2,380,000')
assert.equal(cryptoDrift.actionAmount, 2_380_000 - 11_000_000, 'exact crypto actionAmount: -8,620,000 (Trim)')

const stockDrift = drift.find((d) => d.assetClass === 'stock')!
assert.ok(stockDrift, 'stock drift exists')
assert.equal(stockDrift.status, 'UNDERWEIGHT')
assert.ok(Math.abs(stockDrift.actualPct - (900_000 / 11_900_000) * 100) < 0.001, 'exact stock actualPct')
assert.ok(Math.abs(stockDrift.driftPct - ((900_000 / 11_900_000) * 100 - 45)) < 0.001, 'exact stock driftPct')
assert.equal(stockDrift.targetValue, (45 / 100) * 11_900_000, 'exact stock targetValue: 5,355,000')
assert.equal(stockDrift.actionAmount, 5_355_000 - 900_000, 'exact stock actionAmount: +4,455,000 (Buy)')

// Empty input tests for NaN / zero division safety
const emptyRatios = financialRatios({ assets: 0, debts: 0, net: 0 }, 0, 0, [])
assert.equal(emptyRatios.runwayMonths, null)
assert.equal(emptyRatios.debtToAssetPct, 0)
assert.equal(emptyRatios.savingsRatePct, 0)
assert.equal(emptyRatios.liquidityRatioPct, 0)
assert.equal(emptyRatios.investmentAllocationPct, 0)

const emptyRisk = portfolioRiskMetrics([])
assert.equal(emptyRisk.hhi, 0)
assert.equal(emptyRisk.concentrationLevel, 'Low')
assert.equal(emptyRisk.topHolding, null)

const emptyDrift = rebalanceDrift([], 0)
assert.ok(emptyDrift.length > 0, 'drift handles empty classes')
assert.ok(!isNaN(emptyDrift[0].actualPct), 'drift actualPct not NaN')

// --- SPRINT 2 NEW ENGINE TESTS ---
const passiveTxs: Tx[] = [
  ...txs,
  { amount: 500_000, type: 'income', category: 'Dividen & Kupon', date: '2026-02-15' },
]
const passive = passiveIncomeMetrics(passiveTxs, 2_150_000)
assert.equal(passive.totalPassiveIncome, 500_000, 'exact total passive income')
assert.equal(passive.latestMonthPassive, 500_000, 'exact latest month passive')
assert.equal(passive.monthlyAvgPassive, 250_000, 'exact monthly avg passive (500k / 2 bln)')
assert.equal(passive.coverageRatioPct, (500_000 / 2_150_000) * 100, 'exact coverage ratio')

// Empty passive metrics safety
const emptyPassive = passiveIncomeMetrics([], 0)
assert.equal(emptyPassive.totalPassiveIncome, 0)
assert.equal(emptyPassive.coverageRatioPct, 0)

// Stress test: crypto -40%, stock -20%
// holdings: BTC (11,000,000) -> stressedVal = 11M * 0.6 = 6,600,000 (loss 4,400,000)
//           BBCA (900,000) -> stressedVal = 900k * 0.8 = 720,000 (loss 180,000)
// total portfolioLoss = 4,400,000 + 180,000 = 4,580,000
const stress = stressTestPortfolio(holdings, nw, { crypto: -40, stock: -20, mutual_fund: -10, gold: -5, bond: -2 })
assert.equal(stress.basePortfolio, 11_900_000)
assert.equal(stress.stressedPortfolio, 7_320_000)
assert.equal(stress.portfolioLoss, 4_580_000)
assert.ok(Math.abs(stress.portfolioDropPct - (4_580_000 / 11_900_000) * 100) < 0.001)
assert.equal(stress.stressedAssets, nw.assets - 4_580_000)
assert.equal(stress.stressedNetWorth, nw.assets - 4_580_000 - nw.debts)

// Empty stress test safety
const emptyStress = stressTestPortfolio([], { assets: 0, debts: 0, net: 0 })
assert.equal(emptyStress.portfolioLoss, 0)
assert.equal(emptyStress.portfolioDropPct, 0)
assert.equal(emptyStress.stressedDarPct, 0)

// Top up allocation:
// port.byClass = [{ assetClass: 'crypto', total: 11,000,000 }, { assetClass: 'stock', total: 900,000 }]
// freshCash = 1,000,000
const topUp = topUpAllocation(port.byClass, port.value, 1_000_000, { stock: 50, crypto: 50, bond: 0, mutual_fund: 0, gold: 0 })
assert.ok(Array.isArray(topUp))
const topUpStock = topUp.find((d) => d.assetClass === 'stock')!
const topUpCrypto = topUp.find((d) => d.assetClass === 'crypto')!
assert.equal(topUpStock.topUpBuy, 1_000_000, '100% of freshCash goes to underweight stock')
assert.equal(topUpCrypto.topUpBuy, 0, '0 freshCash goes to overweight crypto')

// Top up zero cash safety
const zeroTopUp = topUpAllocation(port.byClass, port.value, 0)
assert.ok(zeroTopUp.every((d) => d.topUpBuy === 0))

// --- FINAL POLISH (BAGIAN 5 TESTS) ---
// 1. Uji passiveIncomeMetrics ketika kategori 'Lainnya' tetapi description '[Dividen & Kupon] Dividen interim BBCA'
const descPassiveTxs: Tx[] = [
  ...txs,
  {
    amount: 750_000,
    type: 'income',
    category: 'Lainnya',
    description: '[Dividen & Kupon] Dividen interim BBCA',
    date: '2026-02-20',
  },
]
const descPassive = passiveIncomeMetrics(descPassiveTxs, 2_150_000)
assert.equal(descPassive.totalPassiveIncome, 750_000, 'detected passive income via description tag')
assert.equal(descPassive.latestMonthPassive, 750_000, 'detected latest month passive via description tag')

// 2. Uji stressTestPortfolio skenario safe-haven positif (10g emas @ 1.5jt = 15jt, shock gold: +10%)
const goldHolding: Holding[] = [
  { symbol: 'EMAS', name: 'Logam Mulia', asset_class: 'gold', quantity: 10, avg_buy_price: 1_000_000, current_price: 1_500_000 },
]
const initialWorth = { assets: 20_000_000, debts: 5_000_000, net: 15_000_000 }
const goldStress = stressTestPortfolio(goldHolding, initialWorth, { gold: 10 })
assert.equal(goldStress.basePortfolio, 15_000_000, 'base portfolio is 15M')
assert.ok(Math.abs(goldStress.stressedPortfolio - 16_500_000) < 0.01, 'stressed portfolio increases +10% to 16.5M')
assert.equal(goldStress.portfolioLoss, 0, 'portfolioLoss remains 0 on safe haven net gain')
assert.ok(Math.abs(goldStress.stressedAssets - 21_500_000) < 0.01, 'stressedAssets gains +1.5M via positive portfolioDelta')
assert.ok(Math.abs(goldStress.stressedNetWorth - (21_500_000 - 5_000_000)) < 0.01, 'stressedNetWorth accurately reflects safe haven gain')

// ============================================================================
// SPRINT 3 MASTERPIECE TESTS
// ============================================================================

// 1. calculateDivestmentNet (Indonesian stock: 0.15% fee + 0.10% PPh Final = 0.25%)
const divest = calculateDivestmentNet('stock', 1_000, 10_000, 9_000)
assert.equal(divest.grossProceeds, 10_000_000, 'exact gross proceeds')
assert.equal(divest.costBasis, 9_000_000, 'exact cost basis')
assert.equal(divest.feeAndTax, 25_000, 'exact fee and tax (0.25% of 10M = 25k)')
assert.equal(divest.netProceeds, 9_975_000, 'exact net proceeds (10M - 25k)')
assert.equal(divest.netRealizedPL, 975_000, 'exact net realized P/L (9.975M - 9M)')
assert.ok(Math.abs(divest.netPLPct - (975_000 / 9_000_000) * 100) < 0.001)

// Crypto divestment (0.22% tax/fee)
const cryptoDivest = calculateDivestmentNet('crypto', 1, 100_000_000, 90_000_000)
assert.equal(cryptoDivest.feeAndTax, 220_000, '0.22% crypto fee/tax')
assert.equal(cryptoDivest.netProceeds, 99_780_000)

// 2. benchmarkAndAlphaMetrics with realistic holdings
const bench = benchmarkAndAlphaMetrics(holdings, 6.8, 6.25)
assert.ok(!isNaN(bench.alphaVsIhsgPct), 'alpha is not NaN')
assert.ok(!isNaN(bench.sharpeRatio), 'sharpe ratio is not NaN')
assert.ok(bench.estimatedVolatilityPct > 0, 'volatility is positive')
assert.ok(bench.status === 'OUTPERFORM' || bench.status === 'UNDERPERFORM')

// Empty benchmark safety
const emptyBench = benchmarkAndAlphaMetrics([], 6.8, 6.25)
assert.equal(emptyBench.portfolioReturnPct, 0)
assert.equal(emptyBench.estimatedVolatilityPct, 0)
assert.equal(emptyBench.sharpeRatio, 0, 'sharpe ratio is 0 on empty portfolio without NaN')
assert.equal(emptyBench.status, 'UNDERPERFORM')

// 3. tradingJournalMetrics with 3 sample trades (2 wins, 1 loss)
const sampleTrades: TradeEntry[] = [
  { timestamp: '2026-10-01', symbol: 'BBCA.JK', side: 'BUY', entryPrice: 9000, exitPrice: 10000, quantity: 100, pnl: 100_000 },
  { timestamp: '2026-10-02', symbol: 'BTC', side: 'BUY', entryPrice: 1_000_000_000, exitPrice: 1_050_000_000, quantity: 0.01, pnl: 500_000 },
  { timestamp: '2026-10-03', symbol: 'TLKM.JK', side: 'SELL', entryPrice: 3200, exitPrice: 3000, quantity: 500, pnl: -100_000 },
]
const journal = tradingJournalMetrics(sampleTrades)
assert.equal(journal.totalTrades, 3)
assert.equal(journal.winCount, 2)
assert.equal(journal.lossCount, 1)
assert.ok(Math.abs(journal.winRatePct - (2 / 3) * 100) < 0.001)
assert.equal(journal.grossProfit, 600_000)
assert.equal(journal.grossLoss, 100_000)
assert.equal(journal.netPnL, 500_000)
assert.equal(journal.profitFactor, 6, 'profit factor 600k / 100k = 6')
assert.ok(Math.abs(journal.expectancy - 500_000 / 3) < 0.001)
assert.equal(journal.maxDrawdown, 100_000, 'peak was 600k, dropped to 500k -> dd 100k')

// Empty trading journal safety
const emptyJournal = tradingJournalMetrics([])
assert.equal(emptyJournal.totalTrades, 0)
assert.equal(emptyJournal.winRatePct, 0)
assert.equal(emptyJournal.profitFactor, 0)
assert.equal(emptyJournal.expectancy, 0)
assert.equal(emptyJournal.maxDrawdown, 0)

console.log('scripts/checks/check-aggregate.ts: all quantitative checks passed!')

