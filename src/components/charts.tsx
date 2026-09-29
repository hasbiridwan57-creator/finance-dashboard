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
                  {pl >= 0 ? '+' : ''}
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
