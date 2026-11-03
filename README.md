# SiPosyandu — Sistem Informasi Posyandu Pede Seneng

Sistem informasi Posyandu Pede Seneng, Desa Montong Betok, Kecamatan Montong Gading.
Tahap saat ini: **sistem login, manajemen pengguna, dan seluruh modul Posyandu**
yang mengikuti `Form_Posyandu_Pede_Seneng.xlsx`, berjalan di atas layanan **Neon**
(Postgres, Auth, Object Storage, Functions, Realtime).

## Fitur

- Login dengan username + password (password di-hash bcrypt)
- Sesi JWT disimpan di cookie `httpOnly`, `SameSite=Lax`, berlaku 8 jam
- Role-based access control:
  - **Admin** — dashboard + manajemen pengguna (CRUD) + seluruh modul Posyandu
  - **Kader** — dashboard + seluruh modul Posyandu
- Modul Posyandu lengkap: Buku Pendaftaran, Kartu Ibu Hamil, Kartu Remaja,
  Kartu Dewasa, Kartu Lansia, Daftar Nama Laporan, Laporan Bulanan, dan Rekap Kunjungan
- Nilai otomatis mengikuti rumus Excel: umur, IMT + status IMT, hasil tekanan darah,
  LiLA (KEK / risiko malnutrisi), SKILAS, skor PUMA, dan skrining TBC
- Kehadiran Januari–Desember per sasaran dan rekap otomatis per kategori/bulan
- Laporan bulanan dengan jumlah L+P, D/S, dan total ASI eksklusif otomatis
- Manajemen pengguna: tambah, ubah, aktif/nonaktifkan, hapus, reset password
- Proteksi: tidak bisa menonaktifkan/menghapus akun sendiri, tidak bisa menghapus admin terakhir
- Rate limit login (5 percobaan / 10 menit per IP+email)
- Audit log login berhasil/gagal, akun diblokir, dan logout
- **Live activity feed** — audit log terbaru masuk lewat Neon Realtime tanpa refresh
- **Avatar pengguna** — upload ke Neon Object Storage (bucket privat `assets`), disajikan lewat presigned URL
- **Status layanan** — kartu di dashboard memeriksa Postgres, Neon Auth, Object Storage, Functions, dan Realtime
- Akun yang dinonaktifkan langsung kehilangan akses (dicek ke database setiap request)

## Modul Posyandu

Menu **Posyandu** tersedia untuk Admin dan Kader:

| Menu | Isi | Nilai otomatis |
| --- | --- | --- |
| Buku Pendaftaran | Identitas sasaran, kategori (Lansia/PTM/Remaja/Balita), kehadiran Jan–Des | Kategori & daftar bulan hadir |
| Kartu Ibu Hamil | Identitas, riwayat kehamilan, BB/TB, LiLA, TD, skrining TBC, TTD, MT, edukasi | Hasil LiLA, hasil TD, hasil skrining TBC |
| Kartu Remaja | Identitas, pemeriksaan (BB/TB/LiLA/L. perut/TD/Hb/Fe), mental emosional | Umur, hasil TD |
| Kartu Dewasa | Identitas, riwayat, pemeriksaan, IMT, TD, gula darah, hitung jari/tes bisik, PUMA, TBC | Umur, IMT, status IMT, hasil TD, skor & rujukan PUMA, hasil TBC |
| Kartu Lansia | Identitas, pemeriksaan, 11 pertanyaan SKILAS, imunisasi COVID, edukasi | Umur, hasil TD, LiLA < 21, hasil SKILAS |
| Daftar Nama Laporan | BGM, Balita T2, Bayi Baru Lahir, Bumil KEK, Bumil Anemia | Umur (bulan) |
| Laporan Bulanan | 16 bagian laporan hasil kegiatan Posyandu | Jumlah L+P, D/S (%), total ASI eksklusif |
| Rekap Kunjungan | Rekap dari Buku Pendaftaran + jumlah kunjungan kartu + laporan | Semua dihitung dari data tersimpan |

Ambang yang dipakai sama dengan Excel: IMT `<17` Sangat Kurus, `<18,5` Kurus,
`≤25` Normal, `≤27` Gemuk, `>27` Obesitas; TD Tinggi jika sistole ≥140 atau
diastole ≥90, Rendah jika sistole <90 atau diastole <60; LiLA ibu hamil KEK jika
<23,5 cm; SKILAS rujuk jika ≥1 jawaban “Ya”; TBC rujuk jika ≥2 gejala “Ya”;
PUMA rujuk jika skor >6.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS 4
- Prisma 6 + **Neon Postgres** (pooled `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED` untuk migrasi)
- `jose` (JWT), `bcryptjs` (hash password), `zod` (validasi)
- `@neon/realtime` + `@neon/realtime-react` (live query)
- `files-sdk` + adapter `files-sdk/neon` (object storage)
- Neon Functions (`hello.ts`, Node.js + `pg`)

