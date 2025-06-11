# NutriMood Frontend

NutriMood adalah aplikasi web berbasis Next.js (React) yang memberikan rekomendasi makanan Indonesia berbasis AI sesuai mood dan kondisi kesehatan, serta menyediakan fitur komunitas, dashboard, dan edukasi. Aplikasi ini terintegrasi dengan backend FastAPI (Python) dan Supabase sebagai database & autentikasi. Mendukung PWA (Progressive Web App) untuk pengalaman mobile.

---

## Fitur Utama
- **Rekomendasi Makanan AI**: Dapatkan 5 makanan Indonesia terbaik sesuai mood (energizing, relaxing, focusing, neutral) dan kondisi kesehatan (diabetes, hipertensi, kolesterol, dsb).
- **Komunitas**: Berbagi cerita, resep, tips, review, dan tanya jawab seputar makanan & kesehatan.
- **Dashboard & Riwayat**: Pantau riwayat rekomendasi, statistik mood, dan aktivitas nutrisi Anda.
- **PWA**: Installable, offline support, mobile-friendly.
- **Edukasi**: Artikel dan tips kesehatan berbasis nutrisi & mood.

---

## Struktur Project
```
frontend/
├── src/
│   ├── app/           # Halaman Next.js (dashboard, community, profile, dsb)
│   ├── components/    # Komponen UI (Navbar, Toast, dsb)
│   ├── hooks/         # Custom React hooks
│   └── lib/           # API client, Supabase client
├── public/            # Asset, icon, manifest, service worker
├── backend/           # Backend FastAPI (lihat backend/README.md)
├── database/          # SQL schema & seed data Supabase
├── package.json       # Dependensi frontend
├── next.config.ts     # Konfigurasi Next.js
├── postcss.config.mjs # Konfigurasi PostCSS/Tailwind
├── tsconfig.json      # Konfigurasi TypeScript
└── README.md          # Dokumentasi ini
```

---

## Instalasi & Setup Lokal

### 1. Clone Repository
```sh
git clone <repository-url>
cd nutrimoodv2
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Konfigurasi Environment
Buat file `.env.local` di root `frontend/` dengan isi:
```
NEXT_PUBLIC_SUPABASE_URL=...        # URL Supabase Project
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon key
NEXT_PUBLIC_API_URL=http://localhost:8000 # URL backend FastAPI
```

### 4. Jalankan Backend (FastAPI)
Lihat petunjuk lengkap di `backend/README.md`.
Contoh (dari folder backend):
```sh
pip install -r requirements.txt
python main.py
```

### 5. Jalankan Frontend (Next.js)
```sh
npm run dev
```
Akses di [http://localhost:3000](http://localhost:3000)

---

## Build & Production
```sh
npm run build
npm start
```

---

## Testing & Linting
```sh
npm run lint
```

---

## Kontribusi
1. Fork repo & buat branch baru
2. Commit perubahan
3. Buat Pull Request

---

## Lisensi
MIT License. Lihat file LICENSE.

---

## Support
Buat issue di repo atau hubungi tim pengembang.

---

## Catatan
- Untuk fitur komunitas & dashboard, pastikan Supabase sudah di-setup dan tabel sudah sesuai schema di folder `database/`.
- Untuk rekomendasi AI, backend FastAPI & model ML harus berjalan.
- Aplikasi ini mendukung PWA (installable di mobile/desktop, offline page, dsb).

---

**Selamat mencoba NutriMood!**
