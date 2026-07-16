import { CommuterOptionsCard } from "../components/CommuterOptionsCard";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";
import type { ModeKey } from "../components/commuter/types";

type CommuterPageProps = {
  prediction: SalaryPredictionResponse | null;
  spatialSummary: SpatialSummaryItem[];
  selectedOrigin: string;
  activeMode: ModeKey;
  onOriginChange: (origin: string) => void;
  onModeChange: (mode: ModeKey) => void;
  onGoToSalary: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
};

export function CommuterPage({
  prediction,
  spatialSummary,
  selectedOrigin,
  activeMode,
  onOriginChange,
  onModeChange,
  onGoToSalary,
  onPrevStep,
  onNextStep,
}: CommuterPageProps) {
  return (
    <main className="page-shell flex flex-col gap-6 md:gap-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Commuter Simulator</h1>
          <p className="page-description">
            Hitung jarak, waktu tempuh, dan biaya komuter harian dari lokasi kos
            ke tempat kerja.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={onPrevStep}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#E5E2E0] bg-white px-4 py-2 text-xs font-bold text-[#696969] hover:text-[#141413] transition-all active:scale-95"
          >
            &lt; Sebelumnya
          </button>
          <button
            type="button"
            onClick={onNextStep}
            disabled={!prediction}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#F37338] px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Selanjutnya &gt;
          </button>
        </div>
      </section>

      {prediction ? (
        <section>
          <CommuterOptionsCard
            prediction={prediction}
            spatialSummary={spatialSummary}
            selectedOrigin={selectedOrigin}
            activeMode={activeMode}
            onOriginChange={onOriginChange}
            onModeChange={onModeChange}
          />
        </section>
      ) : (
        <CommuterEmptyState onGoToSalary={onGoToSalary} />
      )}
    </main>
  );
}

// Empty state saat user belum punya hasil Salary Prediction.
function CommuterEmptyState({ onGoToSalary }: { onGoToSalary: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-[#E5E2E0] bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#141413]/5 text-[#141413]/60">
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-bold tracking-[-0.01em] text-[#141413]">
        Simulator Terkunci
      </h3>
      <p className="max-w-md text-sm text-[#696969]">
        Untuk menggunakan simulator komuter, Anda perlu menentukan target lokasi
        kerja melalui halaman Salary Prediction terlebih dahulu.
      </p>
      <button
        type="button"
        onClick={onGoToSalary}
        className="mt-8 rounded-full bg-[#141413] px-6 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#141413]/80 active:scale-95"
      >
        Ke Salary Prediction
      </button>
    </div>
  );
}
