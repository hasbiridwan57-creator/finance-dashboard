# AUDIT REPORT — Wealth & Risk Terminal

Repo: `/Users/hasbi/finance-dashboard`  
Sprint: *Wealth & Portfolio Risk Management Terminal* (Sprint 1 + Sprint 2 + Final Fix) — self-audit  
Generator: `scripts/generate-audit-report.py` (output terminal ditangkap langsung, source dibaca langsung dari disk)

---

## BAGIAN A — Hasil Output Terminal

### A.1 `npx tsc --noEmit`

Exit code: **0**

```text
(tidak ada output — zero error)
```

### A.2 `npx tsx scripts/checks/check-aggregate.ts`

Exit code: **0**

```text
scripts/checks/check-aggregate.ts: all quantitative checks passed!
```

### A.3 `npm run build`

Exit code: **0**

```text

> finance-dashboard@0.1.0 build
> next build

▲ Next.js 16.3.6 (Turbopack)
- Environments: .env.local
✓ Running next.config.ts took 61ms

  Creating an optimized production build ...
✓ Compiled successfully in 660ms
  Running TypeScript ...
  Finished TypeScript in 876ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/7) ...
  Generating static pages using 7 workers (1/7) 
  Generating static pages using 7 workers (3/7) 
  Generating static pages using 7 workers (5/7) 
✓ Generating static pages using 7 workers (7/7) in 119ms
  Finalizing page optimization ...

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/prices
├ ƒ /api/smt
├ ƒ /auth
└ ƒ /auth/callback


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
```

### A.4 `npm run lint` (pelengkap)

Exit code: **0**

```text

> finance-dashboard@0.1.0 lint
> eslint
```

---

## BAGIAN B — Self-Audit Checklist

| # | Item | Status | Bukti |
|---|------|--------|-------|
| 1 | Tidak ada API key / secret tertulis di source code | ✅ PASS | Tidak ada literal key. `.env*` di-gitignore; hanya `process.env.NEXT_PUBLIC_SUPABASE_*` yang dibaca runtime. |
| 2 | `colSpan` pada `EditRow` & `SellRow` sesuai jumlah kolom tabel | ✅ PASS (koreksi) | Tabel kini **9 kolom** (Instrumen, Kelas, Jumlah, Harga Rata, Harga Kini, Nilai Pasar, **Bobot**, U/R, Aksi). `colSpan={9}` di kedua komponen. Catatan: instruksi menyebut "8 kolom", namun setelah kolom **Bobot** ditambahkan jumlah riil adalah 9 — dipakai nilai riil agar tabel tidak pecah. |
| 3 | `avg_buy_price` tidak berubah saat partial sell (Average Cost) | ✅ PASS | `sellHolding()` hanya `.update({ quantity: newQty })` pada cabang partial; `avg_buy_price` tidak disertakan. Cabang full-sell menghapus row. |
| 4 | Semua fungsi kuantitatif aman dari pembagian nol (tanpa NaN/Infinity) | ✅ PASS | Setiap pembagian dijaga guard (`worth.assets > 0`, `totalValue > 0`, `burnRate > 0`, `income > 0`). Diuji dengan input kosong/nol di `check-aggregate.ts`. |
| 5 | Fungsi lama di `aggregate.ts` tidak dihapus | ✅ PASS | `monthlyCashflow`, `expenseByCategory`, `portfolioSummary`, `netWorth`, `latestDelta`, `avgMonthlyExpense` masih utuh. |
| 6 | Fixed bug: assert `portfolioSummary([])` gagal (pre-existing) | ✅ FIXED | Assert lama mengharapkan objek tanpa `costByClass`; fungsi riil mengembalikan `costByClass: []`. Assert diperbarui ke bentuk riil. |
| 7 | Akuntansi Divestasi di `sellHolding` (`actions.ts`) | ✅ PASS (REVISED) | Hasil penjualan (proceeds) masuk ke saldo kas via `bump_account_balance`. Transaksi L/R hanya mencatat Realized Capital Gain (`income`) atau Realized Capital Loss (`expense`) murni pada kategori 'Lainnya', tanpa mencatat return of principal sebagai income. |
| 8 | Logika Tier Liquidity Runway (`page.tsx`) | ✅ PASS (REVISED) | Menangani 4 kondisi: null (Burn rate 0), >=6 bln (Sehat, text-emerald-400), 3-6 bln (Moderat, text-amber-300), <3 bln (Kritis, text-orange-400). |
| 9 | Warna Dinamis Savings Rate (`page.tsx`) | ✅ PASS (REVISED) | >=20% hijau (emerald), >=0% kuning (amber), <0% oranye (defisit). |
| 10 | Rebalancing Drift Status & Standalone Panel (`page.tsx`) | ✅ PASS (REVISED) | Panel rebalancing dikeluarkan dari `<Panel>` Kepemilikan. Kolom drift menggunakan warna status (`OVERWEIGHT` amber, `UNDERWEIGHT` cyan, `ON_TARGET` emerald). |
| 11 | Filter Akun & ESLint Cleanup (`auth-actions.tsx`, `seed-data.ts`) | ✅ PASS (REVISED) | Akun bertipe 'investment' difilter dari dropdown transaksi harian. Variabel tak terpakai dihapus (`supabase`, `totalCost`, `Holding`). `npm run lint` menghasilkan **0 errors, 0 warnings**. |
| 12 | Exact Value Assertions di Unit Test (`check-aggregate.ts`) | ✅ PASS (REVISED) | Pengujian nilai eksak bobot portofolio, HHI, level konsentrasi, target value, dan action amount. |
| 13 | Edge-case pembulatan Realized P/L (`sellHolding`) | ✅ PASS (SPRINT 2) | `const absPL = Math.round(Math.abs(realizedPL)); if (absPL > 0)` — tidak pernah meng-insert transaksi Rp 0 akibat pembulatan desimal < 0.5. Deklarasi `absPL` duplikat dihapus. |
| 14 | 3 Server Actions manajemen kas & utang | ✅ PASS (SPRINT 2) | `updateAccountBalance`, `deleteAccount`, `transferBetweenAccounts` (validasi akun utang, proteksi saldo sumber, penyesuaian beban utang akun tujuan). |
| 15 | Engine kuantitatif baru: passive income, stress test, top-up rebalance | ✅ PASS (SPRINT 2) | `RISK_PRESETS`/`RiskProfileKey`, `passiveIncomeMetrics`, `stressTestPortfolio`, `topUpAllocation`. Semua pure (tanpa DB/React) dan diguard terhadap pembagian nol. |
| 16 | Komponen baru `accounts-panel.tsx` & `rebalance-stress-panel.tsx` | ✅ PASS (SPRINT 2) | `AccountsPanel` (daftar/edit/hapus akun + form transfer & bayar utang) dan `RebalanceStressPanel` (pemilih profil risiko, simulasi top-up, crash simulator 3 preset). |
| 17 | Kategori passive income di form transaksi | ✅ PASS (SPRINT 2) | `Dividen & Kupon` dan `Bunga & Yield` ditambahkan sebagai kategori `income`. |
| 18 | Proteksi saldo menguap saat transfer ke akun `investment` | ✅ PASS (FINAL FIX) | `sourceAccounts` mengecualikan `debt` **dan** `investment`; `targetAccounts` mengecualikan `investment`. `transferBetweenAccounts` menolak mutasi akun `investment` dengan arahan ke menu Tambah/Jual Aset. Ini mencegah Net Worth hilang karena `netWorth()` sudah mengabaikan saldo akun investment. |
| 19 | Kolom `<td>` tabel akun tetap seimbang saat mode edit | ✅ PASS (FINAL FIX) | Kolom Aksi ke-4 selalu dirender ketika `isLoggedIn`; saat `isEditing` kolom Saldo hanya berisi `<input>`, dan tombol Simpan/Batal dirender di kolom Aksi. Sebelumnya sel ke-4 tidak dirender sama sekali sehingga tabel timpang 3 vs 4 kolom. |
| 20 | Pesan error Server Actions tidak membocorkan pesan internal | ✅ PASS (FINAL FIX) | `updateAccountBalance` → `'Gagal memperbarui saldo akun.'`, `deleteAccount` → `'Gagal menghapus akun.'`; tidak ada `error.message` yang diteruskan ke UI. |
| 21 | Exact assertion `topUpAllocation` | ✅ PASS (FINAL FIX) | `topUpStock.topUpBuy === 1_000_000` (100% fresh cash ke saham underweight) dan `topUpCrypto.topUpBuy === 0` (crypto overweight tidak menerima alokasi). Diverifikasi ulang independen: deficit saham 5.550.000 = 100% total deficit. |
| 22 | Auto-Live Gold Pricing (`prices.ts`) | ✅ PASS (POLISH) | Mengambil harga live COMEX Gold Futures (`GC=F`) x USD/IDR, dikonversi ke rupiah per gram (1 oz = 31.1035 gram). Deteksi emas didukung via alias simbol (`EMAS`, `XAUUSD`, dll) serta heuristik nama/simbol. |
| 23 | Perbaikan dobel tanda plus `++` (`charts.tsx`) | ✅ PASS (POLISH) | Menghapus hardcoded `{pl >= 0 ? '+' : ''}` karena helper `formatPct()` sudah otomatis menyertakan tanda plus. |
| 24 | Edit manual `current_price` untuk unlisted/bonds (`actions.ts`, `holdings-table.tsx`) | ✅ PASS (POLISH) | Menambahkan opsi pengisian `current_price` pada fungsi `updateHolding` dan form Edit tabel kepemilikan. Mengatasi kendala obligasi & reksadana yang tidak memiliki feed publik live. |
| 25 | Optimistic UI & responsivitas pemilih periode (`nav.tsx`) | ✅ PASS (POLISH) | Menambahkan `useState` optimistik + `useTransition` + `{ scroll: false }` pada `PeriodToggle` (3, 6, 12 bulan). Menghilangkan kelambatan/macet saat klik dan memperluas area sentuh. |
| 26 | Auto-bootstrap akun default saat transaksi pertama (`actions.ts`, `auth-actions.tsx`) | ✅ PASS (POLISH) | Mencegah error 'Akun tidak ditemukan' pada user pendaftar baru yang tabel akunnya masih kosong di Supabase dengan auto-insert akun default ('BCA') saat simpan transaksi pertama. |
| 27 | Rebranding konsisten 'Wealth & Risk Terminal' (`auth/page.tsx`, `layout.tsx`) | ✅ PASS (POLISH) | Menyeragamkan judul dan identitas aplikasi di halaman login, metadata title, dan sidebar/header. |
| 28 | Penempatan prioritas portofolio nomor 1 & migrasi Vercel (`portfolio-site`) | ✅ PASS (POLISH) | Memindahkan project Wealth & Portfolio Risk Management Terminal ke index 0 (paling atas) di array portofolio dan men-deploy ke Vercel production (`portfolio-site-xi-swart-28.vercel.app`). |
| 29 | Penutupan celah silent-failure kategori passive income (`actions.ts`, `data.ts`, `aggregate.ts`) | ✅ PASS (FINAL POLISH 2) | `addTransaction` menyematkan tag `[Kategori]` ke deskripsi bila kategori tidak ada di tabel `categories`; `data.ts` mengambil kolom `description` dan memulihkan kategori dari regex `/dividen|kupon/i` & `/bunga|yield/i`; `passiveIncomeMetrics` memfilter via kategori MAUPUN deskripsi. |
| 30 | Kalkulasi hedging / safe-haven di `stressTestPortfolio` (`aggregate.ts`) | ✅ PASS (FINAL POLISH 2) | Memakai `portfolioDelta = stressedPortfolio - basePortfolio` sehingga `stressedAssets = Math.max(0, worth.assets + portfolioDelta)`. Kenaikan aset safe-haven (mis. emas +5% di Crypto Winter) kini ikut terhitung, bukan diabaikan. |
| 31 | Integrasi harga emas live ke endpoint `/api/prices` (`route.ts`) | ✅ PASS (FINAL POLISH 2) | Import `fetchGoldPerGram` + `GOLD_SYMBOLS` (12 alias). Fitur "Beli via Nominal (Rp)" kini mengenali simbol emas sebelum jatuh ke jalur saham `.JK` / Binance. |
| 32 | Sinkronisasi state dropdown akun (`auth-actions.tsx`, `accounts-panel.tsx`) | ✅ PASS (FINAL POLISH 2) | `handleSubmit` memvalidasi `validAccount` terhadap `accountNames` terkini; `<select>` memakai nilai ternormalisasi; `handleDelete` mereset `fromAcc`/`toAcc` bila akun yang dipilih terhapus — mencegah state stale. |

