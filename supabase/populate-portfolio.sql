-- Script populate portofolio lengkap untuk akun hasbiridwan57@gmail.com
DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'hasbiridwan57@gmail.com' LIMIT 1;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'User tidak ditemukan!'; END IF;

  DELETE FROM holdings WHERE user_id = v_uid;

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
