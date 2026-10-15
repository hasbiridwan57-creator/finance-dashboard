import { NextResponse } from 'next/server'
import { fetchGoldPerGram } from '@/lib/finance/prices'

const GOLD_SYMBOLS = new Set(['EMAS', 'GOLD', 'ANTM', 'UBS', 'XAU', 'XAUUSD', 'XAUIDR', 'LOGAMMULIA', 'DIGITALGOLD', 'GALERI24', 'LOGAM24', 'PEGADAIAN', 'EMASDIGITAL'])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase()
  if (!symbol) return NextResponse.json({ price: null })

  try {
    if (GOLD_SYMBOLS.has(symbol)) {
      const goldPx = await fetchGoldPerGram()
      if (goldPx != null) return NextResponse.json({ price: goldPx })
    }

    // 1. Automatic Gold Price (IDR per gram) from Yahoo Finance GC=F & USDIDR=X
    if (['EMAS', 'GOLD', 'ANTM', 'UBS', 'XAU'].includes(symbol)) {
      const [goldRes, fxRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1d&range=1d', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        }),
      ])

      const goldJson = await goldRes.json()
      const fxJson = await fxRes.json()

      const goldUsd = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice
      const usdIdr = fxJson?.chart?.result?.[0]?.meta?.regularMarketPrice

      if (goldUsd && usdIdr) {
        // 1 troy oz = 31.1034768 grams
        const pricePerGramIdr = Math.round((goldUsd * usdIdr) / 31.1034768)
        return NextResponse.json({ price: pricePerGramIdr })
      }
    }

    // 2. Government Retail Bonds (ORI, SR, FR, PBS) -> Par value default Rp 1,000,000 or 100%
    if (/^(ORI|SR|FR|PBS)\d+/i.test(symbol) || symbol.startsWith('OBL')) {
      return NextResponse.json({ price: 1000000 })
    }

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
