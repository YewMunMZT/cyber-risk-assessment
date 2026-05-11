export interface AnswerInput {
  questionId: number
  category: string
  selectedChoiceScore: number
}

export interface ScoreResult {
  peopleRawScore: number
  processRawScore: number
  technologyRawScore: number
  peopleWeightedScore: number
  processWeightedScore: number
  technologyWeightedScore: number
  overallRiskScore: number
}

const CATEGORY_WEIGHTS = {
  People: 0.20,
  Process: 0.40,
  Technology: 0.40,
} as const

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calculateScores(answers: AnswerInput[]): ScoreResult {
  const buckets = {
    People: { total: 0, count: 0 },
    Process: { total: 0, count: 0 },
    Technology: { total: 0, count: 0 },
  }

  for (const answer of answers) {
    const cat = answer.category as keyof typeof buckets
    if (buckets[cat] !== undefined) {
      buckets[cat].total += answer.selectedChoiceScore
      buckets[cat].count++
    }
  }

  const peopleRawScore =
    buckets.People.count > 0 ? buckets.People.total / buckets.People.count : 0
  const processRawScore =
    buckets.Process.count > 0 ? buckets.Process.total / buckets.Process.count : 0
  const technologyRawScore =
    buckets.Technology.count > 0 ? buckets.Technology.total / buckets.Technology.count : 0

  const peopleWeightedScore = peopleRawScore * CATEGORY_WEIGHTS.People
  const processWeightedScore = processRawScore * CATEGORY_WEIGHTS.Process
  const technologyWeightedScore = technologyRawScore * CATEGORY_WEIGHTS.Technology

  const overallRiskScore = peopleWeightedScore + processWeightedScore + technologyWeightedScore

  return {
    peopleRawScore: round2(peopleRawScore),
    processRawScore: round2(processRawScore),
    technologyRawScore: round2(technologyRawScore),
    peopleWeightedScore: round2(peopleWeightedScore),
    processWeightedScore: round2(processWeightedScore),
    technologyWeightedScore: round2(technologyWeightedScore),
    overallRiskScore: round2(overallRiskScore),
  }
}

export function generateReferenceNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `RISK-${y}${m}${d}-${rand}`
}

export function getRiskLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low':
      return 'green'
    case 'moderate':
      return 'yellow'
    case 'high':
      return 'orange'
    case 'critical':
      return 'red'
    default:
      return 'gray'
  }
}
