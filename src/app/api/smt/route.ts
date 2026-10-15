import { NextResponse } from 'next/server'
import { getSmtTrades } from '@/lib/finance/data'

export async function GET() {
  const trades = await getSmtTrades()
  return NextResponse.json({ trades, source: 'single-source-of-truth' })
}
