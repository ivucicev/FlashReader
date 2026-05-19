import { api } from './api'

export interface Note {
  id: string
  book_id: string
  chapter_id: string
  chapter_title: string
  word_index: number
  text: string
  created_at: number
}

export async function getNotes(bookId: string): Promise<Note[]> {
  return api.get<Note[]>(`/notes/${bookId}`)
}

export async function addNote(note: {
  id: string; bookId: string; chapterId: string
  chapterTitle: string; wordIndex: number; text: string; createdAt: number
}): Promise<void> {
  await api.post(`/notes/${note.bookId}`, {
    id: note.id,
    chapterId: note.chapterId,
    chapterTitle: note.chapterTitle,
    wordIndex: note.wordIndex,
    text: note.text,
    createdAt: note.createdAt,
  })
}

export async function deleteNote(bookId: string, noteId: string): Promise<void> {
  await api.del(`/notes/${noteId}`)
  void bookId
}
