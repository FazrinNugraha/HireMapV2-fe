import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { SalaryPredictionResponse, SpatialSummaryItem } from '../types/api'
import { formatRupiah } from '../utils/format'

ChartJS.register(ArcElement, ChartTooltip)

type FeasibilityScoreCardProps = {
  prediction: SalaryPredictionResponse
  spatialSummary: SpatialSummaryItem[]
  onRequestAudit: (prompt: string) => void
}

type ScoreDimension = {
  label: string
  weight: number
  rawScore: number // 0–100
  weightedScore: number
  description: string
  statusColor: string
}

function computeFeasibilityScore(
  prediction: SalaryPredictionResponse,
  spatialSummary: SpatialSummaryItem[]
): { total: number; dimensions: ScoreDimension[] } {
  // --- 1. Keterjangkauan Hunian (40%) ---
  // rasio_kos = % gaji yang habis untuk kos
  // 0–25% = 100, 25–35% = 75, 35–50% = 50, 50–65% = 25, >65% = 5
  const ratio = prediction.rasio_kos
  let affordScore = 100
  if (ratio > 65) affordScore = 5
  else if (ratio > 50) affordScore = 25
  else if (ratio > 35) affordScore = 50
  else if (ratio > 25) affordScore = 75

  // --- 2. Daya Saing Gaji (30%) ---
  // multiplier = product of all qualification multipliers (from backend)
  // Range: typically 0.60 (low) to 1.80+ (very strong)
  const mult = prediction.multiplier
  // Normalize: 0.60 = 0, 1.80 = 100
  const competeScore = Math.min(100, Math.max(0, Math.round(((mult - 0.6) / (1.8 - 0.6)) * 100)))

  // --- 3. Ketersediaan Pasar (30%) ---
  // Uses spatialSummary to find total_jobs for the selected location.
  // Max jobs across all cities = 100, min = 0.
  const locationEntry = spatialSummary.find(
    (s) => s.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase()
  )
  const locationJobs = locationEntry?.Jumlah_Lowongan ?? 0
  const allJobs = spatialSummary.map((s) => s.Jumlah_Lowongan)
  const maxJobs = allJobs.length > 0 ? Math.max(...allJobs) : 1
  const marketScore = Math.min(100, Math.round((locationJobs / maxJobs) * 100))

  const dimensions: ScoreDimension[] = [
    {
      label: 'Keterjangkauan Hunian',
      weight: 40,
      rawScore: affordScore,
      weightedScore: Math.round((affordScore * 40) / 100),
      description: `Rasio kos ${ratio.toFixed(1)}% dari gaji. Estimasi kos ${formatRupiah(prediction.estimasi_kos)}/bln.`,
      statusColor: affordScore >= 75 ? '#16a34a' : affordScore >= 50 ? '#ca8a04' : '#dc2626',
    },
    {
      label: 'Daya Saing Kualifikasi',
      weight: 30,
      rawScore: competeScore,
      weightedScore: Math.round((competeScore * 30) / 100),
      description: `Multiplier kualifikasi Anda: ${mult.toFixed(2)}× (pengalaman × pendidikan × sertifikasi).`,
      statusColor: competeScore >= 70 ? '#16a34a' : competeScore >= 40 ? '#ca8a04' : '#dc2626',
    },
    {
      label: 'Ketersediaan Pasar',
      weight: 30,
      rawScore: marketScore,
      weightedScore: Math.round((marketScore * 30) / 100),
      description: `${locationJobs.toLocaleString('id-ID')} lowongan aktif di ${prediction.lokasi} (dari data riil Jabodetabek).`,
      statusColor: marketScore >= 60 ? '#16a34a' : marketScore >= 30 ? '#ca8a04' : '#dc2626',
    },
  ]

  const total = dimensions.reduce((sum, d) => sum + d.weightedScore, 0)
  return { total, dimensions }
}

function getScoreGrade(score: number): { label: string; color: string; bg: string; description: string } {
  if (score >= 80) return { label: 'Sangat Layak', color: '#16a34a', bg: '#dcfce7', description: 'Kondisi karir & finansial sangat mendukung posisi ini.' }
  if (score >= 65) return { label: 'Layak', color: '#2563eb', bg: '#dbeafe', description: 'Posisi ini cukup menjanjikan dengan beberapa area yang bisa dioptimalkan.' }
  if (score >= 50) return { label: 'Cukup', color: '#ca8a04', bg: '#fef9c3', description: 'Ada beberapa risiko yang perlu dipertimbangkan sebelum memutuskan.' }
  if (score >= 35) return { label: 'Perlu Pertimbangan', color: '#dc2626', bg: '#fee2e2', description: 'Kondisi kurang ideal — pertimbangkan alternatif atau negosiasi lebih lanjut.' }
  return { label: 'Berisiko Tinggi', color: '#7f1d1d', bg: '#fef2f2', description: 'Banyak faktor tidak mendukung. Sangat disarankan mencari alternatif.' }
}

