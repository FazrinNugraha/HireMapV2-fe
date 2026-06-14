import { useEffect, useMemo, useState } from "react";
import { CommuterOptionsCard } from "../components/CommuterOptionsCard";
import { SelectField } from "../components/SelectField";
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

const ALL_INDUSTRIES = "All Industries";

type SpatialPageProps = {
  metadata: MetadataResponse | null;
  prediction: SalaryPredictionResponse | null;
};

// Halaman peta: membandingkan peluang kerja, lokasi, dan opsi komuter.
export function SpatialPage({ metadata, prediction }: SpatialPageProps) {
  const [summary, setSummary] = useState<SpatialSummaryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    prediction?.kategori ?? ALL_INDUSTRIES,
  );
  const [selectedLocation, setSelectedLocation] = useState(
    prediction?.lokasi ?? "",
  );
  const [locationDetail, setLocationDetail] =
    useState<LocationDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mengambil ringkasan semua wilayah untuk peta, ranking, dan commuter.
  useEffect(() => {
    getSpatialSummary()
      .then((data) => {
        setSummary(data);
        setSelectedLocation((current) => current || data[0]?.Lokasi_Clean || "");
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil data spasial.",
        );
      });
  }, []);

  // Jika user sudah punya prediksi, filter peta mengikuti kategori dan lokasi kerja.
  useEffect(() => {
    if (prediction) {
      setSelectedCategory(prediction.kategori);
      setSelectedLocation(prediction.lokasi);
    }
  }, [prediction]);

  // Mengambil detail wilayah setiap kategori atau lokasi berubah.
  useEffect(() => {
    if (!selectedLocation) return;

    setIsDetailLoading(true);
    getLocationDetail(selectedLocation, selectedCategory)
      .then(setLocationDetail)
      .catch(() => setLocationDetail(null))
      .finally(() => setIsDetailLoading(false));
  }, [selectedLocation, selectedCategory]);

  const stats = useMemo(() => getSpatialStats(summary), [summary]);
  const locationOptions = useMemo(
    () => summary.map((item) => item.Lokasi_Clean),
    [summary],
  );

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
      <SpatialHeader />

      <SpatialFilterBar
        categories={metadata?.categories ?? []}
        locations={locationOptions}
        selectedCategory={selectedCategory}
        selectedLocation={selectedLocation}
        onCategoryChange={setSelectedCategory}
        onLocationChange={setSelectedLocation}
      />

      {error && <SpatialErrorBanner message={error} />}

      <SpatialMapSection
        summary={summary}
        selectedLocation={selectedSummaryItem?.Lokasi_Clean ?? selectedLocation}
        locationDetail={locationDetail}
        selectedCategory={selectedCategory}
        sweetColor={sweetColor}
        sweetLabel={sweetLabel}
        isDetailLoading={isDetailLoading}
        onSelectLocation={setSelectedLocation}
      />

      {prediction && (
        <section>
          <CommuterOptionsCard
            prediction={prediction}
            spatialSummary={summary}
          />
        </section>
      )}

      <RegionalRankingTable summary={summary} stats={stats} />
    </main>
  );
}

// Header halaman Spatial Map.
function SpatialHeader() {
  return (
    <section className="max-w-2xl">
      <h1 className="text-4xl font-semibold tracking-[-0.02em] text-[#141413] md:text-5xl">
        Spatial Career Map
      </h1>
      <p className="mt-3 text-lg leading-8 text-[#696969]">
        Bandingkan peluang kerja dan biaya hidup di seluruh Jabodetabek.
      </p>
    </section>
  );
}

// Filter utama untuk mengubah kategori industri dan wilayah di peta.
function SpatialFilterBar({
  categories,
  locations,
  selectedCategory,
  selectedLocation,
  onCategoryChange,
  onLocationChange,
}: {
  categories: string[];
  locations: string[];
  selectedCategory: string;
  selectedLocation: string;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}) {
  return (
    <div className="flex w-fit max-w-full flex-wrap items-center gap-3 rounded-[40px] border border-[#E5E2E0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <SelectField
        value={selectedCategory}
        options={[ALL_INDUSTRIES, ...categories]}
        onChange={onCategoryChange}
        variant="pill"
      />

      <div className="hidden h-6 w-px bg-[#E5E2E0] sm:block" />

      <SelectField
        value={selectedLocation}
        options={locations}
        onChange={onLocationChange}
        variant="pill"
      />
    </div>
  );
}

// Pesan error fetch data spasial.
function SpatialErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-[20px] border border-[#CF4500]/20 bg-white px-5 py-3 text-sm text-[#9A3A0A]">
      ! {message}
    </div>
  );
}

