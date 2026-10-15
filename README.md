# Wealth & Portfolio Risk Management Terminal

> Institutional-grade personal wealth terminal — live market data, 16 quantitative finance engines, Indonesian tax & broker-fee modelling, portfolio stress testing, and an interactive Smart Money trading journal.

**Live:** https://finance-dashboard-hasbi.vercel.app

![status](https://img.shields.io/badge/status-production-10b981?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.3.6-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-production-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Quantitative Financial Engine (16 pure functions)

All math lives in `src/lib/finance/aggregate.ts` as dependency-free pure functions with zero-division guards, independently verifiable.

| # | Function | Purpose |
|---|----------|---------|
| 1 | `monthlyCashflow` | Monthly income vs expense aggregation |
| 2 | `expenseByCategory` | Descending expense breakdown per category |
| 3 | `portfolioSummary` | Market value, cost basis, unrealized P/L, per-class split |
| 4 | `netWorth` | Net worth (ignores `investment` accounts to prevent double counting) |
| 5 | `latestDelta` | Current vs previous month expense/income delta (%) |
| 6 | `avgMonthlyExpense` | Baseline monthly burn rate |
| 7 | `financialRatios` | Savings rate, emergency runway, debt-to-asset, liquidity, allocation |
| 8 | `portfolioRiskMetrics` | Concentration + Herfindahl-Hirschman Index (HHI) |
| 9 | `rebalanceDrift` | Drift vs target preset (Konservatif / Seimbang / Agresif) |
| 10 | `passiveIncomeMetrics` | Dividends, coupons, interest + coverage ratio vs burn rate |
| 11 | `stressTestPortfolio` | Market Crash -30%, Crypto Winter -40%, Stagflation, gold hedge |
| 12 | `topUpAllocation` | Fresh-cash allocation to underweight classes only |
| 13 | `calculateDivestmentNet` | Indonesian divestment tax & broker fee engine |
| 14 | `benchmarkAndAlphaMetrics` | vs IHSG YTD, Jensen's Alpha, excess vs SBN risk-free, Sharpe ratio |
| 15 | `tradingJournalMetrics` | Win rate, profit factor, expectancy, max drawdown |
| 16 | `calculateAcquisitionCost` | Symmetric buy-side fee, cash outflow, effective avg buy price |

### Indonesian Tax & Broker Fee Engine

- **Saham (BEI):** broker commission 0.15% + PPh Final Pasal 4(2) 0.10% → **0.25%**
- **Kripto:** PPh + PPN → **0.22%**
- **Emas (buyback):** PPh 22 → **0.25%**
- **SBN / Reksa Dana:** **0%**

Buy-side (`calculateAcquisitionCost`) and sell-side (`calculateDivestmentNet`) are fully symmetric: cash outflow on purchase and net proceeds on sale both include fees, so realized P/L is never overstated.

---

## Live Market Data

| Asset class | Source | Notes |
|-------------|--------|-------|
| IDX equities | Yahoo Finance (`.JK`) | e.g. `BBCA.JK` |
| Crypto | Binance IDR pairs, CoinGecko fallback | `BTC`, `ETH`, `SOL`, `SUI`, … |
| Gold (physical, per gram) | COMEX `GC=F` × `USDIDR=X` ÷ 31.1034768 | auto-priced; aliases `EMAS`, `ANTAM`, `UBS`, `XAU` |
| Retail bonds | Par value Rp 1,000,000/unit | `ORI`, `SR`, `FR`, `PBS` + manual override |
| Mutual funds | Manual `current_price` | no free public NAB API available |

Single endpoint: `GET /api/prices?symbol=...`

---

## Feature Highlights

- **Net worth & liquidity runway** — 4 tiers (Sehat ≥ 6 mo, Moderat 3–6 mo, Kritis < 3 mo)
- **Rebalancing & Market Stress Test Simulator** — crash scenarios with gold safe-haven hedge
- **Benchmark Alpha & Risk-Adjusted Return** — CAPM alpha, Sharpe ratio, OUTPERFORM/UNDERPERFORM badge
- **Interactive Smart Money Trading Journal (CRUD)** — add / edit / delete executions, auto-calculated directional P/L (LONG vs SHORT), 4 quantitative cards, client-side sandbox persistence with a *Reset ke Default* action
- **One-click Export IPS Report (PDF)** — dedicated `@media print` stylesheet with exact color adjustment and proportional canvas
- **Cash auto-deduction** — asset purchases deduct liquid accounts atomically via the `bump_account_balance` RPC, inclusive of buy fees

---

## Tech Stack

Next.js 16.3.6 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 · Supabase (PostgreSQL + RLS + `@supabase/ssr`) · Vercel

---

## Verification

Five mandatory gates, all expected at exit code 0 with zero warnings:

```bash
npx tsc --noEmit
npx tsx scripts/checks/check-aggregate.ts
npx tsx scripts/verify-engine-proof.ts
npm run lint
npm run build
```

`scripts/checks/check-aggregate.ts` is the quantitative unit-test suite.
`scripts/verify-engine-proof.ts` prints the exact mathematical trace (input, formula, output, `[PASS]`) for all 16 engine functions.

---

## Getting Started

```bash
git clone https://github.com/hasbiridwan57-creator/finance-dashboard.git
cd finance-dashboard
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

```bash
npm run dev     # http://127.0.0.1:3000
npm run build && npm start
```

## License

MIT