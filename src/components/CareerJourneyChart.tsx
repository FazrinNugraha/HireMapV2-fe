import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { FeatureHeader } from "./FeatureHeader";
import type { SalaryPredictionResponse } from "../types/api";
import { formatRupiah } from "../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

type JourneyStep = {
  key: string;
  label: string;
  sublabel: string;
  salary: number;
  growthPct: number | null; // % vs previous step
  isActive: boolean;
};

function buildJourneySteps(
  prediction: SalaryPredictionResponse,
): JourneyStep[] {
  const activeLabel = prediction.pengalaman.toLowerCase();
  const referenceBase = prediction.gaji_prediksi / prediction.m_pengalaman;

  const MULTIPLIERS: Record<string, number> = {
    fresh: 0.8,
    junior: 0.95,
    mid: 1.1,
    senior: 1.3,
  };
  const META = [
    { key: "fresh", label: "Entry-Level", sublabel: "< 1 tahun" },
    { key: "junior", label: "Junior", sublabel: "1–3 tahun" },
    { key: "mid", label: "Mid-Level", sublabel: "3–7 tahun" },
    { key: "senior", label: "Senior", sublabel: "7+ tahun" },
  ];

  function matchActive(key: string): boolean {
    if (
      key === "fresh" &&
      (activeLabel.includes("entry") || activeLabel.includes("< 1"))
    )
      return true;
    if (key === "junior" && activeLabel.includes("junior")) return true;
    if (
      key === "mid" &&
      (activeLabel.includes("mid") || activeLabel.includes("staff"))
    )
      return true;
    if (key === "senior" && activeLabel.includes("senior")) return true;
    return false;
  }

  const hasMatch = META.some((m) => matchActive(m.key));
  const salaries = META.map((m) =>
    Math.round(referenceBase * MULTIPLIERS[m.key]),
  );

  return META.map((m, i) => {
    let active = matchActive(m.key);
    if (!hasMatch) {
      const closest = Object.entries(MULTIPLIERS).reduce(
        (acc, [k, v]) =>
          Math.abs(v - prediction.m_pengalaman) <
          Math.abs(MULTIPLIERS[acc] - prediction.m_pengalaman)
            ? k
            : acc,
        "fresh",
      );
      active = m.key === closest;
    }
    const prev = i > 0 ? salaries[i - 1] : null;
    const growthPct = prev
      ? parseFloat((((salaries[i] - prev) / prev) * 100).toFixed(1))
      : null;
    return { ...m, salary: salaries[i], growthPct, isActive: active };
  });
}

// ── Design tokens ──────────────────────────────────────────────────────────
const INK = "#141413";
const ORANGE = "#F37338";
const GRID_COLOR = "rgba(0,0,0,0.06)";

/**
 * Visualisasi proyeksi karir.
 * Menggunakan multiplier pengalaman untuk mensimulasikan gaji dari Entry-Level sampai Senior.
 */
