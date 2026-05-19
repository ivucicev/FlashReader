import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { TextSize } from './RSVPDisplay'

interface Props {
  isPlaying: boolean
  wpm: number
  textSize: TextSize
  onToggle: () => void
  onSkipBack: () => void
  onWpmChange: (wpm: number) => void
  onPrevChapter: () => void
  onNextChapter: () => void
  onTextSizeChange: (s: TextSize) => void
  hasPrev: boolean
  hasNext: boolean
}

const WPM_PRESETS = [150, 250, 350, 500, 700, 1000, 1200]
const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'sm', label: 'S' },
  { value: 'md', label: 'M' },
  { value: 'lg', label: 'L' },
  { value: 'xl', label: 'XL' },
]

export function Controls({
  isPlaying, wpm, textSize,
  onToggle, onSkipBack, onWpmChange,
  onPrevChapter, onNextChapter, onTextSizeChange,
  hasPrev, hasNext,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); onToggle() }
      if (e.code === 'ArrowLeft') { e.preventDefault(); onSkipBack() }
      if (e.code === 'ArrowRight' && hasNext) { e.preventDefault(); onNextChapter() }
      if (e.code === 'ArrowUp') { e.preventDefault(); onWpmChange(Math.min(1200, wpm + 50)) }
      if (e.code === 'ArrowDown') { e.preventDefault(); onWpmChange(Math.max(100, wpm - 50)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, wpm, onToggle, onSkipBack, onWpmChange, onNextChapter, hasNext])

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Main controls */}
      <div className="flex items-center gap-5">
        <Btn onClick={onPrevChapter} disabled={!hasPrev} title="Prev chapter">
          <ChevronLeft />
        </Btn>

        <Btn onClick={onSkipBack} title="Skip back 10 words (←)">
          <SkipBack />
        </Btn>

        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.93 }}
          className="w-20 h-20 rounded-full bg-accent hover:bg-accent-dim flex items-center justify-center text-white transition-colors shadow-lg shadow-accent/25"
          title="Play / Pause (Space)"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </motion.button>

        <Btn onClick={onNextChapter} disabled={!hasNext} title="Next chapter (→)">
          <ChevronRight />
        </Btn>
      </div>

      {/* WPM control */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-3">
          <span className="text-xs font-display text-text-dim uppercase tracking-widest">WPM</span>
          <span className="text-lg font-display text-accent tabular-nums w-14 text-center">{wpm}</span>
        </div>

        <input
          type="range"
          min={100}
          max={1200}
          step={10}
          value={wpm}
          onChange={e => onWpmChange(Number(e.target.value))}
          className="w-full h-2 appearance-none rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3B82F6 ${((wpm - 100) / 1100) * 100}%, #1A1A1A ${((wpm - 100) / 1100) * 100}%)`,
          }}
        />

        <div className="flex gap-2 flex-wrap justify-center">
          {WPM_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => onWpmChange(preset)}
              className={`px-4 py-2 rounded-full text-xs font-display transition-colors min-h-[44px] min-w-[52px] ${
                wpm === preset
                  ? 'bg-accent text-white'
                  : 'bg-subtle text-text-dim hover:bg-border hover:text-text'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Text size */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs font-display text-text-dim uppercase tracking-widest">Size</span>
          <div className="flex gap-1">
            {TEXT_SIZES.map(s => (
              <button
                key={s.value}
                onClick={() => onTextSizeChange(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-display transition-colors min-h-[36px] ${
                  textSize === s.value
                    ? 'bg-accent text-white'
                    : 'bg-subtle text-text-dim hover:bg-border hover:text-text'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard hints — desktop only */}
      <div className="hidden sm:flex gap-4 text-text-dim text-xs font-display tracking-widest">
        <span><Key>Space</Key> play</span>
        <span><Key>←</Key> back 10</span>
        <span><Key>↑↓</Key> speed</span>
        <span><Key>→</Key> chapter</span>
      </div>
    </div>
  )
}

function Btn({ onClick, disabled, children, title }: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  title?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.92 }}
      title={title}
      className="w-14 h-14 rounded-2xl bg-subtle hover:bg-border flex items-center justify-center text-text-dim hover:text-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </motion.button>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 bg-subtle border border-border rounded text-text-dim text-xs font-display">
      {children}
    </kbd>
  )
}

function PlayIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
}
function PauseIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
}
function SkipBack() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
}
function ChevronLeft() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
}
function ChevronRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
}
