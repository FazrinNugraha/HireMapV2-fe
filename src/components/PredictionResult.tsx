import { Metric } from './Metric'
import { formatRupiah } from '../utils/format'
import type { SalaryPredictionResponse } from '../types/api'

type PredictionResultProps = {
  prediction: SalaryPredictionResponse | null
}

export function PredictionResult({ prediction }: PredictionResultProps) {
  return (
    <section className="rounded-[32px] bg-[#141413] p-6 text-[#F3F0EE]">
      <p className="text-sm font-bold tracking-[0.04em] text-[#F37338] uppercase">Result</p>
      {prediction ? (
        <div className="mt-5 grid gap-5">
          <div>
            <p className="text-sm text-white/60">Estimasi gaji anda</p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.02em]">
              {formatRupiah(prediction.gaji_prediksi)}
            </p>
          </div>

          <div className="grid gap-3 text-sm">
            <Metric label="Gaji basis" value={formatRupiah(prediction.gaji_basis)} />
            <Metric label="Range bawah" value={formatRupiah(prediction.gaji_min)} />
            <Metric label="Range atas" value={formatRupiah(prediction.gaji_max)} />
            <Metric label="Estimasi kos" value={formatRupiah(prediction.estimasi_kos)} />
            <Metric label="Rasio kos" value={`${prediction.rasio_kos.toFixed(1)}%`} />
            <Metric label="Confidence" value={prediction.confidence_label} />
          </div>

          {prediction.adjustment_notes.length > 0 && (
            <div className="rounded-[20px] bg-white/10 p-4 text-sm leading-6 text-white/75">
              {prediction.adjustment_notes.join(' ')}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-white/65">
          Hasil prediksi akan muncul di sini setelah form dikirim.
        </p>
      )}
    </section>
  )
}

