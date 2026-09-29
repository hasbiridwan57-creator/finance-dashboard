/**
 * Live price fetcher: Yahoo Finance (IDX stocks) + CoinGecko (crypto).
 * Mutual funds / unlisted instruments fall back to the stored last price.
 * Everything is denominated in IDR so PL is computed against avg_buy_price.
 */

const UA = 'Mozilla/5.0 (finance-dashboard)'

interface YahooMeta {
  regularMarketPrice: number | null
  currency: string | null
}

async function fetchYahoo(symbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (!symbols.length) return out
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
            sym,
          )}?interval=1d&range=1d`,
          { headers: { 'User-Agent': UA }, next: { revalidate: 60 } },
        )
        if (!res.ok) return
        const json = await res.json()
        const meta = json?.chart?.result?.[0]?.meta as YahooMeta | undefined
        if (meta?.regularMarketPrice != null) out.set(sym, meta.regularMarketPrice)
      } catch {
        // Network/parse failure → keep the stored price.
      }
    }),
  )
  return out
}

const COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  USDT: 'tether',
  SUI: 'sui',
}

/** Crypto pairs Binance quotes directly against IDR. */
const BINANCE_SUPPORTED = new Set([
  'BTCIDR',
  'ETHIDR',
  'BNBIDR',
  'SOLIDR',
  'ADAIDR',
  'DOGEIDR',
  'AVAXIDR',
  'LINKIDR',
  'MATICIDR',
  'DOTIDR',
  'LTCIDR',
  'TRXIDR',
  'XRPIDR',
  'SUIIDR',
])

/**
 * Fetch crypto IDR prices. Tries CoinGecko first; falls back to Binance
 * (IDR pairs) when CoinGecko is rate-limiting (403).
 */
async function fetchCrypto(symbols: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>()

  // --- Binance: bulk ticker, one request --------------------------------
  const binSyms = symbols.filter((s) => !s.toUpperCase().endsWith('IDR'))
  const pairs = binSyms
    .map((s) => `${s.toUpperCase()}IDR`)
    .filter((p) => BINANCE_SUPPORTED.has(p))
  if (pairs.length) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(
          JSON.stringify(pairs),
        )}`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } },
      )
      if (res.ok) {
        const json = (await res.json()) as { symbol: string; price: string }[]
        for (const t of json) {
          const sym = t.symbol.replace(/IDR$/, '')
          const n = Number(t.price)
          if (n > 0) out.set(sym, n)
        }
        if (out.size === binSyms.length) return out // all resolved
      }
    } catch {
      // fall through to CoinGecko
    }
  }

  // --- CoinGecko: ID map -----------------------------------------------
  const ids = symbols.map((s) => COINGECKO_ID[s.toUpperCase()]).filter(Boolean)
  if (ids.length) {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(
          ',',
        )}&vs_currencies=idr`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 60 } },
      )
      if (res.ok) {
        const json = (await res.json()) as Record<string, { idr?: number }>
        for (const sym of symbols) {
          const id = COINGECKO_ID[sym.toUpperCase()]
          // Strict IDR check to avoid USD injection
          if (id && typeof json[id]?.idr === 'number') out.set(sym, json[id].idr!)
        }
      }
    } catch {
      // Keep whatever Binance returned.
    }
  }

  return out
}

export interface PricedHolding {
  id?: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  current_price: number
  /** Fetched live this request; false = stale DB value. */
  live: boolean
}

/**
 * Attach live market prices to holdings. Symbols are mapped by asset class:
 * stocks → Yahoo (`.JK` assumed listed on IDX), crypto → CoinGecko IDR pairs.
 */
export async function applyLivePrices(
  holdings: {
    symbol: string
    name: string
    asset_class: string
    quantity: number
    avg_buy_price: number
    current_price: number
  }[],
): Promise<PricedHolding[]> {
  const stocks = holdings.filter((h) => h.asset_class === 'stock').map((h) => h.symbol)
  const crypto = holdings.filter((h) => h.asset_class === 'crypto').map((h) => h.symbol)

  const [stockPx, cryptoPx] = await Promise.all([
    fetchYahoo(stocks),
    fetchCrypto(crypto),
  ])

  return holdings.map((h) => {
    const livePx =
      h.asset_class === 'stock'
        ? stockPx.get(h.symbol)
        : h.asset_class === 'crypto'
          ? cryptoPx.get(h.symbol.toUpperCase())
          : undefined
    return livePx != null
      ? { ...h, current_price: livePx, live: true }
      : { ...h, live: false }
  })
}
