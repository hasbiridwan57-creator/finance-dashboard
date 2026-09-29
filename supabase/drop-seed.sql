-- Opsi A: akun baru mulai kosong. Drop trigger auto-seed + hapus semua row hasil seed.

begin;

-- 1. Hapus trigger auto-seed pas signup baru.
drop trigger if exists on_auth_user_created on auth.users;

-- 2. Hapus function seed-nya.
drop function if exists private.seed_new_user();

-- 3. Kosongkan template seed (dibiarkan kosong, bukan di-drop, agar tidak mengganggu skema).
delete from private.seed_transactions;
delete from private.seed_holdings;
delete from private.seed_accounts;

-- 4. Hapus SEMUA data user yang sudah di-seed.
--    (Gaji bulanan / template description dari seed-trigger.)
delete from transactions where source = 'import';
delete from holdings;
delete from accounts;

commit;

-- Verifikasi: harus 0 semua.
select
  (select count(*) from transactions) as tx,
  (select count(*) from holdings)      as holdings,
  (select count(*) from accounts)      as accounts;
