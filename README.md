# 🍔 Salt N Bite - Customer Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP Version](https://img.shields.io/badge/PHP-8.1%2B-blue)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-10.x-red)](https://laravel.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-blue)](https://www.mysql.com/)

> Sistem manajemen pelanggan terintegrasi untuk restoran cepat saji Salt N Bite yang mengelola data pelanggan, program loyalty, promosi event, dan reservasi dalam satu platform digital.

---

## 📑 Table of Contents

- [About](#about)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Authors](#authors)
- [License](#license)

---

## 📖 About

**Salt N Bite Customer Management System** adalah sistem informasi manajemen pelanggan yang dikembangkan untuk meningkatkan kualitas layanan restoran cepat saji melalui digitalisasi proses pengelolaan pelanggan.

### 🎯 Project Objectives

- ✅ Meningkatkan kepuasan dan loyalitas pelanggan melalui program loyalty dengan promo event
- ✅ Mempermudah pengelolaan data pelanggan secara terpusat
- ✅ Menampilkan promosi dan menu secara real-time
- ✅ Mengoptimalkan strategi promosi dengan pengiriman otomatis (WhatsApp/Email)
- ✅ Mengintegrasikan data dengan sistem POS, Akuntansi, dan Reservasi
- ✅ Menyediakan dashboard analytics untuk pengambilan keputusan berbasis data

### 🚀 Problems Solved

| **Before (As-Is)**                                      | **After (To-Be)**                                           |
|---------------------------------------------------------|-------------------------------------------------------------|
| Data pelanggan tidak tersimpan secara terpusat         | Database pelanggan terintegrasi dan tersinkronisasi         |
| Promosi dilakukan manual tanpa segmentasi              | Promosi otomatis dengan target pelanggan yang tepat         |
| Tidak ada sistem membership atau loyalty points        | Program loyalty digital dengan event-based rewards          |
| Tidak tersedia laporan otomatis                        | Reporting otomatis dengan dashboard analytics               |

---

## ✨ Key Features

### 🔑 Core Features

#### 1. **Customer Auto Registration** (FR-01) 🔥 *Critical*
Sistem otomatis mendaftarkan pelanggan saat melakukan reservasi atau transaksi menggunakan nomor telepon sebagai identitas unik.

#### 2. **Event-Based Loyalty Program** (FR-02) 🔥 *Critical*
Program loyalty yang aktif hanya saat event tertentu dengan perhitungan poin otomatis dari transaksi POS.

#### 3. **Promo Display** (FR-03) ⚡ *High Priority*
Menampilkan promo event secara real-time kepada pelanggan terdaftar di dashboard dan notifikasi.

#### 4. **Transaction History** (FR-04) ⚡ *High Priority*
Riwayat transaksi lengkap dengan detail menu, nominal, dan metode pembayaran untuk setiap pelanggan.

#### 5. **Reservation Sync** (FR-05) 🔥 *Critical*
Integrasi otomatis data reservasi ke profil pelanggan untuk tracking kunjungan dan preferensi.

#### 6. **POS Integration** (FR-06) 🔥 *Critical*
Sinkronisasi real-time dengan sistem Point of Sales untuk update transaksi dan loyalty points.

#### 7. **Customer Feedback** (FR-07) 📊 *Medium*
Sistem rating dan komentar pelanggan setelah transaksi untuk evaluasi kualitas layanan.

#### 8. **Customer Dashboard** (FR-08) ⚡ *High Priority*
Dashboard real-time menampilkan statistik kunjungan, transaksi, poin, dan tren pembelian.

#### 9. **Membership Grouping** (FR-09) 📊 *Medium*
Pengelompokan pelanggan berdasarkan riwayat transaksi untuk segmentasi promosi yang lebih efektif.

#### 10. **Automated Reporting** (FR-10) ⚡ *High Priority*
Generate laporan aktivitas pelanggan, efektivitas promo, dan penggunaan loyalty secara otomatis.

---

## 🛠 Tech Stack

### Backend
- **PHP** 8.1+
- **Laravel** 10.x (Framework)
- **MySQL** 8.0+ (Database)
- **Redis** (Caching & Queue)

### Frontend
- **Blade Templates** (Laravel)
- **Tailwind CSS** / **Bootstrap 5**
- **Alpine.js** (Interactivity)
- **Chart.js** (Data Visualization)

### Integration & Tools
- **REST API** (Inter-system Communication)
- **JWT Authentication** (API Security)
- **WhatsApp Business API** (Notification)
- **Laravel Sanctum** (API Token Management)
- **Laravel Queue** (Background Jobs)

### Development Tools
- **Composer** (PHP Dependency Manager)
- **NPM** (Node Package Manager)
- **Git** (Version Control)
- **Postman** (API Testing)

---

## 🏗 System Architecture

