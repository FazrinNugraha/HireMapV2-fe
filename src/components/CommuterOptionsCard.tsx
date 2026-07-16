import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureHeader } from "./FeatureHeader";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";
import { getKrlRoute } from "../constants/krl-data";
import type {
  CommuterOption,
  ModeKey,
  RouteInfo,
  RouteRequest,
} from "./commuter/types";
import {
  getRouteKey,
  calculateDistance,
  buildFallbackRoute,
} from "./commuter/utils";
import { MODES } from "./commuter/constants";
import { fetchTomTomRoute } from "./commuter/api";
import { CommuterRouteMap } from "./commuter/CommuterRouteMap";
import { CommuterDetailCard } from "./commuter/CommuterDetailCard";
import { PerformanceDashboard } from "./commuter/PerformanceDashboard";
import { SelectField } from "./SelectField";

const COMMUTE_STORAGE_KEY = "hiremap_last_commute";

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
  selectedOrigin: string;
  activeMode: ModeKey;
  onOriginChange: (origin: string) => void;
  onModeChange: (mode: ModeKey) => void;
};

/**
 * Simulator opsi komuter premium (Single-Route Dashboard).
 * User memilih satu kota tinggal dan satu moda transportasi via dropdown.
 * Peta, tabel perbandingan log, dan mockup HP di kanan akan ber-update secara real-time.
 */
