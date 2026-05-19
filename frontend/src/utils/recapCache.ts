import { api } from './api'
import type { AIReflectionData } from '../types'

export async function saveRecap(bookId: string, chapterId: string, data: AIReflectionData): Promise<void> {
  await api.post(`/recap/${bookId}/${chapterId}`, data)
}

export async function loadRecap(bookId: string, chapterId: string): Promise<AIReflectionData | null> {
  return api.get<AIReflectionData | null>(`/recap/${bookId}/${chapterId}`)
}
