# 🚀 RafaelXD File Host & Link Shortener

Aplikasi Web Hosting File & Pempendek URL Modern, Cepat, dan Ringan yang dibangun menggunakan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB**, dan **Telegram Bot API** sebagai media penyimpanan cloud tanpa batas.

---

## 🌟 Fitur Utama

- 📁 **Upload File Tanpa Batas**: Mengunggah berbagai format file (dokumen, gambar, video, musik, arsip, script) secara aman dan cepat.
- ⚡ **Auto-Copy Download Link**: Link unduhan otomatis disalin ke clipboard setelah proses upload selesai.
- 🔗 **URL Shortener**: Pempendek tautan cepat dengan statistik klik, dukungan custom slug, dan pengalihan instant (`/s/[id]`).
- 👁️ **Halaman Pratinjau File**: Tampilan antarmuka khusus pratinjau file (`/f/[id]`) yang responsif, dilengkapi detail ukuran file, tipe mime, dan tombol unduh langsung.
- 🖼️ **Akses Raw / Direct Link**: Akses langsung file media tanpa perantara melalui endpoint `/api/raw/[id]`.
- 🔐 **Admin Dashboard**: Panel administrasi terproteksi password (`/admin`) untuk mengelola berkas terunggah, URL pendek, dan statistik server.
- 💖 **Halaman Donasi QRIS**: Halaman khusus dukung operasional server dilengkapi kode QRIS All Payment (GPN / Dana / ShopeePay / GoPay / OVO / Bank).
- ☁️ **Telegram & MongoDB Storage**: Integrasi otomatis Telegram Bot API sebagai backend penyimpanan file cloud dan MongoDB untuk basis data metadata.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) & [Lucide React](https://lucide.dev)
- **Database**: [MongoDB](https://www.mongodb.com)
- **Storage Backend**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **QR Code Generator**: `qrcode.react`
- **Animasi**: `motion` (Framer Motion)

---

## 📋 Persyaratan Sistem

- **Node.js**: v18.x atau versi lebih baru
- **NPM / Bun / Yarn**: Manajer paket pilihan Anda
- **Bot Telegram**: Token Bot & Chat ID Telegram untuk penampung file
- **Database MongoDB**: Connection URI (Local / MongoDB Atlas)

---

## ⚙️ Konfigurasi Environment (`.env`)

Buat file `.env` atau `.env.local` di root proyek berdasarkan contoh `.env.example`:

```env
# URL Utama Aplikasi
APP_URL="https://domain-anda.com"

# Kunci Kredensial Administrator Panel
ADMIN_USERNAME=RafaelXD
ADMIN_PASSWORD=Rafael04

# Konfigurasi Storage Telegram Bot
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Konfigurasi Database MongoDB
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/filehost?retryWrites=true&w=majority"

# Gemini AI (Opsional)
GEMINI_API_KEY="your_gemini_api_key"
```

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Cloning & Install Dependensi

```bash
# Install seluruh paket dependensi
npm install
```

### 2. Jalankan Mode Pengembang (Development)

```bash
npm run dev
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000).

### 3. Build & Production Start

```bash
# Kompilasi aplikasi untuk produksi
npm run build

# Jalankan server produksi
npm start
```

---

## 📡 Ringkasan API Routes

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Mengunggah file ke Telegram Storage & menyimpan metadata ke MongoDB |
| `GET` | `/api/file/[id]` | Mengambil informasi metadata file |
| `GET` | `/api/raw/[id]` | Stream/download file mentah secara langsung |
| `POST` | `/api/shorten` | Membuat tautan pendek baru |
| `GET` | `/s/[id]` | Pengalihan otomatis URL pendek ke URL tujuan |
| `GET/POST` | `/api/admin` | Otentikasi dan pengelolaan data admin |

---

## 📂 Struktur Proyek

```text
├── app/
│   ├── admin/         # Halaman Admin Dashboard
│   ├── api/           # API Routes (upload, raw, shorten, file, settings)
│   ├── f/[id]/        # Halaman Pratinjau File
│   ├── s/[id]/        # Redirection URL Shortener
│   ├── globals.css    # Styling Global Tailwind
│   ├── layout.tsx     # Root Layout
│   └── page.tsx       # Halaman Utama (Upload, Shortener, Guide, Donasi)
├── components/        # Komponen UI (Navbar, Uploader, ShortUrl, Donation, Guide)
├── lib/               # Utility, Database connection, Telegram client, Types
├── metadata.json      # Metadata Aplikasi
├── .env.example       # Contoh variabel lingkungan
└── package.json       # Manajer dependensi & script
```

---

## 👨‍💻 Kontak & Sosial Media

- **WhatsApp Channel**: [Komunitas WhatsApp](https://whatsapp.com/channel/0029VbAjoElLI8YVzXxn7H0j)
- **YouTube**: [@RafaelXD_offc](https://www.youtube.com/@RafaelXD_offc)
- **Instagram**: [@rafaelputrasitinjak](https://www.instagram.com/rafaelputrasitinjak/)

---

© 2026 **RafaelXD File Host**. All rights reserved.