// Grid utama: peta interaktif di kiri, detail lokasi di kanan.
function SpatialMapSection({
  summary,
  selectedLocation,
  locationDetail,
  selectedCategory,
  sweetColor,
  sweetLabel,
  isDetailLoading,
  onSelectLocation,
}: {
  summary: SpatialSummaryItem[];
  selectedLocation: string;
  locationDetail: LocationDetailResponse | null;
  selectedCategory: string;
  sweetColor: string;
  sweetLabel: string;
  isDetailLoading: boolean;
  onSelectLocation: (location: string) => void;
}) {
  return (
    <section className="grid min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SpatialLeafletMap
          data={summary}
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
        />
      </div>

      <aside className="flex h-[560px] flex-col lg:col-span-4">
        <div className="flex h-full flex-col rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <LocationDetailPanel
            detail={locationDetail}
            selectedCategory={selectedCategory}
            sweetColor={sweetColor}
            sweetLabel={sweetLabel}
            isLoading={isDetailLoading}
          />
        </div>
      </aside>
    </section>
  );
}

// Memilih isi sidebar: skeleton, detail lokasi, atau instruksi kosong.
function LocationDetailPanel({
  detail,
  selectedCategory,
  sweetColor,
  sweetLabel,
  isLoading,
}: {
  detail: LocationDetailResponse | null;
  selectedCategory: string;
  sweetColor: string;
  sweetLabel: string;
  isLoading: boolean;
}) {
  if (isLoading) return <LocationDetailSkeleton />;

  if (!detail) {
    return (
      <p className="text-sm text-[#696969]">
        Pilih lokasi di peta atau dropdown.
      </p>
    );
  }

  return (
    <div
      key={detail.lokasi}
      className="flex h-full flex-1 flex-col animate-fade-slide-down"
    >
      <LocationDetailCard
        detail={detail}
        selectedCategory={selectedCategory}
        sweetColor={sweetColor}
        sweetLabel={sweetLabel}
      />
    </div>
  );
}

// Skeleton saat detail lokasi sedang dimuat.
function LocationDetailSkeleton() {
  return (
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
  );
}

// Card detail lokasi terpilih: lowongan, kos, industri, dan top demand.
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
          <span className="text-sm leading-none">&gt;</span>
        </div>
      </div>

      <div className="flex flex-col gap-0">
        <SidebarMetric
          label="Total Lowongan Wilayah"
          value={detail.total_jobs.toLocaleString("id-ID")}
        />
        {detail.category_jobs !== null &&
          selectedCategory !== ALL_INDUSTRIES && (
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
            selectedCategory === ALL_INDUSTRIES
              ? "Semua Industri"
              : selectedCategory
          }
        />
      </div>

      {detail.top_categories.length > 0 && (
        <TopDemandChips categories={detail.top_categories} color={sweetColor} />
      )}
    </>
  );
}

// Chips industri teratas pada wilayah terpilih.
function TopDemandChips({
  categories,
  color,
}: {
  categories: string[];
  color: string;
}) {
  return (
    <div className="mt-auto pt-6">
      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
        Top Demand
      </h4>
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <span
            key={category}
            className="rounded-full px-3 py-1.5 text-xs font-semibold"
            style={
              index === 0
                ? { backgroundColor: `${color}15`, color }
                : { backgroundColor: "#EFEEE7", color: "#555555" }
            }
          >
            {category.length > 18 ? category.split(" ")[0] : category}
          </span>
        ))}
      </div>
    </div>
  );
}

// Satu bar metrik di sidebar detail lokasi.
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
        className={`max-w-[180px] text-right text-sm font-semibold ${
          highlight ? "text-[#141413]" : "text-[#555555]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// Tabel ranking wilayah berdasarkan jumlah lowongan dan estimasi kos.
function RegionalRankingTable({
  summary,
  stats,
}: {
  summary: SpatialSummaryItem[];
  stats: ReturnType<typeof getSpatialStats>;
}) {
  return (
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
              <th className="w-16 border-b border-[#E5E2E0] py-4 pl-8 pr-4 text-center">
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
            {summary.map((item, index) => {
              const score = getSweetSpotScore(item, stats);
              const color = getSweetSpotColor(score);
              const label = getSweetSpotLabel(score);

              return (
                <tr
                  className="border-b border-[#E5E2E0] transition-colors last:border-none hover:bg-[#F3F0EE]/30"
                  key={item.Lokasi_Clean}
                >
                  <td className="py-4 pl-8 pr-4 text-center font-bold text-[#696969]">
                    {index + 1}
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
  );
}
