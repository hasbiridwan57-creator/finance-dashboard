'use client'

import { useState } from 'react'
import { updateHolding, deleteHolding } from '@/app/actions'
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

export function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const router = useRouter()

  const liveCount = holdings.filter((h) => h.live).length

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
                <td
                  className={`py-3 text-right font-medium tabular-nums ${pl >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}
                >
                  {formatCompact(pl)}
                  <span className="ml-1 text-[10px] opacity-70">({formatPct(plPct)})</span>
                </td>
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-1">
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
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    onDone()
  }

  return (
    <tr className="bg-white/[.02]">
      <td colSpan={7} className="p-4">
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
          <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? '…' : 'Simpan'}
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
