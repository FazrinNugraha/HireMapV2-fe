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
    <div className="rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-fade-slide-down">
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

      <div className="grid gap-4">
        <div className="rounded-[20px] bg-[#3860BE]/10 border border-[#3860BE]/20 px-4 py-3 text-sm font-medium text-[#3860BE] leading-6">
          Rute memakai OSRM berbasis OpenStreetMap. Mobil memakai rute utama,
          motor memakai alternatif jika tersedia dan durasinya disesuaikan,
          belum termasuk traffic real-time.
        </div>

        <div className="rounded-[20px] border border-[#E5E2E0] bg-[#FCFBFA] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.04em] text-[#696969]">
              Pilih Kota Komuter
            </h4>
            <button
              type="button"
              onClick={() => setSelectedLocations([])}
              className="text-xs font-bold uppercase tracking-[0.04em] text-[#3860BE] transition hover:text-[#141413]"
            >
              Reset
            </button>
          </div>

          <div className="flex max-h-[132px] flex-wrap gap-2 overflow-y-auto pr-1">
            {commuterOptions.map((option) => {
              const isSelected = selectedLocations.includes(option.lokasi);

              return (
                <button
                  type="button"
                  key={option.lokasi}
                  onClick={() => toggleLocation(option.lokasi)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.04em] transition ${
                    isSelected
                      ? "border-[#141413] bg-[#141413] text-white"
                      : "border-[#E5E2E0] bg-white text-[#696969] hover:border-[#3860BE]/40 hover:text-[#141413]"
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
                  className="overflow-hidden rounded-[20px] border border-[#E5E2E0] bg-[#FCFBFA]"
                >
                  <div className="grid gap-4 p-5 lg:grid-cols-[1fr_260px]">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#696969] uppercase tracking-wider">
                            Kost di {option.lokasi}
                          </h4>
                          <div
                            className={`mt-2 text-xl font-bold ${option.savings >= 0 ? "text-[#10b981]" : "text-[#dc2626]"}`}
                          >
                            {formatSavings(option.savings)}
                          </div>
                        </div>
                        <span className="rounded-full border border-[#141413]/10 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-[#696969]">
                          Ke {targetLocation.Lokasi_Clean}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2">
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
                              className="grid gap-2 rounded-[16px] border border-[#E5E2E0] bg-white p-3.5 sm:grid-cols-[112px_1fr_auto] sm:items-center"
                            >
                              <div className="flex items-center gap-2 text-sm font-bold text-[#141413]">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: modeConfig.color }}
                                />
                                {modeConfig.label}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-[#141413]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-[#696969]">
                                  {activeRoute.distance.toFixed(1)} KM
                                </span>
                                <span className="rounded-full bg-[#141413]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-[#696969]">
                                  ~{activeRoute.duration} mnt
                                </span>
                                <span className="rounded-full bg-[#3860BE]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] text-[#3860BE]">
                                  {isLoading
                                    ? "Memuat rute..."
                                    : activeRoute.source === "osrm"
                                      ? "OSRM"
                                      : "Fallback"}
                                </span>
                              </div>
                              <span
                                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.04em] ${status.className}`}
                              >
                                {status.label}
                              </span>
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
          <div className="rounded-[20px] border border-dashed border-[#D1CDC7] bg-[#FCFBFA] px-4 py-6 text-center text-sm leading-6 text-[#696969]">
            Pilih satu atau lebih kota komuter untuk melihat estimasi jarak,
            waktu tempuh, status kelayakan, dan rute pada peta.
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
    <div className="h-[250px] min-h-[250px] overflow-hidden rounded-[18px] border border-[#E5E2E0] bg-white">
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
            weight: mode === "motor" ? 3 : 4,
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
