import { formatRupiah } from "../utils/format";
import { FeatureHeader } from "./FeatureHeader";
import type { SalaryPredictionResponse } from "../types/api";

type ActiveCareerContextProps = {
  prediction: SalaryPredictionResponse | null;
  onGoToSalary: () => void;
};

/**
 * Panel konteks karir aktif untuk AI Consultant.
 * Menampilkan ringkasan prediksi terakhir agar user tahu konteks apa yang dipakai AI.
 */
export function ActiveCareerContext({
  prediction,
  onGoToSalary,
}: ActiveCareerContextProps) {
  if (!prediction) {
    return (
      <section className="rounded-[32px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)] md:col-span-4">
        <FeatureHeader title="Career Context" />
        <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#141413]">
          Belum ada data prediksi
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#696969]">
          Jalankan prediksi gaji terlebih dahulu agar AI bisa memberi saran yang
          lebih personal dan akurat.
        </p>
        <button
          className="mt-6 rounded-[20px] border-[1.5px] border-[#141413] bg-white px-5 py-3 text-sm font-semibold text-[#141413] transition-all hover:bg-[#141413] hover:text-[#F3F0EE]"
          type="button"
          onClick={onGoToSalary}
        >
          Ke Salary Prediction →
        </button>

        {/* Career tip */}
        <div className="mt-6 rounded-[24px] bg-[#F3F0EE] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#696969]">
            💡 Tips
          </p>
          <p className="mt-2 text-sm leading-6 text-[#555555]">
            Gaji di Jabodetabek sangat bervariasi. Lokasi, sertifikasi, dan
            pengalaman bisa mempengaruhi hingga{" "}
            <strong className="text-[#141413]">40%+</strong> dari gaji basis.
          </p>
        </div>
      </section>
    );
  }

  return (
    <aside className="flex flex-col gap-6 md:col-span-4">
      <section className="rounded-[32px] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="mb-6">
          <FeatureHeader title="Career Context" />
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-[#141413]">
            Prediksi aktif
          </h2>
          <p className="mt-1 text-sm text-[#696969]">
            Berdasarkan prediksi terbaru Anda.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ContextRow label="Posisi" value={prediction.judul} />
          <ContextRow label="Lokasi" value={prediction.lokasi} />
          <ContextRow label="Pengalaman" value={prediction.pengalaman} />
          <ContextRow label="Pendidikan" value={prediction.pendidikan} />
        </div>

        <div className="mt-6 rounded-[24px] bg-[#EFEEE7] p-5">
          <div className="mb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#696969]">
              Predicted Salary
            </span>
            <div className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-[#141413]">
              {formatRupiah(prediction.gaji_prediksi)}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#AA3700]">
              Range: {formatRupiah(prediction.gaji_min)} –{" "}
              {formatRupiah(prediction.gaji_max)}
            </div>
          </div>

          <div className="flex justify-between rounded-[18px] bg-white p-3">
            <div>
              <span className="block text-[11px] font-semibold text-[#696969]">
                Est. Kos
              </span>
              <span className="text-sm font-semibold text-[#141413]">
                {formatRupiah(prediction.estimasi_kos)}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-semibold text-[#696969]">
                Rasio Kos
              </span>
              <span className="text-sm font-bold text-[#AA3700]">
                {prediction.rasio_kos.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Negotiation tip card */}
      <section className="rounded-[32px] bg-[#141413] p-6 text-white">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-white/40">
          <span className="text-base leading-none text-[#F37338]">•</span>
          Negotiation Insight
        </p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Confidence level prediksi:{" "}
          <strong className="text-white">{prediction.confidence_label}</strong>.
          Gunakan range{" "}
          <strong className="text-white">
            {formatRupiah(prediction.gaji_min)}–
            {formatRupiah(prediction.gaji_max)}
          </strong>{" "}
          sebagai anchor negosiasi.
        </p>
      </section>
    </aside>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E4E2DC] pb-3">
      <span className="text-sm font-semibold text-[#696969]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#141413]">
        {value}
      </span>
    </div>
  );
}
