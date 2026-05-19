import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Library } from './components/Library'
import { RSVPDisplay } from './components/RSVPDisplay'
import type { TextSize } from './components/RSVPDisplay'
import { Controls } from './components/Controls'
import { ProgressBar } from './components/ProgressBar'
import { ChapterNav } from './components/ChapterNav'
import { AIReflection } from './components/AIReflection'
import { ChapterEndPrompt } from './components/ChapterEndPrompt'
import { NotesPanel } from './components/NotesPanel'
import { useRSVP } from './hooks/useRSVP'
import { useProgress } from './hooks/useProgress'
import { saveBook } from './utils/db'
import { fetchReflection } from './utils/ai'
import { recordWordsRead } from './utils/stats'
import { saveRecap, loadRecap } from './utils/recapCache'
import type { AIReflectionData, AppPhase, BookMeta, ReadingProgress } from './types'

export default function App() {
  const [book, setBook] = useState<BookMeta | null>(null)
  const [chapterIndex, setChapterIndex] = useState(0)
  const [wpm, setWpm] = useState(300)
  const [phase, setPhase] = useState<AppPhase>('landing')
  const [navOpen, setNavOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [initialWordIndex, setInitialWordIndex] = useState(0)
  const [textSize, setTextSize] = useState<TextSize>(() =>
    (localStorage.getItem('flashreader::textsize') as TextSize | null) ?? 'md'
  )

  const [reflectionData, setReflectionData] = useState<AIReflectionData | null>(null)
  const [reflectionLoading, setReflectionLoading] = useState(false)
  const [reflectionError, setReflectionError] = useState<string | null>(null)

  const { save, flush } = useProgress(book?.id)
  const chapter = book?.chapters[chapterIndex]
  const words = chapter?.words ?? []

  const saveRef = useRef(save)
  const flushRef = useRef(flush)
  useEffect(() => { saveRef.current = save; flushRef.current = flush }, [save, flush])

  // Track words read for daily stats
  const lastFlushedIndexRef = useRef(0)
  function flushWords(currentIndex: number) {
    const delta = currentIndex - lastFlushedIndexRef.current
    if (delta > 0) {
      recordWordsRead(delta).catch(() => {})
      lastFlushedIndexRef.current = currentIndex
    }
  }

  const onProgress = useCallback((index: number) => {
    saveRef.current(chapterIndex, index)
  }, [chapterIndex])

  const onComplete = useCallback(async () => {
    if (!chapter) return
    const skipTitles = /^(contents|table of contents|foreword|preface|acknowledgements?|acknowledgments?|dedication|about the author|index|bibliography|references|appendix|introduction|prologue|epilogue|copyright|cover|title page|half title|endorsements?|praise for|also by)/i
    if (skipTitles.test(chapter.title.trim()) || chapter.words.length < 300) {
      nextChapter()
      return
    }
    setPhase('chapter-end')
  }, [chapter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startReflection() {
    if (!chapter || !book) return
    setPhase('reflection')
    setReflectionError(null)
    const cached = await loadRecap(book.id, chapter.id).catch(() => null)
    if (cached) {
      setReflectionData(cached)
      setReflectionLoading(false)
      return
    }
    setReflectionLoading(true)
    setReflectionData(null)
    try {
      const data = await fetchReflection(chapter.rawText)
      saveRecap(book.id, chapter.id, data).catch(() => {})
      setReflectionData(data)
    } catch (e) {
      setReflectionError(e instanceof Error ? e.message : 'AI request failed.')
    } finally {
      setReflectionLoading(false)
    }
  }

  const { wordIndex, isPlaying, toggle, skipBack } = useRSVP({
    words, initialIndex: initialWordIndex, wpm, onComplete, onProgress,
  })

  const wordIndexRef = useRef(wordIndex)
  useEffect(() => { wordIndexRef.current = wordIndex }, [wordIndex])

  // Flush words on pause
  useEffect(() => {
    if (!isPlaying) {
      flushWords(wordIndexRef.current)
      flushRef.current()
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset words flush cursor on chapter change
  useEffect(() => {
    lastFlushedIndexRef.current = initialWordIndex
  }, [chapterIndex, initialWordIndex])

  async function openBook(newBook: BookMeta, progress: ReadingProgress | null) {
    await saveBook(newBook)
    setBook(newBook)
    if (progress && (progress.chapterIndex > 0 || progress.wordIndex > 0)) {
      setChapterIndex(progress.chapterIndex)
      setInitialWordIndex(progress.wordIndex)
    } else {
      setChapterIndex(0)
      setInitialWordIndex(0)
    }
    setPhase('reading')
    setReflectionData(null)
  }

  function selectChapter(index: number) {
    flushRef.current()
    setChapterIndex(index)
    setInitialWordIndex(0)
    save(index, 0)
  }

  function prevChapter() { if (chapterIndex > 0) selectChapter(chapterIndex - 1) }
  function nextChapter() { if (book && chapterIndex < book.chapters.length - 1) selectChapter(chapterIndex + 1) }

  function continueReading() {
    setPhase('reading')
    setReflectionData(null)
    nextChapter()
  }

  async function retryReflection() {
    if (!chapter || !book) return
    setReflectionLoading(true)
    setReflectionError(null)
    try {
      const data = await fetchReflection(chapter.rawText)
      saveRecap(book.id, chapter.id, data).catch(() => {})
      setReflectionData(data)
    } catch (e) {
      setReflectionError(e instanceof Error ? e.message : 'AI request failed.')
    } finally {
      setReflectionLoading(false)
    }
  }

  function handleTextSizeChange(s: TextSize) {
    setTextSize(s)
    localStorage.setItem('flashreader::textsize', s)
  }

  if (phase === 'landing' || !book || !chapter) {
    return <Library onOpen={openBook} />
  }

  const wordsBeforeChapter = book.chapters.slice(0, chapterIndex).reduce((s, ch) => s + ch.words.length, 0)
  const totalBookWords = book.chapters.reduce((s, ch) => s + ch.words.length, 0)
  const bookPct = totalBookWords > 0 ? ((wordsBeforeChapter + wordIndex) / totalBookWords) * 100 : 0

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setNavOpen(true)}
            className="flex flex-col gap-1 p-2 hover:bg-subtle rounded-lg transition-colors min-h-[44px] min-w-[44px] items-center justify-center shrink-0">
            <span className="block w-4 h-px bg-text-dim" />
            <span className="block w-4 h-px bg-text-dim" />
            <span className="block w-3 h-px bg-text-dim" />
          </button>
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-ui text-text leading-none truncate">{book.title}</p>
            <p className="text-xs text-text-dim mt-0.5 truncate">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-text-dim shrink-0">
          <span className="text-accent font-display tabular-nums px-2">{wpm} WPM</span>
          <span className="hidden md:block tabular-nums text-muted px-2">{bookPct.toFixed(0)}%</span>

          {/* Notes — icon only on mobile, icon+label on desktop */}
          <button onClick={() => setNotesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-subtle hover:text-text transition-colors min-h-[44px] min-w-[44px] justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span className="hidden sm:inline">Notes</span>
          </button>

          {/* Library — icon only on mobile */}
          <button onClick={() => { flushRef.current(); setBook(null); setPhase('landing') }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-subtle hover:text-text transition-colors min-h-[44px] min-w-[44px] justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
            <span className="hidden sm:inline">Library</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-10 px-6 py-10">
        <RSVPDisplay word={words[wordIndex] ?? ''} isPlaying={isPlaying} textSize={textSize} />
        <ProgressBar wordIndex={wordIndex} totalWords={words.length} chapterTitle={chapter.title}
          chapterIndex={chapterIndex} totalChapters={book.chapters.length} />
        <Controls isPlaying={isPlaying} wpm={wpm} textSize={textSize}
          onToggle={toggle} onSkipBack={() => skipBack(10)} onWpmChange={setWpm}
          onPrevChapter={prevChapter} onNextChapter={nextChapter} onTextSizeChange={handleTextSizeChange}
          hasPrev={chapterIndex > 0} hasNext={chapterIndex < book.chapters.length - 1} />
      </main>

      <footer className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted">
        <span className="tabular-nums">{bookPct.toFixed(1)}% of book</span>
        <span className="tabular-nums">{((wordIndex / words.length) * 100).toFixed(0)}% of chapter</span>
      </footer>

      <ChapterNav chapters={book.chapters} currentIndex={chapterIndex}
        onSelect={selectChapter} isOpen={navOpen} onClose={() => setNavOpen(false)} />

      <NotesPanel isOpen={notesOpen} onClose={() => setNotesOpen(false)}
        bookId={book.id} chapterId={chapter.id} chapterTitle={chapter.title}
        wordIndex={wordIndex} onPause={() => { if (isPlaying) toggle() }} />

      <AnimatePresence>
        {phase === 'chapter-end' && (
          <ChapterEndPrompt chapterTitle={chapter.title}
            onSkip={() => { setPhase('reading'); nextChapter() }}
            onReflect={startReflection} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'reflection' && (
          <AIReflection data={reflectionData} loading={reflectionLoading} error={reflectionError}
            onContinue={continueReading} onRetry={retryReflection} chapterTitle={chapter.title} />
        )}
      </AnimatePresence>
    </div>
  )
}