function buildAuditPrompt(prediction: SalaryPredictionResponse, score: number): string {
  return (
    `Tolong buat audit karir komprehensif untuk posisi ${prediction.judul} ` +
    `di ${prediction.lokasi} dengan level ${prediction.pengalaman}. ` +
    `Indeks Kelayakan DSS saya adalah ${score}/100. ` +
    `Gaji prediksi: ${formatRupiah(prediction.gaji_prediksi)}/bln, ` +
    `estimasi kos: ${formatRupiah(prediction.estimasi_kos)}/bln (rasio ${prediction.rasio_kos.toFixed(1)}%), ` +
    `multiplier kualifikasi: ${prediction.multiplier}×. ` +
    `Berikan analisis mendalam tentang: (1) apakah saya perlu upgrade sertifikasi/pendidikan, ` +
    `(2) strategi negosiasi gaji yang tepat, (3) apakah lokasi ${prediction.lokasi} optimal ` +
    `atau ada kota Jabodetabek lain yang lebih baik, dan (4) roadmap konkret 6–12 bulan ke depan.`
  )
}

export function FeasibilityScoreCard({ prediction, spatialSummary, onRequestAudit }: FeasibilityScoreCardProps) {
  const { total, dimensions } = computeFeasibilityScore(prediction, spatialSummary)
  const grade = getScoreGrade(total)
  const auditPrompt = buildAuditPrompt(prediction, total)

  // Chart.js Doughnut data
  const donutData = {
    datasets: [
      {
        data: [total, 100 - total],
        backgroundColor: [grade.color, '#F3F0EE'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  }
  const donutOptions = {
    cutout: '78%',
    animation: { duration: 900, easing: 'easeOutQuart' as const },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    events: [] as string[],
  }

  return (
    <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Header band */}
      <div className="border-b border-[#E4E2DC] px-7 pt-7 pb-6">
        <p className="eyebrow">Indeks Kelayakan DSS</p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#141413]">
          Decision Support Score
        </h3>
        <p className="mt-1 text-sm text-[#696969]">
          Dihasilkan dari data riil: rasio kos, kualifikasi profil, dan kepadatan lowongan Jabodetabek.
        </p>
      </div>

      <div className="p-7">
        {/* Score + Donut row */}
        <div className="flex items-center gap-8">
          {/* Chart.js Doughnut */}
          <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
            <Doughnut data={donutData} options={donutOptions} />
            {/* Center overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold tracking-tight" style={{ color: grade.color }}>
                {total}
              </span>
              <span className="text-[10px] font-semibold text-[#696969]">/ 100</span>
            </div>
          </div>

          {/* Grade text */}
          <div className="flex-1">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: grade.bg, color: grade.color }}
            >
              {grade.label}
            </span>
            <p className="mt-2 text-sm leading-6 text-[#555]">{grade.description}</p>

            {/* Trigger AI audit button */}
            <button
              type="button"
              onClick={() => onRequestAudit(auditPrompt)}
              className="mt-4 flex items-center gap-2 rounded-full bg-[#141413] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#AA3700] active:scale-95"
            >
              <span>🔍</span>
              <span>Minta Audit Detail dari AI</span>
            </button>
          </div>
        </div>

        {/* Dimension breakdown */}
        <div className="mt-6 flex flex-col gap-3">
          {dimensions.map((dim) => (
            <div key={dim.label} className="rounded-[18px] bg-[#F9F8F6] p-4">
              {/* Label + score */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dim.statusColor }}
                  />
                  <span className="text-sm font-semibold text-[#141413]">{dim.label}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-[#696969]">bobot {dim.weight}%</span>
                  <span className="text-sm font-bold" style={{ color: dim.statusColor }}>
                    +{dim.weightedScore}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E4E2DC]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${dim.rawScore}%`, backgroundColor: dim.statusColor }}
                />
              </div>
              {/* Description */}
              <p className="mt-2 text-xs leading-5 text-[#696969]">{dim.description}</p>
            </div>
          ))}
        </div>

        {/* Data source note */}
        <p className="mt-4 text-[11px] leading-5 text-[#A0A09A]">
          ⚡ Skor dihitung secara otomatis dari respons model ML backend, data spasial CSV Jabodetabek, dan konfigurasi kualifikasi profil — bukan opini AI.
        </p>
      </div>
    </div>
  )
}