## Layanan Neon dan cara integrasinya

Konfigurasi infrastruktur ada di [`neon.ts`](./neon.ts) dan diterapkan dengan `neon deploy`.

| Layanan | Dipakai di | Cara kerja |
| --- | --- | --- |
| **Postgres** | `prisma/schema.prisma`, `src/lib/prisma.ts` | Prisma memakai `DATABASE_URL` (pooled) saat runtime dan `DATABASE_URL_UNPOOLED` saat migrasi |
| **Neon Auth** | `src/app/api/neon/status/route.ts` | Aplikasi tetap memakai auth JWT sendiri; JWKS Neon Auth diperiksa sebagai health check |
| **Object Storage** | `src/lib/storage.ts`, `/api/profile/avatar` | Bucket privat `assets`; key avatar disimpan di `User.avatarKey`, dibaca lewat presigned URL 1 jam |
| **Functions** | `hello.ts`, `/api/neon/status` | Function query Postgres dan hanya merespons jika header `x-internal-secret` cocok |
| **Realtime** | `src/lib/realtime.ts`, `/api/realtime/activity`, `LiveActivityFeed.tsx` | Server membuat *sealed query* dari sesi; browser berlangganan lewat WebSocket |

## Menjalankan

Prasyarat: Node.js 20+, akun Neon, dan Neon CLI (`npm i -g neon@latest`).

```bash
npm install                 # otomatis prisma generate

neon login                  # sekali saja per mesin
neon link                   # hubungkan folder ke project Neon
neon deploy --env .env -y   # provision service + tarik env ke .env

npx prisma migrate deploy   # buat tabel di Neon
npx prisma db seed          # buat akun demo
npm run dev                 # http://localhost:3000
```

Untuk production lokal:

```bash
npm run build
npm run start -- -p 3100
```

> `neon deploy` membutuhkan `INTERNAL_API_SECRET` sudah ada di `.env` karena nilainya
> ditulis ke Function `hello`. Jika CLI gagal membacanya, ekspor dulu ke shell:
> `$env:INTERNAL_API_SECRET = "..."` (PowerShell) lalu ulangi `neon deploy --env .env -y`.

## Akun demo

| Role  | Username | Email                 | Password   |
| ----- | -------- | --------------------- | ---------- |
| Admin | `admin`  | admin@siposyandu.id   | `Admin123!` |
| Kader | `kader`  | kader@siposyandu.id   | `Kader123!` |

> Login memakai **username**. Email tetap disimpan sebagai data profil dan identitas audit.

> **Penting:** ganti password akun demo dan `JWT_SECRET` di `.env` sebelum dipakai di lapangan.
> Jangan jalankan `prisma db seed` di production.

## Konfigurasi `.env`

Sebagian besar variabel diisi otomatis oleh `neon deploy` (lihat [`.env.example`](./.env.example)):

| Variabel | Sumber | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Neon | Connection string pooled untuk Prisma |
| `DATABASE_URL_UNPOOLED` | Neon | Koneksi langsung untuk `prisma migrate` |
| `NEON_BRANCH` | Neon | Nama branch (mis. `production`) |
| `NEON_AUTH_BASE_URL` / `NEON_AUTH_JWKS_URL` | Neon | Endpoint Neon Auth |
| `NEON_REALTIME_URL` / `NEON_REALTIME_SECRET` | Neon | WebSocket + secret server Realtime |
| `NEXT_PUBLIC_NEON_REALTIME_URL` | manual | Sama dengan `NEON_REALTIME_URL`; di-inline ke browser saat build |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_ENDPOINT_URL_S3` / `AWS_REGION` | Neon | Kredensial branch untuk Object Storage |
| `NEON_FUNCTION_HELLO_BASE_URL` | Neon | URL Function `hello` |
| `JWT_SECRET` | manual | Minimal 32 karakter |
| `INTERNAL_API_SECRET` | manual | Shared secret aplikasi ↔ Function |
| `REALTIME_ALLOWED_ORIGINS` | manual (opsional) | Daftar origin dipisah koma untuk `neon.ts` |

Buat secret acak:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Struktur folder

```
prisma/
  schema.prisma          # User, AuditLog, Sasaran, 4 kartu kunjungan, laporan
  migrations/            # riwayat migrasi, wajib di-commit
  seed.ts                # akun demo + 21 sasaran awal Buku Pendaftaran
