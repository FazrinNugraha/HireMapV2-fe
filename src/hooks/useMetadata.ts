import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { getMetadata } from '../services/api'
import type { MetadataOption, MetadataResponse, SalaryPredictionRequest } from '../types/api'

type UseMetadataResult = {
  metadata: MetadataResponse | null
  isLoading: boolean
  error: string | null
}

type SetSalaryForm = Dispatch<SetStateAction<SalaryPredictionRequest>>

// Hook untuk mengambil metadata dropdown dan memastikan default form tetap valid.
export function useMetadata(setForm: SetSalaryForm): UseMetadataResult {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMetadata()
      .then((data) => {
        setMetadata(data)
        setForm((current) => normalizeFormWithMetadata(current, data))
      })
      .catch((metadataError: unknown) => {
        setError(getMetadataErrorMessage(metadataError))
      })
      .finally(() => setIsLoading(false))
  }, [setForm])

  return { metadata, isLoading, error }
}

// Mengganti nilai form yang tidak ada di metadata backend dengan opsi pertama.
function normalizeFormWithMetadata(
  form: SalaryPredictionRequest,
  metadata: MetadataResponse,
): SalaryPredictionRequest {
  return {
    ...form,
    category: getValidStringOption(form.category, metadata.categories),
    location: getValidStringOption(form.location, metadata.locations),
    experience_level: getValidMetadataValue(
      form.experience_level,
      metadata.experience_levels,
    ),
    education_level: getValidMetadataValue(
      form.education_level,
      metadata.education_levels,
    ),
    certification_level: getValidMetadataValue(
      form.certification_level,
      metadata.certification_levels,
    ),
  }
}

// Validasi opsi string sederhana seperti kategori dan lokasi.
function getValidStringOption(currentValue: string, options: string[]) {
  return options.includes(currentValue) ? currentValue : (options[0] ?? currentValue)
}

// Validasi opsi metadata yang berbentuk object { value, label, multiplier }.
function getValidMetadataValue(currentValue: string, options: MetadataOption[]) {
  const matchedOption = options.find((item) => item.value === currentValue)
  return matchedOption?.value ?? options[0]?.value ?? currentValue
}

function getMetadataErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Gagal mengambil metadata.'
}
