import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AIReflectionData } from '../types'

interface Props {
  data: AIReflectionData | null
  loading: boolean
  error: string | null
  onContinue: () => void
  onRetry: () => void
  chapterTitle: string
}

export function AIReflection({ data, loading, error, onContinue, onRetry, chapterTitle }: Props) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (Object.keys(selectedAnswers).length < (data?.quiz.length ?? 0)) return
    setSubmitted(true)
  }

  function score(): number {
    if (!data) return 0
    return data.quiz.filter((q, i) => selectedAnswers[i] === q.correctIndex).length
  }

  return (
    <motion.div
      className="fixed inset-0 bg-bg/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-2xl bg-surface border border-border rounded-3xl overflow-hidden"
        initial={{ scale: 0.96, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        {/* Header */}
        <div className="p-8 border-b border-border">
          <h2 className="text-xl font-ui font-medium text-text truncate">{chapterTitle}</h2>
          <p className="text-xs text-text-dim mt-1">Chapter complete — recap &amp; quiz</p>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-12">
              <motion.div
                className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-text-dim text-sm font-display">Generating recap + quiz…</p>
            </div>
          )}

          {error && (
            <div className="space-y-4 text-center py-8">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={onRetry}
                className="px-6 py-2 bg-subtle hover:bg-border rounded-xl text-sm font-ui text-text-dim hover:text-text transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Recap */}
              <section>
                <div className="text-xs font-display text-text-dim tracking-widest uppercase mb-3">
                  Chapter Recap
                </div>
                <p className="text-text text-sm leading-relaxed font-ui">{data.recap}</p>
              </section>

              {/* Quiz */}
              <section>
                <div className="text-xs font-display text-text-dim tracking-widest uppercase mb-4">
                  Retention Quiz
                </div>
                <div className="space-y-6">
                  {data.quiz.map((q, qi) => (
                    <div key={qi}>
                      <p className="text-text font-ui text-sm mb-3">
                        <span className="text-accent font-display mr-2">Q{qi + 1}.</span>
                        {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => {
                          const selected = selectedAnswers[qi] === oi
                          const correct = submitted && oi === q.correctIndex
                          const wrong = submitted && selected && oi !== q.correctIndex

                          return (
                            <button
                              key={oi}
                              disabled={submitted}
                              onClick={() => setSelectedAnswers(a => ({ ...a, [qi]: oi }))}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-ui transition-colors border min-h-[44px] ${
                                correct
                                  ? 'border-green-500 bg-green-500/10 text-green-400'
                                  : wrong
                                  ? 'border-red-500 bg-red-500/10 text-red-400'
                                  : selected
                                  ? 'border-accent bg-accent/10 text-accent'
                                  : 'border-border bg-subtle text-text-dim hover:border-muted hover:text-text'
                              }`}
                            >
                              <span className="font-display text-xs mr-2 opacity-60">
                                {['A', 'B', 'C', 'D'][oi]}.
                              </span>
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 rounded-xl bg-subtle border border-border text-center"
                    >
                      <p className="text-text font-ui text-sm">
                        Score:{' '}
                        <span className={`font-display text-lg ${score() === data.quiz.length ? 'text-green-400' : score() >= data.quiz.length / 2 ? 'text-accent' : 'text-red-400'}`}>
                          {score()}/{data.quiz.length}
                        </span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="p-6 border-t border-border flex gap-3 justify-end">
            {!submitted && (
              <button
                onClick={submit}
                disabled={Object.keys(selectedAnswers).length < data.quiz.length}
                className="px-6 py-2.5 rounded-xl text-sm font-ui bg-subtle hover:bg-border text-text-dim hover:text-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                Submit Quiz
              </button>
            )}
            <button
              onClick={onContinue}
              className="px-6 py-2.5 rounded-xl text-sm font-ui bg-accent hover:bg-accent-dim text-white transition-colors min-h-[44px]"
            >
              Continue Reading
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
