import { motion, AnimatePresence } from 'framer-motion'
import type { Chapter } from '../types'

interface Props {
  chapters: Chapter[]
  currentIndex: number
  onSelect: (index: number) => void
  isOpen: boolean
  onClose: () => void
}

export function ChapterNav({ chapters, currentIndex, onSelect, isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed left-0 top-0 bottom-0 w-80 bg-surface border-r border-border z-50 flex flex-col overflow-hidden"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <span className="text-xs font-display text-text-dim tracking-widest uppercase">
                Chapters
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-subtle hover:bg-border flex items-center justify-center text-text-dim hover:text-text transition-colors"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-2">
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => { onSelect(i); onClose() }}
                  className={`w-full text-left px-6 py-3 text-sm transition-colors hover:bg-subtle flex items-center gap-3 ${
                    i === currentIndex ? 'text-accent bg-accent/5' : 'text-text-dim'
                  }`}
                >
                  <span className="font-display text-xs text-muted w-6 shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="truncate font-ui">{ch.title}</span>
                  {i === currentIndex && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
