-- Script populate history 3 bulan untuk akun hasbiridwan57@gmail.com
DO $$
DECLARE
  v_uid uuid;
  v_date date := (current_date - interval '3 months');
BEGIN
  -- Ambil UUID user berdasarkan email
  SELECT id INTO v_uid FROM auth.users WHERE email = 'hasbiridwan57@gmail.com' LIMIT 1;
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'User hasbiridwan57@gmail.com tidak ditemukan!';
  END IF;

  -- Bersihkan data lama user ini (idempoten)
  DELETE FROM transactions WHERE user_id = v_uid;
  DELETE FROM holdings   WHERE user_id = v_uid;
  DELETE FROM accounts   WHERE user_id = v_uid;

  -- Insert dummy account
  INSERT INTO accounts (user_id, name, kind, balance, institution)
  VALUES (v_uid, 'BCA', 'bank', 50000000, 'Bank BCA');

  -- Loop 3 bulan transaksi (gaji tiap 30 hari + pengeluaran harian)
  FOR i IN 0..90 LOOP
    IF i % 30 = 0 THEN
      INSERT INTO transactions (user_id, account, type, amount, date, description)
      VALUES (v_uid, 'BCA', 'income', 15000000, v_date + (i * interval '1 day'), 'Gaji Bulanan');
    END IF;
    
    INSERT INTO transactions (user_id, account, type, amount, date, description)
    VALUES (v_uid, 'BCA', 'expense', 350000, v_date + (i * interval '1 day'), 'Belanja Harian');
  END LOOP;

  -- Insert holdings (BBCA & BTC)
  INSERT INTO holdings (user_id, symbol, name, asset_class, quantity, avg_buy_price, current_price)
  VALUES 
    (v_uid, 'BBCA.JK', 'Bank Central Asia Tbk.', 'stock', 200, 5800, 6150),
    (v_uid, 'BTC', 'Bitcoin', 'crypto', 0.1, 1000000000, 1400000000);
END $$;
