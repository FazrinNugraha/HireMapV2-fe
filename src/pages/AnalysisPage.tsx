import { FeasibilityScoreCard } from "../components/FeasibilityScoreCard";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";

type AnalysisPageProps = {
  prediction: SalaryPredictionResponse | null;
  spatialSummary: SpatialSummaryItem[];
  onGoToSalary: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onRequestAudit: (prompt: string) => void;
};

// Halaman analisis karir: DSS score.
export function AnalysisPage({
  prediction,
  spatialSummary,
  onGoToSalary,
  onPrevStep,
  onNextStep,
  onRequestAudit,
}: AnalysisPageProps) {
  return (
    <main className="page-shell">
      <AnalysisHeader onPrevStep={onPrevStep} onNextStep={onNextStep} isNextDisabled={!prediction} />

      {!prediction ? (
        <AnalysisEmptyState onGoToSalary={onGoToSalary} />
      ) : (
        <div className="flex flex-col gap-8">
          <FeasibilityScoreCard
            prediction={prediction}
            spatialSummary={spatialSummary}
            onRequestAudit={onRequestAudit}
          />
        </div>
      )}
    </main>
  );
}

// Header halaman untuk menjelaskan scope Analisis Karir.
function AnalysisHeader({
  onPrevStep,
  onNextStep,
  isNextDisabled,
}: {
  onPrevStep: () => void;
  onNextStep: () => void;
  isNextDisabled: boolean;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
      <div>
        <p className="eyebrow">Decision Support System</p>
        <h1 className="page-title mt-2">
          Analisis Karir &amp; Kelayakan
        </h1>
        <p className="page-description">
          Indeks kelayakan berbasis data riil: rasio hunian, kualifikasi profil,
          dan kepadatan pasar kerja Jabodetabek.
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
          disabled={isNextDisabled}
          className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#F37338] px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Selanjutnya &gt;
        </button>
      </div>
    </header>
  );
}

// Empty state saat user belum punya hasil Salary Prediction.
function AnalysisEmptyState({ onGoToSalary }: { onGoToSalary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-8 text-center md:rounded-[32px] md:p-16">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFEEE7] text-2xl font-bold text-[#696969]">
        %
      </span>
      <h2 className="mt-5 text-xl font-bold text-[#141413]">
        Analisis Belum Tersedia
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#696969]">
        Jalankan prediksi gaji terlebih dahulu agar sistem bisa menghasilkan
        analisis kelayakan karir &amp; finansial yang akurat.
      </p>
      <button
        type="button"
        onClick={onGoToSalary}
        className="mt-7 rounded-full bg-[#141413] px-7 py-3.5 text-sm font-bold text-[#F3F0EE] transition-all hover:bg-[#AA3700] active:scale-95"
      >
        Ke Salary Prediction
      </button>
    </div>
  );
}
