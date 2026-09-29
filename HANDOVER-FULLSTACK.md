# Handover: Finance Dashboard → Fullstack

Project: `~/finance-dashboard` (Next.js 16 + Supabase + Tailwind v4)
Supabase project ref: `eurdqmgjmmyevxbznhwv` (org "hasbiridwan57-creator's Org", FREE tier)
Netlify site: `finance-dashboard-hasbi.netlify.app` (siteId 56eecec7-c77f-4850-a1a3-b53aa4ef9eea, team "uiux")
Server lokal: `http://localhost:3001` (background, `npx next start -p 3001`)

---

## Yang SUDAH selesai (kode)

Semua file ini sudah ditulis dan lolos `npx tsc --noEmit`:

- `src/middleware.ts` — refresh session Supabase di setiap navigasi (wajib supaya cookie auth gak kedaluwarsa di Server Component).
- `src/app/auth/page.tsx` — halaman login/signup (dark premium, sesuai design system), redirect ke `/` kalau sudah login.
- `src/app/auth/auth-form.tsx` — client form signUp/signInWithPassword, error message Bahasa Indonesia.
- `src/app/auth/callback/route.ts` — tukar code email redirect jadi session.
- `src/app/actions.ts` — server action `addTransaction` + `deleteTransaction` (cek user login dulu, resolve category name → id, `revalidatePath('/')`).
- `src/components/auth-actions.tsx` — modal tambah transaksi (type toggle, kategori filter, tanggal, akun) + tombol SignOut.
- `src/components/nav.tsx` — nav sidebar smooth-scroll + period toggle 3/6/12 bulan (URL `?months=N`).
- `src/lib/finance/data.ts` — auth-aware: user login → row miliknya; anon → dataset contoh (`user_id IS NULL`).
- `src/app/page.tsx` — header ada tombol "+ Transaksi", link Masuk/nama user; sidebar ada email + tombol Keluar.
- `supabase/schema-v2.sql` — **SUDAH di-run di Supabase SQL editor** (sukses, lewat dialog konfirmasi destructive). Isi: tabel + RLS v2 (policy select pakai `private.is_owner_or_demo()`, insert/update/delete strict `auth.uid() = user_id`, categories public read) + realtime publication.

## Yang BELUM selesai

1. **`supabase/seed-trigger.sql` belum di-run.** Ini trigger `after insert on auth.users` → isi akun/holdings/transaksi contoh otomatis untuk user baru. Isi: tabel template `private.seed_accounts`, `private.seed_holdings`, `private.seed_transactions` + function `private.seed_new_user()` + trigger `on_auth_user_created`. Cara apply: `pbcopy < supabase/seed-trigger.sql` → paste ke SQL editor → Run → konfirmasi dialog destructive.

2. **Auth Supabase belum dicek konfigurasinya.** Pastikan di dashboard → Authentication → Providers: Email **enable**, dan **"Confirm email" bisa OFF** (supaya signup langsung dapet session, gak nunggu klik link email). Kalau tetap ON, signup jadi pending — `AuthForm` sudah handle redirect ke `/` tapi user gak langsung login.

---

## ⚠️ BLOCKER UTAMA: semua key ditolak (HTTP 401)

Status project: **HEALTHY** (sudah dicek user langsung). Tapi API gateway tetap tolak:

```
HTTP 401 · sb-error-code: UNAUTHORIZED_INVALID_API_KEY
{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}
```

Yang sudah dicek (semua 401):
- Legacy anon key (JWT 208 char, `eyJhbG...Dvk`) — sebelumnya pernah **berhasil 200**, dashboard live
- Publishable key `sb_publishable_VIzUmOhZh8bLnW4jnWB5zw_B0jKtotv` (46 char) dari section "Publishable and secret API keys" baris "default"
- Semua varian: `apikey` header, `Authorization: *** query param `?apikey=`, HTTP/1.1, HTTP/2
- Endpoint publik `/auth/v1/health` → 401 juga → **bukan** masalah RLS/policy/schema, tapi gateway tolak di lapis auth
- DNS resolve normal (Cloudflare `104.18.38.10`), header response `sb-project-ref` betul
- Project respond (404 di `/` = path invalid, bukan project mati)

401 mulai muncul setelah run `schema-v2.sql`, tapi project healthy jadi bukan pause.

### ⚠️ DULUAN: secret key BOCOR di chat
User sudah paste `sb_secret_QKsCg...` (service_role) di chat. **WAJIB roll**: Settings → API → Roll API keys. Service_role bypass RLS = akses penuh DB. Jangan pernah paste lagi, jangan taruh di client.

### Step by step buat Claude

**Langkah 1 — buka halaman API keys.**
URL `https://supabase.com/dashboard/project/eurdqmgjmmyevxbznhwv/settings/api` **redirect ke `/integrations/data_api/overview`** (sudah dicek berulang). Navigasi manual: sidebar kiri bawah → **Project Settings** → cari section **API**.
Di halaman Integrations/Data API ada tab **Settings** — itu BUKAN API keys, jangan tertukar.

**Langkah 2 — Roll API keys** (wajib, karena secret bocor).

**Langkah 3 — copy publishable key baru.** Klik ikon **mata** di baris "default" section "Publishable and secret API keys" → copy.
Kalau section ini kosong/gak ada (FREE tier lama) → buka tab **"Legacy anon, service_role API keys"** → generate anon key baru.

