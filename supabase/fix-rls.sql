-- Fix RLS: user login hanya boleh baca row miliknya sendiri.
-- Demo dataset (user_id IS NULL) hanya untuk anonymous.
-- (Sebelumnya is_owner_or_demo mengizinkan user lain baca data user lain.)

-- Transactions
drop policy if exists "users can read own transactions" on transactions;
drop policy if exists "demo transactions readable" on transactions;
create policy "users can read own transactions" on transactions
  for select using (
    auth.uid() = user_id
    or (auth.uid() is null and user_id is null)
  );

-- Holdings
drop policy if exists "users can read own holdings" on holdings;
drop policy if exists "demo holdings readable" on holdings;
create policy "users can read own holdings" on holdings
  for select using (
    auth.uid() = user_id
    or (auth.uid() is null and user_id is null)
  );

-- Accounts
drop policy if exists "users can read own accounts" on accounts;
drop policy if exists "demo accounts readable" on accounts;
create policy "users can read own accounts" on accounts
  for select using (
    auth.uid() = user_id
    or (auth.uid() is null and user_id is null)
  );
