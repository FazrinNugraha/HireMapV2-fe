import { formatRupiah } from '../utils/format'
import type { SalaryPredictionResponse } from '../types/api'

type PredictionResultProps = {
  prediction: SalaryPredictionResponse | null
}

export function PredictionResult({ prediction }: PredictionResultProps) {
  if (!prediction) return null

  return (
    <section className="flex flex-col justify-between rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#696969]">
          <span className="text-sm leading-none text-[#F37338]">•</span>
          Salary Estimate
        </p>
        <h3 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[#141413]">
          {formatRupiah(prediction.gaji_prediksi)}
        </h3>
        <div className="mt-2.5">
          <span className="inline-block rounded-full bg-[#10b981]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
            {prediction.confidence_label} Confidence
          </span>
        </div>
      </div>
      <div className="mt-6 border-t border-[#E5E2E0] pt-5">
        <div className="grid gap-3 text-xs text-[#555555]">
          <div className="flex justify-between gap-4">
            <span className="shrink-0">Posisi Pekerjaan</span>
            <span className="font-semibold text-[#141413] text-right truncate">{prediction.judul}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="shrink-0">Lokasi</span>
            <span className="font-semibold text-[#141413] text-right truncate">{prediction.lokasi}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
