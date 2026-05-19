import { motion } from 'framer-motion'

interface Props {
  chapterTitle: string
  onSkip: () => void
  onReflect: () => void
}

export function ChapterEndPrompt({ chapterTitle, onSkip, onReflect }: Props) {
  return (
    <motion.div
      className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5"
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28 }}
      >
        <div>
          <p className="text-xs text-text-dim mb-1">Chapter complete</p>
          <p className="text-text font-ui font-medium text-sm leading-snug line-clamp-2">
            {chapterTitle}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onReflect}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent-dim text-white text-sm font-ui transition-colors min-h-[44px]"
          >
            Recap &amp; quiz
          </button>
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-xl bg-subtle hover:bg-border text-text-dim hover:text-text text-sm font-ui transition-colors min-h-[44px]"
          >
            Skip
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
