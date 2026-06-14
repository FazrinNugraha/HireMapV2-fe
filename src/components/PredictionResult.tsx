import {
  ArcElement,
  Chart as ChartJS,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { FeatureHeader } from "./FeatureHeader";
import type { SalaryPredictionResponse } from "../types/api";
import { formatRupiah } from "../utils/format";

ChartJS.register(ArcElement, Tooltip);

type PredictionResultProps = {
  prediction: SalaryPredictionResponse | null;
};

function getConfidenceScore(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("high") || normalized.includes("tinggi")) return 88;
  if (normalized.includes("medium") || normalized.includes("sedang")) return 68;
  if (normalized.includes("low") || normalized.includes("rendah")) return 42;
  return 60;
}

function getConfidenceStatus(score: number) {
  if (score >= 80)
    return { label: "Tinggi", color: "#10b981", bg: "#10b98115" };
  if (score >= 60)
    return { label: "Sedang", color: "#f59e0b", bg: "#f59e0b15" };
  return { label: "Rendah", color: "#ef4444", bg: "#ef444415" };
}

/**
 * Card ringkasan prediksi gaji.
 * Menampilkan nominal gaji, confidence model, dan konteks posisi/lokasi.
 */
export function PredictionResult({ prediction }: PredictionResultProps) {
  if (!prediction) return null;

  const confidenceScore = getConfidenceScore(prediction.confidence_label);
  const confidenceStatus = getConfidenceStatus(confidenceScore);
  const chartData = {
    labels: ["Confidence", "Uncertainty"],
    datasets: [
      {
        data: [confidenceScore, 100 - confidenceScore],
        backgroundColor: [confidenceStatus.color, "#EFEEE7"],
        hoverBackgroundColor: [confidenceStatus.color, "#E4E2DC"],
        borderWidth: 0,
      },
    ],
  };
  const chartOptions: ChartOptions<"doughnut"> = {
    cutout: "76%",
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#141413",
        titleFont: { family: "Sofia Sans", size: 11 },
        bodyFont: { family: "Sofia Sans", size: 11 },
        padding: 8,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            const value = Number(context.raw);
            return ` ${context.label}: ${value.toFixed(0)}%`;
          },
        },
      },
    },
  };

  return (
    <section className="flex h-full w-full flex-col justify-between rounded-[32px] border border-[#E5E2E0] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div>
        <FeatureHeader
          title="Salary Estimate"
          action={
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: confidenceStatus.bg,
                color: confidenceStatus.color,
              }}
            >
              {confidenceStatus.label} Confidence
            </span>
          }
          className="mb-4"
        />

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-3xl font-semibold tracking-[-0.02em] text-[#141413]">
              {formatRupiah(prediction.gaji_prediksi)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#696969]">
              Estimasi model berdasarkan profil pekerjaan dan faktor
              kualifikasi.
            </p>
          </div>

          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold leading-none text-[#141413]">
                {confidenceScore}%
              </span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-[#696969]">
                Trust
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-[#E5E2E0] pt-5">
        <div className="grid gap-2 text-sm text-[#555555]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
              <span>Confidence Model</span>
            </div>
            <span className="font-semibold text-[#141413]">
              {confidenceScore}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#F37338]" />
              <span>Posisi & Lokasi</span>
            </div>
            <span className="truncate text-right font-semibold text-[#141413]">
              {prediction.judul} di {prediction.lokasi}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
