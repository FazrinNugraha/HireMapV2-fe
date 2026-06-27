// Semua tab utama yang tersedia di aplikasi.
export type AppLayer = 'salary' | 'spatial' | 'commuter' | 'analysis' | 'consultant'

export type AppLayerConfig = {
  id: AppLayer
  label: string
}

// Konfigurasi urutan tab pada AppTabs.
export const APP_LAYERS: AppLayerConfig[] = [
  { id: 'salary', label: 'Salary Prediction' },
  { id: 'spatial', label: 'Spatial Map' },
  { id: 'commuter', label: 'Commuter Simulator' },
  { id: 'analysis', label: 'Analytics & Insight' },
  { id: 'consultant', label: 'AI Consultant' },
]
