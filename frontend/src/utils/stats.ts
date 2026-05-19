import { api } from './api'

type DailyMap = Record<string, number>

function dateKey(d = new Date()): string {
  return d.toLocaleDateString('sv')
}

export async function recordWordsRead(count: number): Promise<void> {
  if (count <= 0) return
  await api.post('/stats/daily', { date: dateKey(), count })
}

export async function getDailyStats(): Promise<DailyMap> {
  return api.get<DailyMap>('/stats/daily')
}

export function calcStreak(stats: DailyMap): number {
  const d = new Date()
  if (!stats[dateKey(d)]) {
    d.setDate(d.getDate() - 1)
    if (!stats[dateKey(d)]) return 0
  }
  let streak = 1
  d.setDate(d.getDate() - 1)
  while (stats[dateKey(d)]) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function calcLast7(stats: DailyMap): { date: string; words: number; label: string }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = dateKey(d)
    return { date, words: stats[date] ?? 0, label: d.toLocaleDateString(undefined, { weekday: 'short' }) }
  })
}
