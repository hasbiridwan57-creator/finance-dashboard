// Generate seed SQL from the same deterministic generator the demo mode uses.
// Usage: npx tsx scripts/gen-seed-sql.ts > supabase/seed.sql
import { generateTransactions, generateHoldings, generateAccounts } from '../src/lib/seed-data'

const txs = generateTransactions()
const holdings = generateHoldings()
const accounts = generateAccounts()

// Resolve category name -> id at insert time via subselect.
const lines: string[] = []
lines.push('-- Auto-generated from src/lib/seed-data.ts (deterministic seed)')
lines.push('-- Demo data: user_id IS NULL so the public anon key can read it.')
lines.push('begin;')
lines.push('delete from transactions; delete from holdings; delete from accounts;')
lines.push('')

lines.push('insert into transactions (user_id, amount, type, category_id, description, date, account, source)')
lines.push('values')
txs.forEach((t, i) => {
  const catSafe = t.category.replace(/'/g, "''")
  const descSafe = t.description.replace(/'/g, "''")
  const tail = i === txs.length - 1 ? ';' : ','
  lines.push(
    `  (null, ${t.amount}, '${t.type}', (select id from categories where name = '${catSafe}'), '${descSafe}', '${t.date}', '${t.account}', '${t.source}')${tail}`,
  )
})
lines.push('')

lines.push('insert into holdings (user_id, symbol, name, asset_class, quantity, avg_buy_price, current_price)')
lines.push('values')
holdings.forEach((h, i) => {
  const tail = i === holdings.length - 1 ? ';' : ','
  lines.push(
    `  (null, '${h.symbol}', '${h.name.replace(/'/g, "''")}', '${h.asset_class}', ${h.quantity}, ${h.avg_buy_price}, ${h.current_price})${tail}`,
  )
})
lines.push('')

lines.push('insert into accounts (user_id, name, kind, balance, institution)')
lines.push('values')
accounts.forEach((a, i) => {
  const inst = a.institution ? `'${a.institution.replace(/'/g, "''")}'` : 'null'
  const tail = i === accounts.length - 1 ? ';' : ','
  lines.push(`  (null, '${a.name}', '${a.kind}', ${a.balance}, ${inst})${tail}`)
})
lines.push('')
lines.push('commit;')
lines.push('')
lines.push('-- Public demo read access (user_id IS NULL rows only).')
lines.push('drop policy if exists "demo transactions readable" on transactions;')
lines.push('create policy "demo transactions readable" on transactions for select using (user_id is null);')
lines.push('drop policy if exists "demo holdings readable" on holdings;')
lines.push('create policy "demo holdings readable" on holdings for select using (user_id is null);')
lines.push('drop policy if exists "demo accounts readable" on accounts;')
lines.push('create policy "demo accounts readable" on accounts for select using (user_id is null);')
lines.push('')

console.log(lines.join('\n'))
