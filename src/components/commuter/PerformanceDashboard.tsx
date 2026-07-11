import type { ModeKey, RouteInfo } from "./types";
import { getModeConfig, hitungLiterFallback, hitungBiayaBbmPerBulan } from "./utils";
import { formatRupiah } from "../../utils/format";

type PerformanceDashboardProps = {
  mode: ModeKey;
  route: RouteInfo | undefined;
  fallbackRoute: RouteInfo;
};

export function PerformanceDashboard({
  mode,
  route,
  fallbackRoute,
}: PerformanceDashboardProps) {
  const activeRoute = route ?? fallbackRoute;
  const modeConfig = getModeConfig(mode);
  const isLoading = !route;

  // 1. Hitung data KONDISI NORMAL (Ideal)
  const normalDuration = activeRoute.duration - (activeRoute.trafficDelay ?? 0);
  
  // Kecepatan normal = Jarak / Waktu Normal (jam)
  const normalDurationHours = normalDuration / 60;
  const normalAvgSpeed = normalDurationHours > 0 
    ? Math.round(activeRoute.distance / normalDurationHours) 
    : 0;

  // BBM normal = Fallback liter (jarak konstan)
  const normalFuelCost = mode === "krl"
    ? 0
    : hitungBiayaBbmPerBulan(hitungLiterFallback(activeRoute.distance, mode === "motor" ? "motor" : "car"));

  // 2. Hitung data KONDISI REAL-TIME (Traffic/TomTom)
  const realTimeDuration = activeRoute.duration;
  const realTimeAvgSpeed = activeRoute.avgSpeed ?? normalAvgSpeed;
  
  // BBM Real-time = Biaya BBM dari TomTom (jika tersedia), fallback ke normal
  const realTimeFuelCost = mode === "krl"
    ? (activeRoute.biaya ?? 0)
    : (activeRoute.fuelCostPerMonth ?? normalFuelCost);

  return (
    <div className="w-full flex-1 rounded-[32px] border border-[#E5E2E0] bg-white p-5 shadow-[rgba(0,0,0,0.04)_0px_24px_48px_0px] flex flex-col justify-between select-none animate-fade-slide-down font-sans">
      <div className="flex items-center justify-between border-b border-[#E5E2E0]/60 pb-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#141413]">
            Performance Dashboard ({modeConfig.label})
          </h2>
        </div>
        {isLoading && mode !== "krl" && (
          <span className="flex items-center gap-1.5 rounded-full bg-[#3860BE]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#3860BE]">
            <span className="spinner h-2.5 w-2.5" />
            Updating Live Data...
          </span>
        )}
      </div>

      <div className="overflow-x-auto my-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#E5E2E0] text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#696969]">
              <th className="pb-3 pr-3">Kondisi Perjalanan</th>
              <th className="pb-3 px-3">Jarak Tempuh</th>
              <th className="pb-3 px-3">Waktu Tempuh</th>
              <th className="pb-3 px-3">Kecepatan rata-rata</th>
              <th className="pb-3 px-3">{mode === "krl" ? "Harga Ticket" : "Biaya BBM"}</th>
              <th className="pb-3 pl-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-xs md:text-sm text-[#141413]">
            {/* Baris KONDISI NORMAL */}
            <tr className="border-b border-[#E5E2E0]/40 transition-colors hover:bg-[#F3F0EE]/20">
              <td className="py-4 pr-3 font-extrabold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                Kondisi Normal (Ideal)
              </td>
              <td className="py-4 px-3 font-semibold text-[#555555]">
                {activeRoute.distance.toFixed(1)} km
              </td>
              <td className="py-4 px-3 font-black text-[#141413]">
                {isLoading && mode !== "krl" ? "..." : `${normalDuration} mnt`}
              </td>
              <td className="py-4 px-3 font-semibold text-[#555555]">
                {isLoading && mode !== "krl" ? "..." : `${normalAvgSpeed} km/j`}
              </td>
              <td className="py-4 px-3 font-black text-[#141413]">
                {mode === "krl" 
                  ? activeRoute.biaya !== undefined ? formatRupiah(activeRoute.biaya) : "-"
                  : formatRupiah(normalFuelCost)}
              </td>
              <td className="py-4 pl-3">
                <span className="inline-flex rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#047857] border border-[#10b981]/15">
                  Lancar
                </span>
              </td>
            </tr>

            {/* Baris KONDISI REAL-TIME (Traffic/TomTom) */}
            <tr className="transition-colors hover:bg-[#F3F0EE]/20">
              <td className="py-4 pr-3 font-extrabold flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  mode === "krl" 
                    ? "bg-[#8b5cf6]" 
                    : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2
                      ? "bg-[#ef4444]"
                      : "bg-[#10b981]"
                }`} />
                Kondisi Aktual (Live)
              </td>
              <td className="py-4 px-3 font-semibold text-[#555555]">
                {activeRoute.distance.toFixed(1)} km
              </td>
              <td className="py-4 px-3 font-black text-[#141413]">
                {isLoading && mode !== "krl" ? "..." : `${realTimeDuration} mnt`}
              </td>
              <td className="py-4 px-3 font-semibold text-[#555555]">
                {isLoading && mode !== "krl" ? "..." : `${realTimeAvgSpeed} km/j`}
              </td>
              <td className="py-4 px-3 font-black text-[#141413]">
                {mode === "krl"
                  ? activeRoute.biaya !== undefined ? formatRupiah(activeRoute.biaya) : "-"
                  : formatRupiah(realTimeFuelCost)}
              </td>
              <td className="py-4 pl-3">
                {mode === "krl" ? (
                  <span className="inline-flex rounded-full bg-[#8b5cf6]/10 px-2 py-0.5 text-[10px] font-bold text-[#8b5cf6] border border-[#8b5cf6]/15">
                    Sesuai Jadwal
                  </span>
                ) : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2 ? (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    activeRoute.trafficDelay > 15
                      ? "bg-[#ef4444]/10 text-[#dc2626] border-[#ef4444]/15"
                      : "bg-[#f59e0b]/10 text-[#b45309] border-[#f59e0b]/15"
                  }`}>
                    Macet (+{activeRoute.trafficDelay} mnt)
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#047857] border border-[#10b981]/15">
                    Lancar
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
