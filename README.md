# CreatorDesk 🚀
> **Plan. Create. Publish. Analyze.**
> Platform Manajemen Konten Digital untuk Content Creator Berbasis Web

CreatorDesk dirancang untuk membantu content creator, streamer, dan digital storyteller mengelola ide, perencanaan produksi, jadwal publikasi kalender, inventaris konten, analitik performa, hingga pelaporan otomatis dalam satu platform terpadu dan aman.

---

## 🌟 Fitur Utama
1. **Authentication & RBAC**: Sistem login, registrasi, logout dengan role Creator dan Admin, proteksi brute-force rate limiting, password hashing bcrypt, dan sesi aman.
2. **Dashboard Creator**: Ringkasan performa (views, likes, comments, shares), jadwal terdekat, dan visualisasi pertumbuhan.
3. **Content Ideas**: Manajemen ide (CRUD) dengan filter status (New Idea, Planned, In Production, Completed).
4. **Content Planner & Calendar**: Penjadwalan produksi dengan tampilan list dan kalender interaktif.
5. **Content Management**: Inventaris konten publikasi (Draft, In Production, Scheduled, Published) dengan platform tags (YouTube, TikTok, Instagram).
6. **Performance Analytics**: Pencatatan manual statistik performa konten dan analisis perbandingan performa platform.
7. **Reports & Exports**: Filter periode dan platform, ekspor laporan ke format CSV dan PDF instan.
8. **Profile & Settings**: Pengaturan informasi profil, bio, dan ubah password dengan validasi keamanan.
9. **Admin Dashboard**: Monitoring pengguna sistem, status akun, dan audit log aktivitas.
10. **Security**: Perlindungan SQL Injection (parameterized queries), XSS sanitization, pencegahan IDOR (strict ownership verification), dan security headers.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: SQLite (Node.js 22 Native `node:sqlite`) dengan integrasi Supabase PostgreSQL
- **Security & Auth**: bcryptjs, jose (JWT), HTTP-Only Cookies, Rate Limiting
- **Visuals & Export**: Recharts, jsPDF, jspdf-autotable

---

## 🚀 Memulai Aplikasi

### 1. Prasyarat
- Node.js v18+ (disarankan Node.js v20/v22)
- npm / pnpm

### 2. Instalasi
```bash
npm install
```

### 3. Setup Lingkungan & Database
Salin `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Inisialisasi database dan akun demo:
```bash
npm run seed
```

### 4. Akun Demo Bawaan
- **Admin**:
  - Email: `admin@creatordesk.com`
  - Password: `AdminPassword123!`
  - Akses: Admin Dashboard, Manajemen Pengguna, Audit Log
- **Creator (User)**:
  - Email: `creator@creatordesk.com`
  - Password: `CreatorPassword123!`
  - Akses: Dashboard Creator, Ideas, Planner, Content, Analytics, Reports

### 5. Menjalankan Server Development
```bash
npm run dev
```
Akses di browser: `http://localhost:3000`

### 6. Menjalankan Pengujian Otomatis
```bash
npm test
```
