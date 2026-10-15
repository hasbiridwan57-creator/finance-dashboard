'use client'

import { useState } from 'react'
import { formatIDR, formatPct } from '@/lib/format'
import {
  tradingJournalMetrics,
  type TradeEntry,
} from '@/lib/finance/aggregate'
import { addTradeEntry, updateTradeEntry, deleteTradeEntry } from '@/app/actions'
import { useRouter } from 'next/navigation'

export function SmtJournalPanel({ trades }: { trades: TradeEntry[] }) {
  const router = useRouter()
  const metrics = tradingJournalMetrics(trades)
  const recentTrades = [...trades].slice(-15).reverse()

  const [isOpen, setIsOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<TradeEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<'BUY' | 'SELL' | 'LONG' | 'SHORT'>('BUY')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pnl, setPnl] = useState('')
  const [strategy, setStrategy] = useState('')

  function openAddModal() {
    setEditingTrade(null)
    setSymbol('')
    setSide('BUY')
    setEntryPrice('')
    setExitPrice('')
    setQuantity('')
    setPnl('')
    setStrategy('')
    setError(null)
    setIsOpen(true)
  }

  function openEditModal(t: TradeEntry) {
    setEditingTrade(t)
    setSymbol(t.symbol)
    setSide(t.side)
    setEntryPrice(String(t.entryPrice))
    setExitPrice(String(t.exitPrice))
    setQuantity(String(t.quantity))
    setPnl(String(t.pnl))
    setStrategy(t.strategy ?? '')
    setError(null)
    setIsOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      timestamp: new Date().toISOString(),
      symbol: symbol.trim().toUpperCase(),
      side,
      entryPrice: Number(entryPrice) || 0,
      exitPrice: Number(exitPrice) || 0,
      quantity: Number(quantity) || 1,
      pnl: Number(pnl) || 0,
      strategy: strategy.trim() || 'Smart Money Footprint',
    }

    try {
      if (editingTrade && editingTrade.id) {
        const res = await updateTradeEntry({ id: editingTrade.id, ...payload })
        if (res.error) {
          setError(res.error)
          setLoading(false)
          return
        }
      } else {
        const res = await addTradeEntry(payload)
        if (res.error) {
          setError(res.error)
          setLoading(false)
          return
        }
      }
      setIsOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan trade.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus catatan trade ini dari jurnal?')) return
    try {
      await deleteTradeEntry(id)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar with Add Trade Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Smart Money & Quantitative Execution Log
          </h3>
          <p className="text-xs text-[#9aa0ac]">
            Pencatatan real-time, statistik win rate, profit factor, dan manajemen eksekusi order.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
        >
          + Catat Trade Baru
        </button>
      </div>

      {/* 4 Quantitative summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Win Rate */}
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
            Win Rate
          </p>
          <p
            className={`mt-1.5 text-2xl font-semibold tabular-nums ${
              metrics.winRatePct >= 50 ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {metrics.winRatePct.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-[#9aa0ac]">
            {metrics.winCount}W / {metrics.lossCount}L dari {metrics.totalTrades} eksekusi
          </p>
        </div>

        {/* Card 2: Profit Factor */}
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
            Profit Factor
          </p>
          <p
            className={`mt-1.5 text-2xl font-semibold tabular-nums ${
              metrics.profitFactor >= 1.5
                ? 'text-emerald-400'
                : metrics.profitFactor >= 1.0
                  ? 'text-amber-300'
                  : 'text-orange-400'
            }`}
          >
            {metrics.profitFactor.toFixed(2)}x
          </p>
          <p className="mt-1 text-xs text-[#9aa0ac]">
            {metrics.profitFactor >= 1.5 ? 'Sehat (≥ 1.5x)' : 'Di bawah ambang target'}
          </p>
        </div>

        {/* Card 3: Expectancy per Trade */}
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
            Expectancy / Trade
          </p>
          <p
            className={`mt-1.5 text-2xl font-semibold tabular-nums ${
              metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-orange-400'
            }`}
          >
            {formatIDR(metrics.expectancy, { compact: true })}
          </p>
          <p className="mt-1 text-xs text-[#9aa0ac]">
            Net PnL: {formatIDR(metrics.netPnL, { compact: true })}
          </p>
        </div>

        {/* Card 4: Max Drawdown */}
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">
            Max Drawdown (Journal)
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-orange-400">
            -{formatIDR(metrics.maxDrawdown, { compact: true })}
          </p>
          <p className="mt-1 text-xs text-[#9aa0ac]">Penurunan puncak ke lembah</p>
        </div>
      </div>

      {/* Recent executions table */}
      <div className="overflow-x-auto rounded-xl border border-white/[.06] bg-white/[.02]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[.06] text-[#9aa0ac]">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Instrumen</th>
              <th className="px-4 py-3 font-medium">Side</th>
              <th className="px-4 py-3 font-medium">Entry vs Exit</th>
              <th className="px-4 py-3 font-medium">Strategi</th>
              <th className="px-4 py-3 text-right font-medium">Realized PnL</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.04]">
            {recentTrades.map((t, idx) => {
              const dateStr = t.timestamp ? t.timestamp.slice(0, 10) : '-'
              const timeStr = t.timestamp && t.timestamp.length >= 16 ? t.timestamp.slice(11, 16) : ''
              const isWin = t.pnl >= 0
              const sideTone =
                t.side === 'BUY' || t.side === 'LONG'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-400'

              return (
                <tr key={t.id ?? idx} className="hover:bg-white/[.02]">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[#9aa0ac]">
                    {dateStr} {timeStr}
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{t.symbol}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${sideTone}`}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-[#cbd5e1]">
                    {formatIDR(t.entryPrice, { compact: true })} →{' '}
                    {formatIDR(t.exitPrice, { compact: true })}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-[#9aa0ac]">
                    {t.strategy ?? 'Smart Money Footprint'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    <span className={isWin ? 'text-emerald-400' : 'text-orange-400'}>
                      {formatPct(
                        (() => {
                          const invested = t.entryPrice * t.quantity
                          if (invested > 0) return (t.pnl / invested) * 100
                          if (t.entryPrice > 0) {
                            const diff = (t.side === 'SHORT' || t.side === 'SELL')
                              ? t.entryPrice - t.exitPrice
                              : t.exitPrice - t.entryPrice
                            return (diff / t.entryPrice) * 100
                          }
                          return 0
                        })()
                      )}{' '}
                      ({formatIDR(t.pnl, { compact: true })})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-cyan-400 hover:underline"
                    >
                      Edit
                    </button>
                    {t.id && (
                      <button
                        onClick={() => handleDelete(t.id!)}
                        className="text-orange-400 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Trade */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/[.1] bg-[#12141c] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {editingTrade ? 'Edit Catatan Trade' : 'Catat Eksekusi Trade Baru'}
            </h3>
            <p className="text-xs text-[#9aa0ac] mt-1">
              Masukkan detail harga entry, exit, quantity, dan realized PnL.
            </p>

            {error && (
              <div className="mt-3 rounded-lg bg-orange-500/10 border border-orange-500/30 p-3 text-xs text-orange-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Simbol / Ticker</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Contoh: BBCA.JK, BTC, SOL"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white placeholder-[#6b7280] focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Side / Arah</label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as TradeEntry['side'])}
                    className="w-full rounded-lg border border-white/[.1] bg-[#1a1d26] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BUY">BUY</option>
                    <option value="LONG">LONG</option>
                    <option value="SELL">SELL</option>
                    <option value="SHORT">SHORT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Harga Entry</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="9450"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Harga Exit</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="9975"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Quantity / Lot</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Realized PnL (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    placeholder="262500 (negatif jika rugi)"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[#9aa0ac] mb-1">Strategi / Footprint</label>
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Smart Money Accumulation"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-white/[.1] px-4 py-2 text-white hover:bg-white/[.05]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
