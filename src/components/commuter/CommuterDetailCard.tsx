import type { ModeKey, RouteInfo } from "./types";
import { hitungLiterFallback, hitungBiayaBbmPerBulan } from "./utils";
import { formatRupiah } from "../../utils/format";

type CommuterDetailCardProps = {
  originCity: string;
  destinationCity: string;
  mode: ModeKey;
  route: RouteInfo | undefined;
  fallbackRoute: RouteInfo;
  savings: number;
  kosCost: number;
  targetKosCost: number;
};

export function CommuterDetailCard({
  originCity,
  destinationCity,
  mode,
  route,
  fallbackRoute,
  kosCost,
  targetKosCost,
}: CommuterDetailCardProps) {
  const activeRoute = route ?? fallbackRoute;

  // Hitung biaya transport bulanan
  const transportCost = mode === "krl"
    ? (activeRoute.biaya ?? 0)
    : (activeRoute.fuelCostPerMonth ?? hitungBiayaBbmPerBulan(
      hitungLiterFallback(activeRoute.distance, mode === "motor" ? "motor" : "car")
    ));

  const totalExpense = kosCost + transportCost;
  const netSavings = targetKosCost - totalExpense;

  return (
    <div className="w-full h-full rounded-[40px] border border-[#E5E2E0] bg-white p-6 shadow-[rgba(0,0,0,0.04)_0px_24px_48px_0px] flex flex-col justify-between select-none animate-fade-slide-down">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2E0]/60 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#696969]">
            Trip Summary
          </span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            mode === "krl" 
              ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" 
              : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2
                ? "bg-[#ef4444]/10 text-[#dc2626]"
                : "bg-[#10b981]/10 text-[#047857]"
          }`}>
            {mode === "krl" 
              ? "Static Rail Route" 
              : activeRoute.trafficDelay && activeRoute.trafficDelay >= 2
                ? `Delay Macet +${activeRoute.trafficDelay} mnt`
                : "Lalu Lintas Lancar"}
          </span>
        </div>

        {/* Route Details */}
        <div className="flex items-center justify-between py-1 bg-[#FCFBFA] border border-[#E5E2E0]/40 rounded-2xl px-4 mb-5">
          <div>
            <div className="text-sm font-bold text-[#141413]">
              {originCity}
            </div>
            <span className="text-[10px] text-[#696969] uppercase font-bold">Asal</span>
          </div>
          <span className="text-sm text-[#A0A09A] font-bold">➔</span>
          <div className="text-right">
            <div className="text-sm font-bold text-[#141413]">
              {destinationCity}
            </div>
            <span className="text-[10px] text-[#696969] uppercase font-bold">Kantor</span>
          </div>
        </div>

        {/* Expenses List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#696969]">
            Monthly Expense Details
          </span>

          <div className="rounded-2xl border border-[#E5E2E0]/60 p-4 flex flex-col gap-3.5 bg-white">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#555555] font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A0A09A]" />
                Sewa Kos Asal
              </span>
              <span className="font-bold text-[#141413]">{formatRupiah(kosCost)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#555555] font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A0A09A]" />
                {mode === "krl" ? "Tarif Tiket KRL" : "Estimasi BBM Bulanan"}
              </span>
              <span className="font-bold text-[#141413]">{formatRupiah(transportCost)}</span>
            </div>
            <div className="border-t border-[#E5E2E0]/60 pt-3.5 flex justify-between items-center text-sm">
              <span className="font-black text-[#141413]">Total Pengeluaran</span>
              <span className="font-black text-[#141413]">{formatRupiah(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Card (Savings/Budget Info) */}
      <div className="mt-5 rounded-[24px] bg-[#141413] p-5 text-white flex flex-col gap-1 shadow-md relative overflow-hidden">
        {/* Decorative background line */}
        <div className="absolute top-0 right-0 h-full w-24 bg-white/[0.03] -skew-x-12 translate-x-8 pointer-events-none" />

        <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">
          {netSavings >= 0 ? "Potential Monthly Savings" : "Additional Budget Needed"}
        </span>
        <div className={`text-xl font-black tracking-tight ${netSavings >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
          {netSavings >= 0 ? `Hemat ${formatRupiah(netSavings)}` : `Lebih mahal ${formatRupiah(Math.abs(netSavings))}`}
        </div>
        <span className="text-[9px] text-white/40 italic mt-1 block">
          *dibanding sewa kos di dekat kantor ({formatRupiah(targetKosCost)})
        </span>
      </div>
    </div>
  );
}
