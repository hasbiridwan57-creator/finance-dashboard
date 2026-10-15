import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { TradeEntry } from '@/lib/finance/aggregate'

/**
 * Deterministic fallback dataset for the Smart Money & Quantitative Trading
 * Journal. Used when the local paper-trade ledger is unavailable — which is
 * always the case on Vercel serverless, where `../smart-money-tracker` does not
 * exist. Returning this instead of a 404 keeps the demo panel alive.
 */
const FALLBACK_TRADES: TradeEntry[] = [
  {
    id: 'smt-001',
    timestamp: '2026-09-22T09:15:00+07:00',
    symbol: 'BBCA.JK',
    side: 'BUY',
    entryPrice: 9_450,
    exitPrice: 9_975,
    quantity: 500,
    pnl: 262_500,
    strategy: 'Smart Money Accumulation (Institutional Footprint)',
  },
  {
    id: 'smt-002',
    timestamp: '2026-09-25T10:05:00+07:00',
    symbol: 'BMRI.JK',
    side: 'LONG',
    entryPrice: 5_800,
    exitPrice: 6_125,
    quantity: 1_000,
    pnl: 325_000,
    strategy: 'Breakout Retest + Volume Confirmation',
  },
  {
    id: 'smt-003',
    timestamp: '2026-09-29T14:30:00+07:00',
    symbol: 'BTC',
    side: 'BUY',
    entryPrice: 1_062_000_000,
    exitPrice: 1_118_500_000,
    quantity: 0.05,
    pnl: 2_825_000,
    strategy: 'Liquidity Sweep Reclaim (Higher Timeframe)',
  },
  {
    id: 'smt-004',
    timestamp: '2026-10-01T09:45:00+07:00',
    symbol: 'TLKM.JK',
    side: 'SELL',
    entryPrice: 3_180,
    exitPrice: 3_020,
    quantity: 2_000,
    pnl: -320_000,
    strategy: 'Failed Breakout — Cut Loss Discipline',
  },
  {
    id: 'smt-005',
    timestamp: '2026-10-03T11:20:00+07:00',
    symbol: 'ETH',
    side: 'LONG',
    entryPrice: 61_500_000,
    exitPrice: 64_950_000,
    quantity: 0.4,
    pnl: 1_380_000,
    strategy: 'Smart Money Divergence (Spot CVD vs Price)',
  },
  {
    id: 'smt-006',
    timestamp: '2026-10-07T15:10:00+07:00',
    symbol: 'ASII.JK',
    side: 'BUY',
    entryPrice: 4_850,
    exitPrice: 5_150,
    quantity: 1_500,
    pnl: 450_000,
    strategy: 'Order Block Mitigation Bounce',
  },
  {
    id: 'smt-007',
    timestamp: '2026-10-09T20:40:00+07:00',
    symbol: 'SOL',
    side: 'SHORT',
    entryPrice: 3_350_000,
    exitPrice: 3_512_000,
    quantity: 4,
    pnl: -648_000,
    strategy: 'Mean Reversion Short — Stopped Out on Squeeze',
  },
  {
    id: 'smt-008',
    timestamp: '2026-10-13T09:05:00+07:00',
    symbol: 'BBCA.JK',
    side: 'BUY',
    entryPrice: 9_800,
    exitPrice: 10_275,
    quantity: 800,
    pnl: 380_000,
    strategy: 'Relative Strength vs IHSG Rotation',
  },
]

/** Normalise one raw ledger line into a TradeEntry, tolerant of shape drift. */
function normaliseLine(raw: unknown): TradeEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const symbol = typeof r.symbol === 'string' ? r.symbol : null
  if (!symbol) return null
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0)
  return {
    id: typeof r.id === 'string' ? r.id : undefined,
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date().toISOString(),
    symbol,
    side: (typeof r.side === 'string' ? r.side.toUpperCase() : 'BUY') as TradeEntry['side'],
    entryPrice: num(r.entryPrice ?? r.entry_price),
    exitPrice: num(r.exitPrice ?? r.exit_price),
    quantity: num(r.quantity ?? r.qty),
    pnl: num(r.pnl),
    strategy: typeof r.strategy === 'string' ? r.strategy : undefined,
  }
}

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    '../smart-money-tracker/data/paper_trade_ledger.jsonl',
  )

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      const trades = data
        .trim()
        .split('\n')
        .filter((l) => l.trim() !== '')
        .map((line) => {
          try {
            return normaliseLine(JSON.parse(line))
          } catch {
            return null
          }
        })
        .filter((t): t is TradeEntry => t !== null)

      if (trades.length > 0) {
        return NextResponse.json({ trades: trades.slice(-50), source: 'ledger' })
      }
    }
  } catch {
    // fall through to the deterministic dataset
  }

  return NextResponse.json({ trades: FALLBACK_TRADES, source: 'fallback' })
}