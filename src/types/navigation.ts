export type AppLayer = 'salary' | 'spatial' | 'consultant'

export type AppLayerConfig = {
  id: AppLayer
  label: string
}

export const APP_LAYERS: AppLayerConfig[] = [
  { id: 'salary', label: 'Salary Prediction' },
  { id: 'spatial', label: 'Spatial Map' },
  { id: 'consultant', label: 'AI Consultant' },
]
