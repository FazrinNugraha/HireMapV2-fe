import { formatRupiah } from '../utils/format'
import type { SalaryPredictionResponse, SpatialSummaryItem } from '../types/api'

type CommuterOptionsCardProps = {
  prediction: SalaryPredictionResponse
  spatialSummary: SpatialSummaryItem[]
}

// Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function CommuterOptionsCard({ prediction, spatialSummary }: CommuterOptionsCardProps) {
  const targetLocation = spatialSummary.find(
    (item) => item.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase()
  )

  if (!targetLocation || spatialSummary.length === 0) return null

  // Calculate commuter options
  const options = spatialSummary
    .filter((item) => item.Lokasi_Clean.toLowerCase() !== targetLocation.Lokasi_Clean.toLowerCase())
    .map((item) => {
      const distance = calculateDistance(targetLocation.lat, targetLocation.lon, item.lat, item.lon)
      const travelTime = Math.round((distance / 25) * 60)
      const savings = prediction.estimasi_kos - item.Harga_Kos_Estimasi
      return {
        lokasi: item.Lokasi_Clean,
        savings,
        distance,
        travelTime,
      }
    })
    .filter((opt) => opt.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 2)

  return (
    <div className="rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] animate-fade-slide-down">
      <div className="mb-4">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[#696969]">
          <span className="text-sm leading-none text-[#F37338]">•</span>
          Pilihan Tempat Tinggal (Opsi Komuter)
        </p>
        <p className="mt-1.5 text-[11px] leading-5 text-[#696969]">
          Tinggal di wilayah kota lain di Jabodetabek untuk menghemat biaya hidup bulanan sambil tetap bekerja di pusat bisnis.
        </p>
      </div>

      {options.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-[20px] bg-[#3860BE]/10 border border-[#3860BE]/20 px-4 py-3 text-xs font-medium text-[#3860BE] leading-relaxed">
            Anda bisa menghemat uang jika tinggal di kota-kota penyangga berikut dan komuter ke{' '}
            <span className="font-bold">{prediction.lokasi}</span>:
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {options.map((opt) => (
              <div
                key={opt.lokasi}
                className="rounded-[20px] bg-[#FCFBFA] border border-[#E5E2E0] p-5 flex flex-col justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#696969] uppercase tracking-wider">
                    Kost di {opt.lokasi}
                  </h4>
                  <div className="mt-2 text-lg font-bold text-[#10b981]">
                    Hemat {formatRupiah(opt.savings)}/bln
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#141413]/5 border border-[#141413]/10 px-2.5 py-1 text-[9px] font-bold text-[#696969] uppercase tracking-wider">
                    Jarak +/-{opt.distance.toFixed(1)} KM
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[#141413]/5 border border-[#141413]/10 px-2.5 py-1 text-[9px] font-bold text-[#696969] uppercase tracking-wider">
                    Waktu ~{opt.travelTime} mnt
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#10b981]/10 border border-[#10b981]/25 px-4 py-3.5 text-xs text-[#10b981] leading-relaxed">
          Biaya hunian di lokasi penempatan Anda (<span className="font-bold">{prediction.lokasi}</span>) saat ini tergolong paling terjangkau dibanding wilayah lainnya. Alternatif komuter tidak diperlukan.
        </div>
      )}
    </div>
  )
}
