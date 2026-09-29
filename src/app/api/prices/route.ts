import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase()
  if (!symbol) return NextResponse.json({ price: null })

  try {
    if (symbol.endsWith('.JK')) {
      // Yahoo stock (IDX)
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      )
      const json = await res.json()
      const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (price != null) return NextResponse.json({ price })
    } else {
      // Binance crypto — try the IDR pair directly
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}IDR`)
      if (res.ok) {
        const json = await res.json()
        if (json?.price) return NextResponse.json({ price: Number(json.price) })
      }
      // Fallback: CoinGecko
      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=idr`,
      )
      if (cgRes.ok) {
        const cgJson = await cgRes.json()
        const id = Object.keys(cgJson)[0]
        if (cgJson[id]?.idr) return NextResponse.json({ price: cgJson[id].idr })
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ price: null })
}
