import type { ModeKey } from "./types";

export const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY as string;

export const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const MODES: Array<{
  key: ModeKey;
  label: string;
  color: string;
  durationMultiplier: number;
  routeIndex: number;
}> = [
  {
    key: "car",
    label: "Mobil",
    color: "#3860BE",
    durationMultiplier: 1,
    routeIndex: 0,
  },
  {
    key: "motor",
    label: "Motor",
    color: "#f97316",
    durationMultiplier: 0.8,
    routeIndex: 1,
  },
  {
    key: "krl",
    label: "KRL",
    color: "#8b5cf6",
    durationMultiplier: 1,
    routeIndex: 0,
  },
];

export const HARGA_BENSIN_PER_LITER = 10_000;
export const HARI_KERJA_PER_BULAN = 22;

/**
 * Kurva Konsumsi Kendaraan untuk TomTom API (constantSpeedConsumptionInLitersPerHundredkm).
 * 
 * Format: "kecepatan,konsumsi:kecepatan,konsumsi:..."
 *   - kecepatan dalam km/jam
 *   - konsumsi dalam Liter per 100 km (L/100km)
 * 
 * TomTom menggunakan nilai ini untuk melakukan interpolasi. Saat mesin menghitung rute, 
 * TomTom akan melihat kecepatan kendaraan di setiap titik jalan (termasuk saat macet stop-and-go 
 * atau saat ngebut di tol) lalu menghitung estimasi BBM secara presisi berdasarkan kurva ini.
 * 
 * Contoh Mobil:
 * - 30 km/j -> 9.0 L/100km (Macet / Stop-and-go boros bensin)
 * - 80 km/j -> 7.0 L/100km (Jalan arteri lancar sangat efisien)
 * - 120 km/j -> 8.5 L/100km (Tol kecepatan tinggi, aerodinamika membuat boros lagi)
 */
export const VEHICLE_CONSUMPTION = {
  car: "30,9.0:50,8.0:80,7.0:100,7.5:120,8.5",
  motorcycle: "20,2.8:40,2.5:60,2.7:80,3.0",
};
