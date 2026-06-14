import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  type ChartOptions,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { FeatureHeader } from "./FeatureHeader";
import type {
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from "../types/api";
import { formatRupiah } from "../utils/format";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

type FeasibilityScoreCardProps = {
  prediction: SalaryPredictionResponse;
  spatialSummary: SpatialSummaryItem[];
  onRequestAudit: (prompt: string) => void;
};

type ScoreDimension = {
  label: string;
  weight: number;
  rawScore: number; // 0-100
  weightedScore: number;
  description: string;
  statusColor: string;
};

// Haversine dipakai sebagai estimasi jarak dasar untuk skor commute DSS.
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // presisi 1 angka desimal
}

// Mengubah total skor numerik menjadi label keputusan yang lebih mudah dipahami user.
function getScoreGrade(score: number): {
  label: string;
  color: string;
  bg: string;
  description: string;
} {
  if (score >= 80)
    return {
      label: "Sangat Layak",
      color: "#16a34a",
      bg: "#dcfce7",
      description:
        "Kondisi karir, tempat tinggal, dan jarak sangat mendukung untuk posisi ini.",
    };
  if (score >= 65)
    return {
      label: "Layak",
      color: "#2563eb",
      bg: "#dbeafe",
      description:
        "Cukup seimbang secara finansial dan operasional dengan sedikit penyesuaian.",
    };
  if (score >= 50)
    return {
      label: "Cukup",
      color: "#ca8a04",
      bg: "#fef9c3",
      description:
        "Ada beberapa faktor (seperti jarak jauh atau pengeluaran kos tinggi) yang perlu dipertimbangkan.",
    };
  if (score >= 35)
    return {
      label: "Perlu Pertimbangan",
      color: "#dc2626",
      bg: "#fee2e2",
      description:
        "Kondisi kurang ideal - pertimbangkan jarak commute harian atau penawaran gaji.",
    };
  return {
    label: "Berisiko Tinggi",
    color: "#7f1d1d",
    bg: "#fef2f2",
    description:
      "Banyak faktor tidak mendukung. Disarankan mencari alternatif yang lebih dekat atau bergaji lebih tinggi.",
  };
}

// Prompt standar untuk membuka audit detail di AI Consultant.
function buildAuditPrompt(
  prediction: SalaryPredictionResponse,
  score: number,
  distance: number,
  domicile: string,
): string {
  return (
    `Tolong buat audit karir komprehensif untuk posisi ${prediction.judul} ` +
    `di ${prediction.lokasi} dengan level ${prediction.pengalaman}. ` +
    `Indeks Kelayakan DSS saya adalah ${score}/100. ` +
    `Gaji prediksi: ${formatRupiah(prediction.gaji_prediksi)}/bln, ` +
    `estimasi kos: ${formatRupiah(prediction.estimasi_kos)}/bln (rasio ${prediction.rasio_kos.toFixed(1)}%), ` +
    `multiplier kualifikasi: ${prediction.multiplier}x. ` +
    `Saya berdomisili di ${domicile} dengan perkiraan jarak commute harian ${distance} KM. ` +
    `Berikan analisis mendalam tentang: (1) kelayakan transportasi, commute, dan opsi kos/tinggal, ` +
    `(2) rekomendasi peningkatan kualifikasi profil, ` +
    `(3) strategi negosiasi gaji berdasarkan tingkat kepercayaan model (${prediction.confidence_label}), dan ` +
    `(4) langkah konkret mitigasi risiko dalam 6-12 bulan.`
  );
}

/**
 * Card Decision Support Score.
 * Menggabungkan housing, kualifikasi, commute, dan confidence menjadi skor kelayakan 0-100.
 */
