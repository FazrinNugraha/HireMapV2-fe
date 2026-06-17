import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple, PathOptions } from "leaflet";
import { FeatureHeader } from "./FeatureHeader";
import { formatRupiah } from "../utils/format";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";
import { getKrlRoute } from "../constants/krl-data";
import "leaflet/dist/leaflet.css";

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
};

type ModeKey = "car" | "motor" | "krl";

type CommuterOption = {
  lokasi: string;
  savings: number;
  fallbackDistance: number;
  lat: number;
  lon: number;
};

type RouteInfo = {
  distance: number;
  duration: number;
  coordinates: LatLngTuple[];
  source: "osrm" | "fallback" | "static"; // "static" = data KRL dari matriks
  biaya?: number; // hanya diisi untuk mode KRL (estimasi harga tiket)
};

type RouteRequest = {
  key: string;
  mode: ModeKey;
  origin: CommuterOption;
  destination: SpatialSummaryItem;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: {
      coordinates: [number, number][];
    };
  }>;
};

const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const MODES: Array<{
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
      color: "#f97316", // oren — menggantikan warna hijau sebelumnya
      durationMultiplier: 0.8,
      routeIndex: 1,
    },
    {
      key: "krl",
      label: "KRL",
      color: "#8b5cf6",  // ungu — identik dengan warna lintas KRL di peta
      durationMultiplier: 1, // tidak dipakai untuk KRL (waktu dari matriks statis)
      routeIndex: 0,
    },
  ];

// Route cache key: satu kombinasi asal-tujuan-moda hanya fetch OSRM sekali.
function getRouteKey(
  originLocation: string,
  destinationLocation: string,
  mode: ModeKey,
) {
  return `${originLocation.toLowerCase()}->${destinationLocation.toLowerCase()}:${mode}`;
}

