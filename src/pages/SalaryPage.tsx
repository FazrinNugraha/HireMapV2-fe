import { type FormEvent, useEffect, useRef, useState } from "react";
import { LoadingStateCard } from "../components/LoadingStateCard";
import { HousingAffordabilityCard } from "../components/HousingAffordabilityCard";
import { PredictionForm } from "../components/PredictionForm";
import { PredictionResult } from "../components/PredictionResult";
import type {
  MetadataResponse,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
} from "../types/api";

type SalaryPageProps = {
  form: SalaryPredictionRequest;
  metadata: MetadataResponse | null;
  prediction: SalaryPredictionResponse | null;
  isMetadataLoading: boolean;
  isPredicting: boolean;
  onFormChange: (form: SalaryPredictionRequest) => void;
  onPredict: (event: FormEvent<HTMLFormElement>) => void;
  onNextStep: () => void;
};

// Halaman utama untuk input faktor gaji dan membaca hasil prediksi.
export function SalaryPage({
  form,
  metadata,
  prediction,
  isMetadataLoading,
  isPredicting,
  onFormChange,
  onPredict,
  onNextStep,
}: SalaryPageProps) {
  const [revealKey, setRevealKey] = useState(0);
  const prevPrediction = useRef<SalaryPredictionResponse | null>(null);

  // Mengulang animasi hasil setiap user mendapatkan prediksi baru.
  useEffect(() => {
    if (prediction && prediction !== prevPrediction.current) {
      prevPrediction.current = prediction;
      setRevealKey((key) => key + 1);
    }
  }, [prediction]);

  return (
    <main className="page-shell grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-12">
      <SalaryHeader prediction={prediction} onNextStep={onNextStep} />

      <section className="col-span-1 flex flex-col lg:col-span-5">
        <PredictionForm
          form={form}
          metadata={metadata}
          isMetadataLoading={isMetadataLoading}
          isSubmitting={isPredicting}
          onChange={onFormChange}
          onSubmit={onPredict}
        />
      </section>

      <section className="col-span-1 flex h-full flex-col lg:col-span-7">
        {isPredicting ? (
          <SalaryLoadingState />
        ) : prediction ? (
          <SalaryResultPanel key={revealKey} prediction={prediction} />
        ) : (
          <SalaryEmptyState />
        )}
      </section>
    </main>
  );
}

// Header singkat agar tujuan tab Salary Prediction langsung jelas.
function SalaryHeader({
  prediction,
  onNextStep,
}: {
  prediction: SalaryPredictionResponse | null;
  onNextStep: () => void;
}) {
  return (
    <header className="col-span-1 lg:col-span-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="eyebrow">Interactive Simulator</p>
        <h1 className="page-title mt-2">
          Simulator Gaji Pasar &amp; Evaluasi Karir
        </h1>
        <p className="page-description">
          Petakan parameter kualifikasi Anda untuk mensimulasikan proyeksi pendapatan yang realistis berdasarkan tren data riil pasar kerja Jabodetabek
        </p>
      </div>

      {prediction && (
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={onNextStep}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#F37338] px-5 py-2 text-xs font-bold text-white transition-all active:scale-95"
          >
            Selanjutnya &gt;
          </button>
        </div>
      )}
    </header>
  );
}

// State saat request prediksi sedang diproses oleh backend.
function SalaryLoadingState() {
  return (
    <LoadingStateCard
      title="Memproses Analisis Keputusan..."
      description="Mengevaluasi kualifikasi pekerjaan, menghitung estimasi model gaji, dan menyiapkan faktor pendukung prediksi."
    />
  );
}

// Ringkasan hasil salary: angka gaji dan faktor finansial pendukung.
function SalaryResultPanel({
  prediction,
}: {
  prediction: SalaryPredictionResponse;
}) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex h-full flex-col gap-6">
        <div className="flex animate-fade-slide-down-d1 lg:flex-1">
          <PredictionResult prediction={prediction} />
        </div>
        <div className="flex animate-fade-slide-down-d2 lg:flex-1">
          <HousingAffordabilityCard prediction={prediction} />
        </div>
      </div>
    </div>
  );
}

// State awal sebelum user menjalankan prediksi.
function SalaryEmptyState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-6 text-center md:min-h-[420px] md:rounded-[32px] md:p-10">
      <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFEEE7] text-[#696969]">
        <svg
          className="h-8 w-8 text-[#696969]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#141413]">
        Sistem Pendukung Keputusan Belum Aktif
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[#696969]">
        Isi data posisi, kategori, dan lokasi kerja Anda pada panel input di
        sebelah kiri, lalu klik tombol untuk memproses analisis keputusan karir
        &amp; finansial.
      </p>
    </div>
  );
}
