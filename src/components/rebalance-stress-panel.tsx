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
