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

function StatCard({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-5 flex items-start gap-4">
      <div className="w-10 h-10 bg-uob-red/10 rounded flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-uob-dark">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

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
          <div className="inline-block w-10 h-10 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-gray-500">Failed to load dashboard data.</div>

  const riskLevels = ['Low', 'Moderate', 'High', 'Critical']

  return (
    <div className="p-6 md:p-8 max-w-7xl">

      {/* Page heading */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-1 h-7 bg-uob-red rounded" />
        <div>
          <h1 className="text-xl font-bold text-uob-dark">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of cyber risk assessment activity</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon="📋" label="Total Submissions"      value={data.totalSubmissions}     sub="All time assessments" />
        <StatCard icon="📝" label="Active Questions"       value={data.totalActiveQuestions} sub="In question bank" />
        <StatCard icon="🎯" label="Recommendation Ranges" value={data.totalRecommendations}  sub="Active score bands" />
        <StatCard icon="📈" label="Average Risk Score"     value={data.avgScore || '—'}       sub="Across all submissions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Risk Level Distribution */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-uob-red rounded" />
            <h2 className="text-sm font-bold text-uob-dark">Submissions by Risk Level</h2>
          </div>
          {data.totalSubmissions === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No submissions yet</p>
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
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: RISK_BAR_COLOR[level] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded shadow-sm p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-uob-red rounded" />
            <h2 className="text-sm font-bold text-uob-dark">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: '/admin/questions',        icon: '📝', label: 'Manage Questions',    sub: 'Add, edit, deactivate' },
              { href: '/admin/recommendations',  icon: '🎯', label: 'Score Ranges',        sub: 'Configure risk bands' },
              { href: '/admin/submissions',      icon: '📋', label: 'View Reports',         sub: 'Browse submissions' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 rounded border-2 border-dashed border-gray-200 hover:border-uob-red hover:bg-red-50/40 transition-all text-center group"
              >
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-uob-red">{item.label}</span>
                <span className="text-xs text-gray-400">{item.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white border border-gray-200 rounded shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-uob-red rounded" />
            <h2 className="text-sm font-bold text-uob-dark">Recent Submissions</h2>
          </div>
          <Link href="/admin/submissions" className="text-xs text-uob-red hover:underline font-medium">
            View all →
          </Link>
        </div>

        {data.recentSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
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
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${RISK_BADGE[sub.overallRiskLevel] || 'bg-gray-100 text-gray-700'}`}>
                        {sub.overallRiskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(sub.submittedAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/submissions/${sub.id}`} className="text-uob-red hover:underline text-xs font-medium">
                        View →
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
