'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Submission {
  id: number
  reportReferenceNo: string
  companyName: string
  contactPersonName: string
  contactEmail: string
  contactNumber: string
  countryCode: string
  estimatedEndpoints: number
  overallRiskScore: number
  overallRiskLevel: string
  submittedAt: string
}

const RISK_BADGE: Record<string, string> = {
  Low: 'bg-green-100 text-green-800',
  Moderate: 'bg-amber-100 text-amber-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
}

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Critical']

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (riskFilter) params.set('riskLevel', riskFilter)
    const res = await fetch(`/api/submissions?${params}`)
    const data = await res.json()
    setSubmissions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [debouncedSearch, riskFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submitted Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            className="input-field"
            placeholder="Search company, contact or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500 font-medium">Risk:</span>
          <button
            onClick={() => setRiskFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!riskFilter ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            All
          </button>
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(riskFilter === level ? '' : level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                riskFilter === level
                  ? RISK_BADGE[level].replace('bg-', 'bg-').replace('100', '400').replace('text-', 'text-white bg-') + ' text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {level}
            </button>
          ))}
          {search || riskFilter ? (
            <button
              onClick={() => { setSearch(''); setRiskFilter('') }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 text-sm">
            {search || riskFilter ? 'No submissions match your filters.' : 'No submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Reference No.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Submitted</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Endpoints</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risk Level</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{s.reportReferenceNo}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap text-xs">
                      {format(new Date(s.submittedAt), 'dd MMM yyyy')}
                      <div className="text-gray-400">{format(new Date(s.submittedAt), 'HH:mm')}</div>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900 max-w-[160px]">
                      <div className="truncate">{s.companyName}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 max-w-[140px]">
                      <div className="truncate">{s.contactPersonName}</div>
                      <div className="text-xs text-gray-400 truncate">{s.countryCode} {s.contactNumber}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-xs max-w-[160px]">
                      <div className="truncate">{s.contactEmail}</div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700">{s.estimatedEndpoints.toLocaleString()}</td>
                    <td className="px-4 py-4 text-center font-bold text-lg text-gray-900">{s.overallRiskScore}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${RISK_BADGE[s.overallRiskLevel] || 'bg-gray-100 text-gray-800'}`}>
                        {s.overallRiskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/submissions/${s.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-uob-red bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
