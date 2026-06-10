import type {
  AiChatRequest,
  AiChatResponse,
  LocationDetailResponse,
  MetadataResponse,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const detail =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String(body.detail)
        : 'Request backend gagal.'
    throw new Error(detail)
  }

  return body as TResponse
}

export function getMetadata() {
  return apiRequest<MetadataResponse>('/api/metadata')
}

export function predictSalary(payload: SalaryPredictionRequest) {
  return apiRequest<SalaryPredictionResponse>('/api/salary/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendAiChat(payload: AiChatRequest) {
  return apiRequest<AiChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getSpatialSummary() {
  return apiRequest<SpatialSummaryItem[]>('/api/spatial/summary')
}

export function getLocationDetail(location: string, category?: string) {
  const categoryParam = category ? `&category=${encodeURIComponent(category)}` : ''
  return apiRequest<LocationDetailResponse>(
    `/api/spatial/location-detail?location=${encodeURIComponent(location)}${categoryParam}`
  )
}

export { API_BASE_URL }