hello.ts                 # Neon Function (query Postgres + shared secret)
neon.ts                  # deklarasi service Neon (auth, realtime, function, bucket)
src/
  app/
    login/page.tsx       # halaman login
    (app)/
      layout.tsx         # proteksi sesi + shell aplikasi
      dashboard/         # dashboard + live feed + avatar + status layanan
      pengguna/          # manajemen pengguna (khusus admin)
      posyandu/
        [module]/        # pendaftaran, ibu-hamil, remaja, dewasa, lansia, laporan-nama
        laporan-bulanan/ # form 16 bagian laporan bulanan
        rekap/           # rekap kategori, kehadiran, dan kunjungan
    api/
      auth/login/        # POST login
      auth/logout/       # POST logout
      auth/me/           # GET sesi aktif
      users/             # GET/POST pengguna (admin)
      users/[id]/        # PATCH/DELETE pengguna (admin)
      posyandu/[module]/ # GET/POST data modul Posyandu
      posyandu/[module]/[id]/ # PATCH/DELETE data modul
      profile/avatar/    # GET/POST/DELETE avatar (Object Storage)
      realtime/activity/ # POST sealed query audit log
      neon/status/       # GET health check 5 layanan (admin)
  components/
    AppShell.tsx         # sidebar + topbar + RealtimeProvider
    LiveActivityFeed.tsx # useLiveQuery audit log
    AvatarUploader.tsx   # upload avatar
    NeonStatusCard.tsx   # kartu status layanan
    LoginForm.tsx
    UsersManager.tsx
    icons.tsx
    posyandu/
      ModuleWorkspace.tsx        # tabel + form generik modul Posyandu
      LaporanBulananWorkspace.tsx # form laporan bulanan 16 bagian
      PosyanduTabs.tsx           # navigasi antar modul
  lib/
    auth.ts              # sesi JWT, requireUser, requireRole
    prisma.ts            # Prisma client singleton
    realtime.ts          # createRealtime + raw SQL audit log
    storage.ts           # files-sdk + bucket assets
    password.ts          # hash & verifikasi password
    rate-limit.ts        # rate limiter in-memory
    validation.ts        # skema zod
    roles.ts             # daftar role & label
    format.ts            # format tanggal Indonesia (WITA)
    types.ts
    posyandu/
      compute.ts         # rumus Excel (umur, IMT, TD, LiLA, PUMA, TBC, SKILAS)
      modules.ts         # definisi field, tabel, dan komputasi per modul
      laporan-bulanan.ts # struktur 16 bagian laporan bulanan
      server.ts          # konversi input, validasi, audit log
scripts/
  e2e-neon.mjs           # smoke test semua layanan Neon
  e2e-posyandu.mjs       # smoke test 8 modul Posyandu + nilai otomatis
