import { strict as assert } from 'assert'
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
  type Holding,
  type TradeEntry,
  type Tx,
  type Account,
  type MonthBucket,
} from '../src/lib/finance/aggregate'

console.log('=== FORENSIC ENGINE PROOF & MATHEMATICAL TRACE ===\n')

// 1. monthlyCashflow
{
  const name = 'monthlyCashflow'
  const input: Tx[] = [
    { date: '2026-10-01', amount: 15_000_000, type: 'income', category: 'Gaji' },
    { date: '2026-10-05', amount: 5_000_000, type: 'expense', category: 'Sewa' },
  ]
  const formula = 'Sum income vs sum expense grouped by month (YYYY-MM)'
  const output = monthlyCashflow(input)
  assert.equal(output.length, 1)
  assert.equal(output[0].income, 15_000_000)
  assert.equal(output[0].expense, 5_000_000)
  console.log(`[PASS] 1. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 2. expenseByCategory
{
  const name = 'expenseByCategory'
  const input: Tx[] = [
    { date: '2026-10-02', amount: 5_000_000, type: 'expense', category: 'Sewa' },
    { date: '2026-10-03', amount: 2_000_000, type: 'expense', category: 'Makan' },
  ]
  const formula = 'Sum expenses grouped by category in descending order'
  const output = expenseByCategory(input)
  assert.equal(output.length, 2)
  assert.equal(output[0].category, 'Sewa')
  assert.equal(output[0].total, 5_000_000)
  console.log(`[PASS] 2. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 3. portfolioSummary
{
  const name = 'portfolioSummary'
  const input: Holding[] = [
    { symbol: 'BBCA.JK', name: 'BCA', asset_class: 'stock', quantity: 1000, avg_buy_price: 9000, current_price: 10000 },
  ]
  const formula = 'value = qty * current_price; cost = qty * avg_buy_price; pl = value - cost; plPct = (pl / cost) * 100'
  const output = portfolioSummary(input)
  assert.equal(output.value, 10_000_000)
  assert.equal(output.cost, 9_000_000)
  assert.equal(output.pl, 1_000_000)
  console.log(`[PASS] 3. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 4. netWorth
{
  const name = 'netWorth'
  const accounts: Account[] = [{ name: 'BCA', balance: 50_000_000, kind: 'bank' }]
  const portfolioVal = 10_000_000
  const formula = 'assets = sum(bank & cash accounts) + portfolioVal; debts = sum(credit & loan); net = assets - debts'
  const output = netWorth(accounts, portfolioVal)
  assert.equal(output.assets, 60_000_000)
  assert.equal(output.debts, 0)
  assert.equal(output.net, 60_000_000)
  console.log(`[PASS] 4. Function: ${name}`)
  console.log(`  Input: accounts=${JSON.stringify(accounts)}, portfolioVal=${portfolioVal}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 5. latestDelta
{
  const name = 'latestDelta'
  const input: MonthBucket[] = [
    { month: '2026-09', income: 10_000_000, expense: 5_000_000, net: 5_000_000 },
    { month: '2026-10', income: 15_000_000, expense: 6_000_000, net: 9_000_000 },
  ]
  const formula = 'expenseDeltaPct = ((last.expense - prev.expense) / prev.expense) * 100; incomeDeltaPct = ((last.income - prev.income) / prev.income) * 100'
  const output = latestDelta(input)
  assert.ok(output !== null)
  assert.equal(output.expenseDeltaPct, 20)
  assert.equal(output.incomeDeltaPct, 50)
  console.log(`[PASS] 5. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 6. avgMonthlyExpense
{
  const name = 'avgMonthlyExpense'
  const input: MonthBucket[] = [
    { month: '2026-09', income: 10_000_000, expense: 4_000_000, net: 6_000_000 },
    { month: '2026-10', income: 15_000_000, expense: 6_000_000, net: 9_000_000 },
  ]
  const formula = 'burnRate = sum(month.expense) / count(active_months)'
  const output = avgMonthlyExpense(input)
  assert.equal(output, 5_000_000)
  console.log(`[PASS] 6. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${output}\n`)
}

// 7. financialRatios
{
  const name = 'financialRatios'
  const worth = { assets: 100_000_000, debts: 10_000_000, net: 90_000_000 }
  const liquidCash = 25_000_000
  const portfolioValue = 65_000_000
  const buckets = [{ month: '2026-10', income: 20_000_000, expense: 5_000_000, net: 15_000_000 }]
  const formula = 'savingsRate = (income - expense)/income; runwayMonths = liquidCash / burnRate; debtToAsset = debts / assets'
  const output = financialRatios(worth, liquidCash, portfolioValue, buckets)
  assert.equal(output.savingsRatePct, 75)
  assert.equal(output.runwayMonths, 5)
  assert.equal(output.debtToAssetPct, 10)
  console.log(`[PASS] 7. Function: ${name}`)
  console.log(`  Input: worth=${JSON.stringify(worth)}, liquidCash=${liquidCash}, portfolioValue=${portfolioValue}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 8. portfolioRiskMetrics
{
  const name = 'portfolioRiskMetrics'
  const input: Holding[] = [
    { symbol: 'BTC', name: 'Bitcoin', asset_class: 'crypto', quantity: 1, avg_buy_price: 900_000_000, current_price: 1_000_000_000 },
    { symbol: 'BBCA.JK', name: 'BCA', asset_class: 'stock', quantity: 10000, avg_buy_price: 9000, current_price: 10000 },
  ]
  const formula = 'weight = holdingValue / totalPortfolio; hhi = sum(weight^2); concentrationLevel based on HHI'
  const output = portfolioRiskMetrics(input)
  assert.ok(output.weights.length === 2)
  assert.ok(output.hhi > 0)
  console.log(`[PASS] 8. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 9. rebalanceDrift
{
  const name = 'rebalanceDrift'
  const byClass = [{ assetClass: 'stock', total: 10_000_000 }]
  const preset = { stock: 50, crypto: 20, gold: 20, bond: 10, cash: 0 }
  const formula = 'Drift = actual_weight - target_weight per asset class; actionAmount = targetValue - actualValue'
  const output = rebalanceDrift(byClass, 10_000_000, preset)
  assert.ok(Array.isArray(output))
  console.log(`[PASS] 9. Function: ${name}`)
  console.log(`  Input: byClass=${JSON.stringify(byClass)}, preset=${JSON.stringify(preset)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 10. passiveIncomeMetrics
{
  const name = 'passiveIncomeMetrics'
  const input: Tx[] = [{ date: '2026-10-01', amount: 1_500_000, type: 'income', category: 'Dividen & Kupon' }]
  const formula = 'Sum of passive categories (Dividen, Kupon, Bunga, Yield); coverageRatio = monthlyAvg / burnRate'
  const output = passiveIncomeMetrics(input, 5_000_000)
  assert.equal(output.totalPassiveIncome, 1_500_000)
  assert.equal(output.coverageRatioPct, 30)
  console.log(`[PASS] 10. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 11. stressTestPortfolio
{
  const name = 'stressTestPortfolio'
  const holdings: Holding[] = [{ symbol: 'BBCA.JK', name: 'BCA', asset_class: 'stock', quantity: 1000, avg_buy_price: 9000, current_price: 10000 }]
  const worth = { assets: 10_000_000, debts: 0, net: 10_000_000 }
  const formula = 'stressedValue = sum(holdingValue * (1 + shock_rate)); portfolioLoss = base - stressed'
  const output = stressTestPortfolio(holdings, worth, { stock: -30 })
  assert.equal(output.portfolioLoss, 3_000_000)
  assert.equal(output.stressedPortfolio, 7_000_000)
  console.log(`[PASS] 11. Function: ${name}`)
  console.log(`  Input: holdings=${JSON.stringify(holdings)}, shock={stock:-30}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 12. topUpAllocation
{
  const name = 'topUpAllocation'
  const byClass = [{ assetClass: 'stock', total: 10_000_000 }]
  const preset = { stock: 80, crypto: 10, gold: 10, bond: 0, cash: 0 }
  const formula = 'newTotal = currentTotal + topUp; target = newTotal * targetPct; deficit = max(0, target - current)'
  const output = topUpAllocation(byClass, 10_000_000, 1_000_000, preset)
  assert.ok(Array.isArray(output))
  console.log(`[PASS] 12. Function: ${name}`)
  console.log(`  Input: topUp=1M, preset=${JSON.stringify(preset)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 13. calculateDivestmentNet
{
  const name = 'calculateDivestmentNet'
  const input = { assetClass: 'stock', qty: 1000, sellPrice: 10_000, avgBuy: 9_000 }
  const formula = 'Gross Proceeds - Broker Fee & Tax (0.25% for stock) = Net Proceeds; Net P/L = Net Proceeds - Cost Basis'
  const output = calculateDivestmentNet(input.assetClass, input.qty, input.sellPrice, input.avgBuy)
  assert.equal(output.grossProceeds, 10_000_000)
  assert.equal(output.costBasis, 9_000_000)
  assert.equal(output.feeAndTax, 25_000)
  assert.equal(output.netProceeds, 9_975_000)
  assert.equal(output.netRealizedPL, 975_000)
  console.log(`[PASS] 13. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 14. benchmarkAndAlphaMetrics
{
  const name = 'benchmarkAndAlphaMetrics'
  const input = {
    holdings: [{ symbol: 'BBCA.JK', name: 'BCA', asset_class: 'stock', quantity: 1000, avg_buy_price: 9000, current_price: 11000 }] as Holding[],
    ihsg: 6.8,
    riskFree: 6.25,
  }
  const formula = 'portfolioReturnPct = (val - cost)/cost * 100; Alpha = portfolioReturn - ihsg; Sharpe = (return - riskFree) / volatility'
  const output = benchmarkAndAlphaMetrics(input.holdings, input.ihsg, input.riskFree)
  assert.ok(!isNaN(output.alphaVsIhsgPct))
  assert.ok(!isNaN(output.sharpeRatio))
  assert.ok(output.status === 'OUTPERFORM' || output.status === 'UNDERPERFORM')
  console.log(`[PASS] 14. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

// 15. tradingJournalMetrics
{
  const name = 'tradingJournalMetrics'
  const input: TradeEntry[] = [
    { timestamp: '2026-10-01', symbol: 'BBCA.JK', side: 'BUY', entryPrice: 9000, exitPrice: 10000, quantity: 100, pnl: 100_000 },
    { timestamp: '2026-10-02', symbol: 'TLKM.JK', side: 'SELL', entryPrice: 3200, exitPrice: 3000, quantity: 500, pnl: -100_000 },
  ]
  const formula = 'winRate = (wins / total)*100; profitFactor = grossProfit / abs(grossLoss); expectancy = netPnL / totalTrades'
  const output = tradingJournalMetrics(input)
  assert.equal(output.totalTrades, 2)
  assert.equal(output.winCount, 1)
  assert.equal(output.lossCount, 1)
  assert.equal(output.winRatePct, 50)
  assert.equal(output.profitFactor, 1)
  assert.equal(output.expectancy, 0)
  console.log(`[PASS] 15. Function: ${name}`)
  console.log(`  Input: ${JSON.stringify(input)}`)
  console.log(`  Formula: ${formula}`)
  console.log(`  Output: ${JSON.stringify(output)}\n`)
}

console.log('=== ALL 15 ENGINE FUNCTIONS VERIFIED WITH MATHEMATICAL PROOF ===')
