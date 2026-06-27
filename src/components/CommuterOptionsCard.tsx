import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureHeader } from "./FeatureHeader";
import { formatRupiah } from "../utils/format";
import type { SalaryPredictionResponse, SpatialSummaryItem } from "../types/api";
import { getKrlRoute } from "../constants/krl-data";
import type { CommuterOption, RouteInfo, RouteRequest } from "./commuter/types";
import { getRouteKey, calculateDistance, buildFallbackRoute, formatSavings } from "./commuter/utils";
import { MODES } from "./commuter/constants";
import { fetchTomTomRoute } from "./commuter/api";
import { CommuterRouteMap } from "./commuter/CommuterRouteMap";
import { TransportModeCard } from "./commuter/TransportModeCard";

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
};

/**
 * Simulator opsi komuter.
 * User memilih kota tinggal, lalu sistem menghitung rute mobil/motor ke lokasi kerja
 * memakai TomTom Routing API dengan data traffic real-time.
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
        // Fetch rute jalan dari TomTom, fallback ke estimasi lokal jika gagal
        // ─────────────────────────────────────────────────────────────────
        fetchTomTomRoute(request)
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
    // Single-select: klik kota yang sama → deselect, klik kota lain → ganti pilihan
    setSelectedLocations((current) =>
      current.includes(location) ? [] : [location]
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
                  ? `${selectedLocations[0]} dipilih`
                  : "Pilih satu kota asal komuter"}
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
                        {routes.map(({ mode, route, fallbackRoute }) => (
                          <TransportModeCard
                            key={mode}
                            mode={mode}
                            route={route}
                            fallbackRoute={fallbackRoute}
                            savings={option.savings}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sisi Kanan: Map Terpadu yang Sticky */}
            <div className="lg:col-span-5 xl:col-span-4 lg:self-start">
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
