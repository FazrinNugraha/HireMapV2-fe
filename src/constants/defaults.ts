import type { SalaryPredictionRequest } from '../types/api'

export const DEFAULT_SALARY_FORM: SalaryPredictionRequest = {
  job_title: 'Senior Programmer',
  category: 'IT, Tech & Data',
  location: 'Jakarta Selatan',
  experience_level: '💼 Mid-Level (3-5 thn)',
  education_level: '🎓 S1 / Sarjana',
  certification_level: '📄 Tanpa Sertifikasi',
}

export const DEFAULT_TARGET_SALARY = '9'

export const DEFAULT_CHAT_MESSAGE = 'Kasih tips negosiasi gaji untuk posisi ini.'

export const QUICK_CHAT_QUESTIONS = [
  'Tips negosiasi gaji',
  'Skill yang perlu ditingkatkan',
  'Persiapan interview',
  'Apakah offer ini fair?',
  'Strategi tempat tinggal',
]
