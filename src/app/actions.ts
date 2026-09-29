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
