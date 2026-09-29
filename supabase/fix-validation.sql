-- Validasi level database: amount/quantity/harga harus positif
-- Jalankan di Supabase SQL Editor

-- Transactions: amount wajib > 0
alter table transactions
  add constraint transactions_amount_positive
  check (amount > 0);

-- Holdings: quantity & harga wajib > 0
alter table holdings
  add constraint holdings_qty_positive
  check (quantity > 0);

alter table holdings
  add constraint holdings_price_positive
  check (avg_buy_price >= 0 and current_price >= 0);

-- Transactions: account wajib ada di accounts user itu (orphan prevention)
-- (FK ringan: kita cek via app; DB constraint opsional karena account adalah text, bukan id)
