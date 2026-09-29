// Generate 6 months of realistic dummy transactions for a fresh-graduate
// Indonesian profile: salary ~Rp6.5M, side income, real expense distribution.
// Deterministic (seeded RNG) so re-runs produce identical data.
import type { Account, Holding } from '@/lib/finance/aggregate'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(240413606993)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

const MONTHS_BACK = 6

// Expense category -> {mean, spread} in Rp thousand per month
const EXPENSES: Record<string, { mean: number; spread: number }> = {
  'Makan & Minum': { mean: 1850, spread: 450 },
  Transport: { mean: 620, spread: 180 },
  Kuliah: { mean: 950, spread: 120 },
  Belanja: { mean: 700, spread: 500 },
  Hiburan: { mean: 380, spread: 240 },
  Kesehatan: { mean: 210, spread: 150 },
  Tagihan: { mean: 430, spread: 60 },
  Lainnya: { mean: 260, spread: 200 },
}

const MERCHANTS: Record<string, string[]> = {
  'Makan & Minum': ['Warkop 24', 'Rumah Makan Padang', 'Indomaret', 'Alfamart', 'GoFood', 'Kopi Senja', 'Mie Gacoan'],
  Transport: ['Gojek', 'Grab', 'Bensin Pertamax', 'Parkir Kampus', 'KRL Commuter'],
  Kuliah: ['Fotokopi Skripsi', 'Buku Akuntansi', 'Parkir Kampus', 'SPP tambahan', 'Praktikum'],
  Belanja: ['Shopee', 'TikTok Shop', 'Tokopedia', 'Uniqlo', 'Distro Lokal'],
  Hiburan: ['Netflix', 'Spotify', 'Bioskop XXI', 'Game top-up', 'Nongkrong kafe'],
  Kesehatan: ['Apotek K24', 'Klinik', 'Vitamin', 'Dokter gigi'],
  Tagihan: ['PLN token', 'Pulsa & paket data', 'Internet rumah', 'Air PDAM'],
  Lainnya: ['Sedekah', 'Berkas administratif', 'ATM transfer', 'Biaya tak terduga'],
}

interface Tx {
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  account: string
  source: 'import'
}

function idr(k: number) {
  return Math.round(k) * 1000
}

export function generateTransactions(): Tx[] {
  const txs: Tx[] = []
  const today = new Date()

  for (let m = MONTHS_BACK; m >= 1; m--) {
    const base = new Date(today.getFullYear(), today.getMonth() - m, 1)
    const year = base.getFullYear()
    const month = base.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Income: salary on the 25th, occasional freelance
    const salary = idr(6200 + Math.round(rand() * 600))
    txs.push({
      amount: salary,
      type: 'income',
      category: 'Gaji',
      description: 'Gaji bulanan',
      date: iso(year, month, Math.min(25, daysInMonth)),
      account: 'BCA',
      source: 'import',
    })

    if (rand() > 0.45) {
      txs.push({
        amount: idr(450 + Math.round(rand() * 900)),
        type: 'income',
        category: 'Freelance',
        description: pick(['Jasa pembuatan website UMKM', 'Naskah artikel bisnis', 'Setting Excel laporan keuangan', 'Konsultasi workflow n8n', 'Desain dashboard finance']),
        date: iso(year, month, 3 + Math.floor(rand() * 20)),
        account: 'OVO',
        source: 'import',
      })
    }

    // Expenses: 10-22 transactions per category per month
    for (const [cat, { mean, spread }] of Object.entries(EXPENSES)) {
      const target = mean + (rand() - 0.5) * 2 * spread
      let remaining = target
      const nTx = 3 + Math.floor(rand() * 8)
      for (let i = 0; i < nTx && remaining > 25; i++) {
        const share = remaining * (0.15 + rand() * 0.7)
        const amount = idr(Math.max(8, share))
        remaining -= amount / 1000
        txs.push({
          amount,
          type: 'expense',
          category: cat,
          description: pick(MERCHANTS[cat]),
          date: iso(year, month, 1 + Math.floor(rand() * daysInMonth)),
          account: pick(['BCA', 'OVO', 'GoPay', 'Cash']),
          source: 'import',
        })
      }
    }
  }

  return txs
}

function iso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function generateHoldings() {
  return [
    { symbol: 'BBCA.JK', name: 'Bank Central Asia', asset_class: 'stock', quantity: 320, avg_buy_price: 8150, current_price: 9420 },
    { symbol: 'ANTM.JK', name: 'Aneka Tambang', asset_class: 'stock', quantity: 1500, avg_buy_price: 1680, current_price: 1520 },
    { symbol: 'BTC', name: 'Bitcoin', asset_class: 'crypto', quantity: 0.085, avg_buy_price: 920000000, current_price: 1080000000 },
    { symbol: 'ETH', name: 'Ethereum', asset_class: 'crypto', quantity: 1.4, avg_buy_price: 38500000, current_price: 41200000 },
    { symbol: 'PINTU', name: 'Reksa Dana PINTU', asset_class: 'mutual_fund', quantity: 1250, avg_buy_price: 1480, current_price: 1565 },
  ]
}

export function generateAccounts(): Account[] {
  return [
    { name: 'BCA', kind: 'bank', balance: 4850000, institution: 'Bank BCA' },
    { name: 'OVO', kind: 'ewallet', balance: 740000, institution: 'OVO' },
    { name: 'GoPay', kind: 'ewallet', balance: 312000, institution: 'Gojek' },
    { name: 'Cash', kind: 'cash', balance: 550000, institution: null },
    { name: 'Rencana Cicilan', kind: 'debt', balance: -2100000, institution: 'Kartu kredit' },
    { name: 'RDN KSEI', kind: 'investment', balance: 7180000, institution: 'KSEI' },
  ]
}
