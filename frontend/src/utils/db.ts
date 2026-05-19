import { api } from './api'
import type { BookMeta } from '../types'

export interface BookSummary {
  id: string
  title: string
  author: string
}

export async function saveBook(book: BookMeta): Promise<void> {
  await api.post('/books', book)
}

export async function loadAllBooks(): Promise<BookSummary[]> {
  return api.get<BookSummary[]>('/books')
}

export async function loadBook(id: string): Promise<BookMeta> {
  return api.get<BookMeta>(`/books/${id}`)
}

export async function deleteBook(id: string): Promise<void> {
  await api.del(`/books/${id}`)
}
