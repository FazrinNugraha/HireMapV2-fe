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
const JSON_HEADERS = { 'Content-Type': 'application/json' }

type BackendErrorBody = {
  detail?: unknown
}

// Wrapper fetch utama agar semua endpoint punya format header dan error yang sama.
async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...init?.headers,
    },
  })

  const body = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getBackendErrorMessage(body))
  }

  return body as TResponse
}

// Membaca response sebagai JSON jika memungkinkan, fallback ke text untuk error non-JSON.
async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function getBackendErrorMessage(body: unknown) {
  if (isBackendErrorBody(body) && body.detail) {
    return String(body.detail)
  }

  return 'Request backend gagal.'
}

function isBackendErrorBody(body: unknown): body is BackendErrorBody {
  return typeof body === 'object' && body !== null && 'detail' in body
}

// Metadata untuk dropdown form prediksi.
export function getMetadata() {
  return apiRequest<MetadataResponse>('/api/metadata')
}

// Mengirim faktor user ke model prediksi salary.
export function predictSalary(payload: SalaryPredictionRequest) {
  return apiRequest<SalaryPredictionResponse>('/api/salary/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Mengirim chat user beserta konteks prediksi terbaru ke AI Consultant.
export function sendAiChat(payload: AiChatRequest) {
  return apiRequest<AiChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// Data agregat wilayah untuk peta dan ranking.
export function getSpatialSummary() {
  return apiRequest<SpatialSummaryItem[]>('/api/spatial/summary')
}

// Detail satu lokasi, optional difilter berdasarkan kategori industri.
export function getLocationDetail(location: string, category?: string) {
  const params = new URLSearchParams({ location })

  if (category) {
    params.set('category', category)
  }

  return apiRequest<LocationDetailResponse>(
    `/api/spatial/location-detail?${params.toString()}`,
  )
}

export { API_BASE_URL }
