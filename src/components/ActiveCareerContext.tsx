import { formatRupiah } from '../utils/format'
import type { SalaryPredictionResponse } from '../types/api'

type ActiveCareerContextProps = {
  prediction: SalaryPredictionResponse | null
  onGoToSalary: () => void
}

export function ActiveCareerContext({ prediction, onGoToSalary }: ActiveCareerContextProps) {
  if (!prediction) {
    return (
      <section className="rounded-[32px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:col-span-4">
        <h2 className="mb-2 text-xl font-semibold text-[#000000]">Active Career Context</h2>
        <p className="text-sm leading-6 text-[#464742]">
          Run a salary prediction first so the AI can give personalized advice.
        </p>
        <button
          className="mt-6 rounded-full bg-[#000000] px-5 py-3 text-sm font-semibold text-white"
          type="button"
          onClick={onGoToSalary}
        >
          Go to Salary Prediction
        </button>
      </section>
    )
  }

  return (
    <aside className="flex flex-col gap-6 md:col-span-4">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-[#000000]">Active Career Context</h2>
          <p className="text-sm leading-6 text-[#464742]">Based on your recent prediction.</p>
        </div>

        <div className="flex flex-col gap-4">
          <ContextRow label="Position" value={prediction.judul} />
          <ContextRow label="Location" value={prediction.lokasi} />
          <ContextRow label="Experience" value={prediction.pengalaman} />
          <ContextRow label="Education" value={prediction.pendidikan} />
        </div>

        <div className="mt-6 rounded-[24px] bg-[#efeee7] p-4">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-wider text-[#464742]">
              Predicted Salary
            </span>
            <div className="text-3xl font-semibold text-[#000000]">
              {formatRupiah(prediction.gaji_prediksi)}
            </div>
            <div className="mt-1 text-xs text-[#aa3700]">
              Range: {formatRupiah(prediction.gaji_min)} - {formatRupiah(prediction.gaji_max)}
            </div>
          </div>

          <div className="flex justify-between rounded-[18px] bg-white p-3">
            <div>
              <span className="block text-xs text-[#464742]">Est. Kos</span>
              <span className="font-medium text-[#000000]">
                {formatRupiah(prediction.estimasi_kos)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-[#464742]">Income Ratio</span>
              <span className="font-bold text-[#aa3700]">
                {prediction.rasio_kos.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="hidden h-48 overflow-hidden rounded-[32px] bg-[#efeee7] md:block">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#efeee7] to-[#e4e2dc] text-sm text-[#464742]">
          AI context illustration placeholder
        </div>
      </section>
    </aside>
  )
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e4e2dc] pb-2">
      <span className="text-sm font-semibold text-[#464742]">{label}</span>
      <span className="text-right text-sm font-medium text-[#000000]">{value}</span>
    </div>
  )
}

