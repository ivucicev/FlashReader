import { api } from './api'
import type { ReadingProgress } from '../types'

export async function saveProgress(bookId: string, chapterIndex: number, wordIndex: number): Promise<void> {
  await api.put(`/progress/${bookId}`, { chapterIndex, wordIndex })
}

export async function loadProgress(bookId: string): Promise<ReadingProgress | null> {
  return api.get<ReadingProgress | null>(`/progress/${bookId}`)
}
