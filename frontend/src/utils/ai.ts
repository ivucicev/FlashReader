import type { AIReflectionData } from '../types'

const MAX_CHARS = 30000

async function post(endpoint: string, body: object): Promise<Response> {
  const res = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`AI error (${res.status}): ${err}`)
  }
  return res
}

export async function fetchReflection(chapterText: string): Promise<AIReflectionData> {
  const text = chapterText.slice(0, MAX_CHARS)
  const res = await post('reflect', { text })
  const data = await res.json()
  return data as AIReflectionData
}
