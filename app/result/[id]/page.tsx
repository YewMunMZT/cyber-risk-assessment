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
  Low:          { bg: 'bg-green-600',   text: 'text-green-700',   border: 'border-green-400',   badge: 'bg-green-100 text-green-800',   icon: '✅' },
  Moderate:     { bg: 'bg-amber-500',   text: 'text-amber-700',   border: 'border-amber-400',   badge: 'bg-amber-100 text-amber-800',   icon: '⚠️' },
  High:         { bg: 'bg-orange-600',  text: 'text-orange-700',  border: 'border-orange-400',  badge: 'bg-orange-100 text-orange-800', icon: '🔶' },
  Critical:     { bg: 'bg-uob-red',     text: 'text-uob-red',     border: 'border-uob-red',     badge: 'bg-red-100 text-red-900',       icon: '🚨' },
  Unclassified: { bg: 'bg-gray-500',    text: 'text-gray-700',    border: 'border-gray-400',    badge: 'bg-gray-100 text-gray-800',     icon: '❓' },
}

const CAT_CONFIG: Record<string, { icon: string; color: string }> = {
  People:     { icon: '👥', color: 'text-uob-red' },
  Process:    { icon: '⚙️', color: 'text-uob-dark-2' },
  Technology: { icon: '🖥️', color: 'text-uob-dark-3' },
}

