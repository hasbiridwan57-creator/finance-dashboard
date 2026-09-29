-- Auto-seed demo dataset for every newly registered user.
-- Fires once on INSERT into auth.users, in the same transaction.

-- ════════════════════════════════════════════════════════════════════════
-- Seedable row templates
-- ════════════════════════════════════════════════════════════════════════
create table if not exists private.seed_accounts (
  name text not null,
  kind text not null,
  balance numeric(18,2) not null,
  institution text
);

create table if not exists private.seed_holdings (
  symbol text not null,
  name text not null,
  asset_class text not null,
  quantity numeric(18,8) not null,
  avg_buy_price numeric(18,2) not null,
  current_price numeric(18,2) not null
);

create table if not exists private.seed_transactions (
  category_name text not null,
  type text not null check (type in ('income','expense')),
  amount numeric(18,2) not null,
  description text not null,
  day_of_month int not null check (day_of_month between 1 and 28),
  account text not null
);

-- ═══════════════ TS generator mirrors (Indonesian fresh-graduate profile)
insert into private.seed_accounts (name, kind, balance, institution) values
  ('BCA',             'bank',       52_400_000, 'Bank BCA'),
  ('GoPay',           'ewallet',     3_250_000, 'Gojek'),
  ('Reksadana Bibit', 'investment',  8_900_000, 'Bibit'),
  ('Cash',            'cash',        1_800_000, null),
  ('Kartu Kredit',    'debt',       -4_200_000, 'BCA')
on conflict do nothing;

insert into private.seed_holdings (symbol, name, asset_class, quantity, avg_buy_price, current_price) values
  ('BBCA', 'Bank Central Asia',  'stock',    320,   8150,        9420),
  ('ANTM', 'Aneka Tambang',      'stock',   1500,   1680,        1520),
  ('BTC',  'Bitcoin',            'crypto',  0.085,  920_000_000, 1_080_000_000),
  ('ETH',  'Ethereum',           'crypto',  1.4,    38_500_000,  41_200_000),
  ('ORI',  'Obligasi Republik Indonesia', 'bond', 10, 1_000_000, 1_040_000)
on conflict do nothing;

insert into private.seed_transactions (category_name, type, amount, description, day_of_month, account) values
  ('Gaji',          'income',  6_500_000, 'Gaji bulanan',          25, 'BCA'),
  ('Freelance',     'income',    900_000, 'Jasa website UMKM',      8, 'OVO'),
  ('Makan & Minum', 'expense',    18_000, 'Makan siang',            12, 'GoPay'),
  ('Makan & Minum', 'expense',    27_500, 'GrabFood',               19, 'GoPay'),
  ('Transport',     'expense',    12_000, 'Gojek ke kantor',        3, 'GoPay'),
  ('Transport',     'expense',     8_500, 'Isi bensin',            22, 'Cash'),
  ('Tagihan',       'expense',   350_000, 'Listrik PLN',           10, 'BCA'),
  ('Tagihan',       'expense',   185_000, 'Internet IndiHome',     15, 'BCA'),
  ('Belanja',       'expense',    99_000, 'Belanja bulanan',        7, 'BCA'),
  ('Hiburan',       'expense',    75_000, 'Netflix',              20, 'BCA'),
  ('Kesehatan',     'expense',   150_000, 'Vitamin & suplemen',    24, 'GoPay'),
  ('Kuliah',        'expense',   250_000, 'Buku kuliah',           17, 'BCA')
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════════
-- The trigger
-- ════════════════════════════════════════════════════════════════════════

create or replace function private.seed_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := new.id;
begin
  -- Accounts + holdings: straight template copies.
  insert into accounts (user_id, name, kind, balance, institution)
  select v_uid, name, kind, balance, institution
  from private.seed_accounts;

  insert into holdings (user_id, symbol, name, asset_class, quantity, avg_buy_price, current_price)
  select v_uid, symbol, name, asset_class, quantity, avg_buy_price, current_price
  from private.seed_holdings;

  -- Transactions: repeat the monthly template across the last 6 months.
  insert into transactions (user_id, amount, type, category_id, description, date, account, source)
  select v_uid,
         st.amount,
         st.type,
         c.id,
         st.description,
         -- same day-of-month, N months back
         (date_trunc('month', now()) - make_interval(months => g.months_back)
          + make_interval(days => st.day_of_month - 1))::date,
         st.account,
         'import'
  from private.seed_transactions st
  join categories c on c.name = st.category_name
  cross join generate_series(0, 5) as g(months_back);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.seed_new_user();
