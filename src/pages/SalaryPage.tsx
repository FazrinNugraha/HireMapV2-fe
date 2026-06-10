import type { FormEvent } from 'react'
import { HousingAffordabilityCard } from '../components/HousingAffordabilityCard'
import { PredictionForm } from '../components/PredictionForm'
import { PredictionResult } from '../components/PredictionResult'
import { SalaryEvaluationCard } from '../components/SalaryEvaluationCard'
import type {
  MetadataResponse,
  SalaryEvaluationResponse,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
} from '../types/api'

type SalaryPageProps = {
  form: SalaryPredictionRequest
  metadata: MetadataResponse | null
  prediction: SalaryPredictionResponse | null
  evaluation: SalaryEvaluationResponse | null
  targetSalary: string
  isMetadataLoading: boolean
  isPredicting: boolean
  isEvaluating: boolean
  onFormChange: (form: SalaryPredictionRequest) => void
  onPredict: (event: FormEvent<HTMLFormElement>) => void
  onTargetSalaryChange: (value: string) => void
  onEvaluate: () => void
}

export function SalaryPage({
  form,
  metadata,
  prediction,
  evaluation,
  targetSalary,
  isMetadataLoading,
  isPredicting,
  isEvaluating,
  onFormChange,
  onPredict,
  onTargetSalaryChange,
  onEvaluate,
}: SalaryPageProps) {
  return (
    <main className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-5 py-10 md:px-10 lg:grid-cols-12">
      <header className="col-span-1 mb-2 lg:col-span-12">
        <h1 className="mb-4 text-4xl font-semibold tracking-[-0.02em] text-[#000000] md:text-5xl">
          Salary Prediction
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-[#464742]">
          Estimate market salary based on role, location, and individual adjustment factors.
        </p>
      </header>

      <section className="col-span-1 flex flex-col gap-6 lg:col-span-7">
        <PredictionForm
          form={form}
          metadata={metadata}
          isMetadataLoading={isMetadataLoading}
          isSubmitting={isPredicting}
          onChange={onFormChange}
          onSubmit={onPredict}
        />
      </section>

      <section className="col-span-1 flex flex-col gap-6 lg:col-span-5">
        <PredictionResult prediction={prediction} />
        <HousingAffordabilityCard prediction={prediction} />
        <SalaryEvaluationCard
          prediction={prediction}
          evaluation={evaluation}
          targetSalary={targetSalary}
          isLoading={isEvaluating}
          onTargetSalaryChange={onTargetSalaryChange}
          onEvaluate={onEvaluate}
        />
      </section>
    </main>
  )
}

