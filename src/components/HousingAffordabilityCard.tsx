import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { FeatureHeader } from "./FeatureHeader";
import type { SalaryPredictionResponse } from "../types/api";
import { formatRupiah } from "../utils/format";

ChartJS.register(ArcElement, Tooltip);

type HousingAffordabilityCardProps = {
  prediction: SalaryPredictionResponse | null;
};

type HousingStatus = { label: string; color: string; bg: string };

function getHousingStatus(ratio: number): HousingStatus {
  if (ratio <= 0) return { label: "Waiting", color: "#696969", bg: "#EFEEE7" };
  if (ratio <= 30) return { label: "Ideal", color: "#10b981", bg: "#10b98115" };
  if (ratio <= 50)
    return { label: "Consider", color: "#f59e0b", bg: "#f59e0b15" };
  return { label: "Heavy Burden", color: "#ef4444", bg: "#ef444415" };
}

/**
 * Card keterjangkauan hunian.
 * Mengukur porsi estimasi kos terhadap gaji prediksi agar user tahu beban sewa bulanannya.
 */
export function HousingAffordabilityCard({
  prediction,
}: HousingAffordabilityCardProps) {
  if (!prediction) return null;

  const ratio = prediction.rasio_kos;
  const remaining = 100 - ratio;
  const status = getHousingStatus(ratio);

  const chartData = {
    labels: ["Porsi Sewa Kos", "Sisa Pendapatan"],
    datasets: [
      {
        data: [ratio, remaining],
        backgroundColor: [status.color, "#EFEEE7"],
        hoverBackgroundColor: [status.color, "#E4E2DC"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<"doughnut"> = {
    cutout: "76%",
    plugins: {
      legend: {
        display: false,
      },
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
            const val = context.raw as number;
            return ` ${context.label}: ${val.toFixed(1)}%`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <section className="flex h-full w-full flex-col justify-between rounded-[24px] border border-[#E5E2E0] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:rounded-[32px] md:p-7">
      <div>
        <FeatureHeader
          title="Biaya Hunian"
          action={
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          }
          className="mb-4"
        />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="text-sm leading-6 text-[#696969]">
              Est. Kos di {prediction.lokasi}
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-[#141413] md:text-3xl">
              {formatRupiah(prediction.estimasi_kos)}
            </div>
            <div className="mt-0.5 text-sm font-normal text-[#696969]">
              per bulan
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#696969]">
              Estimasi model berdasarkan kriteria kos campur, termasuk listrik,
              dan luas kamar 3 x 4.
            </p>
          </div>

          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center self-start sm:self-center">
            <Doughnut data={chartData} options={chartOptions} />
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-sm font-bold text-[#141413] leading-none">
                {ratio.toFixed(0)}%
              </span>
              <span className="text-[7px] font-bold text-[#696969] uppercase tracking-wider mt-0.5">
                KOS
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
              <span>Porsi Sewa Kos</span>
            </div>
            <span className="font-semibold text-[#141413]">
              {ratio.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#F37338]" />
              <span>Sisa Pendapatan</span>
            </div>
            <span className="font-semibold text-[#696969]">
              {remaining.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
