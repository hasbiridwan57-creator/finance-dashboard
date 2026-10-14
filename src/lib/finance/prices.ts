/**
 * Live price fetcher, all denominated in IDR so PL is computed against avg_buy_price.
 *   stock       -> Yahoo Finance (.JK / IDX)
 *   crypto      -> Binance IDR pairs, CoinGecko fallback
 *   gold        -> COMEX GC=F (USD/oz) x USD/IDR, converted to Rp per gram
 *   bond        -> retail par value (Rp 1.000.000/unit); no public feed exists
 *   mutual_fund -> no public NAV API exists in Indonesia; keeps stored NAV
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

// ---------------------------------------------------------------------------
// Gold (physical / Antam / UBS / digital) — auto-derived IDR per gram.
// Source: COMEX gold futures (GC=F, USD/troy-oz) x USD/IDR rate.
// 1 troy ounce = 31.1034768 grams.
// ---------------------------------------------------------------------------
const GOLD_ALIASES = new Set(['EMAS', 'GOLD', 'ANTAM', 'UBS', 'XAU', 'LOGAMMULIA', 'DIGITALGOLD'])
const TROY_OUNCE_IN_GRAMS = 31.1034768

/** Symbols starting with these prefixes are treated as Indonesian retail bonds. */
const BOND_PREFIX = /^(ORI|SR|FR|PBS|SBSN|SUKUK|ST|SBR|OBL)\d*/i

export async function fetchGoldPerGram(): Promise<number | null> {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/USDIDR=X?interval=1d&range=1d', {
        headers: { 'User-Agent': UA },
        next: { revalidate: 300 },
      }),
    ])
    if (!goldRes.ok || !fxRes.ok) return null
    const goldJson = await goldRes.json()
    const fxJson = await fxRes.json()
    const usdPerOz = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice
    const usdIdr = fxJson?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (typeof usdPerOz !== 'number' || typeof usdIdr !== 'number') return null
    return Math.round((usdPerOz * usdIdr) / TROY_OUNCE_IN_GRAMS)
  } catch {
    return null
  }
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

  // Gold: one network call shared by every gold holding.
  const needsGold = holdings.some(
    (h) => h.asset_class === 'gold' || GOLD_ALIASES.has(h.symbol.toUpperCase()),
  )
  const goldPerGram = needsGold ? await fetchGoldPerGram() : null

  return holdings.map((h) => {
    const sym = h.symbol.toUpperCase()

    // Primary source by declared asset class.
    let livePx: number | undefined
    if (h.asset_class === 'stock') {
      livePx = stockPx.get(h.symbol)
    } else if (h.asset_class === 'crypto') {
      livePx = cryptoPx.get(sym)
    } else if (h.asset_class === 'gold') {
      livePx = goldPerGram ?? undefined
    }

    // Gold aliases act as a FALLBACK only: a symbol like "GOLD" is also a real
    // Yahoo ticker (Barrick Gold Corp), so the declared class wins and the
    // alias only applies when that lookup produced nothing.
    if (livePx == null && (h.asset_class === 'gold' || GOLD_ALIASES.has(sym))) {
      livePx = goldPerGram ?? undefined
    }

    // Retail bonds are quoted at par: Rp 1.000.000 per unit. No public feed
    // exists for Indonesian retail bonds, so fall back to par only when the
    // stored price is unusable.
    if (livePx == null && (h.asset_class === 'bond' || BOND_PREFIX.test(sym))) {
      livePx = h.current_price > 0 ? undefined : 1_000_000
    }

    return livePx != null
      ? { ...h, current_price: livePx, live: true }
      : { ...h, live: false }
  })
}
