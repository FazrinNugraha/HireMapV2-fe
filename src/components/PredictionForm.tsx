import type { FormEvent } from 'react'
import { SelectField } from './SelectField'
import type { MetadataResponse, SalaryPredictionRequest } from '../types/api'

type PredictionFormProps = {
  form: SalaryPredictionRequest
  metadata: MetadataResponse | null
  isMetadataLoading: boolean
  isSubmitting: boolean
  onChange: (form: SalaryPredictionRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function PredictionForm({
  form,
  metadata,
  isMetadataLoading,
  isSubmitting,
  onChange,
  onSubmit,
}: PredictionFormProps) {
  const canSubmit = form.job_title.trim().length > 0 && metadata !== null && !isSubmitting

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[32px] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.08)]"
    >
      <div className="mb-5">
        <p className="text-sm font-bold tracking-[0.04em] text-[#CF4500] uppercase">
          Prediction Input
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Faktor utama</h2>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">
          Posisi pekerjaan
          <input
            className="rounded-[20px] border border-[#141413]/20 px-4 py-3 font-normal outline-none focus:border-[#141413]"
            value={form.job_title}
            onChange={(event) => onChange({ ...form, job_title: event.target.value })}
            placeholder="Contoh: Senior Programmer"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Kategori pekerjaan"
            value={form.category}
            options={metadata?.categories ?? []}
            disabled={isMetadataLoading}
            onChange={(value) => onChange({ ...form, category: value })}
          />
          <SelectField
            label="Lokasi penempatan"
            value={form.location}
            options={metadata?.locations ?? []}
            disabled={isMetadataLoading}
            onChange={(value) => onChange({ ...form, location: value })}
          />
          <SelectField
            label="Level pengalaman"
            value={form.experience_level}
            options={metadata?.experience_levels.map((item) => item.value) ?? []}
            disabled={isMetadataLoading}
            onChange={(value) => onChange({ ...form, experience_level: value })}
          />
          <SelectField
            label="Pendidikan terakhir"
            value={form.education_level}
            options={metadata?.education_levels.map((item) => item.value) ?? []}
            disabled={isMetadataLoading}
            onChange={(value) => onChange({ ...form, education_level: value })}
          />
        </div>

        <SelectField
          label="Sertifikasi profesional"
          value={form.certification_level}
          options={metadata?.certification_levels.map((item) => item.value) ?? []}
          disabled={isMetadataLoading}
          onChange={(value) => onChange({ ...form, certification_level: value })}
        />
      </div>

      <button
        className="mt-6 w-full rounded-[20px] bg-[#141413] px-6 py-3 font-semibold text-[#F3F0EE] disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={!canSubmit}
      >
        {isSubmitting ? 'Menghitung...' : 'Hitung Prediksi Gaji'}
      </button>
    </form>
  )
}

