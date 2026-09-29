-- Sinkronisasi saldo akun setiap transaksi baru.
-- Income: balance += amount. Expense: balance -= amount.

create or replace function public.bump_account_balance(
  p_uid uuid,
  p_account text,
  p_delta numeric
)
returns void
language sql
security definer
set search_path = public
as $$
  update accounts
  set balance = balance + p_delta,
      updated_at = now()
  where user_id = p_uid
    and name = p_account;
$$;

comment on function public.bump_account_balance is
  'Adjust an account balance by a signed delta. Called after inserting a transaction.';