### Catatan temuan (jujur)
- **Instruksi menyebut tabel 8 kolom; riil 9 kolom.** Setelah kolom *Bobot* disisipkan, header menjadi 9 `<th>`. `colSpan` diset **9** — mengikuti struktur riil, bukan angka di instruksi. Kalau dipaksa 8, baris Edit/Sell akan menyisakan celah 1 kolom.
- **Peringatan build (bukan error):** Next.js 16 menandai konvensi file `middleware` sebagai *deprecated* dan menyarankan `proxy`. Build tetap sukses; migrasi tidak dilakukan karena di luar scope instruksi.
- **`npm run lint`:** lihat output A.4 untuk status riil.

---

## BAGIAN C — Source Code Lengkap (14 file)

### C.1 `src/lib/finance/aggregate.ts`

_362 baris · 10,949 karakter_

```typescript
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
```

### C.2 `src/lib/finance/data.ts`

_188 baris · 5,855 karakter_

```typescript
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
```

### C.3 `src/lib/finance/prices.ts`

_264 baris · 8,415 karakter_

```typescript
/**
 * Live price fetcher, all denominated in IDR so PL is computed against avg_buy_price.
 *   stock       -> Yahoo Finance (.JK / IDX)
 *   crypto      -> Binance IDR pairs, CoinGecko fallback
 *   gold        -> COMEX GC=F (USD/oz) x USD/IDR, converted to Rp per gram
 *   bond        -> retail par value (Rp 1.000.000/unit); no public feed exists
 *   mutual_fund -> no public NAV API exists in Indonesia; keeps stored NAV
 */

const UA = 'Mozilla/5.0 (finance-dashboard)'

interface YahooMeta {
  regularMarketPrice: number | null
  currency: string | null
}

async function fetchYahoo(symbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!symbols.length) return out
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
            sym,
          )}?interval=1d&range=1d`,
          { headers: { 'User-Agent': UA }, next: { revalidate: 60 } },
        )
        if (!res.ok) return
        const json = await res.json()
        const meta = json?.chart?.result?.[0]?.meta as YahooMeta | undefined
        if (meta?.regularMarketPrice != null) out.set(sym, meta.regularMarketPrice)
      } catch {
        // Network/parse failure → keep the stored price.
      }
    }),
  )
  return out
}

const COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  USDT: 'tether',
  SUI: 'sui',
}

/** Crypto pairs Binance quotes directly against IDR. */
const BINANCE_SUPPORTED = new Set([
  'BTCIDR',
  'ETHIDR',
  'BNBIDR',
  'SOLIDR',
  'ADAIDR',
  'DOGEIDR',
  'AVAXIDR',
  'LINKIDR',
  'MATICIDR',
  'DOTIDR',
  'LTCIDR',
  'TRXIDR',
  'XRPIDR',
  'SUIIDR',
])

/**
 * Fetch crypto IDR prices. Tries CoinGecko first; falls back to Binance
 * (IDR pairs) when CoinGecko is rate-limiting (403).
 */
async function fetchCrypto(symbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()

  // --- Binance: bulk ticker, one request --------------------------------
  const binSyms = symbols.filter((s) => !s.toUpperCase().endsWith('IDR'))
  const pairs = binSyms
    .map((s) => `${s.toUpperCase()}IDR`)
    .filter((p) => BINANCE_SUPPORTED.has(p))
  if (pairs.length) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(
          JSON.stringify(pairs),
        )}`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } },
      )
      if (res.ok) {
        const json = (await res.json()) as { symbol: string; price: string }[]
        for (const t of json) {
          const sym = t.symbol.replace(/IDR$/, '')
          const n = Number(t.price)
          if (n > 0) out.set(sym, n)
        }
        if (out.size === binSyms.length) return out // all resolved
      }
    } catch {
      // fall through to CoinGecko
    }
  }

  // --- CoinGecko: ID map -----------------------------------------------
  const ids = symbols.map((s) => COINGECKO_ID[s.toUpperCase()]).filter(Boolean)
  if (ids.length) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(
          ',',
        )}&vs_currencies=idr`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } },
      )
      if (res.ok) {
        const json = (await res.json()) as Record<string, { idr?: number }>
        for (const sym of symbols) {
          const id = COINGECKO_ID[sym.toUpperCase()]
          // Strict IDR check to avoid USD injection
          if (id && typeof json[id]?.idr === 'number') out.set(sym, json[id].idr!)
        }
      }
    } catch {
      // Keep whatever Binance returned.
    }
  }

  return out
}

// ---------------------------------------------------------------------------
// Gold (physical / Antam / UBS / digital) — auto-derived IDR per gram.
// Source: COMEX gold futures (GC=F, USD/troy-oz) x USD/IDR rate.
// 1 troy ounce = 31.1034768 grams.
// ---------------------------------------------------------------------------
const GOLD_ALIASES = new Set([
  'EMAS',
  'GOLD',
  'ANTAM',
  'UBS',
  'XAU',
  'XAUUSD',
  'XAUIDR',
  'LOGAMMULIA',
  'DIGITALGOLD',
  'GALERI24',
  'LOGAM24',
  'PEGADAIAN',
  'EMASDIGITAL',
])

/**
 * Text heuristic for holdings imported without an explicit `gold` class: the
 * symbol or name mentions gold. Kept deliberately narrow — "GOLD" alone is a
 * real NYSE ticker (Barrick Gold), so the declared class always wins first.
 */
const GOLD_TEXT = /(^|[^A-Z])(emas|gold|antam|logam\s*mulia|logam24|galeri24|xau)([^A-Z]|$)/i
const TROY_OUNCE_IN_GRAMS = 31.1034768

/** Symbols starting with these prefixes are treated as Indonesian retail bonds. */
const BOND_PREFIX = /^(ORI|SR|FR|PBS|SBSN|SUKUK|ST|SBR|OBL)\d*/i

export async function fetchGoldPerGram(): Promise<number | null> {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1d&range=1d', {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      }),
    ])
    if (!goldRes.ok || !fxRes.ok) return null
    const goldJson = await goldRes.json()
    const fxJson = await fxRes.json()
    const usdPerOz = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice
    const usdIdr = fxJson?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof usdPerOz !== 'number' || typeof usdIdr !== 'number') return null
    return Math.round((usdPerOz * usdIdr) / TROY_OUNCE_IN_GRAMS)
  } catch {
    return null
  }
}

export interface PricedHolding {
  id?: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  current_price: number
  /** Fetched live this request; false = stale DB value. */
  live: boolean
}

/**
 * Attach live market prices to holdings. Symbols are mapped by asset class:
 * stocks → Yahoo (`.JK` assumed listed on IDX), crypto → CoinGecko IDR pairs.
 */
export async function applyLivePrices(
  holdings: {
    symbol: string
    name: string
    asset_class: string
    quantity: number
    avg_buy_price: number
    current_price: number
  }[],
): Promise<PricedHolding[]> {
  const stocks = holdings.filter((h) => h.asset_class === 'stock').map((h) => h.symbol)
  const crypto = holdings.filter((h) => h.asset_class === 'crypto').map((h) => h.symbol)

  const [stockPx, cryptoPx] = await Promise.all([
    fetchYahoo(stocks),
    fetchCrypto(crypto),
  ])

  // Gold: one network call shared by every gold holding.
  const needsGold = holdings.some(
    (h) =>
      h.asset_class === 'gold' ||
      GOLD_ALIASES.has(h.symbol.trim().toUpperCase()) ||
      GOLD_TEXT.test(h.symbol) ||
      GOLD_TEXT.test(h.name ?? ''),
  )
  const goldPerGram = needsGold ? await fetchGoldPerGram() : null

  return holdings.map((h) => {
    const sym = h.symbol.toUpperCase()

    // Primary source by declared asset class.
    let livePx: number | undefined
    if (h.asset_class === 'stock') {
      livePx = stockPx.get(h.symbol)
    } else if (h.asset_class === 'crypto') {
      livePx = cryptoPx.get(sym)
    } else if (h.asset_class === 'gold') {
      livePx = goldPerGram ?? undefined
    }

    // Gold aliases act as a FALLBACK only: a symbol like "GOLD" is also a real
    // Yahoo ticker (Barrick Gold Corp), so the declared class wins and the
    // alias only applies when that lookup produced nothing.
    const looksLikeGold =
      GOLD_ALIASES.has(sym) || GOLD_TEXT.test(sym) || GOLD_TEXT.test(h.name ?? '')

    if (livePx == null && (h.asset_class === 'gold' || looksLikeGold)) {
      livePx = goldPerGram ?? undefined
    }

    // Retail bonds are quoted at par: Rp 1.000.000 per unit. No public feed
    // exists for Indonesian retail bonds, so fall back to par only when the
    // stored price is unusable.
    if (livePx == null && (h.asset_class === 'bond' || BOND_PREFIX.test(sym))) {
      livePx = h.current_price > 0 ? undefined : 1_000_000
    }

    return livePx != null
      ? { ...h, current_price: livePx, live: true }
      : { ...h, live: false }
  })
}
```

### C.4 `src/app/api/prices/route.ts`

_77 baris · 3,068 karakter_

```typescript
import { NextResponse } from 'next/server'
import { fetchGoldPerGram } from '@/lib/finance/prices'

