import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { LatLngExpression, LatLngTuple, PathOptions } from "leaflet";
import type { CommuterOption, ModeKey, RouteInfo } from "./types";
import type { SpatialSummaryItem } from "../../types/api";
import { TILE_ATTRIBUTION, TILE_URL } from "./constants";
import { getModeConfig } from "./utils";
import "leaflet/dist/leaflet.css";

/**
 * Komponen peta Leaflet untuk merender polyline rute transportasi dan marker kota.
 * Peta ini memiliki fitur auto-fit bounds (FitRouteBounds) yang akan memusatkan
 * layar pada rute yang saat ini aktif secara dinamis.
 */
export function CommuterRouteMap({
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
    const activeCoords = routes.flatMap((item) => item.route?.coordinates || []);
    if (activeCoords.length > 0) return activeCoords;

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
