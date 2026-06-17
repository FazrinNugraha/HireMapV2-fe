// ============================================================
// DATA ESTIMASI PERJALANAN KRL COMMUTER LINE JABODETABEK
// ============================================================
// Sumber riset: Jadwal KRL Commuter Line (kci.id / GAPEKA 2024)
//
// Setiap waktu SUDAH termasuk:
//   +12 menit  → estimasi jalan kaki ke/dari stasiun
//   + 5 menit  → estimasi waktu tunggu di peron
//   + waktu di atas kereta (berdasarkan jadwal riil)
//
// Data ini bersifat STATIS (bukan real-time).
// Tidak mencerminkan keterlambatan, jam sibuk, atau perubahan jadwal.
// ============================================================

// Struktur data untuk satu rute KRL
export type KrlRouteInfo = {
  waktu: number;  // Total estimasi waktu tempuh dalam MENIT
  jarak: number;  // Perkiraan panjang lintasan rel dalam KM
  biaya: number;  // Estimasi tarif tiket dalam RUPIAH
};

// ------------------------------------------------------------
// FUNGSI BANTU: Hitung tarif tiket KRL
// ------------------------------------------------------------
// Berdasarkan tarif resmi KCI:
//   - Rp 3.000 untuk 25 km pertama
//   - Rp 1.000 untuk setiap 10 km berikutnya
// Contoh: jarak 50 km → 3000 + ceil((50-25)/10) × 1000 = Rp 6.000
// ------------------------------------------------------------
function hitungTarifKrl(jarakKm: number): number {
  const TARIF_DASAR        = 3_000; // tarif minimum (25 km pertama)
  const TARIF_PER_BLOK     = 1_000; // tambahan per blok 10 km
  const BATAS_TARIF_DASAR  = 25;    // km sebelum kena tarif tambahan

  if (jarakKm <= BATAS_TARIF_DASAR) return TARIF_DASAR;

  const sisaJarak    = jarakKm - BATAS_TARIF_DASAR;
  const jumlahBlok   = Math.ceil(sisaJarak / 10);
  return TARIF_DASAR + jumlahBlok * TARIF_PER_BLOK;
}

// ------------------------------------------------------------
// HELPER: Buat objek rute + hitung biaya otomatis dari jarak
// Ini biar penulisan matriks di bawah lebih ringkas & mudah dibaca
// ------------------------------------------------------------
function rute(waktu: number, jarakKm: number): KrlRouteInfo {
  return {
    waktu,
    jarak: jarakKm,
    biaya: hitungTarifKrl(jarakKm),
  };
}

