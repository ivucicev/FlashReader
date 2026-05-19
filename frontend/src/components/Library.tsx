import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAllBooks, loadBook, deleteBook } from '../utils/db'
import { loadProgress } from '../utils/progress'
import { parseEpub } from '../utils/epubParser'
import { saveBook } from '../utils/db'
import { getDailyStats, calcStreak, calcLast7 } from '../utils/stats'
import type { BookMeta, ReadingProgress } from '../types'
import type { BookSummary } from '../utils/db'

interface BookWithProgress extends BookSummary {
  progress: ReadingProgress | null
  totalWords?: number
}

interface Props {
  onOpen: (book: BookMeta, progress: ReadingProgress | null) => void
}


function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export function Library({ onOpen }: Props) {
  const [books, setBooks] = useState<BookWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [dailyStats, setDailyStats] = useState<Record<string, number>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setLoading(true)
    try {
      const [summaries, stats] = await Promise.all([loadAllBooks(), getDailyStats()])
      setDailyStats(stats)
      const withProgress = await Promise.all(
        summaries.map(async b => ({
          ...b,
          progress: await loadProgress(b.id).catch(() => null),
        }))
      )
      setBooks(withProgress)
    } catch {
      setError('Could not load library. Is the backend running?')
    }
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleFile(file: File) {
    if (!file.name.endsWith('.epub')) { setError('Only .epub files supported.'); return }
    setError(null)
    setUploading(true)
    try {
      const book = await parseEpub(file)
      await saveBook(book)
      await refresh()
      // Load full book then open
      const full = await loadBook(book.id)
      onOpen(full, null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse ePub.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleDelete(id: string) {
    await deleteBook(id)
    setConfirmDelete(null)
    await refresh()
  }

  async function handleOpen(b: BookWithProgress) {
    try {
      const full = await loadBook(b.id)
      onOpen(full, b.progress)
    } catch {
      setError('Failed to load book.')
    }
  }

  const streak = calcStreak(dailyStats)
  const last7 = calcLast7(dailyStats)
  const todayKey = new Date().toLocaleDateString('sv')
  const todayWords = dailyStats[todayKey] ?? 0
  const totalWords = Object.values(dailyStats).reduce((s, n) => s + n, 0)
  const booksStarted = books.filter(b => b.progress && (b.progress.chapterIndex > 0 || b.progress.wordIndex > 0)).length

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border px-6 py-5 flex items-center justify-between">
        <h1 className="text-xl font-display font-medium text-text">
          Flash<span className="text-accent">Reader</span>
        </h1>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dim rounded-xl text-sm font-ui text-white transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {uploading ? (
            <>
              <motion.div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
              Parsing…
            </>
          ) : '+ Add book'}
        </button>
        <input ref={inputRef} type="file" accept=".epub" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      </header>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Stats */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex gap-3 flex-wrap">
            <Stat label="Books" value={String(books.length)} />
            <Stat label="In progress" value={String(booksStarted)} />
            <Stat label="All-time words" value={formatNum(totalWords)} />
            <Stat label={streak > 0 ? `${streak}-day streak` : 'No streak'} value={streak > 0 ? `🔥 ${streak}` : '—'} />
            <Stat label="Today" value={formatNum(todayWords)} sub="words" />
          </div>

          <div className="bg-surface border border-border rounded-2xl px-5 py-4">
            <p className="text-xs text-text-dim mb-4">Words per day (last 7 days)</p>
            <WeekChart days={last7} />
          </div>
        </div>

        {error && <p className="mb-6 text-red-400 text-sm">{error}</p>}

        {!loading && books.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-4 cursor-pointer"
            onDragOver={e => e.preventDefault()} onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border hover:border-accent flex items-center justify-center text-2xl text-muted transition-colors">+</div>
            <p className="text-text-dim text-sm">Drop an .epub here or click to add</p>
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
              animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
            <AnimatePresence>
              {books
                .slice()
                .sort((a, b) => (b.progress?.lastRead ?? 0) - (a.progress?.lastRead ?? 0))
                .map(book => {
                  const isDeleting = confirmDelete === book.id
                  const p = book.progress
                  const hasProgress = p && (p.chapterIndex > 0 || p.wordIndex > 0)

                  return (
                    <motion.div key={book.id} layout initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="group relative bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4 hover:border-muted transition-colors"
                    >
                      <button onClick={() => setConfirmDelete(isDeleting ? null : book.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-subtle opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-text-dim text-xs transition-all">
                        ✕
                      </button>

                      <AnimatePresence>
                        {isDeleting && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 rounded-2xl bg-surface/95 flex flex-col items-center justify-center gap-3 z-10">
                            <p className="text-sm text-text">Remove this book?</p>
                            <p className="text-xs text-text-dim">Progress will be lost.</p>
                            <div className="flex gap-2">
                              <button onClick={() => setConfirmDelete(null)} className="px-4 py-1.5 rounded-lg bg-subtle text-text-dim text-sm hover:bg-border transition-colors">Cancel</button>
                              <button onClick={() => handleDelete(book.id)} className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">Remove</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex-1">
                        <p className="text-text font-ui font-medium text-sm leading-snug line-clamp-2 pr-6">{book.title}</p>
                        <p className="text-text-dim text-xs mt-1">{book.author}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="w-full h-1 bg-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${hasProgress ? (((p!.wordIndex) / 1000) * 100) : 0}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>{hasProgress ? `Ch ${(p!.chapterIndex + 1)}` : 'Not started'}</span>
                        </div>
                        {p?.lastRead && hasProgress && <p className="text-xs text-muted">Last read {formatDate(p.lastRead)}</p>}
                      </div>

                      <button onClick={() => handleOpen(book)}
                        className="w-full py-2.5 rounded-xl bg-subtle hover:bg-border text-text-dim hover:text-text text-sm font-ui transition-colors min-h-[44px]">
                        {hasProgress ? 'Continue reading' : 'Start reading'}
                      </button>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-3 min-w-[90px]">
      <p className="text-2xl font-display text-text tabular-nums leading-none">{value}</p>
      {sub && <p className="text-xs text-text-dim mt-0.5">{sub}</p>}
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  )
}

function WeekChart({ days }: { days: { date: string; words: number; label: string }[] }) {
  const max = Math.max(...days.map(d => d.words), 1)
  const todayKey = new Date().toLocaleDateString('sv')
  return (
    <div className="flex items-end gap-2 h-20">
      {days.map(d => {
        const isToday = d.date === todayKey
        return (
          <div key={d.date} className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-full flex items-end justify-center" style={{ height: 56 }}>
              <motion.div
                className={`w-full rounded-t-md ${isToday ? 'bg-accent' : 'bg-subtle'}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((d.words / max) * 56, d.words > 0 ? 4 : 1)}px` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                title={`${d.words.toLocaleString()} words`}
              />
            </div>
            <span className={`text-xs tabular-nums ${isToday ? 'text-accent' : 'text-muted'}`}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
