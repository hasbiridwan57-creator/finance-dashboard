-- Personal Finance Dashboard — v1 schema
-- Dummy-realistic data for a fresh-graduate finance/automation profile

-- Categories (expenses)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('expense','income','investment')),
  color text not null default '#10b981',
  created_at timestamptz default now()
);

-- Transactions (cash flow: income + expense)
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  amount numeric(18,2) not null,
  type text not null check (type in ('income','expense')),
  category_id uuid references categories(id),
  description text not null,
  date date not null,
  account text not null default 'BCA',
  source text not null default 'manual' check (source in ('manual','import','api')),
  created_at timestamptz default now()
);

create index if not exists idx_transactions_user_date on transactions(user_id, date desc);
create index if not exists idx_transactions_category on transactions(category_id);
create index if not exists idx_transactions_type_date on transactions(type, date);

-- Investment holdings (portfolio)
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null,
  asset_class text not null check (asset_class in ('stock','crypto','mutual_fund','bond','gold')),
  quantity numeric(18,8) not null default 0,
  avg_buy_price numeric(18,2) not null default 0,
  current_price numeric(18,2) not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_holdings_user_symbol on holdings(user_id, symbol);

-- Accounts (net worth: assets - liabilities)
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('bank','ewallet','investment','cash','debt')),
  balance numeric(18,2) not null default 0,
  institution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (single-user: only owner sees own data)
alter table transactions enable row level security;
alter table holdings enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;

-- RLS policies: public categories table readable, user-scoped otherwise
create policy "categories are readable by everyone" on categories
  for select using (true);

create policy "users can read own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "users can insert own transactions" on transactions
  for insert with check (auth.uid() = user_id);
create policy "users can update own transactions" on transactions
  for update using (auth.uid() = user_id);
create policy "users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

create policy "users can read own holdings" on holdings
  for select using (auth.uid() = user_id);
create policy "users can insert own holdings" on holdings
  for insert with check (auth.uid() = user_id);
create policy "users can update own holdings" on holdings
  for update using (auth.uid() = user_id);
create policy "users can delete own holdings" on holdings
  for delete using (auth.uid() = user_id);

create policy "users can read own accounts" on accounts
  for select using (auth.uid() = user_id);
create policy "users can insert own accounts" on accounts
  for insert with check (auth.uid() = user_id);
create policy "users can update own accounts" on accounts
  for update using (auth.uid() = user_id);
create policy "users can delete own accounts" on accounts
  for delete using (auth.uid() = user_id);

-- Realtime: enable change broadcast for auto-refresh dashboard
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table holdings;
alter publication supabase_realtime add table accounts;

-- Seed categories (Indonesian fresh-graduate profile)
insert into categories (name, type, color) values
  ('Gaji', 'income', '#22c55e'),
  ('Freelance', 'income', '#84cc16'),
  ('Makan & Minum', 'expense', '#f97316'),
  ('Transport', 'expense', '#3b82f6'),
  ('Kuliah', 'expense', '#a855f7'),
  ('Belanja', 'expense', '#ec4899'),
  ('Hiburan', 'expense', '#eab308'),
  ('Kesehatan', 'expense', '#14b8a6'),
  ('Tagihan', 'expense', '#ef4444'),
  ('Lainnya', 'expense', '#64748b'),
  ('Investasi', 'investment', '#10b981')
on conflict (name) do nothing;
