import { AnimatePresence, motion } from 'framer-motion'
import { calcPivot } from '../utils/pivot'

export type TextSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZE_CLASS: Record<TextSize, string> = {
  sm: 'text-3xl md:text-4xl',
  md: 'text-5xl md:text-6xl',
  lg: 'text-6xl md:text-7xl',
  xl: 'text-7xl md:text-8xl',
}

interface Props {
  word: string
  isPlaying: boolean
  textSize?: TextSize
}

export function RSVPDisplay({ word, isPlaying, textSize = 'md' }: Props) {
  const { before, pivot, after } = calcPivot(word)

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-3xl px-12 py-10 flex items-center justify-center overflow-hidden">
        <div className="orp-line" style={{ left: '50%' }} />
        <div className="absolute top-0 left-8 right-8 h-px bg-border" />
        <div className="absolute bottom-0 left-8 right-8 h-px bg-border" />

        <AnimatePresence mode="wait">
          <motion.div
            key={word}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.06 }}
            className={`rsvp-word flex items-baseline gap-0 font-light ${SIZE_CLASS[textSize]}`}
            style={{ minHeight: '1.3em' }}
          >
            <span className="text-text-dim tracking-tight">{before}</span>
            <span className="text-accent font-medium">{pivot}</span>
            <span className="text-text tracking-tight">{after}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="mt-4 w-1.5 h-1.5 rounded-full bg-accent"
        animate={{ opacity: isPlaying ? [1, 0.3, 1] : 0.3 }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </div>
  )
}
