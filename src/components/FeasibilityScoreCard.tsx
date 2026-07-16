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

/** Tipe data yang disimpan oleh CommuterOptionsCard ke localStorage. */
type LastCommuteSnapshot = {
  origin: string;
  destination: string;
  distance: number;  // km
  duration: number;  // menit
  mode: string;      // "motor" | "car" | "krl"
};

const COMMUTE_STORAGE_KEY = "hiremap_last_commute";

function readLastCommute(): LastCommuteSnapshot | null {
  try {
    const raw = localStorage.getItem(COMMUTE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastCommuteSnapshot) : null;
  } catch {
    return null;
  }
}

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

// Prompt audit spesifik per aspek kelayakan DSS.
function buildDimensionAuditPrompt(
  prediction: SalaryPredictionResponse,
  dimLabel: string,
  rawScore: number,
  dimDesc: string
): string {
  return (
    `Tolong buat analisis audit spesifik yang berfokus pada aspek "${dimLabel}" ` +
    `untuk posisi ${prediction.judul} di ${prediction.lokasi}. ` +
    `Skor kelayakan saya pada aspek ini adalah ${rawScore}/100. ` +
    `Keterangan detail: ${dimDesc}. ` +
    `Berikan analisis hambatan, peluang peningkatan, serta rekomendasi taktis yang relevan.`
  );
}