const GOLD_SYMBOLS = new Set(['EMAS', 'GOLD', 'ANTM', 'UBS', 'XAU', 'XAUUSD', 'XAUIDR', 'LOGAMMULIA', 'DIGITALGOLD', 'GALERI24', 'LOGAM24', 'PEGADAIAN', 'EMASDIGITAL'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase()
  if (!symbol) return NextResponse.json({ price: null })

  try {
    if (GOLD_SYMBOLS.has(symbol)) {
      const goldPx = await fetchGoldPerGram()
      if (goldPx != null) return NextResponse.json({ price: goldPx })
    }

    // 1. Automatic Gold Price (IDR per gram) from Yahoo Finance GC=F & USDIDR=X
    if (['EMAS', 'GOLD', 'ANTM', 'UBS', 'XAU'].includes(symbol)) {
      const [goldRes, fxRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1d&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
      ])

      const goldJson = await goldRes.json()
      const fxJson = await fxRes.json()

      const goldUsd = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice
      const usdIdr = fxJson?.chart?.result?.[0]?.meta?.regularMarketPrice

      if (goldUsd && usdIdr) {
        // 1 troy oz = 31.1034768 grams
        const pricePerGramIdr = Math.round((goldUsd * usdIdr) / 31.1034768)
        return NextResponse.json({ price: pricePerGramIdr })
      }
    }

    // 2. Government Retail Bonds (ORI, SR, FR, PBS) -> Par value default Rp 1,000,000 or 100%
    if (/^(ORI|SR|FR|PBS)\d+/i.test(symbol) || symbol.startsWith('OBL')) {
      return NextResponse.json({ price: 1000000 })
    }

    if (symbol.endsWith('.JK')) {
      // Yahoo stock (IDX)
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      )
      const json = await res.json()
      const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (price != null) return NextResponse.json({ price })
    } else {
      // Binance crypto — try the IDR pair directly
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}IDR`)
      if (res.ok) {
        const json = await res.json()
        if (json?.price) return NextResponse.json({ price: Number(json.price) })
      }
      // Fallback: CoinGecko
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=idr`,
      )
      if (cgRes.ok) {
        const cgJson = await cgRes.json()
        const id = Object.keys(cgJson)[0]
        if (cgJson[id]?.idr) return NextResponse.json({ price: cgJson[id].idr })
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ price: null })
}
```

### C.5 `src/app/actions.ts`

_695 baris · 21,102 karakter_

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addTransaction(input: {
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  account: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  // Validasi: amount harus positif
  if (!(input.amount > 0)) return { error: 'Nominal harus lebih dari 0.' }

  // Validasi: akun harus ada & milik user (auto-create jika belum ada agar tidak pernah buntu)
  let { data: acc } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', input.account)
    .maybeSingle()

  if (!acc) {
    const { data: created } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: input.account || 'BCA',
        kind: 'bank',
        balance: 0,
      })
      .select('id')
      .maybeSingle()
    acc = created
  }

  if (!acc) return { error: 'Gagal membuat atau menemukan akun.' }

  // Resolve category name → id (categories are a shared lookup table).
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('name', input.category)
    .maybeSingle()

  let finalDescription = input.description || input.category
  if (!cat?.id && input.category && !finalDescription.toLowerCase().includes(input.category.toLowerCase())) {
    finalDescription = '[' + input.category + '] ' + finalDescription
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount: input.amount,
    type: input.type,
    category_id: cat?.id ?? null,
    description: finalDescription,
    date: input.date,
    account: input.account,
    source: 'manual',
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  // Keep the matching account balance in sync: income adds, expense subtracts.
  if (input.amount > 0) {
    const delta = input.type === 'income' ? input.amount : -input.amount
    await supabase.rpc('bump_account_balance', {
      p_uid: user.id,
      p_account: input.account,
      p_delta: delta,
    })
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // defense-in-depth: RLS already enforces this

  if (error) return { error: 'Gagal menghapus.' }

  revalidatePath('/')
  return { error: null }
}

export async function addHolding(input: {
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  sourceAccount?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const symbol = input.symbol.trim().toUpperCase()

  // Validasi: quantity & harga harus positif
  if (!(input.quantity > 0)) return { error: 'Jumlah unit harus lebih dari 0.' }
  if (!(input.avg_buy_price > 0)) return { error: 'Harga beli harus lebih dari 0.' }

  const totalCost = input.quantity * input.avg_buy_price

  // Validasi: akun sumber dana harus ada & milik user
  if (input.sourceAccount) {
    const { data: srcAcc } = await supabase
      .from('accounts')
      .select('id, balance, kind')
      .eq('user_id', user.id)
      .eq('name', input.sourceAccount)
      .maybeSingle()
    if (!srcAcc) return { error: 'Akun sumber dana tidak ditemukan.' }
    if (srcAcc.kind === 'debt') return { error: 'Tidak bisa memotong dari akun utang.' }
    if (Number(srcAcc.balance) < totalCost)
      return { error: `Saldo ${input.sourceAccount} tidak cukup untuk pembelian ini.` }
  }

  // Jika user memilih akun sumber dana, potong saldo akun tersebut secara atomik
  if (input.sourceAccount && totalCost > 0) {
    await supabase.rpc('bump_account_balance', {
      p_uid: user.id,
      p_account: input.sourceAccount,
      p_delta: -totalCost, // Mengurangi kas
    })
  }

  let assetClass = input.asset_class
  let name = input.name
  if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE', 'USDT', 'SUI'].includes(symbol)) {
    assetClass = 'crypto'
    if (symbol === 'ETH') name = 'Ethereum'
    if (symbol === 'BTC') name = 'Bitcoin'
    if (symbol === 'SOL') name = 'Solana'
    if (symbol === 'SUI') name = 'Sui'
  }

  // Merge into an existing position of the same symbol: weighted-average cost.
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, quantity, avg_buy_price, name, asset_class')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .maybeSingle()

  if (existing) {
    const oldQty = Number(existing.quantity)
    const oldAvg = Number(existing.avg_buy_price)
    const newQty = oldQty + input.quantity
    const newAvg =
      newQty > 0 ? (oldQty * oldAvg + input.quantity * input.avg_buy_price) / newQty : input.avg_buy_price

    const { error } = await supabase
      .from('holdings')
      .update({
        quantity: newQty,
        avg_buy_price: newAvg,
        // Refresh the name/class only when the new input carries one.
        name: name || existing.name,
        asset_class: assetClass || existing.asset_class,
      })
      .eq('id', existing.id)

    if (error) return { error: 'Gagal menyimpan. Coba lagi.' }
    revalidatePath('/')
    return { error: null }
  }

  const { error } = await supabase.from('holdings').insert({
    user_id: user.id,
    symbol,
    name: name,
    asset_class: assetClass,
    quantity: input.quantity,
    avg_buy_price: input.avg_buy_price,
    // current_price defaults to avg; the dashboard overwrites it live on render.
    current_price: input.avg_buy_price,
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function updateHolding(input: {
  id: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  current_price?: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  let assetClass = input.asset_class
  let name = input.name
  const sym = input.symbol.trim().toUpperCase()
  if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE', 'USDT', 'SUI'].includes(sym)) {
    assetClass = 'crypto'
    if (sym === 'ETH') name = 'Ethereum'
    if (sym === 'BTC') name = 'Bitcoin'
    if (sym === 'SOL') name = 'Solana'
    if (sym === 'SUI') name = 'Sui'
  }

  const updatePayload: Record<string, unknown> = {
    symbol: sym,
    name,
    asset_class: assetClass,
    quantity: input.quantity,
    avg_buy_price: input.avg_buy_price,
  }

  if (typeof input.current_price === 'number' && Number.isFinite(input.current_price) && input.current_price > 0) {
    updatePayload.current_price = input.current_price
  }

  const { error } = await supabase
    .from('holdings')
    .update(updatePayload)
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function deleteHolding(input: { id: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gagal menghapus. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function sellHolding(input: {
  id: string
  sellQuantity: number
  sellPrice: number
  targetAccount?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  if (!(input.sellQuantity > 0)) return { error: 'Jumlah unit yang dijual harus lebih dari 0.' }
  if (!(input.sellPrice > 0)) return { error: 'Harga jual harus lebih dari 0.' }

  const { data: existing, error: fetchErr } = await supabase
    .from('holdings')
    .select('id, symbol, name, asset_class, quantity, avg_buy_price')
    .eq('id', input.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !existing) return { error: 'Instrumen portofolio tidak ditemukan.' }

  const currentQty = Number(existing.quantity)
  if (input.sellQuantity > currentQty) {
    return { error: 'Jumlah unit yang dijual melebihi kepemilikan.' }
  }

  const proceeds = input.sellQuantity * input.sellPrice
  const costBasisSold = input.sellQuantity * Number(existing.avg_buy_price)
  const realizedPL = proceeds - costBasisSold

  // Update or Delete holding
  if (input.sellQuantity >= currentQty) {
    const { error: delErr } = await supabase
      .from('holdings')
      .delete()
      .eq('id', input.id)
      .eq('user_id', user.id)
    if (delErr) return { error: 'Gagal menghapus posisi instrumen.' }
  } else {
    const newQty = currentQty - input.sellQuantity
    const { error: updErr } = await supabase
      .from('holdings')
      .update({ quantity: newQty })
      .eq('id', input.id)
      .eq('user_id', user.id)
    if (updErr) return { error: 'Gagal memperbarui sisa unit instrumen.' }
  }

  // Handle target account & transaction log
  if (input.targetAccount && input.targetAccount.trim() !== '') {
    const { data: acc } = await supabase
      .from('accounts')
      .select('id, kind')
      .eq('user_id', user.id)
      .eq('name', input.targetAccount)
      .maybeSingle()

    if (acc && acc.kind !== 'debt') {
      await supabase.rpc('bump_account_balance', {
        p_uid: user.id,
        p_account: input.targetAccount,
        p_delta: proceeds,
      })

      // Catat HANYA jika ada Realized Gain / Loss murni (selisih harga jual vs cost basis)
      // Pokok investasi (return of principal) masuk ke saldo kas via RPC di atas,
      // bukan sebagai pemasukan operasional/cashflow agar Savings Rate tidak menggelembung palsu.
      const absPL = Math.round(Math.abs(realizedPL))
      if (absPL > 0) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Lainnya')
          .maybeSingle()

        const isGain = realizedPL > 0
        const formattedProceeds = Math.round(proceeds).toLocaleString('id-ID')
        const descPrefix = isGain ? 'Realized Gain Jual' : 'Realized Loss Jual'

        await supabase.from('transactions').insert({
          user_id: user.id,
          amount: absPL,
          type: isGain ? 'income' : 'expense',
          category_id: cat?.id ?? null,
          description: `${descPrefix} ${input.sellQuantity} ${existing.symbol} (Proceeds: Rp ${formattedProceeds})`,
          date: new Date().toISOString().slice(0, 10),
          account: input.targetAccount,
          source: 'manual',
        })
      }
    }
  }

  revalidatePath('/')
  return { error: null, realizedPL, proceeds }
}

export async function addAccount(input: {
  name: string
  kind: string
  balance: number
  institution?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: input.name.trim(),
    kind: input.kind,
    balance: input.balance,
    institution: input.institution?.trim() || null,
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export interface ImportRow {
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
}

export interface ImportRowError {
  row: number // nomor baris data (1-based, tanpa header)
  message: string
}

const VALID_ASSET_CLASS = new Set([
  'stock',
  'crypto',
  'mutual_fund',
  'bond',
  'gold',
])

/** Simbol yang selalu dipaksa menjadi kelas aset crypto + nama resminya. */
const CRYPTO_SYMBOLS: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  USDT: 'Tether',
  SUI: 'Sui',
}

/**
 * Import massal portofolio dari file CSV/Excel.
 *
 * - Validasi per baris: baris yang rusak TIDAK menggagalkan seluruh import —
 *   dikumpulkan lalu dilaporkan agar pengguna tahu baris mana yang dilewati.
 * - Posisi dengan simbol yang sama sudah ada akan digabung (weighted-average
 *   cost), konsisten dengan addHolding.
 * - TIDAK memotong saldo akun: ini import riwayat kepemilikan, bukan transaksi.
 */
export async function importPortfolio(rows: ImportRow[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.', inserted: 0, merged: 0, skipped: [] as ImportRowError[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'Tidak ada baris untuk diimport.', inserted: 0, merged: 0, skipped: [] }
  }
  if (rows.length > 500) {
    return { error: 'Maksimal 500 baris per import.', inserted: 0, merged: 0, skipped: [] }
  }

  const skipped: ImportRowError[] = []
  const prepared: Required<ImportRow>[] = []

  rows.forEach((raw, i) => {
    const rowNo = i + 1
    const symbol = String(raw?.symbol ?? '').trim().toUpperCase()
    if (!symbol) return skipped.push({ row: rowNo, message: 'Symbol kosong.' })
    if (symbol.length > 32) return skipped.push({ row: rowNo, message: 'Symbol terlalu panjang (maks 32).' })

    const qty = Number(raw?.quantity)
    if (!Number.isFinite(qty) || qty <= 0)
      return skipped.push({ row: rowNo, message: 'Jumlah unit harus angka > 0.' })

    const avg = Number(raw?.avg_buy_price)
    if (!Number.isFinite(avg) || avg <= 0)
      return skipped.push({ row: rowNo, message: 'Harga beli rata-rata harus angka > 0.' })

    let assetClass = String(raw?.asset_class ?? '').trim().toLowerCase()
    if (CRYPTO_SYMBOLS[symbol]) assetClass = 'crypto'
    if (!VALID_ASSET_CLASS.has(assetClass)) assetClass = 'stock'

    const name =
      CRYPTO_SYMBOLS[symbol] ??
      String(raw?.name ?? '').trim() ??
      symbol

    prepared.push({
      symbol,
      name: name || symbol,
      asset_class: assetClass,
      quantity: qty,
      avg_buy_price: avg,
    })
  })

  if (prepared.length === 0) {
    return { error: null, inserted: 0, merged: 0, skipped }
  }

  // Ambil posisi lama user untuk simbol-simbol ini (sekali query, bukan per baris).
  const symbols = prepared.map((p) => p.symbol)
  const { data: existingRows, error: selErr } = await supabase
    .from('holdings')
    .select('id, symbol, quantity, avg_buy_price')
    .eq('user_id', user.id)
    .in('symbol', symbols)

  if (selErr) return { error: 'Gagal membaca portofolio lama.', inserted: 0, merged: 0, skipped }

  const existingMap = new Map(
    (existingRows ?? []).map((r) => [r.symbol, r]),
  )

  // Kelompokkan input per simbol agar baris duplikat dalam 1 file digabung.
  const merged = new Map<string, { qty: number; cost: number; name: string; asset_class: string }>()
  for (const p of prepared) {
    const prev = merged.get(p.symbol)
    if (prev) {
      prev.qty += p.quantity
      prev.cost += p.quantity * p.avg_buy_price
      if (!prev.name) prev.name = p.name
    } else {
      merged.set(p.symbol, {
        qty: p.quantity,
        cost: p.quantity * p.avg_buy_price,
        name: p.name,
        asset_class: p.asset_class,
      })
    }
  }

  const inserts: unknown[] = []
  let mergedCount = 0
  const updates: PromiseLike<{ error: unknown }>[] = []

  for (const [symbol, agg] of merged) {
    const avg = agg.qty > 0 ? agg.cost / agg.qty : 0
    const old = existingMap.get(symbol)

    if (old) {
      // Gabung dengan posisi lama (weighted-average cost), konsisten addHolding.
      const oldQty = Number(old.quantity)
      const oldAvg = Number(old.avg_buy_price)
      const newQty = oldQty + agg.qty
      const newAvg =
        newQty > 0 ? (oldQty * oldAvg + agg.cost) / newQty : avg
      mergedCount++
      updates.push(
        supabase
          .from('holdings')
          .update({ quantity: newQty, avg_buy_price: newAvg })
          .eq('id', old.id)
          .eq('user_id', user.id),
      )
    } else {
      inserts.push({
        user_id: user.id,
        symbol,
        name: agg.name || symbol,
        asset_class: agg.asset_class,
        quantity: agg.qty,
        avg_buy_price: avg,
        // current_price = avg sampai harga live menimpanya saat render.
        current_price: avg,
      })
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from('holdings').insert(inserts)
    if (error) return { error: 'Gagal menyimpan portofolio. Coba lagi.', inserted: 0, merged: 0, skipped }
  }

  const updResults = await Promise.all(updates)
  const updFailed = updResults.filter((r) => r.error)
  if (updFailed.length > 0) {
    return { error: `Gagal memperbarui ${updFailed.length} posisi lama.`, inserted: inserts.length, merged: mergedCount - updFailed.length, skipped }
  }

  revalidatePath('/')
  return { error: null, inserted: inserts.length, merged: mergedCount, skipped }
}

export async function updateAccountBalance(input: { name: string; balance: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  if (!Number.isFinite(input.balance)) {
    return { error: 'Nominal saldo tidak valid.' }
  }

  const { error } = await supabase
    .from('accounts')
    .update({ balance: input.balance })
    .eq('user_id', user.id)
    .eq('name', input.name)

  if (error) return { error: 'Gagal memperbarui saldo akun.' }
  revalidatePath('/')
  return { error: null }
}

export async function deleteAccount(input: { name: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('name', input.name)

  if (error) return { error: 'Gagal menghapus akun.' }
  revalidatePath('/')
  return { error: null }
}

export async function transferBetweenAccounts(input: {
  fromAccount: string
  toAccount: string
  amount: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  if (!(input.amount > 0)) {
    return { error: 'Jumlah transfer harus lebih dari 0.' }
  }
  if (input.fromAccount === input.toAccount) {
    return { error: 'Akun sumber dan akun tujuan tidak boleh sama.' }
  }

  // Fetch both accounts
  const { data: accs, error: fetchErr } = await supabase
    .from('accounts')
    .select('id, name, kind, balance')
    .eq('user_id', user.id)
    .in('name', [input.fromAccount, input.toAccount])

  if (fetchErr || !accs || accs.length < 2) {
    return { error: 'Akun sumber atau akun tujuan tidak ditemukan.' }
  }

  const fromAcc = accs.find((a) => a.name === input.fromAccount)
  const toAcc = accs.find((a) => a.name === input.toAccount)

  if (!fromAcc || !toAcc) {
    return { error: 'Akun sumber atau akun tujuan tidak valid.' }
  }

  if (fromAcc.kind === 'investment' || toAcc.kind === 'investment') {
    return { error: 'Gunakan menu Tambah/Jual Aset untuk mutasi instrumen investasi.' }
  }

  if (fromAcc.kind === 'debt') {
    return { error: 'Akun utang tidak dapat digunakan sebagai akun sumber transfer.' }
  }

  if (Number(fromAcc.balance) < input.amount) {
    return { error: 'Saldo akun sumber tidak mencukupi.' }
  }

  // Deduct from fromAccount
  const { error: bumpFromErr } = await supabase.rpc('bump_account_balance', {
    p_uid: user.id,
    p_account: fromAcc.name,
    p_delta: -input.amount,
  })
  if (bumpFromErr) return { error: 'Gagal mengurangi saldo akun sumber.' }

  // Credit to toAccount
  if (toAcc.kind === 'debt') {
    const currentDebtBal = Number(toAcc.balance)
    const newBalance = currentDebtBal < 0
      ? Math.min(0, currentDebtBal + input.amount)
      : Math.max(0, currentDebtBal - input.amount)

    const { error: updDebtErr } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', toAcc.id)
      .eq('user_id', user.id)

    if (updDebtErr) return { error: 'Gagal memperbarui saldo utang akun tujuan.' }
  } else {
    const { error: bumpToErr } = await supabase.rpc('bump_account_balance', {
      p_uid: user.id,
      p_account: toAcc.name,
      p_delta: input.amount,
    })
    if (bumpToErr) return { error: 'Gagal menambah saldo akun tujuan.' }
  }

  revalidatePath('/')
  return { error: null }
}
```

