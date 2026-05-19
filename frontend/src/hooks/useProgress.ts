import { useCallback, useRef } from 'react'
import { saveProgress } from '../utils/progress'

// Debounced progress save — flushes at most every 5s while playing, always on explicit flush()
export function useProgress(bookId: string | undefined) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<{ chapterIndex: number; wordIndex: number } | null>(null)

  const flush = useCallback(() => {
    if (!bookId || !pendingRef.current) return
    const { chapterIndex, wordIndex } = pendingRef.current
    pendingRef.current = null
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    saveProgress(bookId, chapterIndex, wordIndex).catch(() => {})
  }, [bookId])

  const save = useCallback((chapterIndex: number, wordIndex: number) => {
    if (!bookId) return
    pendingRef.current = { chapterIndex, wordIndex }
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        flush()
      }, 5000)
    }
  }, [bookId, flush])

  return { save, flush }
}
