// Pure aggregation: turn raw rows into the four dashboard answers.
// No DB, no React — so it is directly testable.

export interface Tx {
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  description?: string
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

export function financialRatios(
  worth: { assets: number; debts: number; net: number },
  liquidCash: number,
  portfolioValue: number,
  buckets: MonthBucket[]
) {
  const burnRate = avgMonthlyExpense(buckets)
  const runwayMonths = burnRate > 0 ? liquidCash / burnRate : null
  const lastBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null
  const savingsRatePct = lastBucket && lastBucket.income > 0 
    ? ((lastBucket.income - lastBucket.expense) / lastBucket.income) * 100 
    : 0
  const debtToAssetPct = worth.assets > 0 ? (worth.debts / worth.assets) * 100 : 0
  const liquidityRatioPct = worth.assets > 0 ? (liquidCash / worth.assets) * 100 : 0
  const investmentAllocationPct = worth.net > 0 ? (portfolioValue / worth.net) * 100 : 0

  return {
    burnRate,
    runwayMonths,
    savingsRatePct,
    debtToAssetPct,
    liquidityRatioPct,
    investmentAllocationPct,
  }
}

export function portfolioRiskMetrics(holdings: Holding[]) {
  let totalValue = 0
  for (const h of holdings) {
    totalValue += h.quantity * h.current_price
  }

  const weights = holdings.map((h) => {
    const v = h.quantity * h.current_price
    const weightPct = totalValue > 0 ? (v / totalValue) * 100 : 0
    return {
      symbol: h.symbol,
      name: h.name,
      asset_class: h.asset_class,
      value: v,
      weightPct,
      concentrated: weightPct > 25,
    }
  }).sort((a, b) => b.weightPct - a.weightPct)

  let hhi = 0
  if (totalValue > 0) {
    for (const w of weights) {
      const share = w.value / totalValue
      hhi += share * share
    }
  }

  let concentrationLevel: 'Low' | 'Moderate' | 'High' = 'Low'
  if (totalValue > 0) {
    if (hhi > 0.30) concentrationLevel = 'High'
    else if (hhi >= 0.18) concentrationLevel = 'Moderate'
    else concentrationLevel = 'Low'
  }

  const topHolding = weights[0] ?? null

  return {
    weights,
    hhi,
    concentrationLevel,
    topHolding,
  }
}

export function rebalanceDrift(
  byClass: { assetClass: string; total: number }[],
  totalValue: number,
  targets: Record<string, number> = { stock: 45, crypto: 20, bond: 15, mutual_fund: 10, gold: 10 }
) {
  const classMap = new Map<string, number>()
  for (const b of byClass) {
    classMap.set(b.assetClass, b.total)
  }

  const allKeys = new Set([...Object.keys(targets), ...classMap.keys()])
  const result = []

  for (const assetClass of allKeys) {
    const actualValue = classMap.get(assetClass) ?? 0
    const actualPct = totalValue > 0 ? (actualValue / totalValue) * 100 : 0
    const targetPct = targets[assetClass] ?? 0
    const driftPct = actualPct - targetPct
    const targetValue = (targetPct / 100) * totalValue
    const actionAmount = targetValue - actualValue

    let status: 'OVERWEIGHT' | 'UNDERWEIGHT' | 'ON_TARGET' = 'ON_TARGET'
    if (driftPct > 5) status = 'OVERWEIGHT'
    else if (driftPct < -5) status = 'UNDERWEIGHT'

    result.push({
      assetClass,
      actualValue,
      actualPct,
      targetPct,
      driftPct,
      targetValue,
      actionAmount,
      status,
    })
  }

  return result.sort((a, b) => b.targetPct - a.targetPct)
}

export type RiskProfileKey = 'conservative' | 'balanced' | 'aggressive'
export const RISK_PRESETS: Record<RiskProfileKey, Record<string, number>> = {
  conservative: { bond: 45, gold: 25, mutual_fund: 15, stock: 10, crypto: 5 },
  balanced: { stock: 45, crypto: 20, bond: 15, mutual_fund: 10, gold: 10 },
  aggressive: { stock: 50, crypto: 35, mutual_fund: 5, bond: 5, gold: 5 },
}

export function passiveIncomeMetrics(txs: Tx[], burnRate: number) {
  const PASSIVE_CATEGORIES = new Set(['Dividen & Kupon', 'Bunga & Yield', 'Passive Income', 'Dividen'])
  let totalPassiveIncome = 0
  const passiveTxs = txs.filter((t) => {
    if (t.type !== 'income') return false
    const cat = t.category || ''
    const desc = t.description || ''
    const isMatch =
      PASSIVE_CATEGORIES.has(cat) ||
      /dividen|kupon|bunga|yield|passive/i.test(cat) ||
      /dividen|kupon|bunga|yield|passive/i.test(desc)
    if (isMatch) {
      totalPassiveIncome += t.amount
    }
    return isMatch
  })

  const buckets = monthlyCashflow(txs)
  if (buckets.length === 0) {
    return {
      totalPassiveIncome,
      latestMonthPassive: 0,
      monthlyAvgPassive: 0,
      coverageRatioPct: 0,
    }
  }

  const lastMonth = buckets[buckets.length - 1].month
  let latestMonthPassive = 0
  for (const t of passiveTxs) {
    if (t.date && t.date.slice(0, 7) === lastMonth) {
      latestMonthPassive += t.amount
    }
  }

  const monthlyAvgPassive = totalPassiveIncome / buckets.length
  const coverageRatioPct = burnRate > 0 ? (latestMonthPassive / burnRate) * 100 : 0

  return {
    totalPassiveIncome,
    latestMonthPassive,
    monthlyAvgPassive,
    coverageRatioPct,
  }
}

export function stressTestPortfolio(
  holdings: Holding[],
  worth: { assets: number; debts: number; net: number },
  shocks: Record<string, number> = { crypto: -40, stock: -20, mutual_fund: -10, gold: -5, bond: -2 }
) {
  let basePortfolio = 0
  let stressedPortfolio = 0

  for (const h of holdings) {
    const currentVal = h.quantity * h.current_price
    basePortfolio += currentVal
    const shockPct = shocks[h.asset_class] ?? -15
    const stressedVal = Math.max(0, currentVal * (1 + shockPct / 100))
    stressedPortfolio += stressedVal
  }

  const portfolioLoss = Math.max(0, basePortfolio - stressedPortfolio)
  const portfolioDropPct = basePortfolio > 0 ? (portfolioLoss / basePortfolio) * 100 : 0
  const portfolioDelta = stressedPortfolio - basePortfolio
  const stressedAssets = Math.max(0, worth.assets + portfolioDelta)
  const stressedNetWorth = stressedAssets - worth.debts
  const stressedDarPct = stressedAssets > 0 ? (worth.debts / stressedAssets) * 100 : 0

  return {
    basePortfolio,
    stressedPortfolio,
    portfolioLoss,
    portfolioDropPct,
    stressedAssets,
    stressedNetWorth,
    stressedDarPct,
  }
}

export function topUpAllocation(
  byClass: { assetClass: string; total: number }[],
  totalValue: number,
  freshCash: number,
  targets: Record<string, number> = RISK_PRESETS.balanced
) {
  const baseDrift = rebalanceDrift(byClass, totalValue, targets)
  if (!(freshCash > 0)) {
    return baseDrift.map((d) => ({ ...d, topUpBuy: 0 }))
  }

  const newTotal = totalValue + freshCash
  let totalDeficit = 0
  const deficits = baseDrift.map((d) => {
    const idealPostValue = (d.targetPct / 100) * newTotal
    const deficit = Math.max(0, idealPostValue - d.actualValue)
    totalDeficit += deficit
    return { assetClass: d.assetClass, deficit, idealPostValue }
  })

  return baseDrift.map((d) => {
    const defObj = deficits.find((x) => x.assetClass === d.assetClass)
    const deficit = defObj ? defObj.deficit : 0
    let topUpBuy = 0
    if (totalDeficit > 0) {
      topUpBuy = Math.round((deficit / totalDeficit) * freshCash)
    } else {
      topUpBuy = Math.round((d.targetPct / 100) * freshCash)
    }
    return { ...d, topUpBuy }
  })
}

// ============================================================================
// SPRINT 3 MASTERPIECE QUANTITATIVE ADDITIONS
// ============================================================================

export function calculateDivestmentNet(
  assetClass: string,
  sellQuantity: number,
  sellPrice: number,
  avgBuyPrice: number
) {
  const grossProceeds = sellQuantity * sellPrice
  const costBasis = sellQuantity * avgBuyPrice
  const grossPL = grossProceeds - costBasis

  let rate = 0
  let feeLabel = 'Bebas Biaya Jual (0%)'

  if (assetClass === 'stock') {
    rate = 0.0025 // 0.15% broker fee + 0.10% PPh Final
    feeLabel = 'Broker Fee 0.15% + PPh Final BEI 0.10% (0.25%)'
  } else if (assetClass === 'crypto') {
    rate = 0.0022 // 0.22% tax & exchange fee
    feeLabel = 'Pajak & Fee Exchange Kripto (0.22%)'
  } else if (assetClass === 'gold') {
    rate = 0.0025 // 0.25% buyback fee / PPh 22
    feeLabel = 'Estimasi PPh 22 / Biaya Buyback (0.25%)'
  }

  const feeAndTax = Math.round(grossProceeds * rate)
  const netProceeds = Math.max(0, Math.round(grossProceeds - feeAndTax))
  const netRealizedPL = Math.round(netProceeds - costBasis)
  const netPLPct = costBasis > 0 ? (netRealizedPL / costBasis) * 100 : 0

  return {
    grossProceeds,
    costBasis,
    grossPL,
    feeAndTax,
    feeRatePct: rate * 100,
    feeLabel,
    netProceeds,
    netRealizedPL,
    netPLPct,
  }
}

export function benchmarkAndAlphaMetrics(
  holdings: Holding[],
  ihsgReturnPct: number = 6.8,
  riskFreeRatePct: number = 6.25
) {
  const summary = portfolioSummary(holdings)
  if (summary.value <= 0 || summary.cost <= 0) {
    return {
      portfolioReturnPct: 0,
      ihsgReturnPct,
      riskFreeRatePct,
      alphaVsIhsgPct: 0,
      excessVsRiskFreePct: 0,
      estimatedVolatilityPct: 0,
      sharpeRatio: 0,
      status: 'UNDERPERFORM' as const,
    }
  }
  const portfolioReturnPct = summary.plPct
  const alphaVsIhsgPct = portfolioReturnPct - ihsgReturnPct
  const excessVsRiskFreePct = portfolioReturnPct - riskFreeRatePct

  const assetVolatilities: Record<string, number> = {
    crypto: 65,
    stock: 22,
    gold: 12,
    mutual_fund: 8,
    bond: 4,
  }

  let estimatedVolatilityPct = 0
  if (summary.value > 0) {
    for (const b of summary.byClass) {
      const weight = b.total / summary.value
      const vol = assetVolatilities[b.assetClass] ?? 15
      estimatedVolatilityPct += weight * vol
    }
  }

  const sharpeRatio =
    estimatedVolatilityPct > 0
      ? (portfolioReturnPct - riskFreeRatePct) / estimatedVolatilityPct
      : 0

  const status = alphaVsIhsgPct >= 0 ? ('OUTPERFORM' as const) : ('UNDERPERFORM' as const)

  return {
    portfolioReturnPct,
    ihsgReturnPct,
    riskFreeRatePct,
    alphaVsIhsgPct,
    excessVsRiskFreePct,
    estimatedVolatilityPct,
    sharpeRatio,
    status,
  }
}

export interface TradeEntry {
  id?: string
  timestamp: string
  symbol: string
  side: 'BUY' | 'SELL' | 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  strategy?: string
}

export function tradingJournalMetrics(trades: TradeEntry[]) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      winRatePct: 0,
      grossProfit: 0,
      grossLoss: 0,
      netPnL: 0,
      profitFactor: 0,
      expectancy: 0,
      maxDrawdown: 0,
    }
  }

  let winCount = 0
  let lossCount = 0
  let grossProfit = 0
  let grossLoss = 0

  for (const t of trades) {
    if (t.pnl > 0) {
      winCount++
      grossProfit += t.pnl
    } else if (t.pnl < 0) {
      lossCount++
      grossLoss += Math.abs(t.pnl)
    }
  }

  const totalTrades = trades.length
  const winRatePct = (winCount / totalTrades) * 100
  const netPnL = grossProfit - grossLoss
  const profitFactor =
    grossLoss > 0
      ? grossProfit / grossLoss
      : grossProfit > 0
        ? 99.9
        : 0
  const expectancy = netPnL / totalTrades

  let peak = 0
  let cumPnL = 0
  let maxDrawdown = 0

  for (const t of trades) {
    cumPnL += t.pnl
    if (cumPnL > peak) {
      peak = cumPnL
    }
    const dd = peak - cumPnL
    if (dd > maxDrawdown) {
      maxDrawdown = dd
    }
  }

  return {
    totalTrades,
    winCount,
    lossCount,
    winRatePct,
    grossProfit,
    grossLoss,
    netPnL,
    profitFactor,
    expectancy,
    maxDrawdown,
  }
}


/**
 * 16. Calculate symmetric acquisition cost (buy price + brokerage fee & tax).
 * Stock buy fee: 0.15% (PPh Final 0.1% only applies on sell).
 * Crypto buy fee: 0.11% (PPN & Exchange fee).
 */
export function calculateAcquisitionCost(
  assetClass: string,
  quantity: number,
  buyPrice: number
) {
  const rawCost = quantity * buyPrice
  let buyFeeRate = 0
  if (assetClass === 'stock') {
    buyFeeRate = 0.0015 // 0.15% Broker Buy Fee
  } else if (assetClass === 'crypto') {
    buyFeeRate = 0.0011 // 0.11% PPN & Exchange Buy Fee
  }
  const buyFee = Math.round(rawCost * buyFeeRate)
  const totalCashOutflow = Math.round(rawCost + buyFee)
  const effectiveAvgPrice = quantity > 0 ? totalCashOutflow / quantity : buyPrice

  return {
    rawCost,
    buyFee,
    buyFeeRatePct: buyFeeRate * 100,
    totalCashOutflow,
    effectiveAvgPrice,
  }
}
