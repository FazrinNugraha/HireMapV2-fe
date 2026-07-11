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

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
};

/**
 * Simulator opsi komuter premium (Single-Route Dashboard).
 * User memilih satu kota tinggal dan satu moda transportasi via dropdown.
 * Peta, tabel perbandingan log, dan mockup HP di kanan akan ber-update secara real-time.
 */
export function CommuterOptionsCard({
  prediction,
  spatialSummary,
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

  // State untuk kota asal aktif dan moda transportasi aktif
  const [selectedOrigin, setSelectedOrigin] = useState<string>(
    commuterOptions[0]?.lokasi || "",
  );
  const [activeMode, setActiveMode] = useState<ModeKey>("motor");

  // Route Cache & Requested Ref
  const [routeCache, setRouteCache] = useState<Record<string, RouteInfo>>({});
  const requestedRoutesRef = useRef(new Set<string>());

  // Sinkronisasi kota asal jika list berubah
  useEffect(() => {
    if (
      commuterOptions.length > 0 &&
      (!selectedOrigin ||
        !commuterOptions.some((opt) => opt.lokasi === selectedOrigin))
    ) {
      setSelectedOrigin(commuterOptions[0].lokasi);
    }
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
              setSelectedOrigin(rawCity);
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
                setActiveMode(found.key);
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
              onSelectActiveOrigin={setSelectedOrigin}
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
