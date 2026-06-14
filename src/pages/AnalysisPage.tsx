import { useEffect, useRef, useState } from "react";
import { CareerJourneyChart } from "../components/CareerJourneyChart";
import { FeasibilityScoreCard } from "../components/FeasibilityScoreCard";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";

const CAREER_LOADING_DELAY_MS = 2400;

type AnalysisPageProps = {
  prediction: SalaryPredictionResponse | null;
  spatialSummary: SpatialSummaryItem[];
  onGoToSalary: () => void;
  onRequestAudit: (prompt: string) => void;
};

// Halaman analisis karir: DSS score dulu, lalu proyeksi perjalanan karir.
export function AnalysisPage({
  prediction,
  spatialSummary,
  onGoToSalary,
  onRequestAudit,
}: AnalysisPageProps) {
  const [isCareerLoading, setIsCareerLoading] = useState(false);
  const [showCareerChart, setShowCareerChart] = useState(false);
  const prevPrediction = useRef<SalaryPredictionResponse | null>(null);

  // Reset panel proyeksi jika user menjalankan prediksi baru.
  useEffect(() => {
    if (prediction && prediction !== prevPrediction.current) {
      prevPrediction.current = prediction;
      setShowCareerChart(false);
      setIsCareerLoading(false);
    }
  }, [prediction]);

  // Memberi jeda loading agar transisi chart terasa konsisten dengan halaman lain.
  const handleShowCareerChart = () => {
    setIsCareerLoading(true);
    setShowCareerChart(false);

    window.setTimeout(() => {
      setIsCareerLoading(false);
      setShowCareerChart(true);
    }, CAREER_LOADING_DELAY_MS);
  };

  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 py-10 md:px-10">
      <AnalysisHeader />

      {!prediction ? (
        <AnalysisEmptyState onGoToSalary={onGoToSalary} />
      ) : (
        <div className="flex flex-col gap-8">
          <FeasibilityScoreCard
            prediction={prediction}
            spatialSummary={spatialSummary}
            onRequestAudit={onRequestAudit}
          />

          <CareerProjectionPanel
            prediction={prediction}
            isLoading={isCareerLoading}
            showChart={showCareerChart}
            onShowChart={handleShowCareerChart}
          />
        </div>
      )}
    </main>
  );
}

// Header halaman untuk menjelaskan scope Analisis Karir.
function AnalysisHeader() {
  return (
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
  );
}

// Empty state saat user belum punya hasil Salary Prediction.
function AnalysisEmptyState({ onGoToSalary }: { onGoToSalary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-16 text-center">
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

// Pengatur tampilan proyeksi karir: gate, loading, atau chart final.
function CareerProjectionPanel({
  prediction,
  isLoading,
  showChart,
  onShowChart,
}: {
  prediction: SalaryPredictionResponse;
  isLoading: boolean;
  showChart: boolean;
  onShowChart: () => void;
}) {
  if (showChart && !isLoading) {
    return <CareerJourneyChart prediction={prediction} />;
  }

  if (isLoading) {
    return <CareerJourneyLoading />;
  }

  return <CareerJourneyGate onShowCareerChart={onShowChart} />;
}

// Gate awal supaya user sengaja membuka simulasi proyeksi karir.
function CareerJourneyGate({
  onShowCareerChart,
}: {
  onShowCareerChart: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[32px] border border-dashed border-[#E5E2E0] bg-[#FCFBFA] px-10 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-8 sm:text-left">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EFEEE7]">
        <svg
          className="h-7 w-7 text-[#141413]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M3 3v18h18" />
          <path d="m7 16 4-4 4 4 5-5" />
        </svg>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="flex items-center justify-center gap-2 text-base font-extrabold text-[#141413] sm:justify-start md:text-lg">
          <span className="text-lg leading-none text-[#F37338]">*</span>
          Career Journey
        </p>
        <h3 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-[#141413]">
          Proyeksi Karir &amp; Pertumbuhan Gaji
        </h3>
        <p className="mt-2 text-base leading-7 text-[#696969]">
          Jalankan simulasi untuk melihat estimasi perkembangan gaji dari
          Entry-Level hingga Senior.
        </p>
      </div>
      <button
        type="button"
        onClick={onShowCareerChart}
        className="inline-flex shrink-0 items-center gap-2.5 rounded-full bg-[#141413] px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#AA3700] hover:scale-[1.03] active:scale-[0.98]"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Lihat Proyeksi Karir
      </button>
    </div>
  );
}

// Loading lokal saat sistem menyiapkan chart perjalanan karir.
function CareerJourneyLoading() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-[32px] border border-[#E5E2E0] bg-white px-10 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:gap-8 sm:text-left">
      <div className="relative flex shrink-0 items-center justify-center">
        <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-[#F37338]/10 opacity-75" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EFEEE7] text-[#141413]">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="flex items-center justify-center gap-2 text-base font-extrabold text-[#141413] sm:justify-start md:text-lg">
          <span className="text-lg leading-none text-[#F37338]">*</span>
          Career Journey
        </p>
        <h3 className="mt-1.5 text-xl font-bold tracking-[-0.02em] text-[#141413]">
          Menyusun Proyeksi Karir...
        </h3>
        <p className="mt-2 text-base leading-7 text-[#696969]">
          Menghitung jalur pertumbuhan gaji dari Entry-Level hingga Senior
          berdasarkan posisi dan faktor kualifikasi Anda.
        </p>
      </div>
    </div>
  );
}
