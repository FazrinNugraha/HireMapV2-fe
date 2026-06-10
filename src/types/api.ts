export type MetadataOption = {
  value: string
  label: string
  multiplier: number
}

export type MetadataResponse = {
  locations: string[]
  categories: string[]
  experience_levels: MetadataOption[]
  education_levels: MetadataOption[]
  certification_levels: MetadataOption[]
}

export type SalaryPredictionRequest = {
  job_title: string
  category: string
  location: string
  experience_level: string
  education_level: string
  certification_level: string
}

export type SalaryPredictionResponse = {
  judul: string
  kategori: string
  lokasi: string
  pengalaman: string
  pendidikan: string
  sertifikasi: string
  gaji_basis: number
  gaji_setelah_koreksi_judul: number
  gaji_prediksi: number
  gaji_min: number
  gaji_max: number
  multiplier: number
  m_pengalaman: number
  m_pendidikan: number
  m_sertifikat: number
  m_koreksi_realistis: number
  m_koreksi_judul: number
  is_ambiguous_title: boolean
  generic_tokens: string[]
  confidence_label: string
  adjustment_notes: string[]
  estimasi_kos: number
  rasio_kos: number
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AiChatRequest = {
  message: string
  history: ChatMessage[]
  prediction_context?: SalaryPredictionResponse | null
}

export type AiChatResponse = {
  reply: string
}

export type SpatialSummaryItem = {
  Lokasi_Clean: string
  Jumlah_Lowongan: number
  Harga_Kos_Estimasi: number
  lat: number
  lon: number
}

export type LocationDetailResponse = {
  lokasi: string
  total_jobs: number
  kos_estimasi: number
  category_jobs: number | null
  top_categories: string[]
  lat: number
  lon: number
}
