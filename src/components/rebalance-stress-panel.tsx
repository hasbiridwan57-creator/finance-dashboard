'use client'

import { useState } from 'react'
import {
  topUpAllocation,
  stressTestPortfolio,
  benchmarkAndAlphaMetrics,
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
  ihsgReturnPct,
}: {
  holdings: Holding[]
  byClass: { assetClass: string; total: number }[]
  totalValue: number
  worth: { assets: number; debts: number; net: number }
  ihsgReturnPct?: number
}) {
  const [profile, setProfile] = useState<RiskProfileKey>('balanced')
  const [freshCash, setFreshCash] = useState('')
  const [selectedShocks, setSelectedShocks] = useState(STRESS_PRESETS[0].shocks)
  const [activePreset, setActivePreset] = useState(0)

  const bench = benchmarkAndAlphaMetrics(holdings, ihsgReturnPct ?? 6.8, 6.25)
  const rows = topUpAllocation(byClass, totalValue, Number(freshCash) || 0, RISK_PRESETS[profile])
  const stress = stressTestPortfolio(holdings, worth, selectedShocks)

  return (
    <div className="space-y-6">
      {/* Sub-panel 1: Benchmark Alpha & Risk-Adjusted Return (CAPM / Sharpe) */}
      <div className="rounded-xl border border-white/[.08] bg-white/[.02] p-5 space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Benchmark Alpha & Risk-Adjusted Return (CAPM / Sharpe)
            </h4>
            <p className="mt-0.5 text-[11px] text-[#9aa0ac]">
              Evaluasi kinerja portofolio terhadap acuan pasar (IHSG YTD & SBN Risk-Free Rate 6.25%)
            </p>
          </div>
          <span
            className={`inline-block self-start rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
              bench.status === 'OUTPERFORM'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {bench.status}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Metric a: Return vs IHSG */}
          <div className="rounded-lg border border-white/[.06] bg-black/30 p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9aa0ac]">
              Portfolio Return vs IHSG
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-white">
              {formatPct(bench.portfolioReturnPct)}{' '}
              <span className="text-xs font-normal text-[#646b78]">
                vs {formatPct(bench.ihsgReturnPct)}
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0ac]">Acuan IHSG YTD</p>
          </div>

          {/* Metric b: Jensen's Alpha */}
          <div className="rounded-lg border border-white/[.06] bg-black/30 p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9aa0ac]">
              Benchmark Alpha (α)
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${
                bench.alphaVsIhsgPct >= 0 ? 'text-emerald-400' : 'text-amber-300'
              }`}
            >
              {formatPct(bench.alphaVsIhsgPct)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0ac]">Excess return vs IHSG</p>
          </div>

          {/* Metric c: Excess vs Risk-Free */}
          <div className="rounded-lg border border-white/[.06] bg-black/30 p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9aa0ac]">
              Excess vs Risk-Free
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${
                bench.excessVsRiskFreePct >= 0 ? 'text-emerald-400' : 'text-orange-400'
              }`}
            >
              {formatPct(bench.excessVsRiskFreePct)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0ac]">Di atas SBN / BI Rate 6.25%</p>
          </div>

          {/* Metric d: Sharpe Ratio */}
          <div className="rounded-lg border border-white/[.06] bg-black/30 p-3.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#9aa0ac]">
              Sharpe Ratio (Est.)
            </p>
            <p
              className={`mt-1 text-lg font-semibold tabular-nums ${
                bench.sharpeRatio >= 1.0
                  ? 'text-emerald-400'
                  : bench.sharpeRatio >= 0.5
                    ? 'text-amber-300'
                    : 'text-white'
              }`}
            >
              {bench.sharpeRatio.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9aa0ac]">
              Volatilitas portofolio: {bench.estimatedVolatilityPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Sub-panel 2: Target Profil Risiko & Alokasi Target (Top-Up Rebalancing) */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9aa0ac]">
              Target Profil Risiko & Alokasi Target
            </h4>
            <div className="mt-2 flex items-center gap-2">
              {(['conservative', 'balanced', 'aggressive'] as RiskProfileKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProfile(p)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    profile === p
                      ? 'bg-emerald-500 font-semibold text-black'
                      : 'border border-white/10 bg-white/[.02] text-white hover:bg-white/[.05]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-72">
            <label className="block text-[10px] uppercase tracking-wider text-[#646b78]">
              Simulasi Top-Up Dana Baru (Rp)
            </label>
            <input
              type="number"
              placeholder="Contoh: 5000000"
              value={freshCash}
              onChange={(e) => setFreshCash(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                      {{
                        stock: 'Saham',
                        crypto: 'Crypto',
                        bond: 'Obligasi',
                        mutual_fund: 'Reksa Dana',
                        gold: 'Emas',
                      }[d.assetClass] ?? d.assetClass}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-[#c9ced8]">
                      {formatIDR(d.actualValue, { compact: true })}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-white">
                      {d.actualPct.toFixed(1)}% /{' '}
                      <span className="text-[#646b78]">{d.targetPct}%</span>
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums ${
                        d.status === 'OVERWEIGHT'
                          ? 'text-amber-400'
                          : d.status === 'UNDERWEIGHT'
                            ? 'text-cyan-400'
                            : 'text-emerald-400'
                      }`}
                    >
                      {d.driftPct >= 0 ? `+${d.driftPct.toFixed(1)}%` : `${d.driftPct.toFixed(1)}%`}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${badgeColor}`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium tabular-nums text-white">
                      {Math.abs(d.actionAmount) < 1000 ? (
                        <span className="text-[#646b78]">On Target</span>
                      ) : d.actionAmount > 0 ? (
                        <span className="text-cyan-400">
                          Beli +{formatIDR(d.actionAmount, { compact: true })}
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          Trim −{formatIDR(Math.abs(d.actionAmount), { compact: true })}
                        </span>
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

      {/* Sub-panel 3: Market Stress Test / Crash Simulator */}
      <div className="rounded-xl border border-white/[.06] bg-black/20 p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Market Stress Test (What-If Crash Simulator)
            </h4>
            <p className="mt-0.5 text-[11px] text-[#646b78]">
              Simulasi ketahanan portofolio terhadap skenario crash pasar ekstrem
            </p>
          </div>
          <div className="flex items-center gap-2">
            {STRESS_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                onClick={() => {
                  setActivePreset(idx)
                  setSelectedShocks(preset.shocks)
                }}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activePreset === idx
                    ? 'bg-rose-500 font-semibold text-white'
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
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">
              Estimasi Drawdown Portofolio
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-orange-400">
              -{formatIDR(stress.portfolioLoss, { compact: true })}{' '}
              <span className="text-xs font-normal">({formatPct(-stress.portfolioDropPct)})</span>
            </p>
          </div>
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">
              Net Worth Pasca-Crash
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-white">
              {formatIDR(stress.stressedNetWorth, { compact: true })}
            </p>
          </div>
          <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#646b78]">
              DAR Pasca-Crash
            </p>
            <p
              className={`mt-2 text-xl font-semibold tabular-nums ${
                stress.stressedDarPct < 30 ? 'text-emerald-400' : 'text-orange-400'
              }`}
            >
              {stress.stressedDarPct.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
