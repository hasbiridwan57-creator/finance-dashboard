'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addTransaction(input: {
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  account: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  // Validasi: amount harus positif
  if (!(input.amount > 0)) return { error: 'Nominal harus lebih dari 0.' }

  // Validasi: akun harus ada & milik user
  const { data: acc } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', input.account)
    .maybeSingle()
  if (!acc) return { error: 'Akun tidak ditemukan. Pilih akun yang tersedia.' }

  // Resolve category name → id (categories are a shared lookup table).
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('name', input.category)
    .maybeSingle()

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount: input.amount,
    type: input.type,
    category_id: cat?.id ?? null,
    description: input.description,
    date: input.date,
    account: input.account,
    source: 'manual',
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  // Keep the matching account balance in sync: income adds, expense subtracts.
  if (input.amount > 0) {
    const delta = input.type === 'income' ? input.amount : -input.amount
    await supabase.rpc('bump_account_balance', {
      p_uid: user.id,
      p_account: input.account,
      p_delta: delta,
    })
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // defense-in-depth: RLS already enforces this

  if (error) return { error: 'Gagal menghapus.' }

  revalidatePath('/')
  return { error: null }
}

export async function addHolding(input: {
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
  sourceAccount?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const symbol = input.symbol.trim().toUpperCase()

  // Validasi: quantity & harga harus positif
  if (!(input.quantity > 0)) return { error: 'Jumlah unit harus lebih dari 0.' }
  if (!(input.avg_buy_price > 0)) return { error: 'Harga beli harus lebih dari 0.' }

  const totalCost = input.quantity * input.avg_buy_price

  // Validasi: akun sumber dana harus ada & milik user
  if (input.sourceAccount) {
    const { data: srcAcc } = await supabase
      .from('accounts')
      .select('id, balance, kind')
      .eq('user_id', user.id)
      .eq('name', input.sourceAccount)
      .maybeSingle()
    if (!srcAcc) return { error: 'Akun sumber dana tidak ditemukan.' }
    if (srcAcc.kind === 'debt') return { error: 'Tidak bisa memotong dari akun utang.' }
    if (Number(srcAcc.balance) < totalCost)
      return { error: `Saldo ${input.sourceAccount} tidak cukup untuk pembelian ini.` }
  }

  // Jika user memilih akun sumber dana, potong saldo akun tersebut secara atomik
  if (input.sourceAccount && totalCost > 0) {
    await supabase.rpc('bump_account_balance', {
      p_uid: user.id,
      p_account: input.sourceAccount,
      p_delta: -totalCost, // Mengurangi kas
    })
  }

  let assetClass = input.asset_class
  let name = input.name
  if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE', 'USDT', 'SUI'].includes(symbol)) {
    assetClass = 'crypto'
    if (symbol === 'ETH') name = 'Ethereum'
    if (symbol === 'BTC') name = 'Bitcoin'
    if (symbol === 'SOL') name = 'Solana'
    if (symbol === 'SUI') name = 'Sui'
  }

  // Merge into an existing position of the same symbol: weighted-average cost.
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, quantity, avg_buy_price, name, asset_class')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .maybeSingle()

  if (existing) {
    const oldQty = Number(existing.quantity)
    const oldAvg = Number(existing.avg_buy_price)
    const newQty = oldQty + input.quantity
    const newAvg =
      newQty > 0 ? (oldQty * oldAvg + input.quantity * input.avg_buy_price) / newQty : input.avg_buy_price

    const { error } = await supabase
      .from('holdings')
      .update({
        quantity: newQty,
        avg_buy_price: newAvg,
        // Refresh the name/class only when the new input carries one.
        name: name || existing.name,
        asset_class: assetClass || existing.asset_class,
      })
      .eq('id', existing.id)

    if (error) return { error: 'Gagal menyimpan. Coba lagi.' }
    revalidatePath('/')
    return { error: null }
  }

  const { error } = await supabase.from('holdings').insert({
    user_id: user.id,
    symbol,
    name: name,
    asset_class: assetClass,
    quantity: input.quantity,
    avg_buy_price: input.avg_buy_price,
    // current_price defaults to avg; the dashboard overwrites it live on render.
    current_price: input.avg_buy_price,
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function updateHolding(input: {
  id: string
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  let assetClass = input.asset_class
  let name = input.name
  const sym = input.symbol.trim().toUpperCase()
  if (['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOGE', 'USDT'].includes(sym)) {
    assetClass = 'crypto'
    if (sym === 'ETH') name = 'Ethereum'
    if (sym === 'BTC') name = 'Bitcoin'
    if (sym === 'SOL') name = 'Solana'
  }

  const { error } = await supabase
    .from('holdings')
    .update({
      symbol: sym,
      name,
      asset_class: assetClass,
      quantity: input.quantity,
      avg_buy_price: input.avg_buy_price,
    })
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function deleteHolding(input: { id: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', input.id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gagal menghapus. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export async function addAccount(input: {
  name: string
  kind: string
  balance: number
  institution?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.' }

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id,
    name: input.name.trim(),
    kind: input.kind,
    balance: input.balance,
    institution: input.institution?.trim() || null,
  })

  if (error) return { error: 'Gagal menyimpan. Coba lagi.' }

  revalidatePath('/')
  return { error: null }
}

export interface ImportRow {
  symbol: string
  name: string
  asset_class: string
  quantity: number
  avg_buy_price: number
}

export interface ImportRowError {
  row: number // nomor baris data (1-based, tanpa header)
  message: string
}

const VALID_ASSET_CLASS = new Set([
  'stock',
  'crypto',
  'mutual_fund',
  'bond',
  'gold',
])

/** Simbol yang selalu dipaksa menjadi kelas aset crypto + nama resminya. */
const CRYPTO_SYMBOLS: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  USDT: 'Tether',
  SUI: 'Sui',
}

/**
 * Import massal portofolio dari file CSV/Excel.
 *
 * - Validasi per baris: baris yang rusak TIDAK menggagalkan seluruh import —
 *   dikumpulkan lalu dilaporkan agar pengguna tahu baris mana yang dilewati.
 * - Posisi dengan simbol yang sama sudah ada akan digabung (weighted-average
 *   cost), konsisten dengan addHolding.
 * - TIDAK memotong saldo akun: ini import riwayat kepemilikan, bukan transaksi.
 */
export async function importPortfolio(rows: ImportRow[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Belum login.', inserted: 0, merged: 0, skipped: [] as ImportRowError[] }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { error: 'Tidak ada baris untuk diimport.', inserted: 0, merged: 0, skipped: [] }
  }
  if (rows.length > 500) {
    return { error: 'Maksimal 500 baris per import.', inserted: 0, merged: 0, skipped: [] }
  }

  const skipped: ImportRowError[] = []
  const prepared: Required<ImportRow>[] = []

  rows.forEach((raw, i) => {
    const rowNo = i + 1
    const symbol = String(raw?.symbol ?? '').trim().toUpperCase()
    if (!symbol) return skipped.push({ row: rowNo, message: 'Symbol kosong.' })
    if (symbol.length > 32) return skipped.push({ row: rowNo, message: 'Symbol terlalu panjang (maks 32).' })

    const qty = Number(raw?.quantity)
    if (!Number.isFinite(qty) || qty <= 0)
      return skipped.push({ row: rowNo, message: 'Jumlah unit harus angka > 0.' })

    const avg = Number(raw?.avg_buy_price)
    if (!Number.isFinite(avg) || avg <= 0)
      return skipped.push({ row: rowNo, message: 'Harga beli rata-rata harus angka > 0.' })

    let assetClass = String(raw?.asset_class ?? '').trim().toLowerCase()
    if (CRYPTO_SYMBOLS[symbol]) assetClass = 'crypto'
    if (!VALID_ASSET_CLASS.has(assetClass)) assetClass = 'stock'

    const name =
      CRYPTO_SYMBOLS[symbol] ??
      String(raw?.name ?? '').trim() ??
      symbol

    prepared.push({
      symbol,
      name: name || symbol,
      asset_class: assetClass,
      quantity: qty,
      avg_buy_price: avg,
    })
  })

  if (prepared.length === 0) {
    return { error: null, inserted: 0, merged: 0, skipped }
  }

  // Ambil posisi lama user untuk simbol-simbol ini (sekali query, bukan per baris).
  const symbols = prepared.map((p) => p.symbol)
  const { data: existingRows, error: selErr } = await supabase
    .from('holdings')
    .select('id, symbol, quantity, avg_buy_price')
    .eq('user_id', user.id)
    .in('symbol', symbols)

  if (selErr) return { error: 'Gagal membaca portofolio lama.', inserted: 0, merged: 0, skipped }

  const existingMap = new Map(
    (existingRows ?? []).map((r) => [r.symbol, r]),
  )

  // Kelompokkan input per simbol agar baris duplikat dalam 1 file digabung.
  const merged = new Map<string, { qty: number; cost: number; name: string; asset_class: string }>()
  for (const p of prepared) {
    const prev = merged.get(p.symbol)
    if (prev) {
      prev.qty += p.quantity
      prev.cost += p.quantity * p.avg_buy_price
      if (!prev.name) prev.name = p.name
    } else {
      merged.set(p.symbol, {
        qty: p.quantity,
        cost: p.quantity * p.avg_buy_price,
        name: p.name,
        asset_class: p.asset_class,
      })
    }
  }

  const inserts: unknown[] = []
  let mergedCount = 0
  const updates: PromiseLike<{ error: unknown }>[] = []

  for (const [symbol, agg] of merged) {
    const avg = agg.qty > 0 ? agg.cost / agg.qty : 0
    const old = existingMap.get(symbol)

    if (old) {
      // Gabung dengan posisi lama (weighted-average cost), konsisten addHolding.
      const oldQty = Number(old.quantity)
      const oldAvg = Number(old.avg_buy_price)
      const newQty = oldQty + agg.qty
      const newAvg =
        newQty > 0 ? (oldQty * oldAvg + agg.cost) / newQty : avg
      mergedCount++
      updates.push(
        supabase
          .from('holdings')
          .update({ quantity: newQty, avg_buy_price: newAvg })
          .eq('id', old.id)
          .eq('user_id', user.id),
      )
    } else {
      inserts.push({
        user_id: user.id,
        symbol,
        name: agg.name || symbol,
        asset_class: agg.asset_class,
        quantity: agg.qty,
        avg_buy_price: avg,
        // current_price = avg sampai harga live menimpanya saat render.
        current_price: avg,
      })
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase.from('holdings').insert(inserts)
    if (error) return { error: 'Gagal menyimpan portofolio. Coba lagi.', inserted: 0, merged: 0, skipped }
  }

  const updResults = await Promise.all(updates)
  const updFailed = updResults.filter((r) => r.error)
  if (updFailed.length > 0) {
    return { error: `Gagal memperbarui ${updFailed.length} posisi lama.`, inserted: inserts.length, merged: mergedCount - updFailed.length, skipped }
  }

  revalidatePath('/')
  return { error: null, inserted: inserts.length, merged: mergedCount, skipped }
}
