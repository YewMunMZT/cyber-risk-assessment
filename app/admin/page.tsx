'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface DashboardData {
  totalSubmissions: number
  totalActiveQuestions: number
  totalRecommendations: number
  avgScore: number
  byRiskLevel: Record<string, number>
  recentSubmissions: Array<{
    id: number
    companyName: string
    contactPersonName: string
    overallRiskScore: number
    overallRiskLevel: string
    reportReferenceNo: string
    submittedAt: string
  }>
}

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const DocumentsIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)
const QuestionIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
)
const TargetIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const TrendingIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
  </svg>
)
const InboxIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
  </svg>
)
const PencilIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
)
const ArrowRightIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
)

/* ─── Constants ─────────────────────────────────────────────────── */
const RISK_BADGE: Record<string, string> = {
  Low:      'bg-green-100 text-green-800',
  Moderate: 'bg-amber-100 text-amber-800',
  High:     'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-900',
}

const RISK_BAR_COLOR: Record<string, string> = {
  Low:      '#16a34a',
  Moderate: '#d97706',
  High:     '#ea580c',
  Critical: '#CC0000',
}

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({
  Icon,
  label,
  value,
  sub,
}: {
  Icon: ({ className }: { className?: string }) => JSX.Element
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="bg-white border border-uob-border p-5 flex items-start gap-4" style={{ borderRadius: 2 }}>
      <div className="w-10 h-10 bg-uob-navy/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-uob-navy" />
      </div>
      <div>
        <div className="text-2xl font-bold text-uob-dark">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Quick Action Card ─────────────────────────────────────────── */
function ActionCard({
  href,
  Icon,
  label,
  sub,
}: {
  href: string
  Icon: ({ className }: { className?: string }) => JSX.Element
  label: string
  sub: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-gray-200 hover:border-uob-navy hover:bg-blue-50/40 transition-all text-center group"
      style={{ borderRadius: 2 }}
    >
      <div className="w-10 h-10 bg-uob-navy/10 group-hover:bg-uob-navy/15 flex items-center justify-center transition-colors">
        <Icon className="w-5 h-5 text-uob-navy" />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-uob-navy">{label}</span>
      <span className="text-xs text-gray-400">{sub}</span>
    </Link>
  )
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-blue-200 border-t-uob-navy rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="p-8 text-center text-gray-500">Failed to load dashboard data.</div>
  }

  const riskLevels = ['Low', 'Moderate', 'High', 'Critical']

  return (
    <div className="p-6 md:p-8 max-w-7xl">

      {/* Page heading */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1 h-7 bg-uob-navy" />
        <div>
          <h1 className="text-xl font-bold text-uob-dark">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of cyber risk assessment activity</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard Icon={DocumentsIcon} label="Total Submissions"      value={data.totalSubmissions}     sub="All time assessments" />
        <StatCard Icon={QuestionIcon}  label="Active Questions"       value={data.totalActiveQuestions} sub="In question bank" />
        <StatCard Icon={TargetIcon}    label="Recommendation Ranges"  value={data.totalRecommendations} sub="Active score bands" />
        <StatCard Icon={TrendingIcon}  label="Average Risk Score"     value={data.avgScore || '—'}       sub="Across all submissions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Risk Level Distribution */}
        <div className="bg-white border border-uob-border p-5" style={{ borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-uob-navy" />
            <h2 className="text-sm font-bold text-uob-dark">Submissions by Risk Level</h2>
          </div>
          {data.totalSubmissions === 0 ? (
            <div className="text-center py-8">
              <InboxIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskLevels.map((level) => {
                const count = data.byRiskLevel[level] || 0
                const pct = data.totalSubmissions > 0 ? (count / data.totalSubmissions) * 100 : 0
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{level}</span>
                      <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: RISK_BAR_COLOR[level] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-uob-border p-5 lg:col-span-2" style={{ borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-uob-navy" />
            <h2 className="text-sm font-bold text-uob-dark">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ActionCard href="/admin/questions"       Icon={QuestionIcon}  label="Manage Questions" sub="Add, edit, deactivate" />
            <ActionCard href="/admin/recommendations" Icon={TargetIcon}    label="Score Ranges"     sub="Configure risk bands" />
            <ActionCard href="/admin/submissions"     Icon={DocumentsIcon} label="View Reports"      sub="Browse submissions" />
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-uob-border" style={{ borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-uob-navy" />
            <h2 className="text-sm font-bold text-uob-dark">Recent Submissions</h2>
          </div>
          <Link href="/admin/submissions" className="text-xs text-uob-navy hover:underline font-medium flex items-center gap-1">
            View all <ArrowRightIcon className="w-3 h-3" />
          </Link>
        </div>

        {data.recentSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <InboxIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No submissions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Share the public assessment link to receive responses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Reference', 'Company', 'Contact', 'Score', 'Risk Level', 'Date', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{sub.reportReferenceNo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sub.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">{sub.contactPersonName}</td>
                    <td className="px-4 py-3 font-bold text-uob-dark">{sub.overallRiskScore}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold ${RISK_BADGE[sub.overallRiskLevel] || 'bg-gray-100 text-gray-700'}`}>
                        {sub.overallRiskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(sub.submittedAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/submissions/${sub.id}`} className="text-xs font-medium text-uob-navy hover:underline flex items-center gap-1">
                        View <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
