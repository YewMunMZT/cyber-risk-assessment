'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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

const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Low: { bg: 'bg-green-600', text: 'text-green-700', border: 'border-green-300', badge: 'bg-green-100 text-green-800' },
  Moderate: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-800' },
  High: { bg: 'bg-orange-600', text: 'text-orange-700', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800' },
  Critical: { bg: 'bg-red-600', text: 'text-red-700', border: 'border-red-300', badge: 'bg-red-100 text-red-800' },
  Unclassified: { bg: 'bg-gray-500', text: 'text-gray-700', border: 'border-gray-300', badge: 'bg-gray-100 text-gray-800' },
}

const CAT_ICONS: Record<string, string> = { People: '👥', Process: '⚙️', Technology: '🖥️' }

function getRisk(level: string) {
  return RISK_CONFIG[level] || RISK_CONFIG.Unclassified
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => r.json())
      .then((data) => { setSubmission(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    await fetch(`/api/submissions/${id}`, { method: 'DELETE' })
    router.push('/admin/submissions')
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Submission not found.</p>
        <Link href="/admin/submissions" className="text-uob-red hover:underline text-sm mt-2 inline-block">← Back to submissions</Link>
      </div>
    )
  }

  const risk = getRisk(submission.overallRiskLevel)
  const submittedAt = format(new Date(submission.submittedAt), 'dd MMM yyyy, HH:mm')

  const answersByCategory = submission.answers.reduce<Record<string, Answer[]>>((acc, a) => {
    const cat = a.categorySnapshot
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/admin/submissions" className="text-uob-red hover:underline">Submitted Reports</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-600 font-mono">{submission.reportReferenceNo}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary text-sm py-2"
          >
            🖨️ Print
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Risk Score Banner */}
      <div className={`${risk.bg} text-white rounded-2xl px-8 py-8 mb-6 text-center shadow-lg`}>
        <div className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Overall Risk Score</div>
        <div className="text-6xl font-bold mb-2">{submission.overallRiskScore}</div>
        <div className={`inline-flex items-center gap-2 bg-white/20 rounded-full px-5 py-1.5 text-lg font-semibold`}>
          {submission.overallRiskLevel} Risk
        </div>
        <div className="mt-3 text-xs opacity-70">Ref: {submission.reportReferenceNo} &nbsp;|&nbsp; Submitted: {submittedAt}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Score Breakdown */}
        <div className="card">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">📊 Risk Score Breakdown</h2>
          <div className="space-y-4">
            {(
              [
                { label: 'People', raw: submission.peopleRawScore, weighted: submission.peopleWeightedScore, weight: '20%' },
                { label: 'Process', raw: submission.processRawScore, weighted: submission.processWeightedScore, weight: '40%' },
                { label: 'Technology', raw: submission.technologyRawScore, weighted: submission.technologyWeightedScore, weight: '40%' },
              ] as const
            ).map((cat) => (
              <div key={cat.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {CAT_ICONS[cat.label as keyof typeof CAT_ICONS]} {cat.label}
                    <span className="text-xs text-gray-400 ml-1">({cat.weight})</span>
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{cat.weighted}</span>
                    <span className="text-xs text-gray-400 ml-1">weighted</span>
                  </div>
                </div>
                <ScoreBar score={cat.raw} />
                <div className="text-xs text-gray-400 mt-0.5">Raw: {cat.raw}</div>
              </div>
            ))}
          </div>
          <div className={`mt-4 flex justify-between items-center p-3 rounded-xl border ${risk.border} ${risk.badge}`}>
            <span className="font-bold text-sm">Overall Score</span>
            <span className="text-xl font-bold">{submission.overallRiskScore}</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`card border-l-4 ${risk.border}`}>
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">💡 Recommendation</h2>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 inline-block ${risk.badge}`}>
            {submission.overallRiskLevel} Risk
          </span>
          <h3 className={`font-bold text-sm mb-2 ${risk.text}`}>{submission.recommendationTitle}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{submission.recommendationText}</p>
        </div>
      </div>

      {/* Company Details */}
      <div className="card mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">🏢 Company Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Company Name', value: submission.companyName },
            { label: 'Contact Person', value: submission.contactPersonName },
            { label: 'Email', value: submission.contactEmail },
            { label: 'Contact Number', value: `${submission.countryCode} ${submission.contactNumber}` },
            { label: 'Website', value: submission.website || '—' },
            { label: 'Est. Endpoints', value: submission.estimatedEndpoints.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</div>
              <div className="text-sm text-gray-900 font-medium break-all">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Answers by Category */}
      <div className="card">
        <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">📋 Assessment Answers</h2>
        {(['People', 'Process', 'Technology'] as const).map((cat) => {
          const catAnswers = answersByCategory[cat] || []
          if (catAnswers.length === 0) return null
          return (
            <div key={cat} className="mb-6 last:mb-0">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>{CAT_ICONS[cat]}</span> {cat}
              </h3>
              <div className="space-y-3">
                {catAnswers.map((a, idx) => (
                  <div key={a.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="text-xs font-semibold text-gray-400 mb-1">Q{idx + 1}</div>
                    <div className="text-sm font-medium text-gray-800 mb-2">{a.questionTextSnapshot}</div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 text-sm">✓</span>
                      <span className="text-sm text-gray-700">{a.selectedChoiceText}</span>
                      <span className="ml-auto text-xs font-mono font-bold text-gray-500">Score: {a.selectedChoiceScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Submission?</h3>
            <p className="text-sm text-gray-500 mb-2">
              <strong>{submission.companyName}</strong> — {submission.reportReferenceNo}
            </p>
            <p className="text-sm text-gray-500 mb-5">This will permanently delete the submission and all answers. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
