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
      <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-[16px] sm:rounded-full border border-[#E5E2E0] bg-white/90 px-3.5 py-2 text-[10px] font-bold text-[#555555] shadow-sm backdrop-blur-sm sm:bottom-4 sm:left-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" />
          <span>High Opportunity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
          <span>Low Opportunity</span>
        </div>
        <span className="h-3 w-px bg-[#E5E2E0] mx-0.5" />
        <span className="text-[#A0A09A] font-semibold text-[9px] uppercase tracking-wider">
          Ukuran = Jumlah Lowongan
        </span>
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
