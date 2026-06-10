import type { FormEvent } from 'react'
import { HousingAffordabilityCard } from '../components/HousingAffordabilityCard'
import { PredictionForm } from '../components/PredictionForm'
import { PredictionResult } from '../components/PredictionResult'
import { CommuterOptionsCard } from '../components/CommuterOptionsCard'
import { CareerJourneyChart } from '../components/CareerJourneyChart'
import type {
  MetadataResponse,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from '../types/api'

type SalaryPageProps = {
  form: SalaryPredictionRequest
  metadata: MetadataResponse | null
  prediction: SalaryPredictionResponse | null
  spatialSummary: SpatialSummaryItem[]
  isMetadataLoading: boolean
  isPredicting: boolean
  onFormChange: (form: SalaryPredictionRequest) => void
  onPredict: (event: FormEvent<HTMLFormElement>) => void
}

export function SalaryPage({
  form,
  metadata,
  prediction,
  spatialSummary,
  isMetadataLoading,
  isPredicting,
  onFormChange,
  onPredict,
}: SalaryPageProps) {
  return (
    <main className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-8 px-5 py-10 md:px-10 lg:grid-cols-12">
      {/* Header */}
      <header className="col-span-1 lg:col-span-12">
        <p className="eyebrow">Interactive Calculator</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.02em] text-[#141413] md:text-5xl">
          Salary Predictor &amp; Decision Support System
        </h1>
        <p className="mt-3 text-lg leading-8 text-[#696969]">
          Hitung estimasi gaji pasar yang kompetitif dan dapatkan rekomendasi keputusan karir &amp; finansial di Jabodetabek.
        </p>
      </header>

      {/* Form Input Panel */}
      <section className="col-span-1 lg:col-span-5 flex flex-col">
        <PredictionForm
          form={form}
          metadata={metadata}
          isMetadataLoading={isMetadataLoading}
          isSubmitting={isPredicting}
          onChange={onFormChange}
          onSubmit={onPredict}
        />
      </section>

      {/* Decision Support System Panel */}
      <section className="col-span-1 lg:col-span-7 flex flex-col">
        {isPredicting ? (
          <div className="flex-1 flex flex-col justify-center items-center rounded-[32px] border border-[#E5E2E0] bg-white p-10 text-center min-h-[420px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-[#3860BE]/10 opacity-75" />
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3860BE]/10 text-[#3860BE]">
                <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            </div>
            <h3 className="mt-6 text-lg font-bold text-[#141413]">Memproses Analisis Keputusan...</h3>
            <p className="mt-2 max-w-sm text-xs leading-5 text-[#696969]">
              Mengevaluasi kualifikasi pekerjaan, menghitung estimasi model gaji, dan mencari opsi sewa kos komuter paling ekonomis di Jabodetabek.
            </p>
          </div>
        ) : prediction ? (
          <div className="grid gap-6 animate-fade-slide-down">
            <div className="grid gap-6 md:grid-cols-2">
              <PredictionResult prediction={prediction} />
              <HousingAffordabilityCard prediction={prediction} />
            </div>
            <CommuterOptionsCard prediction={prediction} spatialSummary={spatialSummary} />
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-[#D1CDC7] bg-[#FCFBFA]/50 p-10 text-center">
            <span className="text-4xl">🎯</span>
            <h3 className="mt-4 text-lg font-bold text-[#141413]">Sistem Pendukung Keputusan Belum Aktif</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#696969]">
              Isi data posisi, kategori, dan lokasi kerja Anda pada panel input di sebelah kiri, lalu klik tombol untuk memproses analisis keputusan karir &amp; finansial.
            </p>
          </div>
        )}
      </section>

      {/* Career Journey Chart — full-width row */}
      {prediction && !isPredicting && (
        <section className="col-span-1 lg:col-span-12 animate-fade-slide-down">
          <CareerJourneyChart prediction={prediction} />
        </section>
      )}
    </main>
  )
}
