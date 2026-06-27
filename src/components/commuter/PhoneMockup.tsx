import type { ModeKey, RouteInfo } from "./types";
import { getModeConfig, hitungLiterFallback, hitungBiayaBbmPerBulan } from "./utils";
import { formatRupiah } from "../../utils/format";

type PhoneMockupProps = {
  originCity: string;
  destinationCity: string;
  mode: ModeKey;
  route: RouteInfo | undefined;
  fallbackRoute: RouteInfo;
  savings: number;
  kosCost: number;
  targetKosCost: number;
};

export function PhoneMockup({
  originCity,
  destinationCity,
  mode,
  route,
  fallbackRoute,
  savings,
  kosCost,
  targetKosCost,
}: PhoneMockupProps) {
  const activeRoute = route ?? fallbackRoute;
  const modeConfig = getModeConfig(mode);
  const isLoading = !route;

  // Hitung biaya transport bulanan
  const transportCost = mode === "krl"
    ? (activeRoute.biaya ?? 0)
    : (activeRoute.fuelCostPerMonth ?? hitungBiayaBbmPerBulan(
      hitungLiterFallback(activeRoute.distance, mode === "motor" ? "motor" : "car")
    ));

  const totalExpense = kosCost + transportCost;
  const netSavings = targetKosCost - totalExpense;

  // Pilih warna stroke SVG rute berdasarkan mode
  const strokeColor = modeConfig.color;

  return (
    <div className="relative mx-auto w-[300px] h-[470px] rounded-[40px] border-[10px] border-[#141413] bg-[#FCFBFA] shadow-[rgba(0,0,0,0.08)_0px_24px_48px_0px] overflow-hidden flex flex-col justify-between select-none animate-fade-slide-down">
      {/* Notch / Dynamic Island */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-[#141413] rounded-full z-50 flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-[#262627]" />
      </div>

      {/* Screen Container */}
      <div className="flex-1 flex flex-col justify-between p-3 pt-7 overflow-y-auto text-[#141413] font-sans">
        {/* App Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E2E0]/60">
          <div className="flex items-center gap-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#141413] text-white text-[8px] font-black">
              H
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#141413]">
              HirePass
            </span>
          </div>
          <span className="text-[8px] font-bold text-[#696969] bg-[#E5E2E0]/40 px-1.5 py-0.5 rounded-full">
            Active Trip
          </span>
        </div>

        {/* Route Card (Status & Map SVG) */}
        <div className="mt-2 rounded-[16px] bg-white border border-[#E5E2E0]/80 p-2.5 shadow-sm flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-bold uppercase tracking-wider text-[#696969]">
              Your Route
            </span>
            <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${
              mode === "krl" 
                ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" 
                : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2
                  ? "bg-[#ef4444]/10 text-[#dc2626] animate-pulse"
                  : "bg-[#10b981]/10 text-[#047857]"
            }`}>
              {mode === "krl" 
                ? "Static Rail" 
                : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2
                  ? `Delayed +${activeRoute.trafficDelay}m`
                  : "Smooth Traffic"}
            </span>
          </div>

          <div className="flex items-center justify-between py-0.5">
            <div>
              <div className="text-[10px] font-black leading-tight text-[#141413]">
                {originCity}
              </div>
              <span className="text-[8px] text-[#696969]">Origin</span>
            </div>
            <span className="text-[9px] text-[#A0A09A] font-bold">➔</span>
            <div className="text-right">
              <div className="text-[10px] font-black leading-tight text-[#141413]">
                {destinationCity}
              </div>
              <span className="text-[8px] text-[#696969]">Workspace</span>
            </div>
          </div>

          {/* SVG Animated Route Path */}
          <div className="relative h-11 w-full bg-[#FCFBFA] border border-[#E5E2E0]/40 rounded-lg overflow-hidden flex items-center justify-center p-1">
            <svg viewBox="0 0 200 60" className="w-full h-full">
              {/* Start Circle */}
              <circle cx="20" cy="30" r="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2" />
              <text x="20" y="44" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#696969">{originCity.slice(0, 3).toUpperCase()}</text>

              {/* End Circle */}
              <circle cx="180" cy="30" r="3.5" fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
              <text x="180" y="44" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#141413">WRK</text>

              {/* Route Line (dashed and animated if motor/car) */}
              <path
                d="M 24 30 Q 70 10, 100 30 T 176 30"
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={mode === "motor" ? "6 5" : undefined}
                className={mode !== "krl" && !isLoading ? "animate-[dash_2.5s_linear_infinite]" : undefined}
                style={{
                  strokeDashoffset: mode !== "krl" && !isLoading ? 100 : undefined
                }}
              />
            </svg>
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: 0;
                }
              }
            `}</style>
          </div>

          {/* Trip performance metrics inside phone */}
          <div className="grid grid-cols-3 gap-1 divide-x divide-[#E5E2E0]/60 text-center pt-1 border-t border-[#FCFBFA]">
            <div>
              <div className="text-[10px] font-black text-[#141413]">{activeRoute.distance.toFixed(1)} km</div>
              <span className="text-[7.5px] text-[#696969] uppercase font-semibold">Distance</span>
            </div>
            <div>
              <div className="text-[10px] font-black text-[#141413]">
                {isLoading && mode !== "krl" ? "..." : `~${activeRoute.duration}m`}
              </div>
              <span className="text-[7.5px] text-[#696969] uppercase font-semibold">Duration</span>
            </div>
            <div>
              <div className="text-[10px] font-black text-[#141413]">
                {activeRoute.avgSpeed ? `${activeRoute.avgSpeed} km/h` : "-"}
              </div>
              <span className="text-[7.5px] text-[#696969] uppercase font-semibold">Avg Speed</span>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="mt-2.5 flex-1 flex flex-col gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-wider text-[#696969]">
            Monthly Expenses
          </span>

          <div className="rounded-[14px] bg-white border border-[#E5E2E0]/80 p-2.5 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#555555] font-semibold flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-[#A0A09A]" />
                Sewa Kos Asal
              </span>
              <span className="font-bold text-[#141413]">{formatRupiah(kosCost)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#555555] font-semibold flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-[#A0A09A]" />
                {mode === "krl" ? "Tarif KRL (PP)" : "Estimasi BBM"}
              </span>
              <span className="font-bold text-[#141413]">{formatRupiah(transportCost)}</span>
            </div>
            <div className="border-t border-[#FCFBFA] pt-1.5 flex justify-between items-center text-[11px]">
              <span className="font-black text-[#141413]">Total Bulanan</span>
              <span className="font-black text-[#141413]">{formatRupiah(totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Financial Ticket Card */}
        <div className="mt-2.5 rounded-[16px] bg-[#141413] p-2.5 text-white flex flex-col gap-1 shadow-md relative overflow-hidden">
          {/* Ticket watermark line */}
          <div className="absolute top-0 right-0 h-full w-20 bg-white/[0.03] -skew-x-12 translate-x-8 pointer-events-none" />

          <div className="flex justify-between items-center text-[7px] font-bold tracking-widest text-white/50 border-b border-white/10 pb-1">
            <span>TICKET PASS</span>
            <span>ID: {originCity.slice(0,3).toUpperCase()}-{mode.toUpperCase()}</span>
          </div>

          <div className="flex flex-col gap-0.5 pt-0.5">
            <span className="text-[7.5px] text-white/60 font-semibold uppercase tracking-wider">
              {netSavings >= 0 ? "Potential Savings" : "Additional Budget"}
            </span>
            <div className={`text-base font-black tracking-tight ${netSavings >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
              {netSavings >= 0 ? `Hemat ${formatRupiah(netSavings)}` : `Lebih mahal ${formatRupiah(Math.abs(netSavings))}`}
            </div>
            <span className="text-[7.5px] text-white/40 italic">
              *dibanding sewa kos di Jakarta ({formatRupiah(targetKosCost)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
