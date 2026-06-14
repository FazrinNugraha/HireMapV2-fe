import type { SalaryPredictionRequest } from '../types/api'

// Nilai awal form salary agar user langsung punya contoh input yang valid.
export const DEFAULT_SALARY_FORM: SalaryPredictionRequest = {
  job_title: 'Senior Programmer',
  category: 'IT, Tech & Data',
  location: 'Jakarta Selatan',
  experience_level: 'Mid-Level (3-5 thn)',
  education_level: 'S1 / Sarjana',
  certification_level: 'Tanpa Sertifikasi',
}

// Target salary default masih disimpan sebagai string karena dipakai sebagai nilai input.
export const DEFAULT_TARGET_SALARY = '9'

// Pesan awal untuk mengarahkan konteks chat AI Consultant.
export const DEFAULT_CHAT_MESSAGE = 'Kasih tips negosiasi gaji untuk posisi ini.'

// Quick prompt yang muncul sebagai shortcut pertanyaan umum di AI Consultant.
export const QUICK_CHAT_QUESTIONS = [
  'Tips negosiasi gaji',
  'Skill yang perlu ditingkatkan',
  'Persiapan interview',
  'Apakah offer ini fair?',
  'Strategi tempat tinggal',
]
