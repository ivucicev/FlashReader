import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotes, addNote, deleteNote } from '../utils/notes'
import type { Note } from '../utils/notes'

interface Props {
  isOpen: boolean
  onClose: () => void
  bookId: string
  chapterId: string
  chapterTitle: string
  wordIndex: number
  onPause: () => void
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function NotesPanel({ isOpen, onClose, bookId, chapterId, chapterTitle, wordIndex, onPause }: Props) {
  const [notes, setNotes] = useState<Note[]>([])
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  async function load() {
    const data = await getNotes(bookId).catch(() => [])
    setNotes(data)
  }

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen, bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd() {
    if (!draft.trim()) return
    await addNote({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      bookId,
      chapterId,
      chapterTitle,
      wordIndex,
      text: draft.trim(),
      createdAt: Date.now(),
    })
    setDraft('')
    setAdding(false)
    await load()
  }

  async function handleDelete(noteId: string) {
    await deleteNote(bookId, noteId)
    await load()
  }

  function startAdding() {
    onPause()
    setAdding(true)
  }

  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    const g = n.chapter_title || n.chapter_id
    ;(acc[g] ??= []).push(n)
    return acc
  }, {})

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/50 z-40" initial={{ opacity: 0 }}
            animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-border z-50 flex flex-col"
            initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-sm font-ui text-text">Notes</span>
              <div className="flex items-center gap-2">
                <button onClick={startAdding}
                  className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-white text-xs font-ui transition-colors">
                  + Add
                </button>
                <button onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-subtle hover:bg-border flex items-center justify-center text-text-dim hover:text-text transition-colors text-xs">
                  ✕
                </button>
              </div>
            </div>

            <AnimatePresence>
              {adding && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="border-b border-border overflow-hidden shrink-0">
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-text-dim truncate">{chapterTitle} · word {wordIndex}</p>
                    <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd() }}
                      placeholder="Type your note…" rows={3}
                      className="w-full bg-subtle border border-border rounded-xl px-3 py-2 text-sm text-text placeholder:text-muted resize-none outline-none focus:border-accent transition-colors" />
                    <div className="flex gap-2">
                      <button onClick={handleAdd} disabled={!draft.trim()}
                        className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-dim text-white text-xs font-ui transition-colors disabled:opacity-40">Save</button>
                      <button onClick={() => { setAdding(false); setDraft('') }}
                        className="flex-1 py-2 rounded-lg bg-subtle hover:bg-border text-text-dim text-xs font-ui transition-colors">Cancel</button>
                    </div>
                    <p className="text-xs text-muted">⌘↵ to save</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto py-2">
              {notes.length === 0 && !adding && (
                <p className="text-center text-text-dim text-sm mt-12 px-6">
                  No notes yet. Hit <span className="text-accent">+ Add</span> while reading.
                </p>
              )}
              {Object.entries(grouped).map(([group, groupNotes]) => (
                <div key={group}>
                  <p className="px-5 py-2 text-xs text-muted font-ui truncate">{group}</p>
                  {groupNotes.map(note => (
                    <div key={note.id} className="group px-5 py-3 hover:bg-subtle transition-colors">
                      <p className="text-sm text-text leading-snug whitespace-pre-wrap">{note.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted">{formatDate(note.created_at)}</span>
                        <button onClick={() => handleDelete(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-muted hover:text-red-400 transition-all">delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
