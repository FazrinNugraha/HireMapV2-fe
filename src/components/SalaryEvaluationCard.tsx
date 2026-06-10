import type { SalaryEvaluationResponse, SalaryPredictionResponse } from '../types/api'

type SalaryEvaluationCardProps = {
  prediction: SalaryPredictionResponse | null
  evaluation: SalaryEvaluationResponse | null
  targetSalary: string
  isLoading: boolean
  onTargetSalaryChange: (value: string) => void
  onEvaluate: () => void
}

export function SalaryEvaluationCard({
  prediction,
  evaluation,
  targetSalary,
  isLoading,
  onTargetSalaryChange,
  onEvaluate,
}: SalaryEvaluationCardProps) {
  return (
    <section className="rounded-[32px] bg-white p-6">
      <p className="text-sm font-bold tracking-[0.04em] text-[#CF4500] uppercase">
        Salary Evaluation
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="grid flex-1 gap-2 text-sm font-semibold">
          Target/offer dalam juta rupiah
          <input
            className="rounded-[20px] border border-[#141413]/20 px-4 py-3 font-normal outline-none focus:border-[#141413]"
            value={targetSalary}
            onChange={(event) => onTargetSalaryChange(event.target.value)}
            placeholder="Contoh: 9"
          />
        </label>
        <button
          className="rounded-[20px] border border-[#141413] px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
          type="button"
          disabled={!prediction || isLoading}
          onClick={onEvaluate}
        >
          {isLoading ? 'Evaluasi...' : 'Evaluasi'}
        </button>
      </div>

      {evaluation && (
        <div className="mt-5 rounded-[24px] bg-[#F3F0EE] p-5">
          <p className="text-sm text-[#696969]">Zona gaji anda</p>
          <h3 className="mt-1 text-2xl font-semibold">{evaluation.status.label}</h3>
          <p className="mt-2 text-sm leading-6 text-[#565656]">
            {evaluation.delta_text}. {evaluation.status.desc}
          </p>
        </div>
      )}
    </section>
  )
}