function getRiskConfig(level: string) {
  return RISK_CONFIG[level] || RISK_CONFIG.Unclassified
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className="h-2 rounded-full bg-uob-red transition-all duration-700" style={{ width: `${pct}%` }} />
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
      .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then((data) => { setSubmission(data); setLoading(false) })
      .catch(() => { setError('Report not found or has been removed.'); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-uob-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Loading your risk report...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-uob-light flex items-center justify-center">
        <div className="text-center card max-w-md">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Start New Assessment</button>
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
    <div className="min-h-screen bg-uob-light">

      {/* UOB Top Bar */}
      <div className="bg-uob-dark">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
          <div className="text-uob-red font-black text-2xl tracking-tight">UOB</div>
          <div className="w-px h-5 bg-gray-600" />
          <span className="text-gray-300 text-sm font-medium">Cyber Risk Assessment</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-uob-dark border-b-4 border-uob-red print:shadow-none">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-uob-red flex items-center justify-center text-xl rounded">🛡️</div>
              <div>
                <h1 className="text-lg font-bold text-white">Cybersecurity Risk Assessment Report</h1>
                <p className="text-gray-400 text-xs">Ref: {submission.reportReferenceNo}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 print:hidden">
              <button onClick={() => window.print()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors">
                🖨️ Print
              </button>
              <button onClick={() => router.push('/')} className="btn-primary text-sm py-2 px-4">
                New Assessment
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Email notice */}
        <div className="bg-white border-l-4 border-uob-red rounded px-5 py-3 flex items-center gap-3 text-sm text-gray-700 shadow-sm">
          <span className="text-xl">📧</span>
          <span>A copy of this report has been emailed to <strong>{submission.contactEmail}</strong></span>
        </div>

        {/* Risk Score Banner */}
        <div className={`${risk.bg} text-white rounded shadow-lg overflow-hidden`}>
          <div className="px-8 py-10 text-center">
            <div className="text-4xl mb-2">{risk.icon}</div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Overall Risk Score</div>
            <div className="text-7xl font-bold leading-none mb-3">{submission.overallRiskScore}</div>
            <div className="inline-flex items-center gap-2 bg-black/20 rounded px-5 py-1.5 text-xl font-bold">
              {submission.overallRiskLevel} Risk
            </div>
            <div className="mt-3 text-xs opacity-60">Score range: 0 (lowest risk) — 10 (highest risk)</div>
          </div>
          {/* UOB bottom accent */}
          <div className="h-1 bg-black/20" />
        </div>

        {/* Score breakdown + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Breakdown */}
          <div className="card">
            <h2 className="text-sm font-bold text-uob-dark mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-5 h-5 bg-uob-red rounded text-white text-xs flex items-center justify-center">📊</span>
              Risk Score Breakdown
            </h2>
            <div className="space-y-5">
              {(
                [
                  { label: 'People',     raw: submission.peopleRawScore,     weighted: submission.peopleWeightedScore,     weight: '20%' },
                  { label: 'Process',    raw: submission.processRawScore,    weighted: submission.processWeightedScore,    weight: '40%' },
                  { label: 'Technology', raw: submission.technologyRawScore, weighted: submission.technologyWeightedScore, weight: '40%' },
                ] as const
              ).map((cat) => {
                const cfg = CAT_CONFIG[cat.label as keyof typeof CAT_CONFIG]
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold flex items-center gap-1.5 ${cfg.color}`}>
                        <span>{cfg.icon}</span> {cat.label}
                        <span className="text-xs text-gray-400 font-normal">({cat.weight})</span>
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{cat.weighted}</span>
                        <span className="text-xs text-gray-400 ml-1">weighted</span>
                      </div>
                    </div>
                    <ScoreBar score={cat.raw} />
                    <div className="text-xs text-gray-400 mt-0.5">Raw: {cat.raw}</div>
                  </div>
                )
              })}
            </div>
            {/* Total */}
            <div className={`mt-5 flex justify-between items-center p-3 rounded border-2 ${risk.border} ${risk.badge}`}>
              <span className="font-bold text-sm">Overall Weighted Score</span>
              <span className="text-2xl font-bold">{submission.overallRiskScore}</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`card border-l-4 ${risk.border}`}>
            <h2 className="text-sm font-bold text-uob-dark mb-3 flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-5 h-5 bg-uob-red rounded text-white text-xs flex items-center justify-center">💡</span>
              Recommendation
            </h2>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold mb-3 inline-block ${risk.badge}`}>
              {risk.icon} {submission.overallRiskLevel} Risk
            </span>
            <h3 className={`font-bold text-sm mb-3 ${risk.text}`}>{submission.recommendationTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{submission.recommendationText}</p>
          </div>
        </div>

        {/* Company Details */}
        <div className="card">
          <h2 className="text-sm font-bold text-uob-dark mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-5 h-5 bg-uob-red rounded text-white text-xs flex items-center justify-center">🏢</span>
            Company Details
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Company Name',     value: submission.companyName },
              { label: 'Contact Person',   value: submission.contactPersonName },
              { label: 'Email',            value: submission.contactEmail },
              { label: 'Contact Number',   value: `${submission.countryCode} ${submission.contactNumber}` },
              { label: 'Website',          value: submission.website || '—' },
              { label: 'Est. Endpoints',   value: submission.estimatedEndpoints.toLocaleString() },
              { label: 'Submitted On',     value: submittedAt },
              { label: 'Report Reference', value: submission.reportReferenceNo },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
                <span className="text-sm text-gray-900 font-medium break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Answers */}
        <div className="card">
          <h2 className="text-sm font-bold text-uob-dark mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-5 h-5 bg-uob-red rounded text-white text-xs flex items-center justify-center">📋</span>
            Assessment Responses
          </h2>
          {(['People', 'Process', 'Technology'] as const).map((cat) => {
            const catAnswers = answersByCategory[cat] || []
            if (catAnswers.length === 0) return null
            const cfg = CAT_CONFIG[cat]
            return (
              <div key={cat} className="mb-6 last:mb-0">
                <h3 className={`text-xs font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider ${cfg.color}`}>
                  <span>{cfg.icon}</span> {cat}
                </h3>
                <div className="space-y-2">
                  {catAnswers.map((a, idx) => (
                    <div key={a.id} className="bg-gray-50 rounded p-4 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-400 mb-1">Q{idx + 1}</div>
                      <div className="text-sm font-medium text-gray-800 mb-2">{a.questionTextSnapshot}</div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 text-sm">✓</span>
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
          <button onClick={() => window.print()} className="btn-secondary">🖨️ Print / Save as PDF</button>
          <button onClick={() => router.push('/')} className="btn-primary">Start New Assessment</button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-uob-dark mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-uob-red font-black text-lg">UOB</div>
            <span className="text-gray-500 text-xs">Cyber Risk Assessment</span>
          </div>
          <p className="text-gray-600 text-xs">Ref: {submission.reportReferenceNo}</p>
        </div>
      </footer>
    </div>
  )
}
