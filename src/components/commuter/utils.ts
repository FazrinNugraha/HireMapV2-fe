import { formatRupiah } from "../../utils/format";
import type { CommuterOption, ModeKey, RouteInfo } from "./types";
import { MODES, HARGA_BENSIN_PER_LITER, HARI_KERJA_PER_BULAN } from "./constants";
import type { SpatialSummaryItem } from "../../types/api";

/**
 * Menghasilkan unique key untuk cache rute berdasarkan kombinasi asal, tujuan, dan moda.
 * Digunakan agar kita tidak melakukan request API berulang untuk rute yang sama.
 */
export function getRouteKey(
  originLocation: string,
  destinationLocation: string,
  mode: ModeKey,
) {
  return `${originLocation.toLowerCase()}->${destinationLocation.toLowerCase()}:${mode}`;
}

/**
 * Menghitung jarak garis lurus (Haversine formula) antara dua titik koordinat bumi.
 * Digunakan sebagai fallback jarak jika API routing gagal atau untuk estimasi KRL statis.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mengambil konfigurasi moda transportasi (label, warna, multiplier durasi).
 * Default ke moda pertama jika key tidak ditemukan.
 */
export function getModeConfig(mode: ModeKey) {
  return MODES.find((item) => item.key === mode) ?? MODES[0];
}

/**
 * Membuat data rute fallback jika pemanggilan API gagal atau untuk rute KRL statis.
 * Jarak jalan raya diasumsikan 1.3x jarak garis lurus.
 * Durasi dihitung berdasarkan asumsi kecepatan rata-rata moda.
 */
export function buildFallbackRoute(
  origin: CommuterOption,
  destination: SpatialSummaryItem,
  mode: ModeKey,
): RouteInfo {
  const modeConfig = getModeConfig(mode);
  const roadDistance = origin.fallbackDistance * 1.3;

  const speedKmh = mode === "krl" ? 45 : mode === "motor" ? 32 : 24;

  return {
    distance: roadDistance,
    duration: Math.round(
      (roadDistance / speedKmh) * 60 * modeConfig.durationMultiplier,
    ),
    coordinates: [
      [origin.lat, origin.lon],
      [destination.lat, destination.lon],
    ],
    source: "fallback",
  };
}

/**
 * Menentukan status kelayakan komuter harian berdasarkan durasi tempuh dan penghematan kos.
 * Mengembalikan objek berisi label teks dan kelas warna Tailwind untuk UI.
 */
export function getCommuteStatus(duration: number, savings: number) {
  if (duration <= 60 && savings >= 0) {
    return {
      label: "Layak",
      className: "bg-[#10b981]/10 text-[#047857] border-[#10b981]/25",
    };
  }

  if (duration <= 90) {
    return {
      label: "Cukup berat",
      className: "bg-[#f59e0b]/10 text-[#b45309] border-[#f59e0b]/25",
    };
  }

  return {
    label: "Berat",
    className: "bg-[#ef4444]/10 text-[#dc2626] border-[#ef4444]/25",
  };
}

/**
 * Memformat selisih penghematan biaya kos menjadi string yang ramah pengguna.
 * Contoh: "Hemat Rp 500.000/bln" atau "Lebih mahal Rp 200.000/bln".
 */
export function formatSavings(value: number) {
  if (value >= 0) return `Hemat ${formatRupiah(value)}/bln`;
  return `Lebih mahal ${formatRupiah(Math.abs(value))}/bln`;
}

/**
 * Menghitung estimasi konsumsi BBM (dalam liter) berdasarkan jarak saja.
 * Digunakan sebagai fallback jika TomTom Routing API gagal mengembalikan fuelConsumptionInLiters.
 */
export function hitungLiterFallback(jarakKm: number, mode: "car" | "motor"): number {
  const kmPerLiter = mode === "car" ? 12 : 40;
  return jarakKm / kmPerLiter;
}

/**
 * Menghitung total estimasi biaya BBM dalam sebulan untuk perjalanan pulang-pergi.
 * Mengasumsikan 22 hari kerja dan jarak tempuh dikali 2 (PP).
 */
export function hitungBiayaBbmPerBulan(literPerTrip: number): number {
  return Math.round(literPerTrip * 2 * HARI_KERJA_PER_BULAN * HARGA_BENSIN_PER_LITER);
}