// ============================================================
// MATRIKS WAKTU PERJALANAN KRL
// ============================================================
// Format: MATRIKS_KRL[kotaAsal][kotaTujuan] → KrlRouteInfo
//
// Cara baca: rute(waktu_menit, jarak_km)
// Contoh: rute(72, 60) artinya → 72 menit, 60 km, tarif dihitung otomatis
// ============================================================
const MATRIKS_KRL: Record<string, Record<string, KrlRouteInfo>> = {

  // -----------------------------------------------------------
  // DARI BOGOR — Lintas Bogor (Bogor → Manggarai → Jakarta)
  // Jalur terpanjang, melewati Depok, Citayam, Duren Kalibata
  // -----------------------------------------------------------
  "Bogor": {
    "Jakarta Selatan":      rute(72,  60),
    "Jakarta Pusat":        rute(88,  74),
    "Jakarta Utara":        rute(105, 90),
    "Jakarta Barat":        rute(98,  82),
    "Jakarta Timur":        rute(95,  78),
    "Jakarta Raya (General)": rute(85, 70),
    "Depok":                rute(32,  22),
    "Bekasi":               rute(110, 92),
    "Tangerang":            rute(115, 98),
    "Tangerang Selatan":    rute(95,  78),
  },

  // -----------------------------------------------------------
  // DARI DEPOK — Lintas Bogor (Depok → Manggarai → Jakarta)
  // Lebih dekat dari Bogor, stasiun utama: Depok Baru / Depok
  // -----------------------------------------------------------
  "Depok": {
    "Jakarta Selatan":      rute(45,  32),
    "Jakarta Pusat":        rute(62,  48),
    "Jakarta Utara":        rute(78,  64),
    "Jakarta Barat":        rute(72,  58),
    "Jakarta Timur":        rute(68,  54),
    "Jakarta Raya (General)": rute(60, 48),
    "Bogor":                rute(32,  22),
    "Bekasi":               rute(85,  68),
    "Tangerang":            rute(88,  72),
    "Tangerang Selatan":    rute(70,  55),
  },

  // -----------------------------------------------------------
  // DARI BEKASI — Lintas Bekasi (Bekasi → Jatinegara → Jakarta)
  // Stasiun utama: Bekasi, Kranji, Cakung, Jatinegara
  // -----------------------------------------------------------
  "Bekasi": {
    "Jakarta Selatan":      rute(65,  50),
    "Jakarta Pusat":        rute(52,  40),
    "Jakarta Utara":        rute(68,  55),
    "Jakarta Barat":        rute(80,  65),
    "Jakarta Timur":        rute(38,  25),
    "Jakarta Raya (General)": rute(55, 43),
    "Bogor":                rute(110, 92),
    "Depok":                rute(85,  68),
    "Tangerang":            rute(92,  78),
    "Tangerang Selatan":    rute(88,  72),
  },

  // -----------------------------------------------------------
  // DARI TANGERANG — Lintas Tangerang (Tangerang → Duri → Jakarta)
  // Stasiun utama: Tangerang, Batu Ceper, Poris, Duri
  // -----------------------------------------------------------
  "Tangerang": {
    "Jakarta Selatan":      rute(75,  62),
    "Jakarta Pusat":        rute(62,  50),
    "Jakarta Utara":        rute(78,  65),
    "Jakarta Barat":        rute(48,  35),
    "Jakarta Timur":        rute(85,  70),
    "Jakarta Raya (General)": rute(65, 52),
    "Bogor":                rute(115, 98),
    "Depok":                rute(88,  72),
    "Bekasi":               rute(92,  78),
    "Tangerang Selatan":    rute(55,  42),
  },

  // -----------------------------------------------------------
  // DARI TANGERANG SELATAN — Lintas Serpong (Serpong → Tanah Abang)
  // Estimasi: angkot/ojek ~12 menit ke Stasiun Rawa Buntu/Serpong,
  // lalu KRL Serpong Line menuju Tanah Abang (Jakarta Pusat/Selatan)
  // -----------------------------------------------------------
  "Tangerang Selatan": {
    "Jakarta Selatan":      rute(65,  52),
    "Jakarta Pusat":        rute(70,  58),
    "Jakarta Utara":        rute(90,  76),
    "Jakarta Barat":        rute(78,  64),
    "Jakarta Timur":        rute(85,  70),
    "Jakarta Raya (General)": rute(68, 55),
    "Bogor":                rute(95,  78),
    "Depok":                rute(70,  55),
    "Bekasi":               rute(88,  72),
    "Tangerang":            rute(55,  42),
  },

  // -----------------------------------------------------------
  // DARI JAKARTA TIMUR — Lintas Bekasi / Tanjung Priok
  // Stasiun utama: Jatinegara, Klender, Cakung
  // -----------------------------------------------------------
  "Jakarta Timur": {
    "Jakarta Selatan":      rute(35,  22),
    "Jakarta Pusat":        rute(25,  15),
    "Jakarta Utara":        rute(40,  28),
    "Jakarta Barat":        rute(50,  38),
    "Jakarta Raya (General)": rute(28, 18),
    "Bogor":                rute(95,  78),
    "Depok":                rute(68,  54),
    "Bekasi":               rute(38,  25),
    "Tangerang":            rute(85,  70),
    "Tangerang Selatan":    rute(85,  70),
  },

  // -----------------------------------------------------------
  // DARI JAKARTA UTARA — Lintas Tanjung Priok / Lintas Bogor
  // Stasiun utama: Tanjung Priok, Ancol, Kemayoran, Pasar Senen
  // -----------------------------------------------------------
  "Jakarta Utara": {
    "Jakarta Selatan":      rute(58,  45),
    "Jakarta Pusat":        rute(42,  30),
    "Jakarta Barat":        rute(52,  40),
    "Jakarta Timur":        rute(40,  28),
    "Jakarta Raya (General)": rute(45, 33),
    "Bogor":                rute(105, 90),
    "Depok":                rute(78,  64),
    "Bekasi":               rute(68,  55),
    "Tangerang":            rute(78,  65),
    "Tangerang Selatan":    rute(90,  76),
  },

  // -----------------------------------------------------------
  // DARI JAKARTA PUSAT — Titik tengah jaringan KRL
  // Semua lintas melewati area ini (Manggarai, Gambir, Pasar Senen)
  // -----------------------------------------------------------
  "Jakarta Pusat": {
    "Jakarta Selatan":      rute(28,  18),
    "Jakarta Utara":        rute(42,  30),
    "Jakarta Barat":        rute(35,  25),
    "Jakarta Timur":        rute(25,  15),
    "Jakarta Raya (General)": rute(20, 12),
    "Bogor":                rute(88,  74),
    "Depok":                rute(62,  48),
    "Bekasi":               rute(52,  40),
    "Tangerang":            rute(62,  50),
    "Tangerang Selatan":    rute(70,  58),
  },

  // -----------------------------------------------------------
  // DARI JAKARTA BARAT — Lintas Rangkasbitung / Tangerang
  // Stasiun utama: Duri, Grogol, Roxy, Tanah Abang
  // -----------------------------------------------------------
  "Jakarta Barat": {
    "Jakarta Selatan":      rute(60,  48),
    "Jakarta Pusat":        rute(35,  25),
    "Jakarta Utara":        rute(52,  40),
    "Jakarta Timur":        rute(50,  38),
    "Jakarta Raya (General)": rute(38, 28),
    "Bogor":                rute(98,  82),
    "Depok":                rute(72,  58),
    "Bekasi":               rute(80,  65),
    "Tangerang":            rute(48,  35),
    "Tangerang Selatan":    rute(78,  64),
  },

  // -----------------------------------------------------------
  // DARI JAKARTA RAYA (GENERAL) — Estimasi rata-rata pusat kota
  // Dipakai jika user tinggal di wilayah Jakarta secara umum
  // -----------------------------------------------------------
  "Jakarta Raya (General)": {
    "Jakarta Selatan":      rute(25,  15),
    "Jakarta Pusat":        rute(20,  12),
    "Jakarta Utara":        rute(40,  30),
    "Jakarta Barat":        rute(35,  25),
    "Jakarta Timur":        rute(28,  18),
    "Bogor":                rute(85,  70),
    "Depok":                rute(60,  48),
    "Bekasi":               rute(55,  43),
    "Tangerang":            rute(65,  52),
    "Tangerang Selatan":    rute(68,  55),
  },
};

// ============================================================
// FUNGSI UTAMA — Dipakai oleh component CommuterOptionsCard
// ============================================================
// Mengembalikan info rute KRL jika tersedia, atau null jika tidak ada
// Cara pakai: getKrlRoute("Bogor", "Jakarta Selatan")
// ============================================================
export function getKrlRoute(
  kotaAsal: string,
  kotaTujuan: string,
): KrlRouteInfo | null {
  return MATRIKS_KRL[kotaAsal]?.[kotaTujuan] ?? null;
}
