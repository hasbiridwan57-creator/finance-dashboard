'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { formatIDR, formatPct } from '@/lib/format'
import {
  tradingJournalMetrics,
  type TradeEntry,
} from '@/lib/finance/aggregate'
import { addTradeEntry, updateTradeEntry, deleteTradeEntry } from '@/app/actions'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'smt_journal_trades'

export function SmtJournalPanel({ trades: initialTrades }: { trades: TradeEntry[] }) {
  const router = useRouter()
  const [trades, setTrades] = useState<TradeEntry[]>(initialTrades)

  useEffect(() => {
    try {
      const local = localStorage.getItem(STORAGE_KEY)
      if (local !== null) {
        const parsed = JSON.parse(local)
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setTrades(parsed)
        }
      }
    } catch {}
  }, [])

  const persistTrades = useCallback((next: TradeEntry[]) => {
    setTrades(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const metrics = tradingJournalMetrics(trades)
  const recentTrades = useMemo(() => [...trades].slice(-15).reverse(), [trades])

  const [isOpen, setIsOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<TradeEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [symbol, setSymbol] = useState('')
  const [side, setSide] = useState<TradeEntry['side']>('BUY')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pnl, setPnl] = useState('')
  const [strategy, setStrategy] = useState('')

  // Auto-calculate PnL whenever side, entryPrice, exitPrice, or quantity change
  const computeAutoPnl = useCallback((s: TradeEntry['side'], entryStr: string, exitStr: string, qtyStr: string) => {
    const entry = Number(entryStr) || 0
    const exit = Number(exitStr) || 0
    const qty = Number(qtyStr) || 0
    if (entry > 0 && exit > 0 && qty > 0) {
      const raw = (s === 'SHORT' || s === 'SELL') ? (entry - exit) * qty : (exit - entry) * qty
      return String(Math.round(raw))
    }
    return ''
  }, [])

  function handleSideChange(newSide: TradeEntry['side']) {
    setSide(newSide)
    const auto = computeAutoPnl(newSide, entryPrice, exitPrice, quantity)
    if (auto !== '') setPnl(auto)
  }

  function handleEntryChange(val: string) {
    setEntryPrice(val)
    const auto = computeAutoPnl(side, val, exitPrice, quantity)
    if (auto !== '') setPnl(auto)
  }

  function handleExitChange(val: string) {
    setExitPrice(val)
    const auto = computeAutoPnl(side, entryPrice, val, quantity)
    if (auto !== '') setPnl(auto)
  }

  function handleQuantityChange(val: string) {
    setQuantity(val)
    const auto = computeAutoPnl(side, entryPrice, exitPrice, val)
    if (auto !== '') setPnl(auto)
  }

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

    if (editingTrade && editingTrade.id) {
      const updated = trades.map((t) => (t.id === editingTrade.id ? { ...t, ...payload } : t))
      persistTrades(updated)
      try {
        await updateTradeEntry({ id: editingTrade.id, ...payload })
      } catch {}
    } else {
      const newId = `smt-${Date.now().toString(36)}`
      const created: TradeEntry = { id: newId, ...payload }
      const updated = [created, ...trades]
      persistTrades(updated)
      try {
        await addTradeEntry(payload)
      } catch {}
    }

    setIsOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus catatan trade ini dari jurnal?')) return
    const filtered = trades.filter((t) => t.id !== id)
    persistTrades(filtered)
    try {
      await deleteTradeEntry(id)
      router.refresh()
    } catch {}
  }

  function handleResetDefault() {
    if (!confirm('Kembalikan jurnal ke data contoh awal? Perubahan Anda akan hilang.')) return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    setTrades(initialTrades)
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Smart Money &amp; Quantitative Execution Log
          </h3>
          <p className="text-xs text-[#9aa0ac]">
            Pelacakan eksekusi order (Sandbox interaktif). PnL terhitung otomatis saat Entry, Exit, dan Quantity diisi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefault}
            className="rounded-lg border border-white/[.12] px-3.5 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-white/[.05] transition"
          >
            Reset ke Default
          </button>
          <button
            onClick={openAddModal}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition"
          >
            + Catat Trade Baru
          </button>
        </div>
      </div>

      {/* 4 Quantitative summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">Win Rate</p>
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

        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9aa0ac]">Profit Factor</p>
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
            {recentTrades.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9aa0ac]">
                  Belum ada catatan trade. Klik &quot;+ Catat Trade Baru&quot; atau &quot;Reset ke Default&quot;.
                </td>
              </tr>
            )}
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
                            const diff =
                              t.side === 'SHORT' || t.side === 'SELL'
                                ? t.entryPrice - t.exitPrice
                                : t.exitPrice - t.entryPrice
                            return (diff / t.entryPrice) * 100
                          }
                          return 0
                        })(),
                      )}{' '}
                      ({formatIDR(t.pnl, { compact: true })})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-cyan-400 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id ?? '')}
                      className="ml-3 text-orange-400 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[.1] bg-[#12141c] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              {editingTrade ? 'Edit Catatan Trade' : 'Catat Eksekusi Trade Baru'}
            </h3>
            <p className="mt-1 text-xs text-[#9aa0ac]">
              Masukkan detail harga entry, exit, quantity, dan realized PnL (dihitung otomatis).
            </p>

            {error && (
              <div className="mt-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Simbol / Ticker</label>
                  <input
                    type="text"
                    required
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Contoh: BBCA.JK, BTC, SOL"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white placeholder-[#6b7280] focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Side / Arah</label>
                  <select
                    value={side}
                    onChange={(e) => handleSideChange(e.target.value as TradeEntry['side'])}
                    className="w-full rounded-lg border border-white/[.1] bg-[#1a1d26] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
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
                  <label className="mb-1 block text-[#9aa0ac]">Harga Entry</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={entryPrice}
                    onChange={(e) => handleEntryChange(e.target.value)}
                    placeholder="9450"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Harga Exit</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => handleExitChange(e.target.value)}
                    placeholder="9975"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Quantity / Lot</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="500"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Realized PnL (Rp) [Auto-calculated]</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    placeholder="Terhitung otomatis"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[#9aa0ac]">Strategi / Footprint</label>
                  <input
                    type="text"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Smart Money Accumulation"
                    className="w-full rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
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