```

## API

| Method | Endpoint               | Akses  | Keterangan |
| ------ | ---------------------- | ------ | ---------- |
| POST   | `/api/auth/login`      | publik | Login, set cookie sesi |
| POST   | `/api/auth/logout`     | login  | Hapus cookie sesi |
| GET    | `/api/auth/me`         | login  | Data sesi aktif |
| GET    | `/api/users`           | admin  | Daftar pengguna |
| POST   | `/api/users`           | admin  | Tambah pengguna |
| PATCH  | `/api/users/:id`       | admin  | Ubah pengguna |
| DELETE | `/api/users/:id`       | admin  | Hapus pengguna |
| GET    | `/api/posyandu/:module` | login | Daftar data modul (`pendaftaran`, `ibu-hamil`, `remaja`, `dewasa`, `lansia`, `laporan-nama`, `laporan-bulanan`) |
| POST   | `/api/posyandu/:module` | login | Tambah data modul |
| PATCH  | `/api/posyandu/:module/:id` | login | Ubah data modul |
| DELETE | `/api/posyandu/:module/:id` | login | Hapus data modul |
| GET    | `/api/profile/avatar`  | login  | Presigned URL avatar |
| POST   | `/api/profile/avatar`  | login  | Upload avatar (multipart `file`, maks. 2 MB) |
| DELETE | `/api/profile/avatar`  | login  | Hapus avatar |
| POST   | `/api/realtime/activity` | login | Sealed query audit log sesuai role |
| GET    | `/api/neon/status`     | admin  | Health check 5 layanan Neon |

## Uji end-to-end

```bash
npm run build
npm run start -- -p 3100
# di terminal lain:
npm run test:e2e
npm run test:posyandu
```

`scripts/e2e-posyandu.mjs` memverifikasi:

1. Login kader dan akses 8 halaman modul
2. API modul menolak request tanpa login (401)
3. 21 sasaran awal dari Buku Pendaftaran tampil
4. CRUD setiap kartu + nilai otomatis (LiLA, TD, TBC, umur, IMT, PUMA, SKILAS)
5. Umur bulan pada Daftar Nama Laporan
6. Validasi dan penyimpanan JSON Laporan Bulanan
7. PATCH + DELETE mengembalikan data ke kondisi semula

`scripts/e2e-neon.mjs` memverifikasi:

1. Login admin/kader (Postgres + auth JWT)
2. `/api/neon/status` melaporkan 5 layanan `ok`
3. JWKS Neon Auth dapat dibaca
4. Function menolak tanpa secret (401) dan berhasil query Postgres dengan secret
5. Upload avatar → presigned URL dapat diunduh → `User.avatarKey` cocok
6. Sealed query dibuat dan baris audit baru masuk lewat WebSocket Realtime
7. Kader tidak bisa membuka status admin tetapi tetap mendapat sealed query sendiri

## Deploy ke Vercel

1. Push repository. File `.env`, `.neon`, dan `prisma/*.db` sudah di-ignore.
2. Import project di Vercel.
3. Isi Environment Variables (Production):
   - Semua variabel Neon dari `.env` (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_*`, `AWS_*`)
   - `JWT_SECRET`, `INTERNAL_API_SECRET`
   - `NEXT_PUBLIC_NEON_REALTIME_URL` (sama dengan `NEON_REALTIME_URL`)
4. Build Command:
   ```bash
   prisma generate && prisma migrate deploy && next build
   ```
5. Tambahkan domain produksi ke Realtime, lalu deploy ulang konfigurasi Neon dari lokal:
   ```bash
   $env:REALTIME_ALLOWED_ORIGINS = "https://domain-anda.vercel.app"
   neon deploy --env .env -y
   ```
6. Jangan jalankan seed demo di production. Buat admin pertama lewat script terpisah
   yang membaca `ADMIN_EMAIL`/`ADMIN_PASSWORD` dari environment.

## Catatan keamanan dan operasional

- Password tidak pernah dikembalikan oleh API (hanya `select` field aman).
- Login memakai pesan error generik agar tidak membocorkan email terdaftar.
- Rate limiter masih in-memory; untuk deployment multi-instance gunakan Redis/Upstash.
- Sesi bersifat stateless (JWT). Logout menghapus cookie, tetapi token yang sudah
  tersalin tetap valid sampai kedaluwarsa.
- Bucket `assets` bersifat privat. Jangan simpan URL presigned ke database — simpan
  **key** (`User.avatarKey`) lalu presign saat dibaca.
- `NEON_REALTIME_SECRET` hanya boleh ada di server. Jangan pernah memberi prefix
  `NEXT_PUBLIC_`.
- Backup dan pemulihan memakai fitur branch/instant restore Neon, bukan menyalin file
  database lokal. `prisma/dev.db` (SQLite lama) sudah tidak dipakai.
- Migrasi baru: `npx prisma migrate dev --name nama_perubahan`, lalu commit folder
  `prisma/migrations/`.

## Catatan pengembangan modul

- Definisi field dan kolom tabel ada di `src/lib/posyandu/modules.ts`. Untuk menambah
  field, tambahkan kolom di `prisma/schema.prisma`, buat migrasi, lalu tambahkan
  `f("namaField", "Label", "tipe", { section: "..." })` pada modul terkait.
- Rumus turunan cukup ditambahkan di `compute()` modul atau di
  `src/lib/posyandu/compute.ts`, sehingga form (pratinjau) dan API memakai hasil yang sama.
- Laporan Bulanan menyimpan rincian 16 bagian sebagai JSON di kolom `data`; struktur
  barunya ada di `src/lib/posyandu/laporan-bulanan.ts`.
- Semua perubahan data Posyandu menulis audit log (`POSYANDU_CREATE/UPDATE/DELETE`)
  sehingga ikut tampil di live activity feed dashboard.
"# siposyandu" 
