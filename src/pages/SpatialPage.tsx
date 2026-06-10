import { useEffect, useMemo, useState } from 'react'
import { getSpatialSummary } from '../services/api'
import type { MetadataResponse, SalaryPredictionResponse, SpatialSummaryItem } from '../types/api'
import { formatRupiah } from '../utils/format'

type SpatialPageProps = {
  metadata: MetadataResponse | null
  prediction: SalaryPredictionResponse | null
}

const VIEW_MODES = ['Job Volume', 'Kos Cost', 'Sweet Spot'] as const

export function SpatialPage({ metadata, prediction }: SpatialPageProps) {
  const [summary, setSummary] = useState<SpatialSummaryItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState(prediction?.kategori ?? 'All Industries')
  const [selectedLocation, setSelectedLocation] = useState(prediction?.lokasi ?? 'All Locations')
  const [activeMode, setActiveMode] = useState<(typeof VIEW_MODES)[number]>('Sweet Spot')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSpatialSummary()
      .then(setSummary)
      .catch((spatialError: unknown) => {
        setError(
          spatialError instanceof Error ? spatialError.message : 'Gagal mengambil data spasial.',
        )
      })
  }, [])

  useEffect(() => {
    if (prediction) {
      setSelectedCategory(prediction.kategori)
      setSelectedLocation(prediction.lokasi)
    }
  }, [prediction])

  const selectedSummary = useMemo(
    () =>
      summary.find((item) => item.Lokasi_Clean === selectedLocation) ??
      summary.find((item) => item.Lokasi_Clean === prediction?.lokasi) ??
      summary[0],
    [prediction?.lokasi, selectedLocation, summary],
  )

  const bestOpportunity = summary[0]
  const lowestKos = [...summary].sort(
    (a, b) => a.Harga_Kos_Estimasi - b.Harga_Kos_Estimasi,
  )[0]

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-5 py-10 md:px-10">
      <section className="flex flex-col gap-7">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#000000] md:text-5xl">
            Spatial Career Map
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#464742]">
            Compare job opportunities and living cost across Jabodetabek.
          </p>
        </div>

        <div className="flex w-fit max-w-full flex-wrap items-center gap-3 rounded-[32px] border border-[#e5e2e0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <select
            className="rounded-full border-none bg-transparent px-4 py-2 text-sm font-semibold text-[#000000] outline-none"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option>All Industries</option>
            {(metadata?.categories ?? []).map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="hidden h-6 w-px bg-[#e5e2e0] sm:block" />

          <select
            className="rounded-full border-none bg-transparent px-4 py-2 text-sm font-semibold text-[#000000] outline-none"
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
          >
            <option>All Locations</option>
            {(metadata?.locations ?? []).map((location) => (
              <option value={location} key={location}>
                {location}
              </option>
            ))}
          </select>

          <div className="hidden h-6 w-px bg-[#e5e2e0] sm:block" />

          <div className="flex rounded-full bg-[#e4e2dc] p-1">
            {VIEW_MODES.map((mode) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  mode === activeMode
                    ? 'bg-white text-[#000000] shadow-sm'
                    : 'text-[#464742] hover:text-[#000000]'
                }`}
                type="button"
                key={mode}
                onClick={() => setActiveMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-[20px] border border-[#aa3700]/20 bg-white px-5 py-3 text-sm text-[#aa3700]">
            {error}
          </div>
        )}
      </section>

      <section className="grid min-h-[600px] grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="relative flex items-center justify-center overflow-hidden rounded-[32px] border border-[#e5e2e0] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)] lg:col-span-8">
          <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative min-h-[420px] w-full">
            <MapMarker
              label="Jakarta Selatan"
              size="large"
              className="left-[42%] top-[28%]"
              isActive={selectedSummary?.Lokasi_Clean === 'Jakarta Selatan'}
            />
            <MapMarker
              label="Bekasi"
              size="medium"
              className="left-[62%] top-[38%]"
              isActive={selectedSummary?.Lokasi_Clean === 'Bekasi'}
            />
            <MapMarker
              label="Depok"
              size="medium"
              className="left-[45%] top-[58%]"
              isActive={selectedSummary?.Lokasi_Clean === 'Depok'}
            />
            <MapMarker
              label="Tangerang Selatan"
              size="small"
              className="left-[24%] top-[46%]"
              isActive={selectedSummary?.Lokasi_Clean === 'Tangerang Selatan'}
            />

            <div className="absolute left-1/2 top-1/2 max-w-xs -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#efeee7] text-2xl">
                ◎
              </div>
              <p className="text-sm leading-6 text-[#464742]">
                Baseline map visualization. Data marker bisa diganti Mapbox/Leaflet nanti.
              </p>
            </div>
          </div>

          <div className="absolute bottom-8 left-8 rounded-2xl border border-[#e5e2e0] bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <h4 className="mb-2 text-xs uppercase tracking-wider text-[#464742]">Legend</h4>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#000000]" /> Job Vol.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#aa3700]" /> Kos Cost
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <div className="grid grid-cols-2 gap-4">
            <InsightCard label="Best Opp." value={bestOpportunity?.Lokasi_Clean ?? 'Jak-Sel'} />
            <InsightCard label="Low Kos" value={lowestKos?.Lokasi_Clean ?? 'Depok'} muted />
          </div>

          <section className="flex flex-1 flex-col rounded-[32px] border border-[#e5e2e0] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="mb-1 text-2xl font-semibold text-[#000000]">
                  {selectedSummary?.Lokasi_Clean ?? 'Jakarta Selatan'}
                </h2>
                <p className="text-xs font-semibold text-[#aa3700]">{activeMode} Candidate</p>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c7c7c0]">
                →
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <SidebarMetric
                label="Job Openings"
                value={selectedSummary ? String(selectedSummary.Jumlah_Lowongan) : '-'}
              />
              <SidebarMetric
                label="Est. Kos"
                value={
                  selectedSummary ? formatRupiah(selectedSummary.Harga_Kos_Estimasi) : '-'
                }
              />
              <SidebarMetric label="Selected Industry" value={selectedCategory} />
            </div>

            <div className="mt-auto pt-6">
              <h4 className="mb-3 text-sm font-semibold text-[#464742]">Top Demand</h4>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#e4e2dc] px-3 py-1 text-xs">Tech</span>
                <span className="rounded-full bg-[#e4e2dc] px-3 py-1 text-xs">Finance</span>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-[#e5e2e0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-[#e5e2e0] p-6 md:p-8">
          <h2 className="text-xl font-bold text-[#000000]">Regional Ranking</h2>
          <span className="text-sm font-semibold text-[#464742]">View Full Data →</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#f5f4ed] text-sm text-[#464742]">
                <th className="border-b border-[#e5e2e0] p-4 pl-8 font-medium">City</th>
                <th className="border-b border-[#e5e2e0] p-4 font-medium">Job Openings</th>
                <th className="border-b border-[#e5e2e0] p-4 font-medium">Est. Kos</th>
                <th className="border-b border-[#e5e2e0] p-4 font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {summary.slice(0, 6).map((item) => (
                <tr className="hover:bg-[#e4e2dc]/40" key={item.Lokasi_Clean}>
                  <td className="border-b border-[#e5e2e0] p-4 pl-8 font-medium">
                    {item.Lokasi_Clean}
                  </td>
                  <td className="border-b border-[#e5e2e0] p-4 text-[#464742]">
                    {item.Jumlah_Lowongan}
                  </td>
                  <td className="border-b border-[#e5e2e0] p-4 text-[#464742]">
                    {formatRupiah(item.Harga_Kos_Estimasi)}
                  </td>
                  <td className="border-b border-[#e5e2e0] p-4">
                    <span className="rounded-full bg-[#efeee7] px-3 py-1 text-xs font-semibold">
                      Balanced
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

type MarkerProps = {
  label: string
  size: 'small' | 'medium' | 'large'
  className: string
  isActive: boolean
}

function MapMarker({ label, size, className, isActive }: MarkerProps) {
  const sizeClass = {
    small: 'h-10 w-10 text-xs',
    medium: 'h-12 w-12 text-xs',
    large: 'h-16 w-16 text-sm',
  }[size]

  return (
    <button
      className={`group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${className}`}
      type="button"
    >
      <span
        className={`${sizeClass} flex items-center justify-center rounded-full border-4 border-white font-bold shadow-lg transition-transform group-hover:scale-110 ${
          isActive ? 'bg-[#aa3700] text-white' : 'bg-[#000000] text-white'
        }`}
      >
        {size === 'large' ? 'High' : 'Med'}
      </span>
      <span className="whitespace-nowrap rounded bg-white px-2 py-1 text-xs opacity-0 shadow transition-opacity group-hover:opacity-100">
        {label}
      </span>
    </button>
  )
}

function InsightCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-[#e5e2e0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <span className={muted ? 'text-[#c9c6c4]' : 'text-[#aa3700]'}>★</span>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#464742]">{label}</h3>
      <p className="text-xl font-bold text-[#000000]">{value}</p>
    </div>
  )
}

function SidebarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e5e2e0] py-3">
      <span className="text-sm text-[#464742]">{label}</span>
      <span className="max-w-[180px] text-right font-semibold text-[#000000]">{value}</span>
    </div>
  )
}

