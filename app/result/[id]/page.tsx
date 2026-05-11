'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Answer {
  id: number
  questionTextSnapshot: string
  categorySnapshot: string
  selectedChoiceText: string
  selectedChoiceScore: number
}

interface Submission {
  id: number
  companyName: string
  contactPersonName: string
  contactNumber: string
  countryCode: string
  contactEmail: string
  website: string | null
  estimatedEndpoints: number
  peopleRawScore: number
  processRawScore: number
  technologyRawScore: number
  peopleWeightedScore: number
  processWeightedScore: number
  technologyWeightedScore: number
  overallRiskScore: number
  overallRiskLevel: string
  recommendationTitle: string
  recommendationText: string
  submittedAt: string
  reportReferenceNo: string
  answers: Answer[]
}

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; badge: string; icon: string }> = {
  Low: {
    bg: 'bg-green-600',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  Moderate: {
    bg: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    icon: '⚠️',
  },
  High: {
    bg: 'bg-orange-600',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-800',
    icon: '🔶',
  },
  Critical: {
    bg: 'bg-red-600',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
    icon: '🚨',
  },
  Unclassified: {
    bg: 'bg-gray-500',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-100 text-gray-800',
    icon: '❓',
  },
}

const CAT_CONFIG: Record<string, { icon: string; color: string }> = {
  People: { icon: '👥', color: 'text-violet-700' },
  Process: { icon: '⚙️', color: 'text-blue-700' },
  Technology: { icon: '🖥️', color: 'text-teal-700' },
}

function getRiskConfig(level: string) {
  return RISK_CONFIG[level] || RISK_CONFIG.Unclassified
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div
        className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found')
        return r.json()
      })
      .then((data) => {
        setSubmission(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Report not found or has been removed.')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading your risk report...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Start New Assessment
          </button>
        </div>
      </div>
    )
  }

  const risk = getRiskConfig(submission.overallRiskLevel)
  const submittedAt = format(new Date(submission.submittedAt), 'dd MMM yyyy, HH:mm')

  const answersByCategory = submission.answers.reduce<Record<string, Answer[]>>((acc, a) => {
    const cat = a.categorySnapshot
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-950 text-white shadow-lg print:shadow-none">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl">🛡️</div>
              <div>
                <h1 className="text-xl font-bold">Cyber Risk Assessment Report</h1>
                <p className="text-indigo-300 text-sm">Ref: {submission.reportReferenceNo}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors print:hidden"
              >
                🖨️ Print Report
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors print:hidden"
              >
                New Assessment
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Email sent notice */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm text-indigo-800">
          <span className="text-xl">📧</span>
          <span>A copy of this report has been emailed to <strong>{submission.contactEmail}</strong></span>
        </div>

        {/* Overall Risk Score Card */}
        <div className={`rounded-2xl shadow-lg overflow-hidden`}>
          <div className={`${risk.bg} text-white px-8 py-10 text-center`}>
            <div className="text-5xl mb-2">{risk.icon}</div>
            <div className="text-sm font-medium uppercase tracking-wider opacity-90 mb-1">Overall Risk Score</div>
            <div className="text-7xl font-bold leading-none mb-3">{submission.overallRiskScore}</div>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-1.5 text-xl font-semibold">
              {submission.overallRiskLevel} Risk
            </div>
            <div className="mt-3 text-sm opacity-75">Score range: 0 (lowest risk) — 10 (highest risk)</div>
          </div>
        </div>

        {/* Score Breakdown + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Risk Score Breakdown
            </h2>
            <div className="space-y-5">
              {(
                [
                  { label: 'People', raw: submission.peopleRawScore, weighted: submission.peopleWeightedScore, weight: '20%' },
                  { label: 'Process', raw: submission.processRawScore, weighted: submission.processWeightedScore, weight: '40%' },
                  { label: 'Technology', raw: submission.technologyRawScore, weighted: submission.technologyWeightedScore, weight: '40%' },
                ] as const
              ).map((cat) => {
                const cfg = CAT_CONFIG[cat.label as keyof typeof CAT_CONFIG]
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <span>{cfg.icon}</span> {cat.label}
                        <span className="text-xs text-gray-400 font-normal">({cat.weight})</span>
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{cat.weighted}</span>
                        <span className="text-xs text-gray-400 ml-1">weighted</span>
                      </div>
                    </div>
                    <ScoreBar score={cat.raw} />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                      <span>Raw score: {cat.raw}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total */}
            <div className={`mt-5 p-4 rounded-xl border-2 ${risk.border} ${risk.badge.includes('green') ? 'bg-green-50' : risk.badge.includes('amber') ? 'bg-amber-50' : risk.badge.includes('orange') ? 'bg-orange-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800 text-sm">Overall Weighted Score</span>
                <span className={`text-2xl font-bold ${risk.text}`}>{submission.overallRiskScore}</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`card border-l-4 ${risk.border}`}>
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>💡</span> Recommendation
            </h2>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${risk.badge}`}>
              {risk.icon} {submission.overallRiskLevel} Risk Level
            </div>
            <h3 className={`font-bold text-sm mb-3 ${risk.text}`}>
              {submission.recommendationTitle}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {submission.recommendationText}
            </p>
          </div>
        </div>

        {/* Company Summary */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏢</span> Company Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {[
              { label: 'Company Name', value: submission.companyName },
              { label: 'Contact Person', value: submission.contactPersonName },
              { label: 'Email', value: submission.contactEmail },
              { label: 'Contact Number', value: `${submission.countryCode} ${submission.contactNumber}` },
              { label: 'Website', value: submission.website || '—' },
              { label: 'Estimated Endpoints', value: submission.estimatedEndpoints.toLocaleString() },
              { label: 'Submitted On', value: submittedAt },
              { label: 'Report Reference', value: submission.reportReferenceNo },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
                <span className="text-sm text-gray-900 font-medium break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Answered Questions */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
            <span>📋</span> Assessment Responses
          </h2>
          {(['People', 'Process', 'Technology'] as const).map((cat) => {
            const catAnswers = answersByCategory[cat] || []
            if (catAnswers.length === 0) return null
            const cfg = CAT_CONFIG[cat]
            return (
              <div key={cat} className="mb-6 last:mb-0">
                <h3 className={`text-sm font-bold mb-3 flex items-center gap-1.5 ${cfg.color}`}>
                  <span>{cfg.icon}</span> {cat}
                </h3>
                <div className="space-y-3">
                  {catAnswers.map((a, idx) => (
                    <div key={a.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Q{idx + 1}</p>
                      <p className="text-sm font-medium text-gray-800 mb-2">{a.questionTextSnapshot}</p>
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-sm mt-0.5">✓</span>
                        <span className="text-sm text-gray-700 leading-snug">{a.selectedChoiceText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
          <button onClick={() => window.print()} className="btn-secondary">
            🖨️ Print / Save as PDF
          </button>
          <button onClick={() => router.push('/')} className="btn-primary">
            Start New Assessment
          </button>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-200 mt-8 print:hidden">
        Cyber Risk Assessment System &bull; Report Ref: {submission.reportReferenceNo}
      </footer>
    </div>
  )
}
