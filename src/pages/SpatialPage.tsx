import { useEffect, useMemo, useState } from "react";
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
  onGoToSalary: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
};

// Halaman peta: membandingkan peluang kerja, lokasi, dan opsi komuter.
export function SpatialPage({ metadata, prediction, onGoToSalary, onPrevStep, onNextStep }: SpatialPageProps) {
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
    <main className="page-shell flex flex-col gap-6 md:gap-8">
      <SpatialHeader onPrevStep={onPrevStep} onNextStep={onNextStep} isNextDisabled={!prediction} />

      {!prediction && (
        <div className="rounded-[24px] border border-[#E5E2E0] bg-white p-5 text-xs text-[#696969] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm md:rounded-[32px] md:p-6">
          <span>Isi data karir di menu Salary Prediction untuk mempersonalisasi peta ini ke profil Anda.</span>
          <button
            type="button"
            onClick={onGoToSalary}
            className="cursor-pointer text-xs font-bold text-[#F37338] hover:text-[#CF4500] transition-colors self-start sm:self-auto shrink-0"
          >
            Mulai Prediksi &rarr;
          </button>
        </div>
      )}

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

      <RegionalRankingTable summary={summary} stats={stats} />
    </main>
  );
}

// Header halaman Spatial Map.
function SpatialHeader({
  onPrevStep,
  onNextStep,
  isNextDisabled,
}: {
  onPrevStep: () => void;
  onNextStep: () => void;
  isNextDisabled: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="page-title">
          Spatial Career Map
        </h1>
        <p className="page-description">
          Bandingkan peluang kerja dan biaya hidup di seluruh Jabodetabek.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
        <button
          type="button"
          onClick={onPrevStep}
          className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#E5E2E0] bg-white px-4 py-2 text-xs font-bold text-[#696969] hover:text-[#141413] transition-all active:scale-95"
        >
          &lt; Sebelumnya
        </button>
        <button
          type="button"
          onClick={onNextStep}
          disabled={isNextDisabled}
          className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-[#141413] hover:bg-[#F37338] px-5 py-2 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#141413]"
        >
          Selanjutnya &gt;
        </button>
      </div>
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
    <div className="grid w-full gap-2 rounded-[24px] border border-[#E5E2E0] bg-white p-2 shadow-[0_4px_20px_rgba(0,0,0,0.05)] sm:w-fit sm:max-w-full sm:grid-flow-col sm:auto-cols-max sm:items-center sm:gap-3 sm:rounded-[40px] sm:p-3">
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
    <section className="grid grid-cols-1 gap-5 lg:min-h-[600px] lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-8">
        <SpatialLeafletMap
          data={summary}
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
        />
      </div>

      <aside className="flex min-h-[360px] flex-col lg:col-span-4 lg:h-[560px]">
        <div className="flex h-full flex-col rounded-[24px] border border-[#E5E2E0] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:rounded-[32px] md:p-7">
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
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedSummary = isExpanded ? summary : summary.slice(0, 3);

  return (
    <section className="overflow-hidden rounded-[32px] border border-[#E5E2E0] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between border-b border-[#E5E2E0] p-6 md:p-8">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#141413]">
            Regional Ranking
          </h2>
          <p className="mt-1 text-xs text-[#696969]">
            Peringkat wilayah berdasarkan peluang kerja dan keterjangkauan hunian.
          </p>
        </div>
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
            {displayedSummary.map((item, index) => {
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

      {summary.length > 3 && (
        <div className="border-t border-[#E5E2E0] bg-[#FCFBFA] p-4 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#E5E2E0] bg-white px-5 py-2 text-xs font-bold text-[#141413] shadow-sm transition-all hover:border-[#141413] hover:bg-[#FCFBFA] active:scale-95"
          >
            <span>
              {isExpanded
                ? "Tampilkan Lebih Sedikit"
                : `Tampilkan Semua (${summary.length} Wilayah)`}
            </span>
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
