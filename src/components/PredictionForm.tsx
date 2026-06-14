import type { FormEvent } from "react";
import { SelectField } from "./SelectField";
import type { MetadataResponse, SalaryPredictionRequest } from "../types/api";

type PredictionFormProps = {
  form: SalaryPredictionRequest;
  metadata: MetadataResponse | null;
  isMetadataLoading: boolean;
  isSubmitting: boolean;
  onChange: (form: SalaryPredictionRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const IconBriefcase = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconCategory = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconLocation = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconExperience = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconEducation = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const IconCertificate = (
  <svg
    className="w-4 h-4 text-[#696969]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/**
 * Form input faktor prediksi gaji.
 * Semua perubahan field dikirim ke parent agar page tetap menjadi single source of truth.
 */
export function PredictionForm({
  form,
  metadata,
  isMetadataLoading,
  isSubmitting,
  onChange,
  onSubmit,
}: PredictionFormProps) {
  const canSubmit =
    form.job_title.trim().length > 0 && metadata !== null && !isSubmitting;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col rounded-[32px] border border-[#E5E2E0] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] lg:h-full lg:justify-between"
    >
      <div>
        <div className="mb-6">
          <p className="eyebrow">PREDICTION INPUT</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#141413]">
            Faktor utama
          </h2>
        </div>

        <div className="flex flex-col gap-5">
          {/* Posisi Pekerjaan */}
          <label className="grid gap-1.5">
            <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">
              Posisi pekerjaan
            </span>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#696969]">
                {IconBriefcase}
              </span>
              <input
                className="w-full rounded-[20px] border border-[#E5E2E0] bg-[#FCFBFA] pl-11 pr-4 py-3 text-sm text-[#141413] outline-none transition-all placeholder:text-[#D1CDC7] hover:border-[#C7C7C0] focus:border-[#141413] focus:bg-white focus:ring-4 focus:ring-[#141413]/5"
                value={form.job_title}
                onChange={(event) =>
                  onChange({ ...form, job_title: event.target.value })
                }
                placeholder="Contoh: Senior Programmer"
              />
            </div>
          </label>

          {/* Kategori & Lokasi */}
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Kategori pekerjaan"
              value={form.category}
              options={metadata?.categories ?? []}
              disabled={isMetadataLoading}
              onChange={(value) => onChange({ ...form, category: value })}
              icon={IconCategory}
            />
            <SelectField
              label="Lokasi penempatan"
              value={form.location}
              options={metadata?.locations ?? []}
              disabled={isMetadataLoading}
              onChange={(value) => onChange({ ...form, location: value })}
              icon={IconLocation}
            />
          </div>

          {/* Pengalaman & Pendidikan */}
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Level pengalaman"
              value={form.experience_level}
              options={
                metadata?.experience_levels.map((item) => item.value) ?? []
              }
              disabled={isMetadataLoading}
              onChange={(value) =>
                onChange({ ...form, experience_level: value })
              }
              icon={IconExperience}
            />
            <SelectField
              label="Pendidikan terakhir"
              value={form.education_level}
              options={
                metadata?.education_levels.map((item) => item.value) ?? []
              }
              disabled={isMetadataLoading}
              onChange={(value) =>
                onChange({ ...form, education_level: value })
              }
              icon={IconEducation}
            />
          </div>

          {/* Sertifikasi */}
          <SelectField
            label="Sertifikasi profesional"
            value={form.certification_level}
            options={
              metadata?.certification_levels.map((item) => item.value) ?? []
            }
            disabled={isMetadataLoading}
            onChange={(value) =>
              onChange({ ...form, certification_level: value })
            }
            icon={IconCertificate}
          />
        </div>
      </div>

      <button
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#141413] px-6 py-4 text-sm font-semibold tracking-[-0.01em] text-[#F3F0EE] transition-opacity hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        type="submit"
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <>
            <span className="spinner animate-spin" />
            <span>Menghitung...</span>
          </>
        ) : (
          "Hitung Prediksi Gaji"
        )}
      </button>
    </form>
  );
}