export function CareerJourneyChart({
  prediction,
}: {
  prediction: SalaryPredictionResponse;
}) {
  const steps = buildJourneySteps(prediction);
  const activeIndex = steps.findIndex((s) => s.isActive);
  const salaries = steps.map((s) => s.salary);
  const maxSalary = Math.max(...salaries);
  const minSalary = Math.min(...salaries);
  const pad = (maxSalary - minSalary) * 0.45;

  // Total salary growth fresh → senior
  const totalGrowth = (
    ((steps[3].salary - steps[0].salary) / steps[0].salary) *
    100
  ).toFixed(1);

  // ── Chart.js data ───────────────────────────────────────────────────────
  const pointBg = steps.map((s) => (s.isActive ? ORANGE : "white"));
  const pointBorder = steps.map((s) => (s.isActive ? ORANGE : "#B0ADA7"));
  const pointR = steps.map((s) => (s.isActive ? 9 : 5));
  const pointHover = steps.map((s) => (s.isActive ? 11 : 7));

  const chartData = {
    labels: steps.map((s) => s.label),
    datasets: [
      {
        label: "Estimasi Gaji",
        data: salaries,
        fill: true,
        tension: 0.42,
        borderColor: ORANGE,
        borderWidth: 2.5,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: canvas, chartArea } = ctx.chart;
          if (!chartArea) return "transparent";
          const g = canvas.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          g.addColorStop(0, "rgba(243,115,56,0.15)");
          g.addColorStop(0.7, "rgba(243,115,56,0.04)");
          g.addColorStop(1, "rgba(243,115,56,0)");
          return g;
        },
        pointBackgroundColor: pointBg,
        pointBorderColor: pointBorder,
        pointBorderWidth: 2,
        pointRadius: pointR,
        pointHoverRadius: pointHover,
        pointHoverBackgroundColor: ORANGE,
        pointHoverBorderColor: "white",
        pointHoverBorderWidth: 2.5,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: "easeOutQuart" },
    layout: { padding: { top: 8, right: 16, bottom: 4, left: 8 } },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: (ctx) => (ctx.index === activeIndex ? ORANGE : "#969690"),
          font: {
            family: "'Sofia Sans', Arial, sans-serif",
            size: 12,
            weight: (ctx: { index: number }) =>
              ctx.index === activeIndex ? "bold" : "normal",
          },
        },
      },
      y: {
        position: "left",
        min: Math.max(0, minSalary - pad),
        max: maxSalary + pad,
        grid: {
          color: GRID_COLOR,
          lineWidth: 1,
        },
        border: { display: false, dash: [4, 4] },
        ticks: {
          maxTicksLimit: 5,
          color: "#A0A09A",
          font: { family: "'Sofia Sans', Arial, sans-serif", size: 11 },
          callback(value) {
            const n = Number(value);
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
            return String(n);
          },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: INK,
        titleColor: "rgba(255,255,255,0.45)",
        bodyColor: "white",
        padding: { x: 14, y: 12 },
        cornerRadius: 14,
        displayColors: false,
        titleFont: {
          family: "'Sofia Sans', Arial, sans-serif",
          size: 11,
          weight: "bold",
        },
        bodyFont: {
          family: "'Sofia Sans', Arial, sans-serif",
          size: 14,
          weight: "bold",
        },
        callbacks: {
          title: (items: TooltipItem<"line">[]) =>
            steps[items[0].dataIndex].sublabel,
          label: (item: TooltipItem<"line">) =>
            `  ${formatRupiah(item.raw as number)}`,
        },
      },
    },
  };

  return (
    <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* ── KPI pill row (like the reference) ──────────────────────── */}
      <div className="border-b border-[#E4E2DC] px-8 pt-7 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <FeatureHeader title="Career Journey" />
            <h3 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-[#141413]">
              Proyeksi Perjalanan Karir
            </h3>
          </div>

          {/* Legend pill */}
          <div className="flex items-center gap-2 rounded-full border border-[#E4E2DC] px-4 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F37338]" />
            <span className="text-xs font-semibold text-[#696969]">
              Estimasi Gaji
            </span>
          </div>
        </div>

        {/* 4 KPI mini-cards */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`flex flex-col gap-1 rounded-[20px] border px-5 py-4 transition-all ${
                step.isActive
                  ? "border-[#F37338]/30 bg-[#FFF4EE] shadow-[0_0_0_1.5px_#F37338]"
                  : "border-[#E4E2DC] bg-white hover:bg-[#FAFAF8]"
              }`}
            >
              <span className="text-[11px] font-semibold text-[#969690]">
                {step.label}
                {step.isActive && (
                  <span className="ml-2 inline-block rounded-full bg-[#F37338] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-white">
                    Posisi Anda
                  </span>
                )}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight text-[#141413]">
                  {formatRupiah(step.salary)}
                </span>
                {step.growthPct !== null && (
                  <span className="text-[11px] font-bold text-[#16a34a]">
                    +{step.growthPct}%
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#B0ADA7]">
                {step.sublabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chart area ──────────────────────────────────────────────── */}
      <div className="px-6 pb-6 pt-5 bg-white">
        {/* Subtitle row */}
        <p className="mb-4 text-base leading-7 text-[#696969]">
          Estimasi gaji{" "}
          <strong className="text-[#141413]">{prediction.judul}</strong> di{" "}
          <strong className="text-[#141413]">{prediction.lokasi}</strong> —
          potensi kenaikan total{" "}
          <strong className="text-[#F37338]">+{totalGrowth}%</strong> dari
          Entry-Level ke Senior.
        </p>

        {/* Chart.js Line */}
        <div style={{ height: "240px" }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
