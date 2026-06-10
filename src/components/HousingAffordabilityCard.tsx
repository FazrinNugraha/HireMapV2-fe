import { formatRupiah } from '../utils/format'
import type { SalaryPredictionResponse } from '../types/api'

type HousingAffordabilityCardProps = {
  prediction: SalaryPredictionResponse | null
}

export function HousingAffordabilityCard({ prediction }: HousingAffordabilityCardProps) {
  const ratio = prediction?.rasio_kos ?? 0
  const markerPosition = Math.min(Math.max(ratio, 0), 100)
  const status = getHousingStatus(ratio)

  return (
    <section className="rounded-[32px] border border-[#e5e2e0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#000000]">Housing Affordability</h3>
        <span className="rounded-full bg-[#efeee7] px-3 py-1 text-xs font-semibold text-[#464742]">
          {status}
        </span>
      </div>

      {prediction ? (
        <>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-1 text-sm font-semibold text-[#464742]">
                Estimated Kos ({prediction.lokasi})
              </div>
              <div className="text-3xl font-semibold text-[#000000]">
                {formatRupiah(prediction.estimasi_kos)}
                <span className="text-base font-normal text-[#464742]"> / mo</span>
              </div>
            </div>
            <div className="md:text-right">
              <div className="text-sm font-bold text-[#aa3700]">
                {prediction.rasio_kos.toFixed(1)}% of salary
              </div>
              <div className="text-xs font-medium text-[#16a34a]">Status: {status}</div>
            </div>
          </div>

          <div className="relative mt-5 h-3 w-full overflow-hidden rounded-full bg-[#efeee7]">
            <div className="absolute inset-y-0 left-0 w-[30%] bg-[#16a34a]/25" />
            <div className="absolute inset-y-0 left-[30%] w-[20%] bg-[#eab308]/25" />
            <div className="absolute inset-y-0 left-[50%] w-[50%] bg-[#ba1a1a]/20" />
            <div
              className="absolute inset-y-0 z-10 w-1 bg-[#000000]"
              style={{ left: `${markerPosition}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between px-1 text-[10px] text-[#464742]">
            <span>0% Ideal</span>
            <span>30% Consider</span>
            <span>50%+ Heavy</span>
          </div>
        </>
      ) : (
        <p className="text-sm leading-6 text-[#464742]">
          Analisis keterjangkauan hunian akan muncul setelah prediksi gaji berhasil.
        </p>
      )}
    </section>
  )
}

function getHousingStatus(ratio: number) {
  if (ratio <= 0) return 'Waiting'
  if (ratio <= 30) return 'Ideal'
  if (ratio <= 50) return 'Consider'
  return 'Heavy'
}

