import { formatRupiah } from "../../utils/format";
import type { RouteInfo, ModeKey } from "./types";
import { getModeConfig, getCommuteStatus, hitungLiterFallback, hitungBiayaBbmPerBulan } from "./utils";

/**
 * Komponen UI untuk merender satu kotak mode transportasi (KRL, Mobil, Motor).
 * Menampilkan ringkasan durasi, jarak, estimasi biaya (BBM/tiket), 
 * kecepatan rata-rata saat ini, dan status kemacetan secara visual.
 */
export function TransportModeCard({
  mode,
  route,
  fallbackRoute,
  savings,
}: {
  mode: ModeKey;
  route: RouteInfo | undefined;
  fallbackRoute: RouteInfo;
  savings: number;
}) {
  const modeConfig = getModeConfig(mode);
  const activeRoute = route ?? fallbackRoute;
  const status = getCommuteStatus(activeRoute.duration, savings);
  const isLoading = !route;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-[#E5E2E0]/80 bg-white p-3.5 transition-all duration-300 hover:border-[#141413]/15 shadow-sm h-full">
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

      {/* Badge Kemacetan (hanya Mobil & Motor dari TomTom) */}
      {mode !== "krl" && activeRoute.trafficDelay !== undefined && activeRoute.trafficDelay >= 2 && (
        <div className={`mt-2 flex items-center gap-1 rounded-[8px] px-2 py-1 ${activeRoute.trafficDelay > 15
            ? "bg-[#ef4444]/8 border border-[#ef4444]/20"
            : "bg-[#f59e0b]/8 border border-[#f59e0b]/20"
          }`}>
          <svg className={`h-2.5 w-2.5 shrink-0 ${activeRoute.trafficDelay > 15 ? "text-[#dc2626]" : "text-[#b45309]"
            }`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className={`text-[9px] font-bold ${activeRoute.trafficDelay > 15 ? "text-[#dc2626]" : "text-[#b45309]"
            }`}>
            +{activeRoute.trafficDelay} mnt akibat macet
          </span>
        </div>
      )}

      {/* Tampilan Estimasi Biaya */}
      <div className="py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#696969]">
            {mode === "krl" ? "Tarif Tiket" : "Est. BBM/bln"}
          </span>
          {mode !== "krl" && activeRoute.fuelCostPerMonth !== undefined && (
            <span className="rounded-full bg-[#3860BE]/8 px-1.5 py-0.5 text-[8px] font-bold text-[#3860BE]">
              TomTom
            </span>
          )}
        </div>
        <div className="text-[14px] sm:text-[15px] font-extrabold text-[#141413] mt-0.5">
          {mode === "krl"
            ? activeRoute.biaya !== undefined
              ? formatRupiah(activeRoute.biaya)
              : "-"
            : formatRupiah(
              activeRoute.fuelCostPerMonth
              ?? hitungBiayaBbmPerBulan(
                hitungLiterFallback(activeRoute.distance, mode === "motor" ? "motor" : "car")
              )
            )}
        </div>
      </div>

      {/* Footer Card: Info Jarak, Waktu Tempuh & Kecepatan */}
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
        {activeRoute.avgSpeed !== undefined && (
          <>
            <span className="h-3 w-px bg-[#E5E2E0]" />
            <div className="flex items-center gap-1">
              <svg className="h-3 w-3 text-[#A0A09A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 1-5.93 18.14" />
                <path d="M12 12l3-3" />
                <circle cx="12" cy="12" r="1" fill="currentColor" />
              </svg>
              <span className="font-semibold text-[#141413]">
                {activeRoute.avgSpeed} km/j
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
