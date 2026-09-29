-- Script populate lengkap 3 bulan: Multi Akun, Multi Kategori Pengeluaran, Multi Holdings (Saham & Crypto)
DO $$
DECLARE
  v_uid uuid;
  v_date date := (current_date - interval '3 months');
  -- Kategori IDs
  v_cat_gaji uuid;
  v_cat_freelance uuid;
  v_cat_makan uuid;
  v_cat_transport uuid;
  v_cat_kuliah uuid;
  v_cat_belanja uuid;
  v_cat_hiburan uuid;
  v_cat_tagihan uuid;
BEGIN
  -- 1. Ambil UUID user berdasarkan email
  SELECT id INTO v_uid FROM auth.users WHERE email = 'hasbiridwan57@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'User hasbiridwan57@gmail.com tidak ditemukan!'; END IF;

  -- Bersihkan data lama user ini (idempoten)
  DELETE FROM transactions WHERE user_id = v_uid;
  DELETE FROM holdings   WHERE user_id = v_uid;
  DELETE FROM accounts   WHERE user_id = v_uid;

  -- 2. Ambil ID kategori dari tabel categories
  SELECT id INTO v_cat_gaji       FROM categories WHERE name = 'Gaji' LIMIT 1;
  SELECT id INTO v_cat_freelance  FROM categories WHERE name = 'Freelance' LIMIT 1;
  SELECT id INTO v_cat_makan      FROM categories WHERE name = 'Makan & Minum' LIMIT 1;
  SELECT id INTO v_cat_transport  FROM categories WHERE name = 'Transport' LIMIT 1;
  SELECT id INTO v_cat_kuliah     FROM categories WHERE name = 'Kuliah' LIMIT 1;
  SELECT id INTO v_cat_belanja    FROM categories WHERE name = 'Belanja' LIMIT 1;
  SELECT id INTO v_cat_hiburan    FROM categories WHERE name = 'Hiburan' LIMIT 1;
  SELECT id INTO v_cat_tagihan    FROM categories WHERE name = 'Tagihan' LIMIT 1;

  -- 3. Insert Multi Akun (Bank, E-Wallet, Utang/Kartu Kredit)
  INSERT INTO accounts (user_id, name, kind, balance, institution)
  VALUES 
    (v_uid, 'BCA Utama', 'bank', 12500000, 'Bank BCA'),
    (v_uid, 'GoPay', 'ewallet', 750000, 'Gojek'),
    (v_uid, 'OVO', 'ewallet', 450000, 'OVO'),
    (v_uid, 'Tunai Dompet', 'cash', 300000, NULL),
    (v_uid, 'PayLater / Cicilan', 'debt', -1500000, 'BCA Blibli');

  -- 4. Insert 3 Bulan Transaksi Beragam Kategori
  -- Bulan 1, 2, 3 (90 hari)
  FOR i IN 0..90 LOOP
    -- Pemasukan Gaji tiap tanggal 1 (asumsi i = 0, 30, 60)
    IF i % 30 = 0 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'BCA Utama', 'income', v_cat_gaji, 12000000, v_date + (i * interval '1 day'), 'Gaji Bulanan PT Tech');
    END IF;

    -- Pemasukan Freelance (tiap 15 hari)
    IF i % 15 = 7 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'GoPay', 'income', v_cat_freelance, 2500000, v_date + (i * interval '1 day'), 'Project UI/UX Freelance');
    END IF;
    
    -- Pengeluaran Harian: Makan & Minum (hampir tiap hari)
    INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
    VALUES (v_uid, CASE WHEN i % 2 = 0 THEN 'BCA Utama' ELSE 'GoPay' END, 'expense', v_cat_makan, 45000 + (i % 35000), v_date + (i * interval '1 day'), 'Makan Siang & Kopi');

    -- Pengeluaran Transport (tiap 2 hari)
    IF i % 2 = 0 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'OVO', 'expense', v_cat_transport, 25000 + (i % 15000), v_date + (i * interval '1 day'), 'Ojek Online');
    END IF;

    -- Pengeluaran Kuliah (tiap minggu)
    IF i % 7 = 3 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'BCA Utama', 'expense', v_cat_kuliah, 350000, v_date + (i * interval '1 day'), 'Buku & Modul Kuliah');
    END IF;

    -- Pengeluaran Belanja (tiap 10 hari)
    IF i % 10 = 2 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'BCA Utama', 'expense', v_cat_belanja, 650000, v_date + (i * interval '1 day'), 'Belanja Bulanan Supermarket');
    END IF;

    -- Pengeluaran Hiburan (tiap 12 hari)
    IF i % 12 = 5 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'OVO', 'expense', v_cat_hiburan, 150000, v_date + (i * interval '1 day'), 'Nonton Bioskop / Cafe');
    END IF;

    -- Pengeluaran Tagihan (tiap bulan sekali, misal i = 5)
    IF i = 5 OR i = 35 OR i = 65 THEN
      INSERT INTO transactions (user_id, account, type, category_id, amount, date, description)
      VALUES (v_uid, 'BCA Utama', 'expense', v_cat_tagihan, 850000, v_date + (i * interval '1 day'), 'Listrik & Wifi Kos');
    END IF;
  END LOOP;

  -- 5. Insert Multi Holdings (Saham & Crypto lengkap)
  INSERT INTO holdings (user_id, symbol, name, asset_class, quantity, avg_buy_price, current_price)
  VALUES 
    (v_uid, 'BBCA.JK', 'Bank Central Asia Tbk.', 'stock', 500, 5800, 6150),
    (v_uid, 'TLKM.JK', 'Telkom Indonesia Tbk.', 'stock', 2000, 3200, 3150),
    (v_uid, 'BMRI.JK', 'Bank Mandiri Tbk.', 'stock', 300, 6200, 6800),
    (v_uid, 'GOTO.JK', 'GoTo Gojek Tokopedia', 'stock', 10000, 85, 68),
    (v_uid, 'BTC', 'Bitcoin', 'crypto', 0.25, 950000000, 1400000000),
    (v_uid, 'ETH', 'Ethereum', 'crypto', 2.5, 35000000, 48000000),
    (v_uid, 'SOL', 'Solana', 'crypto', 20, 1800000, 2400000),
    (v_uid, 'ADA', 'Cardano', 'crypto', 5000, 6500, 8200),
    (v_uid, 'XRP', 'Ripple', 'crypto', 1000, 8500, 9200);

END $$;