**Langkah 4 — test key:**
```bash
curl -s "https://eurdqmgjmmyevxbznhwv.supabase.co/rest/v1/categories?select=name&limit=1" \
  -H "apikey:<KEY>" -w "\nHTTP %{http_code}\n"
```
Harus `HTTP 200` + `[{"name":"Gaji"}]`.

**Langkah 5 — kalau masih 401: Restart project.**
Project Settings → General → **Restart**, tunggu 3 menit, test lagi.
Kalau tetap 401 → coba legacy anon key dari tab "Legacy anon, service_role API keys".

**Langkah 6 — isi `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://eurdqmgjmmyevxbznhwv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<KEY-YANG-200>
```
Nama variabel TETAP `NEXT_PUBLIC_SUPABASE_ANON_KEY` (isinya publishable/legacy anon). `@supabase/supabase-js@2.117.2` + `@supabase/ssr@0.12.7` sudah support format `sb_publishable_` — **tidak perlu update package** (sudah dicek versi).

**Langkah 7 — WAJIB rebuild** (`NEXT_PUBLIC_*` di-baked saat build, bukan runtime):
```bash
pkill -f "next start" 2>/dev/null
cd ~/finance-dashboard && npm run build
npx next start -p 3001   # background
```
Catatan PENTING: `NEXT_PUBLIC_*` di-baked saat **build**, bukan runtime. Setelah ganti `.env.local` WAJIB rebuild, kalau tidak key lama masih nangkring di `.next/`.

Test:
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001` → 200.
- Buka `http://localhost:3001` → harusnya render panel + badge "Live · Supabase" (bukan "Data contoh").
- Buka `http://localhost:3001/auth?mode=signup` → daftar email baru → setelah submit, dashboard harus tampil + sidebar ada email + tombol Keluar + data auto-seed muncul (trigger).
- Coba tambah transaksi via tombol "+ Transaksi" → muncul di panel setelah refresh.

**Langkah 8 — apply seed-trigger.sql** (sebelum test signup, agar auto-seed jalan):
```bash
pbcopy < ~/finance-dashboard/supabase/seed-trigger.sql
```
Buka tab SQL editor Supabase baru → paste (Cmd+V) → klik **Run** → kalau muncul dialog "This query includes destructive operations" klik **Run query**.
Harusnya sukses tanpa error.

**Langkah 9 — cek auth config.**
`https://supabase.com/dashboard/project/eurdqmgjmmyevxbznhwv/auth/providers`.
Email provider: ENABLE. Klik **Email** → matikan "Confirm email" kalau mau signup langsung login (opsional; kalau ON, user harus klik link email dulu).

**Langkah 10 — deploy Netlify (opsional, bisa skip).**
Site sudah dibuat + env var sudah diset (`netlify env:set NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
Tapi `netlify deploy --prod` balas `JSONHTTPError: Forbidden` — penyebab belum ketahuan, kemungkinan: limit plan (sudah 5 site di team "uiux"), atau site baru + team berbeda, atau block deploy free tier.
Cara cek: `netlify sites:list` (site ada), lalu coba `netlify deploy --prod --debug` dan baca response lengkap. Alternatif: lewat web `https://app.netlify.com/projects/finance-dashboard-hasbi` → manual deploy dengan drag folder `.next`, atau hubungkan GitHub repo lalu auto-deploy.
JANGAN deploy ke `hasbiportofolio.netlify.app` — itu site portofolio yang berbeda.

---

## Hal-hal yang gue TAHU penting (hard lessons dari sesi ini)

- `.env*` ada di `.gitignore` → env var harus diset manual di dashboard Netlify (anon key memang public by design, aman di client).
- Ref project: `eurdqmgjmmyevxbznhwv` — huruf **n** sebelum `hwv`. Kalau salah, DNS resolve gagal.
- RLS demo mode: dataset contoh pakai `user_id IS NULL` + policy public read; data user strict `auth.uid() = user_id`. RLS **tidak** didisable.
- Supabase dashboard di Safari butuh foreground mode untuk keyboard input kalau ada >1 window; `osascript` `open location` sering tidak mengubah current tab; gunakan capture mode `ax` + klik by element index.
- `osascript` heredoc merusak `properties:{URL:...}` → error `-2741`. Pakai `computer_use` tool atau `open -a Safari <url>`.
- URL `/settings/api` **redirect ke `/integrations/data_api/overview`**. Navigasi manual: sidebar → Project Settings (kiri bawah) → section API. Tab "Settings" di halaman Data API BUKAN API keys.
- Model Hermes "code" gak punya vision — gambar tidak bisa dibaca, kerja via DOM/AX tree atau teks yang user paste.
- Netlify CLI: user "faisal rozan" (faisalrozan640@gmail.com), team "uiux", 5 site terdaftar.

## Urutan prioritas

1. **Roll API keys** (secret bocor di chat — ini soal keamanan, duluan dari apapun).
2. **Fix 401** — copy publishable/legacy anon yang benar, restart project kalau perlu, test curl sampai 200.
3. Isi `.env.local` + **rebuild** (bukan restart).
4. Apply `seed-trigger.sql`.
5. Test auth E2E lokal (signup → auto-seed → tambah transaksi).
6. Auth config (confirm email on/off).
7. Deploy Netlify (opsional).
