import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { parseEpub } from '../utils/epubParser'
import type { BookMeta } from '../types'

interface Props {
  onBook: (book: BookMeta) => void
}

export function DropZone({ onBook }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.epub')) {
      setError('Only .epub files are supported.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const book = await parseEpub(file)
      onBook(book)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse ePub.')
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-6">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-display font-medium text-text tracking-tight">
          Flash<span className="text-accent">Reader</span>
        </h1>
        <p className="mt-3 text-text-dim text-sm font-ui">
          Speed reading · Up to 1200 WPM · AI comprehension check
        </p>
      </div>

      {/* Drop Zone */}
      <motion.div
        className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors duration-200 ${
          dragging
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-muted bg-surface'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={onInputChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-text-dim text-sm font-display">Parsing ePub…</span>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-4 text-muted select-none">⊕</div>
            <p className="text-text font-ui font-medium mb-1">
              Drop your <span className="text-accent">.epub</span> here
            </p>
            <p className="text-text-dim text-sm">or click to browse</p>
            <p className="mt-6 text-text-dim text-xs">DRM-free .epub only</p>
          </>
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-red-400 text-sm font-ui"
        >
          {error}
        </motion.p>
      )}

    </div>
  )
}