// Fallback jarak garis lurus jika OSRM gagal atau public API sedang tidak tersedia.
function calculateDistance(
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

function getModeConfig(mode: ModeKey) {
  return MODES.find((item) => item.key === mode) ?? MODES[0];
}

// Estimasi lokal agar card tetap usable saat request OSRM gagal (hanya untuk Mobil & Motor).
function buildFallbackRoute(
  origin: CommuterOption,
  destination: SpatialSummaryItem,
  mode: ModeKey,
): RouteInfo {
  const modeConfig = getModeConfig(mode);
  const roadDistance = origin.fallbackDistance * 1.3;

  // KRL tidak punya rute jalan raya, pakai kecepatan rata-rata KRL ~45 km/jam
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

// Fetch rute jalan dari OSRM public demo. Motor memakai alternatif driving jika tersedia.
async function fetchOsrmRoute(request: RouteRequest): Promise<RouteInfo> {
  const modeConfig = getModeConfig(request.mode);
  const coordinates = `${request.origin.lon},${request.origin.lat};${request.destination.lon},${request.destination.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=true`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const route = data.routes?.[modeConfig.routeIndex] ?? data.routes?.[0];

  if (data.code !== "Ok" || !route) {
    throw new Error(`OSRM route unavailable: ${data.code}`);
  }

  return {
    distance: route.distance / 1000,
    duration: Math.round((route.duration / 60) * modeConfig.durationMultiplier),
    coordinates: route.geometry?.coordinates.map(
      ([lon, lat]) => [lat, lon] as LatLngTuple,
    ) ?? [
        [request.origin.lat, request.origin.lon],
        [request.destination.lat, request.destination.lon],
      ],
    source: "osrm",
  };
}

// Status DSS sederhana untuk menandai apakah commute harian masih realistis.
function getCommuteStatus(duration: number, savings: number) {
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

function formatSavings(value: number) {
  if (value >= 0) return `Hemat ${formatRupiah(value)}/bln`;
  return `Lebih mahal ${formatRupiah(Math.abs(value))}/bln`;
}

// ------------------------------------------------------------
// Estimasi biaya BBM per bulan untuk Mobil dan Motor
// ------------------------------------------------------------
// Asumsi:
//   - Bahan bakar: Pertalite Rp 10.000/liter (harga per 2024)
//   - Konsumsi mobil : 12 km/liter (rata-rata kota)
//   - Konsumsi motor : 40 km/liter (rata-rata motor bebek/matic)
//   - Setiap hari kerja dihitung pulang-pergi (jarak × 2)
//   - 22 hari kerja per bulan
// ------------------------------------------------------------
const HARGA_BENSIN_PER_LITER = 10_000; // Rp/liter (Pertalite)
const KONSUMSI_MOBIL = 12;     // km per liter
const KONSUMSI_MOTOR = 40;     // km per liter
const HARI_KERJA_PER_BULAN = 22;     // hari

function hitungBiayaBbmPerBulan(jarakKm: number, mode: "car" | "motor"): number {
  const konsumsi = mode === "car" ? KONSUMSI_MOBIL : KONSUMSI_MOTOR;
  const biayaPerTrip = (jarakKm / konsumsi) * HARGA_BENSIN_PER_LITER; // satu arah
  const biayaPerHari = biayaPerTrip * 2;                              // PP
  return Math.round(biayaPerHari * HARI_KERJA_PER_BULAN);              // per bulan
}

/**
 * Simulator opsi komuter.
 * User memilih kota tinggal, lalu sistem menghitung rute mobil/motor ke lokasi kerja memakai OSRM.
 */
export function CommuterOptionsCard({
  prediction,
  spatialSummary,
}: CommuterOptionsCardProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [routeCache, setRouteCache] = useState<Record<string, RouteInfo>>({});
  const requestedRoutesRef = useRef(new Set<string>());

  const targetLocation = spatialSummary.find(
    (item) =>
      item.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase(),
  );

  // Auto-focus atau pilih kota asal pertama saat pilihan kota asal berubah
  useEffect(() => {
    if (selectedLocations.length === 0) {
      setActiveLocation(null);
    } else if (!activeLocation || !selectedLocations.includes(activeLocation)) {
      setActiveLocation(selectedLocations[0]);
    }
  }, [selectedLocations, activeLocation]);

  const commuterOptions = useMemo<CommuterOption[]>(() => {
    if (!targetLocation || spatialSummary.length === 0) return [];

    return spatialSummary
      .filter(
        (item) =>
          item.Lokasi_Clean.toLowerCase() !==
          targetLocation.Lokasi_Clean.toLowerCase(),
      )
      .map((item) => ({
        lokasi: item.Lokasi_Clean,
        savings: prediction.estimasi_kos - item.Harga_Kos_Estimasi,
        fallbackDistance: calculateDistance(
          targetLocation.lat,
          targetLocation.lon,
          item.lat,
          item.lon,
        ),
        lat: item.lat,
        lon: item.lon,
      }))
      .sort((a, b) => b.savings - a.savings);
  }, [prediction.estimasi_kos, spatialSummary, targetLocation]);

  // Kota yang dipilih user saja yang dirender dan dihitung rutenya.
  const selectedOptions = useMemo(() => {
    const selected = new Set(selectedLocations);
    return commuterOptions.filter((option) => selected.has(option.lokasi));
  }, [commuterOptions, selectedLocations]);

  // Request dibuat dari kombinasi kota terpilih x moda transportasi.
  // Untuk KRL: hanya dibuat jika ada data di matriks (getKrlRoute tidak null)
  const routeRequests = useMemo<RouteRequest[]>(() => {
    if (!targetLocation) return [];

    return selectedOptions.flatMap((origin) =>
      MODES
        .filter((mode) => {
          // Mobil & Motor: selalu ada
          if (mode.key !== "krl") return true;
          // KRL: cek dulu apakah rute ada di matriks
          return getKrlRoute(origin.lokasi, targetLocation.Lokasi_Clean) !== null;
        })
        .map((mode) => ({
          key: getRouteKey(origin.lokasi, targetLocation.Lokasi_Clean, mode.key),
          mode: mode.key,
          origin,
          destination: targetLocation,
        })),
    );
  }, [selectedOptions, targetLocation]);

  // Fetch route dilakukan lazy: hanya saat kombinasi belum ada di cache.
  useEffect(() => {
    routeRequests.forEach((request) => {
      if (
        routeCache[request.key] ||
        requestedRoutesRef.current.has(request.key)
      )
        return;

      requestedRoutesRef.current.add(request.key);

      if (request.mode === "krl") {
        // ── MODE KRL ──────────────────────────────────────────────────────
        // Tidak fetch API. Ambil langsung dari matriks statis di krl-data.ts
        // Koordinat pakai garis lurus asal→tujuan (tidak ada geometri rel)
        // ─────────────────────────────────────────────────────────────────
        const krlData = getKrlRoute(
          request.origin.lokasi,
          request.destination.Lokasi_Clean,
        );
        const route: RouteInfo = krlData
          ? {
            distance: krlData.jarak,
            duration: krlData.waktu,
            coordinates: [
              [request.origin.lat, request.origin.lon],
              [request.destination.lat, request.destination.lon],
            ],
            source: "static",
            biaya: krlData.biaya, // harga tiket ikut disimpan di cache
          }
          : buildFallbackRoute(request.origin, request.destination, "krl");

        setRouteCache((current) => ({ ...current, [request.key]: route }));
      } else {
        // ── MODE MOBIL & MOTOR ────────────────────────────────────────────
        // Fetch rute jalan dari OSRM, fallback ke estimasi lokal jika gagal
        // ─────────────────────────────────────────────────────────────────
        fetchOsrmRoute(request)
          .catch(() =>
            buildFallbackRoute(request.origin, request.destination, request.mode),
          )
          .then((route) => {
            setRouteCache((current) => ({ ...current, [request.key]: route }));
          });
      }
    });
  }, [routeCache, routeRequests]);

  const activeOption = useMemo(() => {
    return selectedOptions.find((opt) => opt.lokasi === activeLocation) || selectedOptions[0];
  }, [selectedOptions, activeLocation]);

  const activeRoutes = useMemo(() => {
    if (!activeOption || !targetLocation) return [];

    return MODES
      .filter((modeItem) => {
        if (modeItem.key !== "krl") return true;
        return getKrlRoute(activeOption.lokasi, targetLocation.Lokasi_Clean) !== null;
      })
      .map(({ key: mode }) => {
        const key = getRouteKey(
          activeOption.lokasi,
          targetLocation.Lokasi_Clean,
          mode,
        );
        return {
          mode,
          route: routeCache[key] || buildFallbackRoute(activeOption, targetLocation, mode),
        };
      });
  }, [activeOption, targetLocation, routeCache]);

  if (!targetLocation || spatialSummary.length === 0) return null;

  const toggleLocation = (location: string) => {
    setSelectedLocations((current) =>
      current.includes(location)
        ? current.filter((item) => item !== location)
        : [...current, location],
    );
  };

  return (
    <div className="animate-fade-slide-down rounded-[24px] border border-[#E5E2E0] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:rounded-[32px] md:p-7">
      <div className="mb-5">
        <FeatureHeader
          title="Simulator Opsi Komuter"
          description={
            <>
              Lokasi kerja dikunci ke{" "}
              <span className="font-bold text-[#141413]">
                {prediction.lokasi}
              </span>
              . Pilih wilayah tinggal dan moda transportasi untuk membandingkan
              jarak serta waktu tempuh.
            </>
          }
        />
      </div>

      <div className="grid gap-5">
        {/* Panel Pilihan Kota Asal */}
        <div className="rounded-[20px] border border-[#E5E2E0] bg-[#FCFBFA] p-4">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
                Kota asal komuter
              </h4>
              <p className="mt-0.5 text-xs text-[#A0A09A]">
                {selectedLocations.length > 0
                  ? `${selectedLocations.length} kota dipilih`
                  : "Pilih satu atau beberapa kota asal"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLocations([])}
              className="rounded-full border border-[#E5E2E0] bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#141413] shadow-sm transition hover:border-[#141413] hover:bg-[#FCFBFA] disabled:cursor-not-allowed disabled:border-[#E5E2E0] disabled:bg-white disabled:text-[#A0A09A] disabled:shadow-none"
              disabled={selectedLocations.length === 0}
            >
              Reset
            </button>
          </div>

          <div className="grid max-h-[128px] grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {commuterOptions.map((option) => {
              const isSelected = selectedLocations.includes(option.lokasi);

              return (
                <button
                  type="button"
                  key={option.lokasi}
                  onClick={() => toggleLocation(option.lokasi)}
                  className={`min-h-9 rounded-full border px-3 py-1.5 text-center text-xs font-semibold leading-5 transition ${isSelected
                    ? "border-[#141413] bg-[#141413] text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                    : "border-[#E5E2E0] bg-white text-[#555555] hover:border-[#141413] hover:bg-[#FCFBFA]"
                    }`}
                >
                  {option.lokasi}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Utama: List Kartu Kota + Sticky Map */}
        {selectedOptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Sisi Kiri: Daftar Kartu Kota */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {selectedOptions.map((option) => {
                const isActive = option.lokasi === activeLocation;

                // Cari data rute untuk kota ini
                const routes = MODES
                  .filter((modeItem) => {
                    if (modeItem.key !== "krl") return true;
                    return getKrlRoute(option.lokasi, targetLocation.Lokasi_Clean) !== null;
                  })
                  .map(({ key: mode }) => {
                    const key = getRouteKey(
                      option.lokasi,
                      targetLocation.Lokasi_Clean,
                      mode,
                    );
                    return {
                      mode,
                      route: routeCache[key],
                      fallbackRoute: buildFallbackRoute(
                        option,
                        targetLocation,
                        mode,
                      ),
                    };
                  });

                return (
                  <div
                    key={option.lokasi}
                    onClick={() => setActiveLocation(option.lokasi)}
                    className={`cursor-pointer overflow-hidden rounded-[20px] border transition-all duration-300 h-full flex flex-col ${isActive
                      ? "border-[#C8C6C4] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                      : "border-[#E5E2E0] bg-[#FCFBFA] hover:border-[#141413]/15 hover:bg-white"
                      }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 h-full">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#696969]">
                            Kost di {option.lokasi}
                          </h4>
                          <div
                            className={`mt-1 text-lg font-bold ${option.savings >= 0 ? "text-[#10b981]" : "text-[#dc2626]"}`}
                          >
                            {formatSavings(option.savings)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-[#E5E2E0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#555555]">
                            Ke {targetLocation.Lokasi_Clean}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-[#141413] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                              Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grid Mode Transportasi */}
                      <div className={`mt-4 grid grid-cols-1 gap-3 flex-1 ${routes.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                        {routes.map(({ mode, route, fallbackRoute }) => {
                          const modeConfig = getModeConfig(mode);
                          const activeRoute = route ?? fallbackRoute;
                          const status = getCommuteStatus(
                            activeRoute.duration,
                            option.savings,
                          );
                          const isLoading = !route;

                          return (
                            <div
                              key={mode}
                              className="relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-[#E5E2E0]/80 bg-white p-3.5 transition-all duration-300 hover:border-[#141413]/15 shadow-sm h-full"
                            >
                              {/* Header Card Transportasi */}
                              <div className="flex items-center justify-between pb-2">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor: `${modeConfig.color}12`,
                                      color: modeConfig.color,
                                    }}
                                  >
                                    {mode === "car" ? (
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4 1L2 12c-.5.8-.5 2-.5 3v1c0 .6.4 1 1 1h2" />
                                        <circle cx="7" cy="17" r="2" />
                                        <path d="M9 17h6" />
                                        <circle cx="17" cy="17" r="2" />
                                      </svg>
                                    ) : mode === "motor" ? (
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="5" cy="18" r="3" />
                                        <circle cx="19" cy="18" r="3" />
                                        <path d="M12 18V10h7m-7 3h4m-8-3l3-4h4" />
                                      </svg>
                                    ) : (
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect x="4" y="3" width="16" height="13" rx="2" />
                                        <path d="M4 11h16" />
                                        <path d="M12 3v8" />
                                        <path d="M8 19l-2 2" />
                                        <path d="M18 21l-2-2" />
                                        <path d="M7 19h10" />
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-bold text-[#141413]">
                                    {modeConfig.label}
                                  </span>
                                </div>
                                <span
                                  className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>

                              {/* Tampilan Estimasi Biaya */}
                              <div className="py-1.5">
                                <div className="text-[9px] font-bold uppercase tracking-wider text-[#696969]">
                                  {mode === "krl" ? "Tarif Tiket" : "Est. BBM/bln"}
                                </div>
                                <div className="text-[14px] sm:text-[15px] font-extrabold text-[#141413] mt-0.5">
                                  {mode === "krl"
                                    ? activeRoute.biaya !== undefined
                                      ? formatRupiah(activeRoute.biaya)
                                      : "-"
                                    : formatRupiah(hitungBiayaBbmPerBulan(activeRoute.distance, mode))}
                                </div>
                              </div>

                              {/* Footer Card: Info Jarak & Waktu Tempuh */}
                              <div className="mt-1.5 flex items-center justify-between border-t border-[#F0EFEA] pt-2 text-[10px] text-[#555555]">
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="h-3 w-3 text-[#A0A09A]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                  </svg>
                                  <span className="font-semibold text-[#141413]">
                                    {activeRoute.distance.toFixed(1)} km
                                  </span>
                                </div>
                                <span className="h-3 w-px bg-[#E5E2E0]" />
                                <div className="flex items-center gap-1">
                                  <svg
                                    className="h-3 w-3 text-[#A0A09A]"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                  </svg>
                                  <span className="font-semibold text-[#141413]">
                                    {isLoading && mode !== "krl" ? (
                                      <span className="inline-flex items-center gap-0.5">
                                        <span className="spinner h-2 w-2" />
                                        ...
                                      </span>
                                    ) : (
                                      `~${activeRoute.duration} mnt`
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sisi Kanan: Map Terpadu yang Sticky */}
            <div className="lg:col-span-5 xl:col-span-4 lg:h-[280px]">
              <div className="lg:sticky lg:top-6 overflow-hidden rounded-[20px] border border-[#E5E2E0] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.04)] p-2 h-[240px] lg:h-[280px]">
                {activeOption && (
                  <CommuterRouteMap
                    destination={targetLocation}
                    activeOrigin={activeOption}
                    routes={activeRoutes}
                    allSelectedOrigins={selectedOptions}
                    onSelectActiveOrigin={setActiveLocation}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State yang Rapi & Indah */
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[#D1CDC7] bg-[#FCFBFA] py-12 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#141413]/5 text-[#141413]/60 mb-3">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h5 className="text-sm font-bold text-[#141413] mb-1">Belum Ada Kota Terpilih</h5>
            <p className="max-w-md text-xs text-[#696969] leading-relaxed">
              Pilih satu atau beberapa kota asal komuter di atas untuk membandingkan rute, estimasi biaya bensin bulanan, tarif tiket kereta KRL, dan waktu tempuh ke lokasi kerja.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommuterRouteMap({
  destination,
  activeOrigin,
  routes,
  allSelectedOrigins,
  onSelectActiveOrigin,
}: {
  destination: SpatialSummaryItem;
  activeOrigin: CommuterOption;
  routes: Array<{ mode: ModeKey; route: RouteInfo }>;
  allSelectedOrigins: CommuterOption[];
  onSelectActiveOrigin: (lokasi: string) => void;
}) {
  const center: LatLngExpression = [
    (activeOrigin.lat + destination.lat) / 2,
    (activeOrigin.lon + destination.lon) / 2,
  ];

  const fitPositions = useMemo(() => {
    // Kumpulkan koordinat rute aktif
    const activeCoords = routes.flatMap((item) => item.route?.coordinates || []);
    if (activeCoords.length > 0) return activeCoords;

    // Fallback ke titik asal + tujuan
    return [
      [activeOrigin.lat, activeOrigin.lon],
      [destination.lat, destination.lon],
    ] as LatLngTuple[];
  }, [routes, activeOrigin, destination]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[18px]">
      <MapContainer
        center={center}
        zoom={10}
        minZoom={8}
        maxZoom={14}
        scrollWheelZoom
        dragging
        doubleClickZoom
        zoomControl
        className="h-full w-full"
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <FitRouteBounds positions={fitPositions} />

        {/* Render rute aktif */}
        {routes.map(({ mode, route }) => {
          if (!route) return null;
          const modeConfig = getModeConfig(mode);
          const pathOptions: PathOptions = {
            color: modeConfig.color,
            weight: mode === "car" ? 4 : 3.5,
            opacity: 0.82,
            dashArray:
              mode === "motor" ? "7 6"
                : mode === "krl" ? "2 5"
                  : undefined,
          };

          return (
            <Polyline
              key={mode}
              positions={route.coordinates}
              pathOptions={pathOptions}
            />
          );
        })}

        {/* Render semua kota asal terpilih */}
        {allSelectedOrigins.map((originItem) => {
          const isActive = originItem.lokasi === activeOrigin.lokasi;

          return (
            <CircleMarker
              key={originItem.lokasi}
              center={[originItem.lat, originItem.lon]}
              pathOptions={{
                color: "#ffffff",
                fillColor: isActive ? "#10b981" : "#a0a09a",
                fillOpacity: isActive ? 0.95 : 0.65,
                weight: isActive ? 2.5 : 1.5,
              }}
              radius={isActive ? 8 : 6}
              eventHandlers={{
                click: () => {
                  onSelectActiveOrigin(originItem.lokasi);
                },
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -8]}
                permanent
                className={`custom-map-tooltip transition-all duration-300 ${isActive ? "active-tooltip font-bold shadow-md" : "inactive-tooltip opacity-75"
                  }`}
              >
                {originItem.lokasi}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Render Kantor/Tujuan */}
        <CircleMarker
          center={[destination.lat, destination.lon]}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#F37338",
            fillOpacity: 0.95,
            weight: 2.5,
          }}
          radius={8}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            permanent
            className="custom-map-tooltip dest-tooltip font-bold shadow-md"
          >
            {destination.Lokasi_Clean} (Kerja)
          </Tooltip>
        </CircleMarker>
      </MapContainer>

      {/* Legend peta di bagian bawah-kiri di dalam peta */}
      <div className="pointer-events-none absolute left-3 bottom-3 z-[500] flex gap-1.5 rounded-full border border-[#E5E2E0] bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#555555] shadow-sm backdrop-blur">
        {routes.map(({ mode }) => {
          const modeConfig = getModeConfig(mode);
          return (
            <span key={mode} className="inline-flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: modeConfig.color }}
              />
              {modeConfig.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FitRouteBounds({ positions }: { positions: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    window.setTimeout(() => {
      map.invalidateSize();

      if (positions.length >= 2) {
        map.fitBounds(positions, { padding: [24, 24], maxZoom: 11 });
      }
    }, 0);
  }, [map, positions]);

  return null;
}
