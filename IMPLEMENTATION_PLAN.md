# Implementation Plan Tracker - Romantic Website

Checklist ini dibuat untuk melacak progress implementasi aplikasi full-stack Next.js + R3F + Supabase + Cloudinary.

## 1) Project Setup & Foundation

- [x] Inisialisasi project Next.js (App Router) dengan TypeScript
- [x] Install dependency utama: `tailwindcss`, `@react-three/fiber`, `@react-three/drei`, `three`, `zustand`, `gsap`, `lucide-react`, `zod`, `jose`, `@supabase/supabase-js`
- [x] Konfigurasi Tailwind CSS + `globals.css` tema dark cinematic
- [x] Setup struktur folder sesuai arsitektur plan
- [x] Tambahkan `.env.example` dengan seluruh env var yang dibutuhkan

## 2) Database & External Services

- [x] Buat project Supabase dan siapkan kredensial
- [x] Buat file `supabase/schema.sql` (tabel `gallery_images` dan `site_settings`)
- [x] Buat file `supabase/seed.sql` dengan sample data awal
- [ ] Jalankan schema + seed di Supabase *(manual — lihat `supabase/SETUP.md`)*
- [x] Setup Cloudinary (cloud name, API key, API secret, upload folder)

## 3) Backend API (Next.js Route Handlers)

- [x] Implement `GET /api/public/gallery`
- [x] Implement `POST /api/admin/login` (set cookie session)
- [x] Implement `POST /api/admin/logout` (clear cookie)
- [x] Implement `GET /api/admin/session`
- [x] Implement image endpoints: `GET /POST /api/admin/images` dan `DELETE /api/admin/images/[id]`
- [x] Implement settings endpoints: `GET /PUT /api/admin/settings`
- [x] Implement `POST /api/admin/cloudinary-signature`
- [x] Tambahkan validasi Zod untuk auth, image payload, dan settings payload

## 4) Auth & Route Protection

- [x] Implement util session JWT (`lib/auth/session.ts`)
- [x] Implement middleware proteksi `/admin` dan `/api/admin/*`
- [x] Pastikan `/admin/login` tetap public
- [x] Tambahkan guard basic untuk login attempts (anti brute force ringan)

## 5) State Management

- [x] Buat Zustand store `store/gallery-store.ts`
- [x] Tambahkan state: `images`, `settings`, `status`, `error`
- [x] Tambahkan action fetch public/admin data
- [x] Tambahkan action update settings, add/delete image
- [x] Tambahkan state + action scatter (`scatterMix`, `triggerScatter`)

## 6) Public 3D Gallery (`/`)

- [x] Buat loading screen hitam dengan spinner + teks `Lagi bikin gallery...`
- [x] Setup full-viewport `<Canvas>` yang responsif desktop/mobile
- [x] Tambahkan stars background environment
- [x] Implement central glowing sphere dengan color dinamis dari settings
- [x] Render frame foto dalam jumlah besar berdasarkan `particle_count`
- [x] Map URL image ke plane-frame putih 3D
- [x] Implement orbit planar ring (sin/cos + wobble vertikal halus)
- [x] Tambahkan `OrbitControls` (drag rotate + zoom)
- [x] Implement double-click scatter effect dengan GSAP
- [x] Implement auto-return ke orbit setelah 2 detik
- [x] Tambahkan teks 3D billboarding: `Only For U, [Name]`
- [x] Tambahkan instruction overlay: `Double-click anywhere for interactive effects. Drag to move, zoom in or out.`

## 7) Admin Panel (`/admin`)

- [x] Buat halaman login admin
- [x] Buat dashboard layout modern dengan Tailwind
- [x] Implement Image Manager (upload Cloudinary + preview + delete)
- [x] Implement Settings Manager (sphere color, floating text, target name, particle count)
- [x] Implement realtime preview scene 3D kecil di dashboard
- [x] Tambahkan topbar dengan session indicator + logout
- [x] Pastikan UX mobile dan desktop tetap rapi

## 8) UI Components & Reusability

- [x] Buat komponen reusable: `Button`, `Input`, `Card`, `Spinner`
- [x] Buat komponen scene terpisah: `Scene3D`, `OrbitingFrames`, `FloatingMessage`, `CenterSphere`, `InstructionOverlay`
- [x] Tambahkan icon dari Lucide React di area penting admin

## 9) Testing & Quality

- [x] Unit test validator Zod (URL, color, particle count, auth payload)
- [x] Unit test util session JWT (sign/verify/expired)
- [x] Unit test fungsi math scatter/orbit
- [x] Integration test endpoint auth + proteksi admin route
- [x] Integration test image CRUD + update settings
- [x] E2E test flow utama (public load, scatter, login admin, upload image, save settings)

## 10) Deployment & Finalization

- [ ] Konfigurasi env var pada Vercel
- [ ] Deploy Next.js app ke Vercel
- [ ] Verifikasi koneksi Supabase di environment production
- [ ] Verifikasi signed upload Cloudinary di production
- [ ] Smoke test final untuk `/` dan `/admin`
- [ ] Dokumentasi singkat setup + run local di README

## Progress Snapshot

- [x] Phase 1 selesai: Foundation
- [x] Phase 2 selesai: Backend + Auth
- [x] Phase 3 selesai: Public 3D Experience
- [x] Phase 4 selesai: Admin Dashboard
- [ ] Phase 5 selesai: Testing + Deployment
