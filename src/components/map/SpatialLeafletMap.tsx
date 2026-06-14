import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import type { SpatialSummaryItem } from '../../types/api'
import 'leaflet/dist/leaflet.css'

type SpatialLeafletMapProps = {
  data: SpatialSummaryItem[]
  selectedLocation: string
  onSelectLocation: (location: string) => void
}

const JABODETABEK_CENTER: LatLngExpression = [-6.28, 106.83]

export function SpatialLeafletMap({
  data,
  selectedLocation,
  onSelectLocation,
}: SpatialLeafletMapProps) {
  const stats = useMemo(() => getSpatialStats(data), [data])
  const selectedItem = data.find((item) => item.Lokasi_Clean === selectedLocation)

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-[#E5E2E0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] sm:h-[440px] md:rounded-[32px] lg:h-[560px]">
      <MapContainer
        center={JABODETABEK_CENTER}
        zoom={10}
        minZoom={9}
        maxZoom={13}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        />

        <MapFocus selectedItem={selectedItem} />

        {data.map((item) => {
          const isSelected = item.Lokasi_Clean === selectedLocation
          const score = getSweetSpotScore(item, stats)
          const color = getSweetSpotColor(score)
          const radius = scaleValue(item.Jumlah_Lowongan, stats.minJobs, stats.maxJobs, 8, 22)

          return (
            <CircleMarker
              center={[item.lat, item.lon]}
              eventHandlers={{
                click: () => onSelectLocation(item.Lokasi_Clean),
              }}
              key={item.Lokasi_Clean}
              pathOptions={{
                color: isSelected ? '#141413' : '#ffffff',
                weight: isSelected ? 2.5 : 1,
                fillColor: color,
                fillOpacity: isSelected ? 0.75 : 0.35,
              }}
              radius={isSelected ? radius + 4 : radius}
            >
              <Tooltip
                permanent
                direction="right"
                offset={[isSelected ? radius + 8 : radius + 4, 0]}
                className="custom-map-tooltip"
              >
                {item.Lokasi_Clean}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[500] max-w-[calc(100%-1.5rem)] overflow-hidden rounded-[18px] border border-[#E5E2E0] bg-white/95 p-3 text-[11px] shadow-sm backdrop-blur-sm sm:bottom-5 sm:left-5 sm:rounded-[20px] sm:p-4 sm:text-xs">
        <h4 className="mb-2 font-bold uppercase tracking-[0.04em] text-[#696969]">
          Job Opportunity
        </h4>
        <div className="grid gap-2">
          <LegendItem color="#10b981" label="High Opportunity" />
          <LegendItem color="#f59e0b" label="Moderate" />
          <LegendItem color="#ef4444" label="Low Opportunity" />
        </div>
        <div className="mt-3 border-t border-[#E5E2E0] pt-2 text-[10px] text-[#696969]">
          Ukuran marker = jumlah lowongan
        </div>
      </div>
    </div>
  )
}

function MapFocus({ selectedItem }: { selectedItem?: SpatialSummaryItem }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedItem) return
    map.flyTo([selectedItem.lat, selectedItem.lon], 11, { duration: 0.8 })
  }, [map, selectedItem])

  return null
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[#555555]">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  )
}

/* Score helpers */

function getSpatialStats(data: SpatialSummaryItem[]) {
  const jobs = data.map((item) => item.Jumlah_Lowongan).filter((j) => j > 0)
  const kos = data.map((item) => item.Harga_Kos_Estimasi).filter((k) => k > 0)
  return {
    minJobs: jobs.length > 0 ? Math.min(...jobs) : 1,
    maxJobs: jobs.length > 0 ? Math.max(...jobs) : 1,
    minKos: kos.length > 0 ? Math.min(...kos) : 1,
    maxKos: kos.length > 0 ? Math.max(...kos) : 1,
  }
}

function getSweetSpotScore(
  item: SpatialSummaryItem,
  stats: ReturnType<typeof getSpatialStats>,
) {
  // Use natural log to handle job volume skew realistically (diminishing marginal returns)
  const minJobsLog = Math.log(stats.minJobs)
  const maxJobsLog = Math.log(stats.maxJobs)
  const currentJobsLog = Math.log(item.Jumlah_Lowongan || 1)

  return maxJobsLog === minJobsLog
    ? 0
    : Math.min(Math.max((currentJobsLog - minJobsLog) / (maxJobsLog - minJobsLog), 0), 1)
}

function getSweetSpotColor(score: number): string {
  if (score >= 0.70) return '#10b981'
  if (score >= 0.35) return '#f59e0b'
  return '#ef4444'
}

function getSweetSpotLabel(score: number): string {
  if (score >= 0.70) return 'High Opportunity'
  if (score >= 0.35) return 'Moderate'
  return 'Low Opportunity'
}

export { getSpatialStats, getSweetSpotScore, getSweetSpotColor, getSweetSpotLabel }

function scaleValue(value: number, min: number, max: number, outputMin: number, outputMax: number) {
  return outputMin + normalize(value, min, max) * (outputMax - outputMin)
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0
  return Math.min(Math.max((value - min) / (max - min), 0), 1)
}