export function FeasibilityScoreCard({
  prediction,
  spatialSummary,
  onRequestAudit,
}: FeasibilityScoreCardProps) {
  // State untuk domisili asal, default disamakan dengan lokasi kerja
  const [domicile, setDomicile] = useState(prediction.lokasi);

  // 1. Keterjangkauan Hunian (35%)
  const ratio = prediction.rasio_kos;
  let affordScore = 100;
  if (ratio > 65) affordScore = 5;
  else if (ratio > 50) affordScore = 25;
  else if (ratio > 35) affordScore = 50;
  else if (ratio > 25) affordScore = 75;

  // 2. Daya Saing Kualifikasi (30%)
  const mult = prediction.multiplier;
  const competeScore = Math.min(
    100,
    Math.max(0, Math.round(((mult - 0.6) / (1.8 - 0.6)) * 100)),
  );

  // Ambil data koordinat kerja (tujuan) dan domisili (asal) untuk Commute (20%)
  const destItem = useMemo(() => {
    return spatialSummary.find(
      (s) => s.Lokasi_Clean.toLowerCase() === prediction.lokasi.toLowerCase(),
    );
  }, [spatialSummary, prediction.lokasi]);

  const originItem = useMemo(() => {
    return spatialSummary.find(
      (s) => s.Lokasi_Clean.toLowerCase() === domicile.toLowerCase(),
    );
  }, [spatialSummary, domicile]);

  const distance = useMemo(() => {
    if (!destItem || !originItem) return 0;
    if (destItem.Lokasi_Clean === originItem.Lokasi_Clean) return 0;
    return calculateDistance(
      originItem.lat,
      originItem.lon,
      destItem.lat,
      destItem.lon,
    );
  }, [destItem, originItem]);

  const commuteScore = useMemo(() => {
    if (distance === 0) return 100;
    if (distance < 5) return 100;
    if (distance < 15) return 85;
    if (distance < 25) return 65;
    if (distance < 40) return 40;
    return 20;
  }, [distance]);

  // 4. Kepastian Prediksi (15%)
  const confidence = prediction.confidence_label;
  const confidenceScore = useMemo(() => {
    if (confidence === "Tinggi") return 100;
    if (confidence === "Sedang") return 70;
    return 40;
  }, [confidence]);

  // Bangun array dimensi dengan bobot baru
  const dimensions: ScoreDimension[] = useMemo(() => {
    return [
      {
        label: "Keterjangkauan Hunian",
        weight: 35,
        rawScore: affordScore,
        weightedScore: Math.round((affordScore * 35) / 100),
        description: `Rasio kos ${ratio.toFixed(1)}% dari gaji. Estimasi kos ${formatRupiah(prediction.estimasi_kos)}/bln.`,
        statusColor:
          affordScore >= 75
            ? "#16a34a"
            : affordScore >= 50
              ? "#ca8a04"
              : "#dc2626",
      },
      {
        label: "Daya Saing Kualifikasi",
        weight: 30,
        rawScore: competeScore,
        weightedScore: Math.round((competeScore * 30) / 100),
        description: `Multiplier kualifikasi Anda: ${mult.toFixed(2)}x (berdasarkan pendidikan, pengalaman, & sertifikasi).`,
        statusColor:
          competeScore >= 70
            ? "#16a34a"
            : competeScore >= 40
              ? "#ca8a04"
              : "#dc2626",
      },
      {
        label: "Kelayakan Commute",
        weight: 20,
        rawScore: commuteScore,
        weightedScore: Math.round((commuteScore * 20) / 100),
        description:
          distance === 0
            ? `Domisili sama dengan lokasi kerja (${prediction.lokasi}). Jarak 0 km.`
            : `Jarak commute harian sekitar ${distance} km dari ${domicile} ke ${prediction.lokasi}.`,
        statusColor:
          commuteScore >= 80
            ? "#16a34a"
            : commuteScore >= 50
              ? "#ca8a04"
              : "#dc2626",
      },
      {
        label: "Kepastian Prediksi Gaji",
        weight: 15,
        rawScore: confidenceScore,
        weightedScore: Math.round((confidenceScore * 15) / 100),
        description: `Tingkat kepastian gaji: ${confidence}. Risiko meleset di lapangan ${confidence === "Tinggi" ? "rendah" : confidence === "Sedang" ? "sedang" : "tinggi"}.`,
        statusColor:
          confidenceScore >= 80
            ? "#16a34a"
            : confidenceScore >= 60
              ? "#ca8a04"
              : "#dc2626",
      },
    ];
  }, [
    affordScore,
    ratio,
    prediction.estimasi_kos,
    competeScore,
    mult,
    commuteScore,
    distance,
    domicile,
    prediction.lokasi,
    confidenceScore,
    confidence,
  ]);

  const total = useMemo(() => {
    return dimensions.reduce((sum, d) => sum + d.weightedScore, 0);
  }, [dimensions]);

  const grade = getScoreGrade(total);
  const auditPrompt = buildAuditPrompt(prediction, total, distance, domicile);

  // Data donut utama untuk menampilkan total skor DSS.
  const donutData = {
    datasets: [
      {
        data: [total, 100 - total],
        backgroundColor: [grade.color, "#F3F0EE"],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  };
  const donutOptions: ChartOptions<"doughnut"> = {
    cutout: "78%",
    animation: { duration: 900, easing: "easeOutQuart" as const },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] md:rounded-[32px]">
      {/* Header band */}
      <div className="border-b border-[#E4E2DC] px-5 pb-5 pt-5 md:px-7 md:pb-6 md:pt-7">
        <FeatureHeader title="Indeks Kelayakan DSS" />
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[#141413]">
          Decision Support Score
        </h3>
        <p className="mt-1 text-sm text-[#696969]">
          Dihasilkan secara dinamis berdasarkan: hunian, kualifikasi profil,
          jarak tempuh commute, dan reliabilitas data.
        </p>
      </div>

      <div className="p-5 md:p-7">
        {/* Score + Donut row */}
        <div className="flex flex-col gap-5 border-b border-[#E4E2DC] pb-6 sm:flex-row sm:items-center sm:gap-8">
          {/* Chart.js Doughnut */}
          <div
            className="relative shrink-0 self-center sm:self-auto"
            style={{ width: 110, height: 110 }}
          >
            <Doughnut data={donutData} options={donutOptions} />
            {/* Center overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-2xl font-bold tracking-tight"
                style={{ color: grade.color }}
              >
                {total}
              </span>
              <span className="text-[10px] font-semibold text-[#696969]">
                / 100
              </span>
            </div>
          </div>

          {/* Grade text */}
          <div className="flex-1">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold animate-pulse"
              style={{ backgroundColor: grade.bg, color: grade.color }}
            >
              {grade.label}
            </span>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              {grade.description}
            </p>

            {/* Trigger AI audit button */}
            <button
              type="button"
              onClick={() => onRequestAudit(auditPrompt)}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#141413] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#AA3700] active:scale-95 sm:w-auto"
            >
              <span>AI</span>
              <span>Minta Audit Detail dari AI</span>
            </button>
          </div>
        </div>

        {/* Input panel untuk pemilihan domisili (Commute parameter control) */}
        <div className="mt-6">
          <div className="flex flex-col gap-2 rounded-2xl bg-[#F9F8F6] p-4 border border-[#E4E2DC] transition-all hover:border-[#A0A09A]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="domicile-select"
                className="text-xs font-bold uppercase tracking-wider text-[#696969]"
              >
                Domisili Anda (Asal)
              </label>
              <select
                id="domicile-select"
                value={domicile}
                onChange={(e) => setDomicile(e.target.value)}
                className="w-full cursor-pointer rounded-full border border-[#E5E2E0] bg-white px-3 py-2 text-xs font-semibold text-[#141413] shadow-sm outline-none transition-colors focus:border-[#141413] sm:w-auto"
              >
                {spatialSummary.map((item) => (
                  <option key={item.Lokasi_Clean} value={item.Lokasi_Clean}>
                    {item.Lokasi_Clean}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#A0A09A]">
              Pilih domisili saat ini untuk menghitung jarak & kelayakan commute
              ke {prediction.lokasi}.
            </p>
          </div>
        </div>

        {/* Dimension breakdown using interactive horizontal mini bar charts */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dimensions.map((dim) => {
            // Mini bar ini merepresentasikan kontribusi per dimensi ke skor total.
            const miniBarData = {
              labels: [""],
              datasets: [
                {
                  label: "Skor",
                  data: [dim.rawScore],
                  backgroundColor: dim.statusColor,
                  borderRadius: 6,
                  borderSkipped: false,
                },
                {
                  label: "Sisa",
                  data: [100 - dim.rawScore],
                  backgroundColor: "#E4E2DC",
                  borderRadius: 6,
                  borderSkipped: false,
                },
              ],
            };

            const miniBarOptions: ChartOptions<"bar"> = {
              indexAxis: "y" as const,
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  stacked: true,
                  display: false,
                  max: 100,
                },
                y: {
                  stacked: true,
                  display: false,
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
              },
            };

            return (
              <div
                key={dim.label}
                className="flex flex-col gap-3 rounded-2xl border border-[#E5E2E0] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[#D1CFC9]"
              >
                {/* Header: Label, Weight & Score Badge */}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#141413] truncate">
                      {dim.label}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-[#696969]">
                      <span>bobot {dim.weight}%</span>
                      <span>*</span>
                      <span>+{dim.weightedScore} DSS</span>
                    </div>
                  </div>

                  {/* Score badge */}
                  <span
                    className="text-xs font-extrabold px-2.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${dim.statusColor}18`,
                      color: dim.statusColor,
                    }}
                  >
                    {dim.rawScore}/100
                  </span>
                </div>

                {/* Chart.js Horizontal Progress Bar */}
                <div className="h-2 w-full my-1 overflow-hidden rounded-full">
                  <Bar data={miniBarData} options={miniBarOptions} />
                </div>

                {/* Description Text */}
                <p className="text-xs leading-relaxed text-[#696969] border-t border-[#F0EFEA] pt-2">
                  {dim.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Data source note */}
        <p className="mt-6 text-[11px] leading-5 text-[#A0A09A] border-t border-[#E4E2DC] pt-4">
          Skor dihitung dinamis menggunakan model spasial terintegrasi
          (formula Haversine untuk commute, regresi housing untuk kos, koreksi
          ML untuk gaji, dan probabilitas ambiguitas data).
        </p>
      </div>
    </div>
  );
}
