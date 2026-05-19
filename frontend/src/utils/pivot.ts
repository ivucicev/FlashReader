export interface PivotResult {
  before: string
  pivot: string
  after: string
  pivotIndex: number
}

export function calcPivot(word: string): PivotResult {
  const clean = word.replace(/[^a-zA-Z0-9]/g, '')
  const len = clean.length || word.length

  let pivotIndex: number
  if (len <= 1) pivotIndex = 0
  else if (len <= 3) pivotIndex = 0
  else if (len <= 6) pivotIndex = 1
  else if (len <= 9) pivotIndex = 2
  else pivotIndex = Math.floor(len * 0.3)

  // Map pivot from clean to original word position
  let cleanCount = 0
  let realPivotPos = 0
  for (let i = 0; i < word.length; i++) {
    if (/[a-zA-Z0-9]/.test(word[i])) {
      if (cleanCount === pivotIndex) {
        realPivotPos = i
        break
      }
      cleanCount++
    }
  }

  return {
    before: word.slice(0, realPivotPos),
    pivot: word[realPivotPos] ?? '',
    after: word.slice(realPivotPos + 1),
    pivotIndex: realPivotPos,
  }
}

const PUNCT_MULTIPLIERS: Record<string, number> = {
  '.': 2.5,
  '!': 2.0,
  '?': 2.0,
  ',': 1.4,
  ';': 1.5,
  ':': 1.4,
  '—': 1.2,
  '-': 1.1,
}

export function getWordDelay(word: string, wpm: number): number {
  const base = 60000 / wpm
  const lastChar = word[word.length - 1]
  const multiplier = PUNCT_MULTIPLIERS[lastChar] ?? 1
  return base * multiplier
}
