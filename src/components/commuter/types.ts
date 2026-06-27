import type { LatLngTuple } from "leaflet";
import type { SpatialSummaryItem } from "../../types/api";

export type ModeKey = "car" | "motor" | "krl";

export type CommuterOption = {
  lokasi: string;
  savings: number;
  fallbackDistance: number;
  lat: number;
  lon: number;
};

export type RouteInfo = {
  distance: number;
  duration: number;
  coordinates: LatLngTuple[];
  source: "tomtom" | "fallback" | "static"; // "static" = data KRL dari matriks
  biaya?: number;           // hanya diisi untuk mode KRL (estimasi harga tiket)
  trafficDelay?: number;    // delay kemacetan dalam menit (hanya dari TomTom)
  avgSpeed?: number;        // kecepatan rata-rata saat ini dalam km/jam (hanya dari TomTom)
  fuelCostPerMonth?: number; // estimasi biaya BBM per bulan dari TomTom (Rp)
};

export type RouteRequest = {
  key: string;
  mode: ModeKey;
  origin: CommuterOption;
  destination: SpatialSummaryItem;
};

export type TomTomRouteResponse = {
  routes?: Array<{
    summary: {
      lengthInMeters: number;
      travelTimeInSeconds: number;
      trafficDelayInSeconds: number;
      fuelConsumptionInLiters?: number; // tersedia jika consumption params dikirim
    };
    legs: Array<{
      points: Array<{
        latitude: number;
        longitude: number;
      }>;
    }>;
  }>;
};
