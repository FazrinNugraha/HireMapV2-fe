import { useEffect, useMemo, useState } from "react";
import {
  SpatialLeafletMap,
  getSpatialStats,
  getSweetSpotColor,
  getSweetSpotLabel,
  getSweetSpotScore,
} from "../components/map/SpatialLeafletMap";
import { getLocationDetail, getSpatialSummary } from "../services/api";
import type {
  LocationDetailResponse,
  MetadataResponse,
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";
import { formatRupiah } from "../utils/format";
import { SelectField } from "../components/SelectField";

type SpatialPageProps = {
  metadata: MetadataResponse | null;
  prediction: SalaryPredictionResponse | null;
};

export function SpatialPage({ metadata, prediction }: SpatialPageProps) {
  const [summary, setSummary] = useState<SpatialSummaryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    prediction?.kategori ?? "All Industries",
  );
  const [selectedLocation, setSelectedLocation] = useState(
    prediction?.lokasi ?? "",
  );
  const [locationDetail, setLocationDetail] =
    useState<LocationDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Load summary data ─── */
  useEffect(() => {
    getSpatialSummary()
      .then((data) => {
        setSummary(data);
        // Default ke lokasi pertama (most jobs) kalau belum ada prediksi
        if (!selectedLocation && data.length > 0) {
          setSelectedLocation(data[0].Lokasi_Clean);
        }
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data spasial.",
        );
      });
  }, []);

  /* ─── Sync prediction ke filter ─── */
  useEffect(() => {
    if (prediction) {
      setSelectedCategory(prediction.kategori);
      setSelectedLocation(prediction.lokasi);
    }
  }, [prediction]);

  /* ─── Fetch location detail setiap ganti lokasi atau kategori ─── */
  useEffect(() => {
    if (!selectedLocation) return;
    setIsDetailLoading(true);
    getLocationDetail(selectedLocation, selectedCategory)
      .then(setLocationDetail)
      .catch(() => setLocationDetail(null))
      .finally(() => setIsDetailLoading(false));
  }, [selectedLocation, selectedCategory]);

  /* ─── Derived stats ─── */
  const stats = useMemo(() => getSpatialStats(summary), [summary]);

  // Removed unused bestOpportunity and lowestKos definitions

  const selectedSummaryItem = useMemo(
    () =>
      summary.find((item) => item.Lokasi_Clean === selectedLocation) ??
      summary[0],
    [selectedLocation, summary],
  );

  const sweetSpotScore = selectedSummaryItem
    ? getSweetSpotScore(selectedSummaryItem, stats)
    : 0;

  const sweetColor = getSweetSpotColor(sweetSpotScore);
  const sweetLabel = getSweetSpotLabel(sweetSpotScore);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-5 py-10 md:px-10">
      {/* ── Page header ── */}
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#141413] md:text-5xl">
          Spatial Career Map
        </h1>
        <p className="mt-3 text-lg leading-8 text-[#696969]">
          Bandingkan peluang kerja dan biaya hidup di seluruh Jabodetabek.
        </p>
      </section>

      {/* ── Filter bar ── */}
      <div className="flex w-fit max-w-full flex-wrap items-center gap-3 rounded-[40px] border border-[#E5E2E0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <SelectField
          value={selectedCategory}
          options={["All Industries", ...(metadata?.categories ?? [])]}
          onChange={setSelectedCategory}
          variant="pill"
        />

        <div className="hidden h-6 w-px bg-[#E5E2E0] sm:block" />

        <SelectField
          value={selectedLocation}
          options={summary.map((item) => item.Lokasi_Clean)}
          onChange={setSelectedLocation}
          variant="pill"
        />
      </div>

      {error && (
        <div className="rounded-[20px] border border-[#CF4500]/20 bg-white px-5 py-3 text-sm text-[#9A3A0A]">
          ⚠ {error}
        </div>
      )}

      {/* ── Main grid: Map + Sidebar ── */}
      <section className="grid min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Map */}
        <div className="lg:col-span-8">
          <SpatialLeafletMap
            data={summary}
            selectedLocation={
              selectedSummaryItem?.Lokasi_Clean ?? selectedLocation
            }
            onSelectLocation={setSelectedLocation}
          />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col lg:col-span-4 h-[560px]">
          {/* Location detail card */}
          <div className="flex h-full flex-col rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            {isDetailLoading ? (
              <div className="flex flex-1 flex-col gap-4">
                <div className="h-4 w-2/3 rounded-full shimmer" />
                <div className="h-3 w-1/3 rounded-full shimmer" />
                <div className="mt-4 flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between border-b border-[#E5E2E0] pb-3"
                    >
                      <div className="h-3 w-1/3 rounded-full shimmer" />
                      <div className="h-3 w-1/4 rounded-full shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            ) : locationDetail ? (
              <div
                key={locationDetail.lokasi}
                className="flex flex-1 flex-col animate-fade-slide-down h-full"
              >
                <LocationDetailCard
                  detail={locationDetail}
                  selectedCategory={selectedCategory}
                  sweetColor={sweetColor}
                  sweetLabel={sweetLabel}
                />
              </div>
            ) : (
              <p className="text-sm text-[#696969]">
                Pilih lokasi di peta atau dropdown.
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* ── Regional Ranking table ── */}
      <section className="overflow-hidden rounded-[32px] border border-[#E5E2E0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#E5E2E0] p-6 md:p-8">
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#141413]">
            Regional Ranking
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#F3F0EE] text-xs font-bold uppercase tracking-wider text-[#696969]">
                <th className="border-b border-[#E5E2E0] py-4 pl-8 pr-4 text-center w-16">
                  Rank
                </th>
                <th className="border-b border-[#E5E2E0] p-4">Kota</th>
                <th className="border-b border-[#E5E2E0] p-4">Lowongan</th>
                <th className="border-b border-[#E5E2E0] p-4">
                  Est. Kos / bulan
                </th>
                <th className="border-b border-[#E5E2E0] py-4 pl-4 pr-8">
                  Job Opportunity
                </th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#141413]">
              {summary.map((item, i) => {
                const score = getSweetSpotScore(item, stats);
                const color = getSweetSpotColor(score);
                const label = getSweetSpotLabel(score);

                return (
                  <tr
                    className="border-b border-[#E5E2E0] last:border-none transition-colors hover:bg-[#F3F0EE]/30"
                    key={item.Lokasi_Clean}
                  >
                    <td className="py-4 pl-8 pr-4 text-center font-bold text-[#696969]">
                      {i + 1}
                    </td>
                    <td className="p-4 font-semibold">{item.Lokasi_Clean}</td>
                    <td className="p-4 font-bold">
                      {item.Jumlah_Lowongan.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-[#555555]">
                      {formatRupiah(item.Harga_Kos_Estimasi)}
                    </td>
                    <td className="py-4 pl-4 pr-8">
                      <span
                        className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function LocationDetailCard({
  detail,
  selectedCategory,
  sweetColor,
  sweetLabel,
}: {
  detail: LocationDetailResponse;
  selectedCategory: string;
  sweetColor: string;
  sweetLabel: string;
}) {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#141413]">
            {detail.lokasi}
          </h2>
          <div className="mt-1.5">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${sweetColor}15`, color: sweetColor }}
            >
              {sweetLabel} Candidate
            </span>
          </div>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2"
          style={{ borderColor: sweetColor, color: sweetColor }}
        >
          <span className="text-sm leading-none">→</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-0">
        <SidebarMetric
          label="Total Lowongan Wilayah"
          value={detail.total_jobs.toLocaleString("id-ID")}
        />
        {detail.category_jobs !== null &&
          selectedCategory !== "All Industries" && (
            <SidebarMetric
              label="Lowongan Industri Terpilih"
              value={detail.category_jobs.toLocaleString("id-ID")}
              highlight
            />
          )}
        <SidebarMetric
          label="Est. Kos / bulan"
          value={formatRupiah(detail.kos_estimasi)}
        />
        <SidebarMetric
          label="Industri Dipilih"
          value={
            selectedCategory === "All Industries"
              ? "Semua Industri"
              : selectedCategory
          }
        />
      </div>

      {/* Top Demand chips */}
      {detail.top_categories.length > 0 && (
        <div className="mt-auto pt-6">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
            Top Demand
          </h4>
          <div className="flex flex-wrap gap-2">
            {detail.top_categories.map((cat, i) => (
              <span
                key={cat}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={
                  i === 0
                    ? { backgroundColor: `${sweetColor}15`, color: sweetColor }
                    : { backgroundColor: "#EFEEE7", color: "#555555" }
                }
              >
                {/* Shorten long category names */}
                {cat.length > 18 ? cat.split(" ")[0] : cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function SidebarMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-[#E5E2E0] py-3.5">
      <span className="text-sm text-[#696969]">{label}</span>
      <span
        className={`max-w-[180px] text-right text-sm font-semibold ${highlight ? "text-[#141413]" : "text-[#555555]"}`}
      >
        {value}
      </span>
    </div>
  );
}
