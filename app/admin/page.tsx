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
  Low: 'bg-green-100 text-green-800',
  Moderate: 'bg-amber-100 text-amber-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
}

const RISK_COLORS: Record<string, string> = {
  Low: '#16a34a',
  Moderate: '#d97706',
  High: '#ea580c',
  Critical: '#dc2626',
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="card flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color ? `${color}20` : '#e0e9ff' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
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
          <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of cyber risk assessment submissions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📋"
          label="Total Submissions"
          value={data.totalSubmissions}
          sub="All time assessments"
          color="#6366f1"
        />
        <StatCard
          icon="📝"
          label="Active Questions"
          value={data.totalActiveQuestions}
          sub="In question bank"
          color="#0891b2"
        />
        <StatCard
          icon="🎯"
          label="Recommendation Ranges"
          value={data.totalRecommendations}
          sub="Active score bands"
          color="#7c3aed"
        />
        <StatCard
          icon="📈"
          label="Average Risk Score"
          value={data.avgScore || '—'}
          sub="Across all submissions"
          color="#d97706"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Risk Level Distribution */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">Submissions by Risk Level</h2>
          {data.totalSubmissions === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {riskLevels.map((level) => {
                const count = data.byRiskLevel[level] || 0
                const pct = data.totalSubmissions > 0 ? (count / data.totalSubmissions) * 100 : 0
                const color = RISK_COLORS[level]
                return (
                  <div key={level}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{level}</span>
                      <span className="text-gray-500">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/questions"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center group"
            >
              <span className="text-3xl">📝</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-700">Manage Questions</span>
              <span className="text-xs text-gray-400">Add, edit or deactivate questions</span>
            </Link>
            <Link
              href="/admin/recommendations"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-center group"
            >
              <span className="text-3xl">🎯</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-violet-700">Score Ranges</span>
              <span className="text-xs text-gray-400">Configure risk bands</span>
            </Link>
            <Link
              href="/admin/submissions"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group"
            >
              <span className="text-3xl">📋</span>
              <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">View Reports</span>
              <span className="text-xs text-gray-400">Browse submissions</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Recent Submissions</h2>
          <Link href="/admin/submissions" className="text-sm text-indigo-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {data.recentSubmissions.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-500 text-sm">No submissions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Share the public assessment link to start receiving responses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-gray-500">{sub.reportReferenceNo}</td>
                    <td className="py-3 px-3 font-medium text-gray-900">{sub.companyName}</td>
                    <td className="py-3 px-3 text-gray-600">{sub.contactPersonName}</td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{sub.overallRiskScore}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE[sub.overallRiskLevel] || 'bg-gray-100 text-gray-800'}`}>
                        {sub.overallRiskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-xs whitespace-nowrap">
                      {format(new Date(sub.submittedAt), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                      >
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