// Helper untuk ikon SVG dimensi
function getDimensionIcon(label: string) {
  switch (label) {
    case "Keterjangkauan Hunian":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case "Daya Saing Kualifikasi":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    case "Kelayakan Commute":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "Kepastian Prediksi Gaji":
      return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Card Decision Support Score.
 * Menggabungkan housing, kualifikasi, commute, dan confidence menjadi skor kelayakan 0-100.
 */
export function FeasibilityScoreCard({
  prediction,
  spatialSummary: _spatialSummary,
  onRequestAudit,
}: FeasibilityScoreCardProps) {
  // Baca snapshot simulasi commute terakhir dari localStorage.
  // Diisi oleh CommuterOptionsCard setiap kali user mengubah pilihan di simulator.
  const lastCommute = useMemo(() => readLastCommute(), []);
  
  // State untuk filter kategori status dimensi
  const [statusFilter, setStatusFilter] = useState<"all" | "layak" | "cukup" | "evaluasi">("all");

  // Gunakan jarak dari simulasi nyata; 50 (netral) jika belum pernah simulasi.
  const distance = lastCommute?.distance ?? null;
  const domicile = lastCommute?.origin ?? null;

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

  // 3. Kelayakan Commute (20%) — dari hasil simulasi TomTom/KRL di CommuterOptionsCard.
  const commuteScore = useMemo(() => {
    if (distance === null) return 50; // belum pernah simulasi → skor netral
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
          distance === null
            ? "Belum ada data simulasi. Jalankan Commuter Simulator terlebih dulu."
            : distance < 5
              ? `Sangat dekat — ${distance} km dari ${domicile} ke ${prediction.lokasi} (via ${lastCommute?.mode ?? "-"}).`
              : `Jarak commute harian ${distance} km dari ${domicile} ke ${prediction.lokasi} (via ${lastCommute?.mode ?? "-"}, ~${lastCommute?.duration ?? "?"} menit).`,
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
    lastCommute,
    prediction.lokasi,
    confidenceScore,
    confidence,
  ]);

  // Filter dimensi berdasarkan status filter yang dipilih
  const filteredDimensions = useMemo(() => {
    return dimensions.filter((dim) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "layak") return dim.rawScore >= 70;
      if (statusFilter === "cukup") return dim.rawScore >= 40 && dim.rawScore < 70;
      if (statusFilter === "evaluasi") return dim.rawScore < 40;
      return true;
    });
  }, [dimensions, statusFilter]);

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
          Decision Index Score
        </h3>
        <p className="mt-1 text-sm text-[#696969]">
          Dihasilkan secara dinamis berdasarkan: hunian, kualifikasi profil,
          jarak tempuh commute, dan reliabilitas data.
        </p>
      </div>

      <div className="p-5 md:p-7">
        {/* KPI Metrics Row (Ala bagian atas referensi Alerts & Triage) */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          {/* KPI 1: Rasio Kos */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E5E2E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[11px] font-bold text-[#696969] tracking-wider uppercase">Rasio Kos</p>
              <p className="text-lg font-extrabold text-[#141413] mt-1">{ratio.toFixed(1)}%</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${dimensions[0].statusColor}18`,
                color: dimensions[0].statusColor,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
          </div>

          {/* KPI 2: Multiplier Profil */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E5E2E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[11px] font-bold text-[#696969] tracking-wider uppercase">Multiplier</p>
              <p className="text-lg font-extrabold text-[#141413] mt-1">{mult.toFixed(2)}x</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${dimensions[1].statusColor}18`,
                color: dimensions[1].statusColor,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </span>
          </div>

          {/* KPI 3: Simulasi Jarak */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E5E2E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[11px] font-bold text-[#696969] tracking-wider uppercase">Jarak Commute</p>
              <p className="text-lg font-extrabold text-[#141413] mt-1">
                {distance !== null ? `${distance.toFixed(1)} km` : "-"}
              </p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: distance === null ? "#f3f0ee" : `${dimensions[2].statusColor}18`,
                color: distance === null ? "#696969" : dimensions[2].statusColor,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>

          {/* KPI 4: Kepastian Gaji */}
          <div className="flex items-center justify-between p-4 bg-white border border-[#E5E2E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
            <div>
              <p className="text-[11px] font-bold text-[#696969] tracking-wider uppercase">Kepastian Gaji</p>
              <p className="text-lg font-extrabold text-[#141413] mt-1">{confidence}</p>
            </div>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${dimensions[3].statusColor}18`,
                color: dimensions[3].statusColor,
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Score + Donut row */}
        <div className="flex flex-col gap-4 border-b border-[#E4E2DC] pb-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Chart.js Doughnut */}
          <div
            className="relative shrink-0 self-center sm:self-auto"
            style={{ width: 110, height: 110 }}
          >
            <Doughnut data={donutData} options={donutOptions} />
            {/* Center overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-2xl font-black tracking-tight leading-none"
                style={{ color: grade.color }}
              >
                {total}
              </span>
              <span className="text-[10px] font-bold text-[#696969] mt-0.5">
                / 100
              </span>
            </div>
          </div>

          {/* Grade text and action */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              {/* Status Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm"
                  style={{ backgroundColor: grade.bg, color: grade.color }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: grade.color }}
                    ></span>
                    <span
                      className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ backgroundColor: grade.color }}
                    ></span>
                  </span>
                  {grade.label}
                </span>
                <span className="text-[9px] font-bold text-[#A0A09A] uppercase tracking-wider">
                  Decision Index
                </span>
              </div>

              {/* Description */}
              <p className="text-sm font-bold text-[#141413] tracking-tight leading-snug sm:text-base">
                {grade.description}
              </p>
            </div>

            {/* Trigger AI audit button */}
            <div>
              <button
                type="button"
                onClick={() => onRequestAudit(auditPrompt)}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#141413] to-[#2D2D2A] px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all duration-300 hover:from-[#AA3700] hover:to-[#C8521A] hover:shadow-[0_6px_20px_rgba(170,55,0,0.25)] active:scale-95 sm:w-auto"
              >
                <svg
                  className="w-5 h-5 text-white animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L18 10l-4.714 1.143L11 18l-2.286-6.857L4 10l4.714-1.143L11 3z"
                  />
                </svg>
                <span>Audit Lengkap dengan AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Banner hasil simulasi commute — menggantikan dropdown domisili */}
        <div className="mt-6">
          {lastCommute ? (
            <div className="flex items-start gap-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] p-4">
              {/* Ikon centang */}
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider">Skor dari Simulasi Terakhir</span>
                <p className="text-sm font-semibold text-[#141413]">
                  {lastCommute.origin} → {lastCommute.destination}
                </p>
                <p className="text-[11px] text-[#4b7c60]">
                  {lastCommute.distance} km • ~{lastCommute.duration} menit • via {lastCommute.mode}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4">
              {/* Ikon info */}
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ca8a04]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#a16207] uppercase tracking-wider">Simulasi Belum Dijalankan</span>
                <p className="text-[11px] text-[#78580a]">
                  Buka <span className="font-bold">Commuter Simulator</span> dan pilih kota asal untuk mendapatkan skor commute yang akurat. Saat ini menggunakan skor netral (50).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filter bar (Ala filter status tab di referensi) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#E4E2DC] pt-6 mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">Filter Dimensi:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "all", label: "Semua" },
                { key: "layak", label: "Layak (≥ 70)" },
                { key: "cukup", label: "Cukup (40-69)" },
                { key: "evaluasi", label: "Perlu Evaluasi (< 40)" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setStatusFilter(btn.key as any)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all border cursor-pointer ${
                    statusFilter === btn.key
                      ? "bg-[#141413] text-white border-[#141413]"
                      : "bg-[#FCFBFA] text-[#696969] border-[#E4E2DC] hover:border-[#A0A09A]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension Breakdown ala Alerts Triage list items (Horizontal list) */}
        <div className="mt-6 flex flex-col gap-4">
          {filteredDimensions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#E4E2DC] rounded-[24px] bg-[#FCFBFA]">
              <p className="text-sm font-semibold text-[#696969]">Tidak ada aspek DSS dalam kategori filter ini.</p>
            </div>
          ) : (
            filteredDimensions.map((dim) => (
              <div
                key={dim.label}
                className="group relative overflow-hidden rounded-[20px] border border-[#E5E2E0] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)] hover:border-[#D1CFC9] flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{ borderLeft: `6px solid ${dim.statusColor}` }}
              >
                {/* Bagian kiri: Icon + Informasi utama */}
                <div className="flex-1 min-w-0 flex items-start gap-4">
                  {/* Circular Icon Container */}
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full mt-1"
                    style={{
                      backgroundColor: `${dim.statusColor}12`,
                      color: dim.statusColor,
                    }}
                  >
                    {getDimensionIcon(dim.label)}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Pill labels */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-[#F3F0EE] text-[#696969] uppercase tracking-wider">
                        Bobot {dim.weight}%
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-[#EAFDF0] text-[#15803d]">
                        +{dim.weightedScore} DSS
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                        style={{
                          backgroundColor: `${dim.statusColor}18`,
                          color: dim.statusColor,
                        }}
                      >
                        Skor: {dim.rawScore}/100
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-extrabold text-[#141413] mt-2 tracking-tight">
                      {dim.label}
                    </h4>

                    {/* Description */}
                    <p className="text-xs leading-relaxed text-[#696969] mt-1 max-w-2xl">
                      {dim.description}
                    </p>

                    {/* Horizontal Progress Bar ala SLA Response Time di referensi */}
                    <div className="w-full mt-4 max-w-md">
                      <div className="flex justify-between items-center text-[9px] text-[#A0A09A] mb-1 font-bold uppercase tracking-wider">
                        <span>Kontribusi Kelayakan</span>
                        <span>{dim.rawScore}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F3F0EE] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${dim.rawScore}%`,
                            backgroundColor: dim.statusColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian kanan: Action Button */}
                <div className="shrink-0 flex items-center justify-end mt-2 md:mt-0">
                  <button
                    type="button"
                    onClick={() => onRequestAudit(buildDimensionAuditPrompt(prediction, dim.label, dim.rawScore, dim.description))}
                    className="w-full md:w-auto cursor-pointer rounded-full border border-[#E5E2E0] bg-[#FCFBFA] hover:bg-[#141413] hover:text-white px-4 py-2 text-xs font-bold text-[#141413] transition-all duration-300 hover:shadow-sm hover:border-[#141413] active:scale-95 text-center"
                  >
                    Audit Spesifik
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Data source note */}
        <p className="mt-6 text-[11px] leading-5 text-[#A0A09A] border-t border-[#E4E2DC] pt-4">
          Skor dihitung dinamis menggunakan model spasial terintegrasi (formula
          Haversine untuk commute, regresi housing untuk kos, koreksi ML untuk
          gaji, dan probabilitas ambiguitas data).
        </p>
      </div>
    </div>
  );
}
