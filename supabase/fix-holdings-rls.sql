-- Holdings: ganti policy select is_owner_or_demo dengan user-scoped.
-- (Transactions & accounts sudah diperbaiki sebelumnya.)

drop policy if exists "users can read own holdings" on holdings;
drop policy if exists "demo holdings readable" on holdings;

create policy "users can read own holdings" on holdings
  for select using (
    auth.uid() = user_id
    or (auth.uid() is null and user_id is null)
  );
