'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addTransaction, addAccount, addHolding, importPortfolio, type ImportRow, type ImportRowError } from '@/app/actions'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { name: 'Gaji', type: 'income' },
  { name: 'Freelance', type: 'income' },
  { name: 'Makan & Minum', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Kuliah', type: 'expense' },
  { name: 'Belanja', type: 'expense' },
  { name: 'Hiburan', type: 'expense' },
  { name: 'Kesehatan', type: 'expense' },
  { name: 'Tagihan', type: 'expense' },
  { name: 'Lainnya', type: 'expense' },
] as const

const ACCOUNTS = ['BCA Utama', 'GoPay', 'OVO', 'Tunai Dompet']

export function AddTransactionButton() {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Makan & Minum')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [account, setAccount] = useState('BCA Utama')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await addTransaction({
      amount: Number(amount),
      type,
      category,
      description: description || category,
      date,
      account,
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
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-white/[.08] bg-[#0e1015] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/40"
                  >
                    {ACCOUNTS.map((a) => (
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
    const totalCost = finalQty * finalPrice

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
