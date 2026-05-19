import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import OpenAI from 'openai'
import 'dotenv/config'
import { bookQueries, progressQueries, recapQueries, noteQueries, statsQueries } from './db.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json({ limit: '10mb' }))

const aiLimiter = rateLimit({ windowMs: 60000, max: 20, standardHeaders: true })

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Books ──────────────────────────────────────────────────────────────────

app.get('/api/books', (_req, res) => {
  res.json(bookQueries.list.all())
})

app.get('/api/books/:id', (req, res) => {
  const row = bookQueries.get.get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  res.json(JSON.parse(row.data))
})

app.post('/api/books', (req, res) => {
  const { id, title, author } = req.body
  if (!id || !title) return res.status(400).json({ error: 'id and title required' })
  bookQueries.upsert.run(id, title, author ?? '', JSON.stringify(req.body))
  res.json({ ok: true })
})

app.delete('/api/books/:id', (req, res) => {
  bookQueries.del.run(req.params.id)
  progressQueries.del.run(req.params.id)
  res.json({ ok: true })
})

// ── Progress ───────────────────────────────────────────────────────────────

app.get('/api/progress/:bookId', (req, res) => {
  const row = progressQueries.get.get(req.params.bookId)
  if (!row) return res.json(null)
  res.json({ chapterIndex: row.chapter_index, wordIndex: row.word_index, lastRead: row.last_read })
})

app.put('/api/progress/:bookId', (req, res) => {
  const { chapterIndex, wordIndex } = req.body
  progressQueries.upsert.run(req.params.bookId, chapterIndex ?? 0, wordIndex ?? 0, Date.now())
  res.json({ ok: true })
})

// ── Recaps ─────────────────────────────────────────────────────────────────

app.get('/api/recap/:bookId/:chapterId', (req, res) => {
  const row = recapQueries.get.get(req.params.bookId, req.params.chapterId)
  if (!row) return res.json(null)
  res.json({ recap: row.recap, quiz: JSON.parse(row.quiz) })
})

app.post('/api/recap/:bookId/:chapterId', (req, res) => {
  const { recap, quiz } = req.body
  recapQueries.upsert.run(req.params.bookId, req.params.chapterId, recap, JSON.stringify(quiz))
  res.json({ ok: true })
})

// ── Notes ──────────────────────────────────────────────────────────────────

app.get('/api/notes/:bookId', (req, res) => {
  res.json(noteQueries.list.all(req.params.bookId))
})

app.post('/api/notes/:bookId', (req, res) => {
  const { id, chapterId, chapterTitle, wordIndex, text, createdAt } = req.body
  noteQueries.insert.run(id, req.params.bookId, chapterId, chapterTitle, wordIndex, text, createdAt)
  res.json({ ok: true })
})

app.delete('/api/notes/:noteId', (req, res) => {
  noteQueries.del.run(req.params.noteId)
  res.json({ ok: true })
})

// ── Stats ──────────────────────────────────────────────────────────────────

app.get('/api/stats/daily', (_req, res) => {
  const rows = statsQueries.all.all()
  const map = Object.fromEntries(rows.map(r => [r.date, r.words]))
  res.json(map)
})

app.post('/api/stats/daily', (req, res) => {
  const { date, count } = req.body
  if (!date || !count) return res.status(400).json({ error: 'date and count required' })
  statsQueries.upsert.run(date, count)
  res.json({ ok: true })
})

// ── AI ─────────────────────────────────────────────────────────────────────

async function callOpenAI(prompt, json = false, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      })
      return res.choices[0].message.content ?? ''
    } catch (err) {
      if (err?.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }
      throw err
    }
  }
}

function extractJson(text) {
  try { return JSON.parse(text) } catch {}
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (m) { try { return JSON.parse(m[1].trim()) } catch {} }
  const s = text.indexOf('{'), e = text.lastIndexOf('}')
  if (s !== -1 && e !== -1) { try { return JSON.parse(text.slice(s, e + 1)) } catch {} }
  throw new Error('Could not extract JSON from AI response')
}

app.post('/api/reflect', aiLimiter, async (req, res) => {
  const { text } = req.body
  if (!text) return res.status(400).json({ error: 'text required' })

  const t = text.slice(0, 30000)
  const recapPrompt = `Summarize the key points of this text in 3-5 short sentences. Be direct, no fluff:\n\n${t}\n\nSummary:`
  const quizPrompt = `Based on this text, create a 3-question multiple choice quiz. Return ONLY a JSON object:\n{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}\n\nText:\n${t.slice(0, 15000)}`

  try {
    const [recapText, quizText] = await Promise.all([
      callOpenAI(recapPrompt, false),
      callOpenAI(quizPrompt, true),
    ])
    const { questions = [] } = extractJson(quizText)
    res.json({
      recap: recapText.trim(),
      quiz: questions.map(q => ({ question: q.question, options: q.options, correctIndex: Number(q.correctIndex) })),
    })
  } catch (err) {
    console.error('AI error:', err?.message)
    res.status(500).json({ error: err?.message ?? 'AI request failed' })
  }
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`FlashReader backend → http://localhost:${PORT}`)
  if (!process.env.OPENAI_API_KEY) console.warn('⚠  OPENAI_API_KEY not set')
})