### C.6 `src/components/holdings-table.tsx`

_469 baris · 18,433 karakter_

```tsx
'use client'

import { useState } from 'react'
import { updateHolding, deleteHolding, sellHolding } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { formatIDR, formatCompact, formatPct } from '@/lib/format'

const ASSET_CLASSES: { value: string; label: string }[] = [
  { value: 'stock', label: 'Saham' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'mutual_fund', label: 'Reksa Dana' },
  { value: 'bond', label: 'Obligasi' },
  { value: 'gold', label: 'Emas' },
]

const LABELS: Record<string, string> = {
  stock: 'Saham',
  crypto: 'Crypto',
  mutual_fund: 'Reksa Dana',
  bond: 'Obligasi',
  gold: 'Emas',
}

const DOT: Record<string, string> = {
  stock: 'bg-emerald-400',
  crypto: 'bg-violet-400',
  mutual_fund: 'bg-blue-400',
  bond: 'bg-yellow-400',
  gold: 'bg-orange-400',
}

const inputCls =
  'w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40'
const selectCls =
  'w-full cursor-pointer rounded-lg border border-white/[.12] bg-[#16181d] px-4 py-3 text-sm text-white shadow-sm outline-none transition-all focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20'
const submitCls =
  'w-full cursor-pointer rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#052e1c] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60'

export interface HoldingRow {
  id?: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  current_price: number
  live?: boolean
}

export function HoldingsTable({
  holdings,
  accounts = [],
}: {
  holdings: HoldingRow[]
  accounts?: { name: string; kind: string }[]
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [selling, setSelling] = useState<string | null>(null)
  const router = useRouter()

  const liveCount = holdings.filter((h) => h.live).length
  const totalPortfolioValue = holdings.reduce(
    (sum, h) => sum + h.quantity * h.current_price,
    0,
  )

  return (
    <div className="overflow-x-auto">
      {liveCount > 0 && (
        <div className="mb-3 flex items-center gap-1.5 text-[10px] text-[#646b78]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {liveCount} dari {holdings.length} instrumen ter-update real-time
        </div>
      )}
      <table className="w-full text-left text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-[#4a515e]">
          <tr>
            <th className="pb-3 pr-4 font-medium">Instrumen</th>
            <th className="pb-3 pr-4 font-medium">Kelas</th>
            <th className="pb-3 pr-4 text-right font-medium">Jumlah</th>
            <th className="pb-3 pr-4 text-right font-medium">Harga Rata</th>
            <th className="pb-3 pr-4 text-right font-medium">Harga Kini</th>
            <th className="pb-3 pr-4 text-right font-medium">Nilai Pasar</th>
            <th className="pb-3 pr-4 text-right font-medium">Bobot</th>
            <th className="pb-3 text-right font-medium">U/R</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[.045]">
          {holdings.map((h) => {
            const pl = (h.current_price - h.avg_buy_price) * h.quantity
            const plPct =
              h.avg_buy_price > 0
                ? ((h.current_price - h.avg_buy_price) / h.avg_buy_price) * 100
                : 0
            const weightPct =
              totalPortfolioValue > 0
                ? ((h.quantity * h.current_price) / totalPortfolioValue) * 100
                : 0

            if (selling === (h.id ?? h.symbol)) {
              return (
                <SellRow
                  key={h.id ?? h.symbol}
                  holding={h}
                  accounts={accounts}
                  onClose={() => setSelling(null)}
                  onDone={() => {
                    setSelling(null)
                    router.refresh()
                  }}
                />
              )
            }

            if (editing === (h.id ?? h.symbol)) {
              return (
                <EditRow
                  key={h.id ?? h.symbol}
                  holding={h}
                  onClose={() => setEditing(null)}
                  onDone={() => {
                    setEditing(null)
                    router.refresh()
                  }}
                />
              )
            }

            return (
              <tr key={h.id ?? h.symbol} className="transition-colors hover:bg-white/[.02]">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[.05] text-[10px] font-bold text-[#c9ced8]">
                      {h.symbol.slice(0, 2)}
                    </span>
                    <div>
                      <span className="font-medium text-white">{h.symbol}</span>
                      <span className="block text-[11px] text-[#646b78]">{h.name}</span>
                      {weightPct > 25 && (
                        <span className="mt-1 inline-block rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                          Concentration &gt;25%
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#9aa0ac]">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[h.asset_class] ?? 'bg-slate-400'}`} />
                    {LABELS[h.asset_class] ?? h.asset_class}
                  </span>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-[#c9ced8]">
                  {h.quantity.toLocaleString('id-ID')}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-[#646b78]">
                  {formatIDR(h.avg_buy_price, { compact: true })}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-[#c9ced8]">
                  {formatIDR(h.current_price, { compact: true })}
                </td>
                <td className="py-3 pr-4 text-right font-medium tabular-nums text-white">
                  {formatIDR(h.quantity * h.current_price, { compact: true })}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-[#c9ced8]">
                  {weightPct.toFixed(1)}%
                </td>
                <td
                  className={`py-3 text-right font-medium tabular-nums ${pl >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}
                >
                  {formatCompact(pl)}
                  <span className="ml-1 text-[10px] opacity-70">({formatPct(plPct)})</span>
                </td>
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-1">
                    {h.id && (
                      <button
                        onClick={() => setSelling(h.id ?? h.symbol)}
                        className="cursor-pointer rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-200"
                      >
                        Jual
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(h.id ?? h.symbol)}
                      className="cursor-pointer rounded-md border border-white/[.08] px-2 py-1 text-[10px] text-[#9aa0ac] transition-colors hover:bg-white/[.06] hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!h.id) return
                        const res = await deleteHolding({ id: h.id })
                        if (res.error) { alert(res.error); return }
                        router.refresh()
                      }}
                      className="cursor-pointer rounded-md border border-white/[.08] px-2 py-1 text-[10px] text-[#9aa0ac] transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function EditRow({
  holding,
  onClose,
  onDone,
}: {
  holding: HoldingRow
  onClose: () => void
  onDone: () => void
}) {
  const [symbol, setSymbol] = useState(holding.symbol)
  const [name, setName] = useState(holding.name)
  const [assetClass, setAssetClass] = useState(holding.asset_class)
  const [quantity, setQuantity] = useState(String(holding.quantity))
  const [avgPrice, setAvgPrice] = useState(String(holding.avg_buy_price))
  const [currentPrice, setCurrentPrice] = useState(String(holding.current_price))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await updateHolding({
      id: holding.id!,
      symbol,
      name,
      asset_class: assetClass,
      quantity: Number(quantity),
      avg_buy_price: Number(avgPrice),
      current_price: Number(currentPrice) || undefined,
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    onDone()
  }

  return (
    <tr className="bg-white/[.02]">
      <td colSpan={9} className="p-4">
        <form onSubmit={submit} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Kode
            </label>
            <input type="text" required value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Nama
            </label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Kelas
            </label>
            <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className={selectCls}>
              {ASSET_CLASSES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#0e1015]">{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Jumlah
            </label>
            <input type="number" required min="0" step="any" value={quantity}
              onChange={(e) => setQuantity(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Harga Beli (Rp)
            </label>
            <input type="number" required min="0" step="any" value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
              Harga Kini (Rp)
            </label>
            <input type="number" min="0" step="any" value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)} className={inputCls}
              placeholder="Kosongkan utk harga pasar otomatis" />
          </div>
          <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? '...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/[.08] px-3.5 py-2.5 text-sm font-medium text-[#9aa0ac] transition-colors hover:bg-white/[.04] hover:text-white"
            >
              Batal
            </button>
          </div>
          {error && (
            <p className="col-span-3 rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
              {error}
            </p>
          )}
        </form>
      </td>
    </tr>
  )
}

function SellRow({
  holding,
  accounts,
  onClose,
  onDone,
}: {
  holding: HoldingRow
  accounts: { name: string; kind: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const [sellQuantity, setSellQuantity] = useState(String(holding.quantity))
  const [sellPrice, setSellPrice] = useState(String(holding.current_price))
  const [targetAccount, setTargetAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cashAccounts = accounts.filter(
    (a) => a.kind !== 'debt' && a.kind !== 'investment',
  )

  const qty = Number(sellQuantity) || 0
  const price = Number(sellPrice) || 0
  const proceeds = qty * price
  const costBasis = qty * holding.avg_buy_price
  const realizedPL = proceeds - costBasis
  const plPct = costBasis > 0 ? (realizedPL / costBasis) * 100 : 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await sellHolding({
      id: holding.id!,
      sellQuantity: qty,
      sellPrice: price,
      targetAccount: targetAccount || undefined,
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    onDone()
  }

  return (
    <tr className="bg-emerald-500/[.03]">
      <td colSpan={9} className="p-4">
        <form onSubmit={submit} className="space-y-3">
          <p className="text-[12px] font-semibold text-white">
            Jual Sebagian / Seluruh {holding.symbol}
            <span className="ml-2 font-normal text-[#646b78]">
              Kepemilikan: {holding.quantity.toLocaleString('id-ID')} unit · Harga rata-rata{' '}
              {formatIDR(holding.avg_buy_price, { compact: true })}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Jumlah Unit Dijual
              </label>
              <input
                type="number"
                required
                min="0"
                max={holding.quantity}
                step="any"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Harga Jual per Unit (Rp)
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Akun Kas Tujuan
              </label>
              <select
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                className={selectCls}
              >
                <option value="" className="bg-[#0e1015]">
                  Jangan masukkan ke saldo akun kas
                </option>
                {cashAccounts.map((a) => (
                  <option key={a.name} value={a.name} className="bg-[#0e1015]">
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time preview */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border border-white/[.06] bg-white/[.02] px-3.5 py-3 text-[12px]">
            <span className="text-[#9aa0ac]">
              Estimasi Dana Masuk:{' '}
              <span className="font-medium tabular-nums text-white">
                {formatIDR(proceeds, { compact: true })}
              </span>
            </span>
            <span className="text-[#9aa0ac]">
              Estimasi Realized P/L:{' '}
              <span
                className={`font-medium tabular-nums ${
                  realizedPL >= 0 ? 'text-emerald-400' : 'text-orange-400'
                }`}
              >
                {formatIDR(realizedPL, { compact: true })} ({formatPct(plPct)})
              </span>
            </span>
          </div>

          <div className="flex items-end gap-2">
            <button type="submit" disabled={loading} className={`${submitCls} sm:w-auto sm:px-6`}>
              {loading ? '...' : 'Konfirmasi Jual'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/[.08] px-3.5 py-3 text-sm font-medium text-[#9aa0ac] transition-colors hover:bg-white/[.04] hover:text-white"
            >
              Batal
            </button>
          </div>
          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
              {error}
            </p>
          )}
        </form>
      </td>
    </tr>
  )
}
```

### C.7 `src/components/auth-actions.tsx`

_991 baris · 39,511 karakter_

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addTransaction, addAccount, addHolding, importPortfolio, type ImportRow, type ImportRowError } from '@/app/actions'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { name: 'Gaji', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Dividen & Kupon', type: 'income' },
  { name: 'Bunga & Yield', type: 'income' },
  { name: 'Makan & Minum', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Kuliah', type: 'expense' },
  { name: 'Belanja', type: 'expense' },
  { name: 'Hiburan', type: 'expense' },
  { name: 'Kesehatan', type: 'expense' },
  { name: 'Tagihan', type: 'expense' },
  { name: 'Lainnya', type: 'expense' },
] as const

export function AddTransactionButton({
  accounts = [],
}: {
  accounts?: { name: string; kind: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const operationalAccounts = accounts.filter((a) => a.kind !== 'investment')
  const accountNames =
    operationalAccounts.length > 0
      ? operationalAccounts.map((a) => a.name)
      : accounts.length === 0
        ? ['BCA'] // akun default yang otomatis dibuat server saat transaksi pertama
        : []

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Makan & Minum')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [account, setAccount] = useState(() => accountNames[0] || 'BCA')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const validAccount = accountNames.includes(account) ? account : (accountNames[0] || 'BCA')
    const res = await addTransaction({
      amount: Number(amount),
      type,
      category,
      description: description || category,
      date,
      account: validAccount,
    })

    setLoading(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setOpen(false)
    setAmount('')
    setDescription('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-[#052e1c] transition-all hover:bg-emerald-400"
      >
        + Transaksi
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[.07] bg-[#0e1015] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Transaksi Baru</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="cursor-pointer text-[#646b78] transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Type toggle */}
              <div className="flex gap-1 rounded-lg border border-white/[.08] bg-white/[.02] p-1">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t)
                      setCategory(t === 'income' ? 'Gaji' : 'Makan & Minum')
                    }}
                    className={`flex-1 cursor-pointer rounded-md py-1.5 text-[12px] font-medium transition-colors ${
                      type === t
                        ? t === 'income'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/[.08] text-white'
                        : 'text-[#9aa0ac] hover:text-white'
                    }`}
                  >
                    {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                  Jumlah (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-white/[.08] bg-[#0e1015] px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
                >
                  {CATEGORIES.filter((c) => c.type === type).map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#0e1015]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={category}
                  className="w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40"
                />
              </div>

              {/* Date + account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Akun
                  </label>
                  <select
                    value={accountNames.includes(account) ? account : (accountNames[0] || 'BCA')}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-white/[.08] bg-[#0e1015] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
                  >
                    {accountNames.map((a) => (
                      <option key={a} value={a} className="bg-[#0e1015]">
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer rounded-lg bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-[#052e1c] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Menyimpan…' : 'Simpan'}
              </button>
            </form>
 </div>
        </div>
      )}
    </>
  )
}

export function AddAssetButton({ accounts = [] }: { accounts?: { name: string; kind: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'cash' | 'invest'>('cash')

  // --- Saldo form ---
  const [accName, setAccName] = useState('')
  const [accKind, setAccKind] = useState('bank')
  const [accBalance, setAccBalance] = useState('')
  const [accInstitution, setAccInstitution] = useState('')

  // --- Investasi form ---
  const [inputMode, setInputMode] = useState<'manual' | 'nominal'>('manual')
  const [totalNominal, setTotalNominal] = useState('')
  const [assetClass, setAssetClass] = useState('stock')
  const [symbol, setSymbol] = useState('')
  const [hName, setHName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [sourceAccount, setSourceAccount] = useState('')

  // Efek auto-hitung saat nominal/symbol berubah
  async function calculateQuantity(sym: string, nominal: string) {
    if (!sym || !nominal) return
    setLoading(true)
    // Fetch harga live
    const res = await fetch(`/api/prices?symbol=${encodeURIComponent(sym)}`)
    const data = await res.json()
    if (data.price) {
      const q = Number(nominal) / data.price
      setQuantity(q.toFixed(8))
      setAvgPrice(data.price.toString())
    }
    setLoading(false)
  }

  const KINDS = [
    { value: 'bank', label: 'Bank' },
    { value: 'ewallet', label: 'E-Wallet' },
    { value: 'cash', label: 'Tunai' },
    { value: 'investment', label: 'Investasi' },
    { value: 'debt', label: 'Utang' },
  ]

  const ASSET_CLASSES = [
    { value: 'stock', label: 'Saham', hint: 'Pakai suffix .JK untuk bursa Indonesia (BBCA.JK, ANTM.JK).' },
    { value: 'crypto', label: 'Crypto', hint: 'Ticker tanpa pair (BTC, ETH, SOL). Harga IDR otomatis dari CoinGecko.' },
    { value: 'mutual_fund', label: 'Reksa Dana', hint: 'Nama reksa dana, contoh: PINTU.' },
    { value: 'bond', label: 'Obligasi', hint: 'Contoh: ORI, SR.' },
    { value: 'gold', label: 'Emas', hint: 'Antam / Pegadaian.' },
  ]

  const cls = ASSET_CLASSES.find((c) => c.value === assetClass)!

  function resetCash() {
    setAccName(''); setAccBalance(''); setAccInstitution(''); setAccKind('bank')
  }
  function resetInvest() {
    setInputMode('manual')
    setTotalNominal('')
    setSymbol(''); setHName(''); setQuantity(''); setAvgPrice(''); setAssetClass('stock'); setSourceAccount('')
  }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await addAccount({
      name: accName,
      kind: accKind,
      balance: Number(accBalance),
      institution: accInstitution,
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setOpen(false); resetCash(); router.refresh()
  }

  async function handleInvestSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Calculate/get correct symbol, qty, price
    const finalSym = symbol.trim().toUpperCase()
    const finalQty = inputMode === 'nominal' ? Number(quantity) : Number(quantity)
    const finalPrice = inputMode === 'nominal' ? Number(avgPrice) : Number(avgPrice)

    // If sourceAccount is set, the RPC call in addHolding handles the deduction
    const res = await addHolding({
      symbol: finalSym,
      name: hName || finalSym,
      asset_class: assetClass,
      quantity: finalQty,
      avg_buy_price: finalPrice,
      sourceAccount: sourceAccount || undefined,
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setOpen(false); resetInvest(); router.refresh()
  }

  const inputCls =
    'w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5a616e] outline-none transition-colors focus:border-emerald-500/40'
  const selectCls =
    'w-full cursor-pointer rounded-lg border border-white/[.08] bg-[#0e1015] px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40'
  const submitCls =
    'w-full cursor-pointer rounded-lg bg-emerald-500 px-3.5 py-2.5 text-sm font-semibold text-[#052e1c] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-1.5 text-xs font-semibold text-[#c9ced8] transition-all hover:border-white/[.15] hover:bg-white/[.06] hover:text-white"
      >
        + Aset
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[.07] bg-[#0e1015] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Tambah Aset</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="cursor-pointer text-[#646b78] transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-1 rounded-lg border border-white/[.08] bg-white/[.02] p-1">
              {([['cash', 'Saldo / Akun'], ['invest', 'Investasi']] as const).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => { setTab(k); setError(null) }}
                  className={`flex-1 cursor-pointer rounded-md py-1.5 text-[12px] font-medium transition-colors ${
                    tab === k ? 'bg-white/[.08] text-white' : 'text-[#9aa0ac] hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'cash' ? (
              <form onSubmit={handleCashSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Nama Akun
                  </label>
                  <input type="text" required autoFocus value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="BCA / GoPay / Dompet" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Jenis
                  </label>
                  <select value={accKind} onChange={(e) => setAccKind(e.target.value)} className={selectCls}>
                    {KINDS.map((k) => (
                      <option key={k.value} value={k.value} className="bg-[#0e1015]">{k.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Saldo (Rp)
                  </label>
                  <input type="number" required value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    placeholder="1000000" className={inputCls} />
                  <p className="mt-1.5 text-[11px] text-[#4a515e]">Utang bisa minus.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Institusi <span className="text-[#4a515e]">(opsional)</span>
                  </label>
                  <input type="text" value={accInstitution}
                    onChange={(e) => setAccInstitution(e.target.value)}
                    placeholder="Bank BCA / Gojek" className={inputCls} />
                </div>
                {error && (
                  <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className={submitCls}>
                  {loading ? 'Menyimpan…' : 'Simpan'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleInvestSubmit} className="space-y-3.5">
                <div className="flex gap-1 rounded-lg border border-white/[.08] bg-white/[.02] p-1">
                  {(['manual', 'nominal'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInputMode(m)}
                      className={`flex-1 cursor-pointer rounded-md py-1.5 text-[10px] font-medium transition-colors ${
                        inputMode === m ? 'bg-white/[.08] text-white' : 'text-[#9aa0ac] hover:text-white'
                      }`}
                    >
                      {m === 'manual' ? 'Mode Manual' : 'Beli via Nominal (Rp)'}
                    </button>
                  ))}
                </div>

                {inputMode === 'nominal' && (
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                      Total Nominal Pembelian (Rp)
                    </label>
                    <input type="number" required min="0" value={totalNominal}
                      onChange={(e) => {
                        setTotalNominal(e.target.value)
                        calculateQuantity(symbol, e.target.value)
                      }}
                      placeholder="Contoh: 100000" className={inputCls} />
                  </div>
                )}
                <div className="flex gap-1 rounded-lg border border-white/[.08] bg-white/[.02] p-1">
                  {ASSET_CLASSES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAssetClass(c.value)}
                      className={`flex-1 cursor-pointer rounded-md py-1.5 text-[10px] font-medium transition-colors ${
                        assetClass === c.value ? 'bg-white/[.08] text-white' : 'text-[#9aa0ac] hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Kode / Simbol
                  </label>
                  <input type="text" required autoFocus value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder={assetClass === 'stock' ? 'BBCA.JK' : assetClass === 'crypto' ? 'BTC' : 'ORI'}
                    className={inputCls} />
                  <p className="mt-1.5 text-[11px] text-[#4a515e]">{cls.hint}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                    Nama <span className="text-[#4a515e]">(opsional)</span>
                  </label>
                  <input type="text" value={hName}
                    onChange={(e) => setHName(e.target.value)}
                    placeholder="Bank Central Asia" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                      Jumlah
                    </label>
                    <input type="number" required min="0" step="any" value={quantity}
                      disabled={inputMode === 'nominal'}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="100" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                      Harga Beli (Rp)
                    </label>
                    <input type="number" required min="0" step="any" value={avgPrice}
                      disabled={inputMode === 'nominal'}
                      onChange={(e) => setAvgPrice(e.target.value)}
                      placeholder="8150" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                      Sumber Dana (Potong Saldo Kas) — Opsional
                    </label>
                    <select value={sourceAccount} onChange={(e) => setSourceAccount(e.target.value)} className={selectCls}>
                      <option value="" className="bg-[#0e1015]">Jangan potong kas (hanya catat aset)</option>
                      {accounts.filter(a => a.kind !== 'debt' && a.kind !== 'investment').map((acc) => (
                        <option key={acc.name} value={acc.name} className="bg-[#0e1015]">
                          Potong dari {acc.name} ({acc.kind})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && (
                  <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={loading} className={submitCls}>
                  {loading ? 'Menyimpan…' : 'Simpan'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full cursor-pointer rounded-lg border border-white/[.06] px-3 py-2 text-left text-[12px] text-[#9aa0ac] transition-colors hover:bg-white/[.03] hover:text-white"
    >
      Keluar
    </button>
  )
}

/* ============================================================
 * Import Portofolio (CSV / paste langsung)
 * ============================================================ */

/** Parser CSV/TSV sederhana: menghargai kutip dan baris baru di dalam kutip. */
function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
    } else if (c === delimiter) {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c === '\r') {
      // abaikan; \n menangani pemisah baris
    } else {
      field += c
    }
  }
  row.push(field)
  rows.push(row)
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Normalisasi angka gaya Indonesia: "1.234.567,89" -> 1234567.89 */
function parseNumber(raw: string): number {
  const s = raw.trim()
  if (!s) return NaN
  // Jika ada koma desimal (mis. 9.500,25) -> hilangkan titik pemisah ribuan.
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    return Number(s.replace(/\./g, '').replace(',', '.'))
  }
  if (/^-?\d+,\d+$/.test(s)) return Number(s.replace(',', '.'))
  return Number(s)
}

const HEADER_ALIASES: Record<string, keyof ImportRow> = {
  symbol: 'symbol',
  ticker: 'symbol',
  kode: 'symbol',
  simbol: 'symbol',
  name: 'name',
  nama: 'name',
  nama_instrumen: 'name',
  asset_class: 'asset_class',
  kelas: 'asset_class',
  jenis: 'asset_class',
  kelas_aset: 'asset_class',
  quantity: 'quantity',
  jumlah: 'quantity',
  qty: 'quantity',
  unit: 'quantity',
  lot: 'quantity',
  avg_buy_price: 'avg_buy_price',
  avg: 'avg_buy_price',
  harga: 'avg_buy_price',
  harga_beli: 'avg_buy_price',
  harga_beli_rata: 'avg_buy_price',
  harga_rata: 'avg_buy_price',
  avg_price: 'avg_buy_price',
}

interface PreviewRow {
  line: number
  raw: string[]
  data: ImportRow | null
  issue: string | null
}

function buildPreview(text: string): { rows: PreviewRow[]; headerIssue: string | null } {
  const trimmed = text.trim()
  if (!trimmed) return { rows: [], headerIssue: 'Belum ada data.' }

  const firstLine = trimmed.split(/\r?\n/, 1)[0]
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  const grid = parseDelimited(trimmed, delimiter)
  if (grid.length === 0) return { rows: [], headerIssue: 'Data kosong.' }

  const header = grid[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const idx = header.map((h) => HEADER_ALIASES[h] ?? null)

  if (!idx.includes('symbol') || !idx.includes('quantity') || !idx.includes('avg_buy_price')) {
    return {
      rows: [],
      headerIssue:
        'Header tidak dikenali. Wajib ada kolom: symbol, quantity, avg_buy_price. (Opsional: name, asset_class)',
    }
  }

  const rows: PreviewRow[] = grid.slice(1).map((cells, i) => {
    const data: ImportRow = {
      symbol: '',
      name: '',
      asset_class: '',
      quantity: NaN,
      avg_buy_price: NaN,
    }
    cells.forEach((cell, c) => {
      const key = idx[c]
      if (!key) return
      if (key === 'quantity' || key === 'avg_buy_price') {
        data[key] = parseNumber(cell)
      } else {
        data[key] = cell.trim()
      }
    })

    let issue: string | null = null
    if (!data.symbol) issue = 'symbol kosong'
    else if (!Number.isFinite(data.quantity) || data.quantity <= 0) issue = 'quantity harus angka > 0'
    else if (!Number.isFinite(data.avg_buy_price) || data.avg_buy_price <= 0)
      issue = 'avg_buy_price harus angka > 0'

    return { line: i + 1, raw: cells, data: issue ? null : data, issue }
  })

  return { rows, headerIssue: null }
}

const inputCls =
  'w-full rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2 text-[13px] text-white placeholder:text-[#4a515e] outline-none transition-colors focus:border-cyan-500/50'

export function ImportPortfolioButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    inserted: number
    merged: number
    skipped: ImportRowError[]
  } | null>(null)

  const { rows, headerIssue } = buildPreview(text)
  const valid = rows.filter((r) => r.data)
  const invalid = rows.filter((r) => !r.data)

  function reset() {
    setText('')
    setFileName(null)
    setError(null)
    setResult(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('File terlalu besar (maks 2 MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setText(String(reader.result ?? ''))
      setFileName(file.name)
      setError(null)
      setResult(null)
    }
    reader.onerror = () => setError('Gagal membaca file.')
    reader.readAsText(file)
  }

  async function handleSubmit() {
    if (valid.length === 0) {
      setError('Tidak ada baris valid untuk diimpor.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await importPortfolio(valid.map((r) => r.data!))
      if (res.error) {
        setError(res.error)
      } else {
        setResult({ inserted: res.inserted, merged: res.merged, skipped: res.skipped })
        if (res.inserted > 0 || res.merged > 0) router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan tak terduga. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const cls =
    'cursor-pointer rounded-lg border border-white/[.08] bg-white/[.03] px-3.5 py-1.5 text-xs font-semibold text-[#c9ced8] transition-all hover:border-white/[.15] hover:bg-white/[.06] hover:text-white'

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/[.07] bg-[#0e1015] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white">Import Portofolio</h2>
                <p className="mt-1 text-[12px] text-[#9aa0ac]">
                  Upload file <b className="text-white">.csv</b> atau tempel tabel dari Excel/Google
                  Sheets. Sistem mendeteksi simbol, jumlah, dan harga beli rata-rata, lalu menghitung
                  gain/loss terhadap harga real-time.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup"
                className="cursor-pointer text-[#646b78] transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Contoh format */}
            <div className="mb-4 rounded-lg border border-white/[.06] bg-white/[.02] p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Format wajib
              </p>
              <pre className="overflow-x-auto rounded-md bg-black/40 p-2.5 text-[11px] leading-relaxed text-[#7ee0a3]">
{`symbol,name,asset_class,quantity,avg_buy_price
BBCA,Bank BCA,stock,1000,9500
BTC,Bitcoin,crypto,0.05,950000000
ANTM,Aneka Tambang,gold,100,15000`}
              </pre>
              <p className="mt-2 text-[11px] text-[#4a515e]">
                Kolom <code className="text-[#9aa0ac]">name</code> dan{' '}
                <code className="text-[#9aa0ac]">asset_class</code> opsional. Kelas aset yang
                dikenali: stock, crypto, mutual_fund, bond, gold.
              </p>
            </div>

            {/* Upload file */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Upload file CSV
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className={inputCls + ' file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-white/[.08] file:px-3 file:py-1 file:text-[11px] file:text-white'}
              />
              {fileName && (
                <p className="mt-1.5 text-[11px] text-cyan-400">File terbaca: {fileName}</p>
              )}
            </div>

            {/* Atau paste */}
            <div className="mb-3">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
                Atau tempel data (CSV / TSV)
              </label>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  setFileName(null)
                  setResult(null)
                  setError(null)
                }}
                rows={6}
                placeholder={'symbol,name,asset_class,quantity,avg_buy_price\nBBCA,Bank BCA,stock,1000,9500'}
                className={inputCls + ' font-mono text-[12px]'}
              />
            </div>

            {/* Preview */}
            {headerIssue && (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[.07] px-3 py-2 text-[12px] text-amber-300"
              >
                {headerIssue}
              </p>
            )}

            {!headerIssue && rows.length > 0 && (
              <div className="mb-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                    {valid.length} valid
                  </span>
                  {invalid.length > 0 && (
                    <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-300">
                      {invalid.length} bermasalah
                    </span>
                  )}
                </div>
                <div className="max-h-52 overflow-auto rounded-lg border border-white/[.06]">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-[#14171d] text-[#9aa0ac]">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Symbol</th>
                        <th className="px-3 py-2">Nama</th>
                        <th className="px-3 py-2">Kelas</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Avg (Rp)</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[.04]">
                      {rows.slice(0, 100).map((r) => (
                        <tr key={r.line} className={r.data ? '' : 'bg-red-500/[.05]'}>
                          <td className="px-3 py-1.5 text-[#4a515e]">{r.line}</td>
                          <td className="px-3 py-1.5 font-mono text-white">
                            {r.raw[0] ?? '—'}
                          </td>
                          <td className="px-3 py-1.5 text-[#9aa0ac]">{r.data?.name || '—'}</td>
                          <td className="px-3 py-1.5 text-[#9aa0ac]">
                            {r.data?.asset_class || '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-white">
                            {r.data ? r.data.quantity : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-white">
                            {r.data ? r.data.avg_buy_price : '—'}
                          </td>
                          <td
                            className={`px-3 py-1.5 ${r.data ? 'text-emerald-400' : 'text-red-400'}`}
                          >
                            {r.data ? 'OK' : r.issue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 100 && (
                    <p className="px-3 py-2 text-[11px] text-[#4a515e]">
                      Menampilkan 100 dari {rows.length} baris.
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-red-500/20 bg-red-500/[.07] px-3 py-2 text-[12px] text-red-400"
              >
                {error}
              </p>
            )}

            {result && (
              <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[.07] px-3 py-2.5 text-[12px] text-emerald-300">
                <p className="font-semibold">
                  Import selesai — {result.inserted} instrumen baru, {result.merged} digabung dengan
                  posisi lama.
                </p>
                {result.skipped.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-amber-300">
                    {result.skipped.map((s) => (
                      <li key={s.row}>
                        Baris {s.row}: {s.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer text-[12px] text-[#646b78] transition-colors hover:text-white"
              >
                Bersihkan
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-lg border border-white/[.08] px-3.5 py-2 text-[12px] text-[#9aa0ac] transition-colors hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || valid.length === 0}
                  className="cursor-pointer rounded-lg bg-cyan-500 px-4 py-2 text-[12px] font-semibold text-black transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Mengimpor…' : `Impor ${valid.length} baris`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

### C.8 `src/components/accounts-panel.tsx`

_250 baris · 9,770 karakter_

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAccountBalance, deleteAccount, transferBetweenAccounts } from '@/app/actions'
import { formatIDR } from '@/lib/format'

export function AccountsPanel({
  accounts,
  isLoggedIn,
}: {
  accounts: { name: string; kind: string; balance: number; institution?: string | null }[]
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [editingName, setEditingName] = useState<string | null>(null)
  const [editBalance, setEditBalance] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Transfer form state
  const [fromAcc, setFromAcc] = useState('')
  const [toAcc, setToAcc] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  // 1a & 1b: Filter source and target accounts properly
  const sourceAccounts = accounts.filter((a) => a.kind !== 'debt' && a.kind !== 'investment')
  const targetAccounts = accounts.filter((a) => a.kind !== 'investment')

  async function handleUpdate(name: string) {
    const val = Number(editBalance)
    if (!Number.isFinite(val)) {
      setError('Nominal tidak valid.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await updateAccountBalance({ name, balance: val })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setEditingName(null)
      router.refresh()
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Hapus akun ${name}?`)) return
    setLoading(true)
    setError(null)
    const res = await deleteAccount({ name })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      if (fromAcc === name) setFromAcc('')
      if (toAcc === name) setToAcc('')
      router.refresh()
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(transferAmount)
    if (!amt || amt <= 0) {
      setError('Jumlah transfer harus lebih dari 0.')
      return
    }
    if (!fromAcc || !toAcc) {
      setError('Pilih akun sumber dan akun tujuan.')
      return
    }
    setLoading(true)
    setError(null)
    const res = await transferBetweenAccounts({
      fromAccount: fromAcc,
      toAccount: toAcc,
      amount: amt,
    })
    setLoading(false)
    if (res.error) {
      setError(res.error)
    } else {
      setTransferAmount('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-[#4a515e]">
            <tr>
              <th className="pb-3 pr-4 font-medium">Nama Akun</th>
              <th className="pb-3 pr-4 font-medium">Jenis</th>
              <th className="pb-3 pr-4 text-right font-medium">Saldo</th>
              {isLoggedIn && <th className="pb-3 text-right font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.045]">
            {accounts.map((a) => {
              const kindBadge =
                a.kind === 'bank'
                  ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  : a.kind === 'ewallet'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : a.kind === 'cash'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : a.kind === 'investment'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'

              const isEditing = editingName === a.name

              return (
                <tr key={a.name} className="transition-colors hover:bg-white/[.02]">
                  <td className="py-3 pr-4 font-medium text-white">
                    {a.name}
                    {a.institution && <span className="ml-2 text-xs text-[#646b78]">({a.institution})</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${kindBadge}`}>
                      {a.kind}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-white">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editBalance}
                        onChange={(e) => setEditBalance(e.target.value)}
                        className="w-32 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-right text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      formatIDR(a.balance, { compact: true })
                    )}
                  </td>
                  {isLoggedIn && (
                    <td className="py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={loading}
                            onClick={() => handleUpdate(a.name)}
                            className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-medium text-black hover:bg-emerald-400"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingName(null)}
                            className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-white hover:bg-white/20"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingName(a.name)
                              setEditBalance(String(a.balance))
                            }}
                            className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(a.name)}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isLoggedIn && accounts.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/[.06] bg-black/20 p-4">
          <h4 className="text-xs font-semibold text-white">Transfer Antar-Akun / Bayar Utang</h4>
          <form onSubmit={handleTransfer} className="mt-3 grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Dari Akun</label>
              <select
                value={fromAcc}
                onChange={(e) => setFromAcc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Sumber...</option>
                {sourceAccounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Ke Akun / Tujuan</label>
              <select
                value={toAcc}
                onChange={(e) => setToAcc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Tujuan...</option>
                {targetAccounts.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 500000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                Transfer / Bayar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
```

### C.9 `src/components/rebalance-stress-panel.tsx`

_195 baris · 9,136 karakter_

```tsx
'use client'

import { useState } from 'react'
import {
  topUpAllocation,
  stressTestPortfolio,
  RISK_PRESETS,
  type RiskProfileKey,
  type Holding,
} from '@/lib/finance/aggregate'
import { formatIDR, formatPct } from '@/lib/format'

const STRESS_PRESETS = [
  {
    label: 'Moderate Correction',
    shocks: { crypto: -25, stock: -10, mutual_fund: -5, gold: 0, bond: -1 },
  },
  {
    label: '2008 / COVID Crash',
    shocks: { crypto: -50, stock: -30, mutual_fund: -15, gold: -5, bond: -3 },
  },
  {
    label: 'Crypto Winter',
    shocks: { crypto: -75, stock: -10, mutual_fund: -5, gold: 5, bond: 0 },
  },
]

export function RebalanceStressPanel({
  holdings,
  byClass,
  totalValue,
  worth,
}: {
  holdings: Holding[]
  byClass: { assetClass: string; total: number }[]
  totalValue: number
  worth: { assets: number; debts: number; net: number }
}) {
  const [profile, setProfile] = useState<RiskProfileKey>('balanced')
  const [freshCash, setFreshCash] = useState('')
  const [selectedShocks, setSelectedShocks] = useState(STRESS_PRESETS[0].shocks)
  const [activePreset, setActivePreset] = useState(0)

  const rows = topUpAllocation(byClass, totalValue, Number(freshCash) || 0, RISK_PRESETS[profile])
  const stress = stressTestPortfolio(holdings, worth, selectedShocks)

  return (
    <div className="space-y-6">
      {/* Bagian A: Risk Profile & Top-Up Rebalancing */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9aa0ac]">Target Profil Risiko & Alokasi Target</h4>
            <div className="mt-2 flex items-center gap-2">
              {(['conservative', 'balanced', 'aggressive'] as RiskProfileKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProfile(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    profile === p
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'border border-white/10 bg-white/[.02] text-white hover:bg-white/[.05]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">Simulasi Top-Up Dana Baru (Rp)</label>
            <input
              type="number"
              placeholder="Contoh: 5000000"
              value={freshCash}
              onChange={(e) => setFreshCash(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-widest text-[#4a515e]">
              <tr>
                <th className="pb-3 pr-4 font-medium">Kelas Aset</th>
                <th className="pb-3 pr-4 text-right font-medium">Nilai Aktual</th>
                <th className="pb-3 pr-4 text-right font-medium">Aktual vs Target</th>
                <th className="pb-3 pr-4 text-right font-medium">Drift</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 text-right font-medium">Rekomendasi Aksi</th>
                <th className="pb-3 text-right font-medium">Alokasi Top-Up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.045]">
              {rows.map((d) => {
                const badgeColor =
                  d.status === 'OVERWEIGHT'
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : d.status === 'UNDERWEIGHT'
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'

                return (
                  <tr key={d.assetClass} className="transition-colors hover:bg-white/[.02]">
                    <td className="py-3 pr-4 font-medium capitalize text-white">
                      {{ stock: 'Saham', crypto: 'Crypto', bond: 'Obligasi', mutual_fund: 'Reksa Dana', gold: 'Emas' }[d.assetClass] ?? d.assetClass}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-[#c9ced8]">
                      {formatIDR(d.actualValue, { compact: true })}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-white">
                      {d.actualPct.toFixed(1)}% / <span className="text-[#646b78]">{d.targetPct}%</span>
                    </td>
                    <td className={`py-3 pr-4 text-right tabular-nums ${d.status === 'OVERWEIGHT' ? 'text-amber-400' : d.status === 'UNDERWEIGHT' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                      {d.driftPct >= 0 ? `+${d.driftPct.toFixed(1)}%` : `${d.driftPct.toFixed(1)}%`}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${badgeColor}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium tabular-nums text-white">
                      {Math.abs(d.actionAmount) < 1000 ? (
                        <span className="text-[#646b78]">On Target</span>
                      ) : d.actionAmount > 0 ? (
                        <span className="text-cyan-400">Beli +{formatIDR(d.actionAmount, { compact: true })}</span>
                      ) : (
                        <span className="text-amber-400">Trim −{formatIDR(Math.abs(d.actionAmount), { compact: true })}</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-semibold tabular-nums text-emerald-400">
                      {d.topUpBuy > 0 ? '+' + formatIDR(d.topUpBuy, { compact: true }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bagian B: Market Stress Test / Crash Simulator */}
      <div className="rounded-xl border border-white/[.06] bg-black/20 p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Market Stress Test (What-If Crash Simulator)</h4>
            <p className="mt-0.5 text-[11px] text-[#646b78]">Simulasi ketahanan portofolio terhadap skenario crash pasar ekstrem</p>
          </div>
          <div className="flex items-center gap-2">
            {STRESS_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => {
                  setActivePreset(idx)
                  setSelectedShocks(preset.shocks)
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activePreset === idx
                    ? 'bg-rose-500 text-white font-semibold'
                    : 'border border-white/10 bg-white/[.02] text-white hover:bg-white/[.05]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">Estimasi Drawdown Portofolio</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-orange-400">
              -{formatIDR(stress.portfolioLoss, { compact: true })}{' '}
              <span className="text-xs font-normal">({formatPct(-stress.portfolioDropPct)})</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">Net Worth Pasca-Crash</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-white">
              {formatIDR(stress.stressedNetWorth, { compact: true })}
            </p>
          </div>
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">DAR Pasca-Crash</p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${stress.stressedDarPct < 30 ? 'text-emerald-400' : 'text-orange-400'}`}>
              {stress.stressedDarPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### C.10 `src/components/nav.tsx`

_147 baris · 4,906 karakter_

```tsx
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
```

### C.11 `src/components/charts.tsx`

_373 baris · 10,533 karakter_

```tsx
'use client'

import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { MonthBucket } from '@/lib/finance/aggregate'
import { formatIDR, formatMonth, formatPct } from '@/lib/format'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
)

const GRID = 'rgba(255,255,255,.055)' as const
const TICK = '#646b78' as const
const TOOLTIP_BG = '#11151c' as const

const baseTooltip = {
  backgroundColor: TOOLTIP_BG,
  borderColor: 'rgba(255,255,255,.10)',
  borderWidth: 1,
  titleColor: '#f4f5f7',
  bodyColor: '#9aa0ac',
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxPadding: 4,
} as const

// --- Cash flow: layered area chart ---------------------------------------

const EASE = 'easeOutQuart' as const

export function CashflowChart({ buckets }: { buckets: MonthBucket[] }) {
  const labels = buckets.map((b) => formatMonth(b.month))
  const mk = (
    label: string,
    data: number[],
    color: string,
  ): ChartData<'line'>['datasets'][number] => ({
    label,
    data,
    borderColor: color,
    backgroundColor: (ctx) => {
      const { chart } = ctx
      const { ctx: c, chartArea } = chart
      if (!chartArea) return 'transparent'
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
      g.addColorStop(0, color + '2e')
      g.addColorStop(1, color + '00')
      return g
    },
    fill: true,
    tension: 0.4,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: '#0a0a0a',
    pointHoverBorderWidth: 2,
  })

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      mk('Pemasukan', buckets.map((b) => b.income), '#34d399'),
      mk('Pengeluaran', buckets.map((b) => b.expense), '#fb923c'),
      // Net worth line: thin, dashed, emerald-white
      {
        label: 'Selisih',
        data: buckets.map((b) => b.net),
        borderColor: 'rgba(244,245,247,.45)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: EASE },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: TICK,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          boxHeight: 7,
          padding: 14,
          font: { size: 11 },
        },
      },
      tooltip: {
        ...baseTooltip,
        callbacks: { label: (c) => ` ${c.dataset.label}: ${formatIDR(Number(c.raw))}` },
      },
    },
    scales: {
      y: {
        ticks: { color: TICK, font: { size: 10 }, callback: (v) => formatCompactT(Number(v)) },
        grid: { color: GRID },
        border: { display: false },
      },
      x: {
        ticks: { color: TICK, font: { size: 10 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  )
}

function formatCompactT(v: number): string {
  const abs = Math.abs(v)
  const s = v < 0 ? '-' : ''
  if (abs >= 1e9) return `${s}${(abs / 1e9).toFixed(1).replace('.', ',')} M`
  if (abs >= 1e6) return `${s}${(abs / 1e6).toFixed(1).replace('.', ',')} jt`
  if (abs >= 1e3) return `${s}${(abs / 1e3).toFixed(0)} rb`
  return `${s}${abs}`
}

// --- Expense breakdown doughnut ------------------------------------------

export function CategoryChart({
  data,
}: {
  data: { category: string; total: number }[]
}) {
  const palette = [
    '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15',
    '#2dd4bf', '#fb7185', '#94a3b8', '#a3e635', '#38bdf8',
  ]

  const chartData: ChartData<'doughnut'> = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: palette,
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
        spacing: 2,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: EASE, animateRotate: true, animateScale: true },
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...baseTooltip,
        callbacks: { label: (c) => ` ${c.label}: ${formatIDR(Number(c.raw))}` },
      },
    },
  }

  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-52 w-52">
        <Doughnut data={chartData} options={options} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-[#646b78]">
            Total
          </span>
          <span className="mt-0.5 text-xl font-semibold tabular-nums text-white">
            {formatIDR(total, { compact: true })}
          </span>
        </div>
      </div>
      {/* Legend as list with bar + amount */}
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li key={d.category} className="flex items-center gap-2.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            <span className="w-24 truncate text-[#9aa0ac]">{d.category}</span>
            <span className="flex-1" />
            <span className="tabular-nums font-medium text-[#f4f5f7]">
              {formatIDR(d.total, { compact: true })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// --- Portfolio by asset class (horizontal bar) ---------------------------

export function PortfolioChart({
  data,
  costByClass,
}: {
  data: { assetClass: string; total: number }[]
  costByClass?: { assetClass: string; total: number }[]
}) {
  const labels: Record<string, string> = {
    stock: 'Saham',
    crypto: 'Crypto',
    mutual_fund: 'Reksa Dana',
    bond: 'Obligasi',
    gold: 'Emas',
  }
  const colors: Record<string, string> = {
    stock: '#34d399',
    crypto: '#a78bfa',
    mutual_fund: '#60a5fa',
    bond: '#facc15',
    gold: '#fb923c',
  }

  const costMap = new Map(
    (costByClass ?? []).map((c) => [c.assetClass, c.total]),
  )

  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => labels[d.assetClass] ?? d.assetClass),
    datasets: [
      {
        label: 'Nilai Pasar',
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => (colors[d.assetClass] ?? '#34d399') + 'cc'),
        hoverBackgroundColor: data.map((d) => colors[d.assetClass] ?? '#34d399'),
        borderRadius: 6,
        barThickness: 22,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: EASE, delay: (ctx) => ctx.dataIndex * 60 },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...baseTooltip,
        callbacks: { label: (c) => ` ${formatIDR(Number(c.raw))}` },
      },
    },
    scales: {
      x: {
        ticks: { color: TICK, font: { size: 10 }, callback: (v) => formatCompactT(Number(v)) },
        grid: { color: GRID },
        border: { display: false },
      },
      y: {
        ticks: { color: '#9aa0ac', font: { size: 11 } },
        grid: { display: false },
        border: { display: false },
      },
    },
  }

  return (
    <div className="space-y-3">
      <div className="h-56">
        <Bar data={chartData} options={options} />
      </div>
      <ul className="space-y-1.5">
        {data.map((d) => {
          const cost = costMap.get(d.assetClass) ?? 0
          const pl = d.total - cost
          const plPct = cost > 0 ? (pl / cost) * 100 : 0
          return (
            <li key={d.assetClass} className="flex items-center gap-2 text-[11px]">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: colors[d.assetClass] ?? '#34d399' }}
              />
              <span className="text-[#9aa0ac]">{labels[d.assetClass] ?? d.assetClass}</span>
              <span className="ml-auto font-medium tabular-nums text-white">
                {formatIDR(d.total, { compact: true })}
              </span>
              {cost > 0 && (
                <span
                  className={`w-16 text-right tabular-nums ${
                    pl >= 0 ? 'text-emerald-400' : 'text-orange-400'
                  }`}
                >
                  {formatPct(plPct)}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// --- Small sparkline for the stat cards ----------------------------------

export function Sparkline({ values }: { values: number[] }) {
  const data: ChartData<'line'> = {
    labels: values.map((_, i) => i),
    datasets: [
      {
        data: values,
        borderColor: (values.at(-1) ?? 0) >= (values[0] ?? 0) ? '#34d399' : '#fb923c',
        backgroundColor: (ctx) => {
          const { chart } = ctx
          const { ctx: c, chartArea } = chart
          if (!chartArea) return 'transparent'
          const up = (values.at(-1) ?? 0) >= (values[0] ?? 0)
          const color = up ? '#34d399' : '#fb923c'
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, color + '30')
          g.addColorStop(1, color + '00')
          return g
        },
        borderWidth: 1.75,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000, easing: EASE },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
  }

  return <div className="h-9">{<Line data={data} options={options} />}</div>
}
```

### C.12 `src/app/page.tsx`

_527 baris · 23,154 karakter_

```tsx
import { getDashboardData, type ActivityEvent } from '@/lib/finance/data'
import {
  monthlyCashflow,
  expenseByCategory,
  portfolioSummary,
  netWorth,
  latestDelta,
  avgMonthlyExpense,
  financialRatios,
  portfolioRiskMetrics,
  passiveIncomeMetrics,
} from '@/lib/finance/aggregate'
import { AccountsPanel } from '@/components/accounts-panel'
import { RebalanceStressPanel } from '@/components/rebalance-stress-panel'
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

  const ratios = financialRatios(worth, liquidCash, portfolio.value, flow)
  const risk = portfolioRiskMetrics(holdings)
  const passive = passiveIncomeMetrics(transactions, ratios.burnRate)

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
            <p className="text-sm font-semibold leading-tight">Wealth & Risk</p>
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
                Wealth & Portfolio Risk Management
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Portfolio & Liquidity Terminal
              </h1>
              <p className="mt-1.5 text-sm text-[#9aa0ac]">
                Valuasi multi-aset real-time, matriks rasio likuiditas, analisis konsentrasi risiko, dan eksekusi rebalancing.
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
                  <AddTransactionButton accounts={accounts} />
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

          {/* Rasio & Risiko Section */}
          <section id="rasio-risiko" className="animate-rise mt-8 scroll-mt-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">Financial Ratios & Portfolio Risk</h2>
              <p className="mt-0.5 text-xs text-[#646b78]">Likuiditas, runway, solvabilitas, dan konsentrasi aset</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Runway */}
              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">Liquidity Runway</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${ratios.runwayMonths == null ? 'text-emerald-400' : ratios.runwayMonths >= 6 ? 'text-emerald-400' : ratios.runwayMonths >= 3 ? 'text-amber-300' : 'text-orange-400'}`}>
                  {ratios.runwayMonths != null ? `${ratios.runwayMonths.toFixed(1)} bln` : '∞'}
                </p>
                <p className="mt-1 text-xs text-[#9aa0ac]">
                  {ratios.runwayMonths == null ? 'Burn rate 0' : ratios.runwayMonths >= 6 ? 'Sehat (≥6 bln)' : ratios.runwayMonths >= 3 ? 'Moderat (3–6 bln)' : 'Kritis (<3 bln)'} · Kas {ratios.liquidityRatioPct.toFixed(0)}% aset
                </p>
              </div>
              {/* Card 2: DAR */}
              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">Debt-to-Asset (DAR)</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${ratios.debtToAssetPct < 30 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {ratios.debtToAssetPct.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-[#9aa0ac]">
                  {ratios.debtToAssetPct < 30 ? 'Sehat (<30%)' : 'Leverage tinggi (≥30%)'}
                </p>
              </div>
              {/* Card 3: Savings & Deployment */}
              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">Savings & Deployment</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${ratios.savingsRatePct >= 20 ? 'text-emerald-400' : ratios.savingsRatePct >= 0 ? 'text-amber-300' : 'text-orange-400'}`}>
                  {ratios.savingsRatePct.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-[#9aa0ac]">
                  Tabungan bln ini · Inv: {ratios.investmentAllocationPct.toFixed(0)}% · Passive cover: {passive.coverageRatioPct.toFixed(0)}%
                </p>
              </div>
              {/* Card 4: Concentration HHI */}
              <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-5">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#646b78]">Concentration Risk (HHI)</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
                  {risk.hhi.toFixed(2)} <span className="text-xs font-normal text-[#9aa0ac]">({risk.concentrationLevel})</span>
                </p>
                <p className="mt-1 text-xs text-[#9aa0ac]">
                  Terbesar: {risk.topHolding ? `${risk.topHolding.symbol} (${risk.topHolding.weightPct.toFixed(1)}%)` : '—'}
                </p>
              </div>
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
          <section id="portofolio" className="animate-rise stagger-2 mt-4 space-y-4 scroll-mt-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Alokasi Aset" hint="Nilai pasar per kelas aset">
                <PortfolioChart data={portfolio.byClass} costByClass={portfolio.costByClass} />
              </Panel>
              <Panel
                title="Kepemilikan"
                hint="Posisi & untung/rugi per instrumen · harga real-time"
                className="lg:col-span-2"
              >
                <HoldingsTable holdings={holdings} accounts={accounts} />
              </Panel>
            </div>

            {/* Rebalancing Engine Panel */}
            <Panel
              title="Target Allocation & Rebalancing Engine"
              hint="Simulasi profil risiko dinamis, alokasi top-up dana baru, dan skenario market crash"
            >
              <RebalanceStressPanel
                holdings={holdings}
                byClass={portfolio.byClass}
                totalValue={portfolio.value}
                worth={worth}
              />
            </Panel>
          </section>

          {/* Row: budget bar + recent activity */}
          <section id="anggaran" className="animate-rise stagger-3 mt-4 grid gap-4 lg:grid-cols-3 scroll-mt-6">
            <Panel title="Progress Anggaran" hint={`Pengeluaran vs rata-rata ${MONTHS} bulan`}>
              <BudgetGauge spent={delta?.last.expense ?? 0} baseline={burn} />
            </Panel>
            <Panel
              className="lg:col-span-2"
              hint="Rincian saldo bank, e-wallet, utang, dan transfer antar-akun"
              title="Manajemen Akun & Likuiditas"
            >
              <AccountsPanel accounts={accounts} isLoggedIn={Boolean(user)} />
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
```

### C.13 `src/app/auth/page.tsx`

_98 baris · 3,531 karakter_

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from './auth-form'

export const metadata = { title: 'Masuk — Wealth & Risk Terminal' }

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; redirect_to?: string }>
}) {
  const sp = await searchParams
  const mode = sp.mode === 'signup' ? 'signup' : 'login'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in? Go straight to the dashboard.
  if (user) redirect(sp.redirect_to || '/')

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#07080a] px-5">
      {/* Ambient glow — same family as the dashboard */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,.18), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,.14), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-sm font-semibold tracking-tight text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[.08] bg-white/[.03] text-emerald-400">
            H
          </span>
          Wealth & Risk Terminal
        </Link>

        <div className="rounded-2xl border border-white/[.07] bg-[#0e1015]/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-white">
            {mode === 'signup' ? 'Buat akun baru' : 'Masuk ke akunmu'}
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#9aa0ac]">
            {mode === 'signup'
              ? 'Data keuanganmu akan terisi otomatis dengan contoh realistis.'
              : 'Lanjut melacak keuanganmu.'}
          </p>

          <div className="mt-6">
            <AuthForm mode={mode} />
          </div>

          <div className="mt-5 border-t border-white/[.06] pt-5">
            <p className="text-center text-[12px] text-[#646b78]">
              {mode === 'signup' ? (
                <>
                  Sudah punya akun?{' '}
                  <a
                    href="/auth?mode=login"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Masuk
                  </a>
                </>
              ) : (
                <>
                  Belum punya akun?{' '}
                  <a
                    href="/auth?mode=signup"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Daftar
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-[#4a515e]">
          Tanpa login, kamu melihat dataset contoh yang sama.
          <br />
          Data kamu hanya bisa dilihat oleh akunmu sendiri.
        </p>
      </div>
    </div>
  )
}
```

### C.14 `scripts/checks/check-aggregate.ts`

_231 baris · 11,732 karakter_

```typescript
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

console.log('scripts/checks/check-aggregate.ts: all quantitative checks passed!')
```

---

**Total baris 14 file: 4,867.** Seluruh source ditulis utuh dari baris pertama sampai terakhir — tidak ada bagian yang disingkat.
