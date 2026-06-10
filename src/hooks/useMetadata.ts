import { useEffect, useState } from 'react'
import { getMetadata } from '../services/api'
import type { MetadataResponse, SalaryPredictionRequest } from '../types/api'

type UseMetadataResult = {
  metadata: MetadataResponse | null
  isLoading: boolean
  error: string | null
}

export function useMetadata(
  setForm: React.Dispatch<React.SetStateAction<SalaryPredictionRequest>>,
): UseMetadataResult {
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
        setError(metadataError instanceof Error ? metadataError.message : 'Gagal mengambil metadata.')
      })
      .finally(() => setIsLoading(false))
  }, [setForm])

  return { metadata, isLoading, error }
}

function normalizeFormWithMetadata(
  form: SalaryPredictionRequest,
  metadata: MetadataResponse,
): SalaryPredictionRequest {
  return {
    ...form,
    category: metadata.categories.includes(form.category)
      ? form.category
      : (metadata.categories[0] ?? form.category),
    location: metadata.locations.includes(form.location)
      ? form.location
      : (metadata.locations[0] ?? form.location),
    experience_level:
      metadata.experience_levels.find((item) => item.value === form.experience_level)?.value ??
      metadata.experience_levels[0]?.value ??
      form.experience_level,
    education_level:
      metadata.education_levels.find((item) => item.value === form.education_level)?.value ??
      metadata.education_levels[0]?.value ??
      form.education_level,
    certification_level:
      metadata.certification_levels.find((item) => item.value === form.certification_level)?.value ??
      metadata.certification_levels[0]?.value ??
      form.certification_level,
  }
}

