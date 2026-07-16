import { useEffect, useRef, useState } from "react";
import { CareerJourneyChart } from "../components/CareerJourneyChart";
import type {
  SalaryPredictionResponse,
} from "../types/api";

const CAREER_LOADING_DELAY_MS = 2400;

type JourneyPageProps = {
  prediction: SalaryPredictionResponse | null;
  showCareerChart: boolean;
  onSetShowCareerChart: (v: boolean) => void;
  onGoToSalary: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
};

// Halaman baru khusus untuk proyeksi perjalanan karir (Step 3).
export function JourneyPage({
  prediction,
  showCareerChart,
  onSetShowCareerChart,
  onGoToSalary,
  onPrevStep,
  onNextStep,
}: JourneyPageProps) {
  const [isCareerLoading, setIsCareerLoading] = useState(false);
  const prevPrediction = useRef<SalaryPredictionResponse | null>(null);

  // Reset panel proyeksi jika user menjalankan prediksi baru.
  useEffect(() => {
    if (prediction && prediction !== prevPrediction.current) {
      prevPrediction.current = prediction;
      onSetShowCareerChart(false);
      setIsCareerLoading(false);
    }
  }, [prediction, onSetShowCareerChart]);

  // Memberi jeda loading agar transisi chart terasa konsisten dengan halaman lain.
  const handleShowCareerChart = () => {
    setIsCareerLoading(true);
    onSetShowCareerChart(false);

    window.setTimeout(() => {
      setIsCareerLoading(false);
      onSetShowCareerChart(true);
    }, CAREER_LOADING_DELAY_MS);
  };

  return (
    <main className="page-shell">
      <JourneyHeader onPrevStep={onPrevStep} onNextStep={onNextStep} isNextDisabled={!prediction} />

      {!prediction ? (
        <JourneyEmptyState onGoToSalary={onGoToSalary} />
      ) : (
        <div className="flex flex-col gap-8">
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

// Header halaman untuk menjelaskan scope Proyeksi Perjalanan Karir.
function JourneyHeader({
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
        <p className="eyebrow">Career Development</p>
        <h1 className="page-title mt-2">
          Career Journey &amp; Growth
        </h1>
        <p className="page-description">
          Proyeksi pertumbuhan karir dan estimasi kenaikan gaji jangka panjang dari Entry-Level hingga Senior.
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
function JourneyEmptyState({ onGoToSalary }: { onGoToSalary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-8 text-center md:rounded-[32px] md:p-16">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFEEE7] text-2xl font-bold text-[#696969]">
        %
      </span>
      <h2 className="mt-5 text-xl font-bold text-[#141413]">
        Proyeksi Karir Belum Tersedia
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#696969]">
        Jalankan prediksi gaji terlebih dahulu agar sistem bisa menghitung estimasi proyeksi perjalanan karir Anda.
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
    <div className="flex flex-col items-center gap-5 rounded-[24px] border border-dashed border-[#E5E2E0] bg-[#FCFBFA] px-5 py-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:py-8 sm:text-left md:rounded-[32px]">
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
        <h3 className="mt-1.5 text-lg font-bold tracking-[-0.02em] text-[#141413] md:text-xl">
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
        className="inline-flex w-full shrink-0 items-center justify-center gap-2.5 rounded-full bg-[#141413] px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#AA3700] active:scale-[0.98] sm:w-auto sm:hover:scale-[1.03]"
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
    <div className="flex flex-col items-center gap-5 rounded-[24px] border border-[#E5E2E0] bg-white px-5 py-7 text-center shadow-[0_4px_20px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:py-8 sm:text-left md:rounded-[32px]">
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