export function CommuterOptionsCard({
  prediction,
  spatialSummary,
  selectedOrigin,
  activeMode,
  onOriginChange,
  onModeChange,
}: CommuterOptionsCardProps) {
  // Lokasi tujuan kerja
  const targetLocation = spatialSummary.find(
    (item) =>
      item.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase(),
  );

  // Filter kota asal komuter
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

  // Route Cache & Requested Ref
  const [routeCache, setRouteCache] = useState<Record<string, RouteInfo>>({});
  const requestedRoutesRef = useRef(new Set<string>());
  // Gunakan ref agar onOriginChange tidak perlu masuk dependency array useEffect
  const onOriginChangeRef = useRef(onOriginChange);
  onOriginChangeRef.current = onOriginChange;

  // Sinkronisasi kota asal ke default pertama jika belum ada pilihan atau pilihan tidak valid
  useEffect(() => {
    if (
      commuterOptions.length > 0 &&
      (!selectedOrigin ||
        !commuterOptions.some((opt) => opt.lokasi === selectedOrigin))
    ) {
      onOriginChangeRef.current(commuterOptions[0].lokasi);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commuterOptions, selectedOrigin]);

  // Opsi komuter yang terpilih saat ini
  const activeOption = useMemo(() => {
    return commuterOptions.find((opt) => opt.lokasi === selectedOrigin);
  }, [commuterOptions, selectedOrigin]);

  // Request dibuat dari kombinasi kota terpilih x moda transportasi terpilih.
  const routeRequest = useMemo<RouteRequest | null>(() => {
    if (!targetLocation || !activeOption) return null;
    return {
      key: getRouteKey(
        activeOption.lokasi,
        targetLocation.Lokasi_Clean,
        activeMode,
      ),
      mode: activeMode,
      origin: activeOption,
      destination: targetLocation,
    };
  }, [activeOption, targetLocation, activeMode]);

  // Fetch route secara lazy (hanya ketika dropdown berubah dan rute belum di-cache)
  useEffect(() => {
    if (!routeRequest) return;

    if (
      routeCache[routeRequest.key] ||
      requestedRoutesRef.current.has(routeRequest.key)
    )
      return;

    requestedRoutesRef.current.add(routeRequest.key);

    if (routeRequest.mode === "krl") {
      // ── KRL dari Matriks Statis ──
      const krlData = getKrlRoute(
        routeRequest.origin.lokasi,
        routeRequest.destination.Lokasi_Clean,
      );
      const route: RouteInfo = krlData
        ? {
          distance: krlData.jarak,
          duration: krlData.waktu,
          coordinates: [
            [routeRequest.origin.lat, routeRequest.origin.lon],
            [routeRequest.destination.lat, routeRequest.destination.lon],
          ],
          source: "static",
          biaya: krlData.biaya,
        }
        : buildFallbackRoute(
          routeRequest.origin,
          routeRequest.destination,
          "krl",
        );

      setRouteCache((current) => ({ ...current, [routeRequest.key]: route }));
    } else {
      // ── Mobil & Motor dari TomTom ──
      fetchTomTomRoute(routeRequest)
        .catch(() =>
          buildFallbackRoute(
            routeRequest.origin,
            routeRequest.destination,
            routeRequest.mode,
          ),
        )
        .then((route) => {
          setRouteCache((current) => ({
            ...current,
            [routeRequest.key]: route,
          }));
        });
    }
  }, [routeCache, routeRequest]);

  // Rute aktif terpilih untuk peta
  const activeRoutesForMap = useMemo(() => {
    if (!activeOption || !targetLocation || !routeRequest) return [];

    return [
      {
        mode: activeMode,
        route:
          routeCache[routeRequest.key] ||
          buildFallbackRoute(activeOption, targetLocation, activeMode),
      },
    ];
  }, [activeOption, targetLocation, routeRequest, routeCache, activeMode]);

  // Simpan snapshot simulasi aktif ke localStorage agar FeasibilityScoreCard
  // bisa membaca jarak & durasi nyata untuk menghitung skor commute DSS.
  useEffect(() => {
    if (!activeOption || !targetLocation) return;

    const route = routeRequest ? routeCache[routeRequest.key] : undefined;
    const modeLabel = MODES.find((m) => m.key === activeMode)?.label ?? activeMode;

    const snapshot = {
      origin: activeOption.lokasi,
      destination: targetLocation.Lokasi_Clean,
      distance: route?.distance ?? activeOption.fallbackDistance,
      duration: route?.duration ?? Math.round((activeOption.fallbackDistance / 40) * 60),
      mode: modeLabel,
    };

    try {
      localStorage.setItem(COMMUTE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // localStorage tidak tersedia (mode private/incognito)
    }
  }, [activeOption, targetLocation, activeMode, routeRequest, routeCache]);

  if (!targetLocation || spatialSummary.length === 0 || !activeOption)
    return null;

  const currentRoute = routeRequest ? routeCache[routeRequest.key] : undefined;
  const fallbackRoute = buildFallbackRoute(
    activeOption,
    targetLocation,
    activeMode,
  );

  return (
    <div className="animate-fade-slide-down rounded-[40px] border border-[#E5E2E0] bg-[#FCFBFA] p-4 shadow-[rgba(0,0,0,0.06)_0px_8px_30px] md:p-6">
      {/* Header Utama */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FeatureHeader
          title="Commuter Simulator"
          description={
            <>
              Lokasi kerja Anda di{" "}
              <span className="font-bold text-[#141413]">
                {prediction.lokasi}
              </span>
              . Pilih wilayah tinggal dan kendaraan untuk memulai simulasi.
            </>
          }
        />

        {/* Dropdown Filters (Mastercard Pill Style) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Kota Asal */}
          <SelectField
            value={`Asal: ${selectedOrigin}`}
            options={commuterOptions.map((opt) => `Asal: ${opt.lokasi}`)}
            onChange={(val) => {
              const rawCity = val.replace("Asal: ", "");
              onOriginChange(rawCity);
            }}
            variant="outline"
          />

          {/* Dropdown Moda Transportasi */}
          <SelectField
            value={`Moda: ${MODES.find((m) => m.key === activeMode)?.label || activeMode}`}
            options={MODES.map((mode) => `Moda: ${mode.label}`)}
            onChange={(val) => {
              const label = val.replace("Moda: ", "");
              const found = MODES.find((m) => m.label === label);
              if (found) {
                onModeChange(found.key);
              }
            }}
            variant="outline"
          />
        </div>
      </div>

      {/* Grid Layout Utama */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Peta Utama + Dashboard Performa */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-[470px]">
          {/* Peta Wrapper (Stadium shape: rounded-40) */}
          <div className="relative h-[240px] overflow-hidden rounded-[40px] border border-[#E5E2E0] shadow-sm bg-white">
            <CommuterRouteMap
              destination={targetLocation}
              activeOrigin={activeOption}
              routes={activeRoutesForMap}
              allSelectedOrigins={commuterOptions.filter(
                (opt) => opt.lokasi === selectedOrigin,
              )}
              onSelectActiveOrigin={onOriginChange}
            />
          </div>

          {/* Performance Dashboard Table */}
          <PerformanceDashboard
            mode={activeMode}
            route={currentRoute}
            fallbackRoute={fallbackRoute}
          />
        </div>

        {/* Kolom Kanan: Detail Card (Sejajar Tinggi) */}
        <div className="lg:col-span-4 h-[470px]">
          <CommuterDetailCard
            originCity={activeOption.lokasi}
            destinationCity={targetLocation.Lokasi_Clean}
            mode={activeMode}
            route={currentRoute}
            fallbackRoute={fallbackRoute}
            savings={activeOption.savings}
            kosCost={prediction.estimasi_kos - activeOption.savings}
            targetKosCost={prediction.estimasi_kos}
          />
        </div>
      </div>
    </div>
  );
}
