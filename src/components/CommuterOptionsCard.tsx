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
import "leaflet/dist/leaflet.css";

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
};

type ModeKey = "car" | "motor";

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
  source: "osrm" | "fallback";
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
      color: "#10b981",
      durationMultiplier: 0.8,
      routeIndex: 1,
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

// Estimasi lokal agar card tetap usable saat request OSRM gagal.
function buildFallbackRoute(
  origin: CommuterOption,
  destination: SpatialSummaryItem,
  mode: ModeKey,
): RouteInfo {
  const modeConfig = getModeConfig(mode);
  const roadDistance = origin.fallbackDistance * 1.3;
  const speedKmh = mode === "motor" ? 32 : 24;

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

/**
 * Simulator opsi komuter.
 * User memilih kota tinggal, lalu sistem menghitung rute mobil/motor ke lokasi kerja memakai OSRM.
 */
export function CommuterOptionsCard({
  prediction,
  spatialSummary,
}: CommuterOptionsCardProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [routeCache, setRouteCache] = useState<Record<string, RouteInfo>>({});
  const requestedRoutesRef = useRef(new Set<string>());

  const targetLocation = spatialSummary.find(
    (item) =>
      item.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase(),
  );

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
  const routeRequests = useMemo<RouteRequest[]>(() => {
    if (!targetLocation) return [];

    return selectedOptions.flatMap((origin) =>
      MODES.map((mode) => ({
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
      fetchOsrmRoute(request)
        .catch(() =>
          buildFallbackRoute(request.origin, request.destination, request.mode),
        )
        .then((route) => {
          setRouteCache((current) => ({ ...current, [request.key]: route }));
        });
    });
  }, [routeCache, routeRequests]);

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

      <div className="grid gap-3">
        <div className="rounded-[18px] border border-[#E5E2E0] bg-[#FCFBFA] p-3.5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
                Kota asal komuter
              </h4>
              <p className="mt-0.5 text-xs text-[#A0A09A]">
                {selectedLocations.length > 0
                  ? `${selectedLocations.length} kota dipilih`
                  : "Pilih satu atau beberapa kota"}
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
                  className={`min-h-9 rounded-full border px-3 py-1.5 text-center text-xs font-semibold leading-5 transition ${
                    isSelected
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

        {selectedOptions.length > 0 ? (
          <div className="grid gap-4">
            {selectedOptions.map((option) => {
              const routes = MODES.map(({ key: mode }) => {
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
                  className="overflow-hidden rounded-[18px] border border-[#E5E2E0] bg-[#FCFBFA]"
                >
                  <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
                            Kost di {option.lokasi}
                          </h4>
                          <div
                            className={`mt-1 text-lg font-bold ${option.savings >= 0 ? "text-[#10b981]" : "text-[#dc2626]"}`}
                          >
                            {formatSavings(option.savings)}
                          </div>
                        </div>
                        <span className="rounded-full border border-[#141413]/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#696969]">
                          Ke {targetLocation.Lokasi_Clean}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                              className="relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-[#E5E2E0] bg-white p-4 transition-all duration-300 hover:border-[#141413]/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
                            >
                              {/* Header: Mode Title with Icon + Status Badge */}
                              <div className="flex items-center justify-between border-b border-[#F0EFEA] pb-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor: `${modeConfig.color}12`,
                                      color: modeConfig.color,
                                    }}
                                  >
                                    {mode === "car" ? (
                                      <svg
                                        className="h-4.5 w-4.5"
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
                                    ) : (
                                      <svg
                                        className="h-4.5 w-4.5"
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
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-[#141413]">
                                    {modeConfig.label}
                                  </span>
                                </div>

                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${status.className}`}
                                >
                                  {status.label}
                                </span>
                              </div>

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-2 gap-2.5 pt-3">
                                {/* Jarak */}
                                <div className="flex flex-col gap-1 rounded-xl bg-[#FCFBFA] p-2.5 border border-[#E5E2E0]/40">
                                  <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#696969]">
                                    Jarak
                                  </span>
                                  <div className="flex items-center gap-1 text-[#141413]">
                                    <svg
                                      className="h-3.5 w-3.5 text-[#A0A09A]"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
                                      <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span className="text-[13px] font-extrabold">
                                      {activeRoute.distance.toFixed(1)} KM
                                    </span>
                                  </div>
                                </div>

                                {/* Waktu */}
                                <div className="flex flex-col gap-1 rounded-xl bg-[#FCFBFA] p-2.5 border border-[#E5E2E0]/40">
                                  <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-[#696969]">
                                    Waktu
                                  </span>
                                  <div className="flex items-center gap-1 text-[#141413]">
                                    <svg
                                      className="h-3.5 w-3.5 text-[#A0A09A]"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span className="text-[13px] font-extrabold">
                                      {isLoading ? (
                                        <span className="inline-flex items-center gap-1">
                                          <span className="spinner h-3 w-3" />
                                          Memuat
                                        </span>
                                      ) : (
                                        `~${activeRoute.duration} mnt`
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <CommuterRouteMap
                      destination={targetLocation}
                      origin={option}
                      routes={routes.map(({ mode, route, fallbackRoute }) => ({
                        mode,
                        route: route ?? fallbackRoute,
                      }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-[#D1CDC7] bg-[#FCFBFA] px-4 py-4 text-center text-xs leading-5 text-[#696969]">
            Pilih kota asal untuk melihat estimasi jarak, waktu tempuh, status,
            dan rute.
          </div>
        )}
      </div>
    </div>
  );
}

function CommuterRouteMap({
  destination,
  origin,
  routes,
}: {
  destination: SpatialSummaryItem;
  origin: CommuterOption;
  routes: Array<{ mode: ModeKey; route: RouteInfo }>;
}) {
  const center: LatLngExpression = [
    (origin.lat + destination.lat) / 2,
    (origin.lon + destination.lon) / 2,
  ];
  const fitPositions = routes.flatMap((item) => item.route.coordinates);

  return (
    <div className="relative h-[200px] min-h-[200px] overflow-hidden rounded-[18px] border border-[#E5E2E0] bg-white sm:h-[220px] sm:min-h-[220px]">
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

        {routes.map(({ mode, route }) => {
          const modeConfig = getModeConfig(mode);
          const pathOptions: PathOptions = {
            color: modeConfig.color,
            weight: mode === "car" ? 4 : 3.5,
            opacity: 0.82,
            dashArray: mode === "motor" ? "7 6" : undefined,
          };

          return (
            <Polyline
              key={mode}
              positions={route.coordinates}
              pathOptions={pathOptions}
            />
          );
        })}

        <CircleMarker
          center={[origin.lat, origin.lon]}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#10b981",
            fillOpacity: 0.9,
            weight: 2,
          }}
          radius={7}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            permanent
            className="custom-map-tooltip"
          >
            {origin.lokasi}
          </Tooltip>
        </CircleMarker>

        <CircleMarker
          center={[destination.lat, destination.lon]}
          pathOptions={{
            color: "#ffffff",
            fillColor: "#F37338",
            fillOpacity: 0.95,
            weight: 2,
          }}
          radius={7}
        >
          <Tooltip
            direction="top"
            offset={[0, -8]}
            permanent
            className="custom-map-tooltip"
          >
            {destination.Lokasi_Clean}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
      <div className="pointer-events-none absolute right-3 top-3 z-[500] flex gap-1.5 rounded-full border border-[#E5E2E0] bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-[#555555] shadow-sm backdrop-blur">
        {MODES.map((mode) => (
          <span key={mode.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: mode.color }}
            />
            {mode.label}
          </span>
        ))}
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
