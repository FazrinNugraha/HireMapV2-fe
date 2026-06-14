import { FeasibilityScoreCard } from "../components/FeasibilityScoreCard";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";

type AnalysisPageProps = {
  prediction: SalaryPredictionResponse | null;
  spatialSummary: SpatialSummaryItem[];
  onGoToSalary: () => void;
  onRequestAudit: (prompt: string) => void;
};

export function AnalysisPage({
  prediction,
  spatialSummary,
  onGoToSalary,
  onRequestAudit,
}: AnalysisPageProps) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 md:px-10">
      {/* Page header */}
      <header className="mb-10">
        <p className="eyebrow">Decision Support System</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em] text-[#141413] md:text-5xl">
          Analisis Karir &amp; Kelayakan
        </h1>
        <p className="mt-3 text-lg leading-8 text-[#696969]">
          Indeks kelayakan berbasis data riil: rasio hunian, kualifikasi profil,
          dan kepadatan pasar kerja Jabodetabek.
        </p>
      </header>

      {/* Empty state */}
      {!prediction ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-16 text-center">
          <span className="text-5xl">📊</span>
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
            Ke Salary Prediction →
          </button>
        </div>
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
