import { motion } from 'framer-motion'

interface Props {
  wordIndex: number
  totalWords: number
  chapterTitle: string
  chapterIndex: number
  totalChapters: number
}

export function ProgressBar({ wordIndex, totalWords, chapterTitle, chapterIndex, totalChapters }: Props) {
  const pct = totalWords > 0 ? Math.min(100, (wordIndex / totalWords) * 100) : 0
  const wordsLeft = Math.max(0, totalWords - wordIndex)

  return (
    <div className="w-full max-w-2xl space-y-2">
      {/* Chapter info */}
      <div className="flex items-center justify-between text-xs font-display text-text-dim">
        <span className="truncate max-w-xs" title={chapterTitle}>{chapterTitle}</span>
        <span className="tabular-nums text-right shrink-0 ml-4">
          Ch {chapterIndex + 1}/{totalChapters} · {wordsLeft.toLocaleString()} words left
        </span>
      </div>

      {/* Bar */}
      <div className="w-full h-1 bg-subtle rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Percentage */}
      <div className="flex justify-between text-xs font-display text-muted">
        <span>{pct.toFixed(1)}%</span>
        <span>word {wordIndex.toLocaleString()} / {totalWords.toLocaleString()}</span>
      </div>
    </div>
  )
}
