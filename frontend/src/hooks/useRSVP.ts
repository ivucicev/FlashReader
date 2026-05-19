import { useCallback, useEffect, useRef, useState } from 'react'
import { getWordDelay } from '../utils/pivot'

interface UseRSVPOptions {
  words: string[]
  initialIndex?: number
  wpm: number
  onComplete: () => void
  onProgress: (index: number) => void
}

export function useRSVP({ words, initialIndex = 0, wpm, onComplete, onProgress }: UseRSVPOptions) {
  const [wordIndex, setWordIndex] = useState(initialIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef({ wordIndex, isPlaying, wpm, words })

  useEffect(() => {
    stateRef.current = { wordIndex, isPlaying, wpm, words }
  })

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const advance = useCallback(() => {
    const { wordIndex, wpm, words } = stateRef.current
    const next = wordIndex + 1

    if (next >= words.length) {
      setIsPlaying(false)
      onComplete()
      return
    }

    setWordIndex(next)
    onProgress(next)

    const delay = getWordDelay(words[next], wpm)
    timerRef.current = setTimeout(advance, delay)
  }, [onComplete, onProgress])

  useEffect(() => {
    if (isPlaying) {
      const delay = getWordDelay(words[wordIndex] ?? '', wpm)
      timerRef.current = setTimeout(advance, delay)
    } else {
      clearTimer()
    }
    return clearTimer
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset when words array changes (new chapter)
  useEffect(() => {
    clearTimer()
    setIsPlaying(false)
    setWordIndex(initialIndex)
  }, [words, initialIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const play = () => setIsPlaying(true)
  const pause = () => setIsPlaying(false)
  const toggle = () => setIsPlaying(p => !p)

  const skipBack = useCallback((n = 10) => {
    clearTimer()
    setWordIndex(i => {
      const next = Math.max(0, i - n)
      onProgress(next)
      return next
    })
    if (stateRef.current.isPlaying) {
      setTimeout(() => {
        const delay = getWordDelay(stateRef.current.words[stateRef.current.wordIndex] ?? '', stateRef.current.wpm)
        timerRef.current = setTimeout(advance, delay)
      }, 0)
    }
  }, [advance, onProgress])

  const jumpTo = useCallback((index: number) => {
    clearTimer()
    const clamped = Math.max(0, Math.min(index, words.length - 1))
    setWordIndex(clamped)
    onProgress(clamped)
    setIsPlaying(false)
  }, [words.length, onProgress])

  return { wordIndex, isPlaying, play, pause, toggle, skipBack, jumpTo }
}
