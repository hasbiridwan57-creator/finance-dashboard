'use client'

import { formatIDR, formatPct } from '@/lib/format'
import {
  tradingJournalMetrics,
  type TradeEntry,
} from '@/lib/finance/aggregate'

export function SmtJournalPanel({ trades }: { trades: TradeEntry[] }) {
  const metrics = tradingJournalMetrics(trades)
  const recentTrades = [...trades].slice(-8).reverse()

  return (
    <div className="space-y-6">
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
                        t.entryPrice > 0 ? ((t.exitPrice - t.entryPrice) / t.entryPrice) * 100 : 0,
                      )}{' '}
                      ({formatIDR(t.pnl, { compact: true })})
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
