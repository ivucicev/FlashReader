export interface Chapter {
  id: string
  title: string
  words: string[]
  rawText: string
}

export interface BookMeta {
  id: string
  title: string
  author: string
  chapters: Chapter[]
}

export interface ReadingProgress {
  chapterIndex: number
  wordIndex: number
  lastRead: number
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export interface AIReflectionData {
  recap: string
  quiz: QuizQuestion[]
}

export type AppPhase =
  | 'landing'
  | 'reading'
  | 'chapter-end'
  | 'reflection'
