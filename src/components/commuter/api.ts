import type { LatLngTuple } from "leaflet";
import type { RouteInfo, RouteRequest, TomTomRouteResponse } from "./types";
import { TOMTOM_API_KEY, VEHICLE_CONSUMPTION } from "./constants";
import { getModeConfig, hitungLiterFallback, hitungBiayaBbmPerBulan } from "./utils";

/**
 * Mengambil data rute dari TomTom Routing API.
 * Request sudah meliputi traffic real-time (traffic=true) dan model konsumsi BBM kendaraan.
 * Mengembalikan objek RouteInfo yang berisi jarak, waktu, rute koordinat, dan estimasi biaya BBM.
 */
export async function fetchTomTomRoute(request: RouteRequest): Promise<RouteInfo> {
  const modeConfig = getModeConfig(request.mode);
  const travelMode = request.mode === "motor" ? "motorcycle" : "car";
  const origin = `${request.origin.lat},${request.origin.lon}`;
  const dest = `${request.destination.lat},${request.destination.lon}`;
  const consumptionCurve = travelMode === "car"
    ? VEHICLE_CONSUMPTION.car
    : VEHICLE_CONSUMPTION.motorcycle;

  const url =
    `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${dest}/json` +
    `?key=${TOMTOM_API_KEY}` +
    `&traffic=true` +
    `&travelMode=${travelMode}` +
    `&vehicleEngineType=combustion` +
    `&sectionType=traffic` +
    `&constantSpeedConsumptionInLitersPerHundredkm=${encodeURIComponent(consumptionCurve)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TomTom request failed: ${response.status}`);
  }

  const data = (await response.json()) as TomTomRouteResponse;
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("TomTom route unavailable");
  }

  const coordinates: LatLngTuple[] = route.legs.flatMap((leg) =>
    leg.points.map((p) => [p.latitude, p.longitude] as LatLngTuple),
  );

  const delayMinutes = Math.round(route.summary.trafficDelayInSeconds / 60);
  const distanceKm = route.summary.lengthInMeters / 1000;
  const durationHour = route.summary.travelTimeInSeconds / 3600;
  const avgSpeed = durationHour > 0 ? Math.round(distanceKm / durationHour) : undefined;

  const literPerTrip = route.summary.fuelConsumptionInLiters
    ?? hitungLiterFallback(distanceKm, request.mode === "motor" ? "motor" : "car");
  const fuelCostPerMonth = hitungBiayaBbmPerBulan(literPerTrip);

  // Ambil data segmen kemacetan dari TomTom
  const trafficSections = route.sections?.filter((s) => s.sectionType === "TRAFFIC");

  return {
    distance: distanceKm,
    duration: Math.round(
      (route.summary.travelTimeInSeconds / 60) * modeConfig.durationMultiplier,
    ),
    coordinates: coordinates.length > 0
      ? coordinates
      : [
        [request.origin.lat, request.origin.lon],
        [request.destination.lat, request.destination.lon],
      ],
    trafficSections,
    source: "tomtom",
    trafficDelay: delayMinutes > 0 ? delayMinutes : undefined,
    avgSpeed,
    fuelCostPerMonth,
  };
}
