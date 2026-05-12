'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

/* ─── Types ──────────────────────────────────────────────────────── */
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

interface VACheck { pass: boolean; label: string; detail: string }
interface VAResult {
  reachable: boolean
  url?: string
  isHttps?: boolean
  responseTimeMs?: number
  checks?: Record<string, VACheck>
  score?: number
  maxScore?: number
  grade?: string
  error?: string
}

/* ─── SVG Icons ──────────────────────────────────────────────────── */
const ShieldCheckIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)
const MailIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)
const PrinterIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
  </svg>
)
const BarChartIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
)
const LightbulbIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>
)
const BuildingIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
)
const ClipboardIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
)
const UsersIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)
const CogIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const MonitorIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
  </svg>
)
const CheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)
const XCircleIcon = ({ className = 'w-12 h-12' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ScanIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
)
const PassIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)
const FailIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const GlobeIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)
const AlertTriangleIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
)

/* ─── Config maps ────────────────────────────────────────────────── */
const RISK_CONFIG: Record<string, { bg: string; text: string; border: string; badge: string; barColor: string }> = {
  Low:          { bg: 'bg-green-600',  text: 'text-green-700',  border: 'border-green-400',  badge: 'bg-green-100 text-green-800',  barColor: '#16a34a' },
  Moderate:     { bg: 'bg-amber-500',  text: 'text-amber-700',  border: 'border-amber-400',  badge: 'bg-amber-100 text-amber-800',  barColor: '#d97706' },
  High:         { bg: 'bg-orange-600', text: 'text-orange-700', border: 'border-orange-400', badge: 'bg-orange-100 text-orange-800', barColor: '#ea580c' },
  Critical:     { bg: 'bg-uob-red',    text: 'text-uob-red',    border: 'border-red-400',    badge: 'bg-red-100 text-red-900',      barColor: '#CC0000' },
  Unclassified: { bg: 'bg-gray-500',   text: 'text-gray-700',   border: 'border-gray-400',   badge: 'bg-gray-100 text-gray-800',   barColor: '#6b7280' },
}

const CAT_CONFIG = {
  People:     { Icon: UsersIcon,   color: 'text-uob-navy' },
  Process:    { Icon: CogIcon,     color: 'text-uob-navy' },
  Technology: { Icon: MonitorIcon, color: 'text-uob-navy' },
}

const VA_CHECK_ORDER = [
  'https', 'hsts', 'xFrameOptions', 'csp',
  'xContentTypeOptions', 'referrerPolicy', 'permissionsPolicy', 'serverHeader',
]

function getRiskConfig(level: string) {
  return RISK_CONFIG[level] || RISK_CONFIG.Unclassified
}

function gradeColor(g: string) {
  return g === 'A' ? 'bg-green-600'
       : g === 'B' ? 'bg-blue-600'
       : g === 'C' ? 'bg-amber-500'
       : g === 'D' ? 'bg-orange-600'
       : 'bg-red-600'
}

function gradeLabel(g: string) {
  return g === 'A' ? 'Excellent'
       : g === 'B' ? 'Good'
       : g === 'C' ? 'Fair'
       : g === 'D' ? 'Poor'
       : 'Critical'
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function VAResultCard({ result, scanning }: { result: VAResult | null; scanning: boolean }) {
  if (scanning) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 text-xs text-blue-700" style={{ borderRadius: 2 }}>
        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
        Running lightweight vulnerability scan on the submitted website...
      </div>
    )
  }

  if (!result) return null

  if (!result.reachable) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 text-xs text-amber-800" style={{ borderRadius: 2 }}>
        <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Website scan unavailable — </span>
          {result.error || 'The website could not be reached for scanning.'}
        </div>
      </div>
    )
  }

  const grade   = result.grade ?? 'F'
  const passed  = result.score ?? 0
  const total   = result.maxScore ?? 0
  const checks  = result.checks ?? {}

  return (
    <div className="border border-uob-border bg-white overflow-hidden" style={{ borderRadius: 2 }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-uob-navy">
        <div className="flex items-center gap-2 text-white">
          <ScanIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide">Website Vulnerability Assessment</span>
          <span className="text-blue-300 text-xs hidden md:inline truncate max-w-xs">— {result.url}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {result.responseTimeMs !== undefined && (
            <span className="text-blue-300 text-xs">{result.responseTimeMs}ms</span>
          )}
          {result.isHttps && (
            <span className="flex items-center gap-1 text-xs text-green-300 font-medium">
              <GlobeIcon /> HTTPS
            </span>
          )}
        </div>
      </div>

      {/* Grade row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-uob-border">
        <div className={`w-14 h-14 flex flex-col items-center justify-center text-white flex-shrink-0 ${gradeColor(grade)}`} style={{ borderRadius: 2 }}>
          <span className="text-2xl font-black leading-none">{grade}</span>
          <span className="text-xs font-medium opacity-80 mt-0.5">{gradeLabel(grade)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-700">Security Header Score</span>
            <span className="text-xs font-bold text-gray-900">{passed} / {total} passed</span>
          </div>
          <div className="w-full bg-gray-100 h-2" style={{ borderRadius: 2 }}>
            <div
              className={`h-2 transition-all duration-700 ${gradeColor(grade)}`}
              style={{ width: `${Math.round((passed / total) * 100)}%`, borderRadius: 2 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Surface-level scan of publicly visible HTTP response headers
          </p>
        </div>
      </div>

      {/* Check grid — 2 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {VA_CHECK_ORDER.map((key, i) => {
          const check = checks[key]
          if (!check) return null
          const isBottomRow = i >= VA_CHECK_ORDER.length - 2
          return (
            <div
              key={key}
              className={`flex items-start gap-2.5 px-4 py-2.5 text-xs border-b border-gray-100 ${isBottomRow ? 'sm:border-b-0' : ''} ${i === VA_CHECK_ORDER.length - 1 ? 'border-b-0' : ''}`}
            >
              <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full mt-0.5 ${check.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {check.pass ? <PassIcon /> : <FailIcon />}
              </span>
              <div className="min-w-0">
                <div className={`font-semibold truncate ${check.pass ? 'text-gray-800' : 'text-gray-700'}`}>
                  {check.label}
                </div>
                <div className="text-gray-500 leading-relaxed mt-0.5">{check.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          This is a surface-level scan analysing HTTP response headers only. Contact UOB for a full penetration test and comprehensive vulnerability assessment.
        </p>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // VA scan state
  const [vaResult, setVaResult]   = useState<VAResult | null>(null)
  const [vaScanning, setVaScanning] = useState(false)

  // Load submission
  useEffect(() => {
    fetch(`/api/submissions/${id}`)
      .then((r) => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then((data) => { setSubmission(data); setLoading(false) })
      .catch(() => { setError('Report not found or has been removed.'); setLoading(false) })
  }, [id])

  // Auto-run VA scan once submission loads and has a website
  useEffect(() => {
    if (!submission?.website) return
    setVaScanning(true)
    setVaResult(null)
    fetch('/api/va-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: submission.website }),
    })
      .then((r) => r.json())
      .then((data: VAResult) => { setVaResult(data) })
      .catch(() => { setVaResult({ reachable: false, error: 'Scan failed — unable to reach the website.' }) })
      .finally(() => setVaScanning(false))
  }, [submission?.website])

  /* ── Loading / error states ──────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-uob-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-uob-navy rounded-full animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Loading your risk report...</p>
        </div>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-uob-light flex items-center justify-center">
        <div className="card max-w-md text-center">
          <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary">Start New Assessment</button>
        </div>
      </div>
    )
  }

  const risk        = getRiskConfig(submission.overallRiskLevel)
  const submittedAt = format(new Date(submission.submittedAt), 'dd MMM yyyy, HH:mm')

  const answersByCategory = submission.answers.reduce<Record<string, Answer[]>>((acc, a) => {
    const cat = a.categorySnapshot
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-uob-light">

      {/* ── White top nav ─────────────────────────────────────────── */}
      <nav className="bg-white border-b border-uob-border sticky top-0 z-40 print:static">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-uob-navy flex items-center justify-center flex-shrink-0" style={{ borderRadius: 2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-gray-700 text-sm font-semibold">Cybersecurity Risk Assessment</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => window.print()} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
              <PrinterIcon className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => router.push('/')} className="btn-primary py-1.5 px-3 text-xs">
              New Assessment
            </button>
          </div>
        </div>
      </nav>

      {/* ── Navy hero ─────────────────────────────────────────────── */}
      <header style={{ backgroundColor: '#003DA5' }} className="print:hidden">
        <div className="max-w-5xl mx-auto px-5 py-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Cybersecurity Risk Assessment Report</h1>
            <p className="text-blue-200 text-xs font-mono mt-0.5">Ref: {submission.reportReferenceNo}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">

        {/* Email notice */}
        <div className="bg-blue-50 border border-blue-200 px-5 py-3 flex items-center gap-3 text-sm text-blue-800">
          <MailIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>A copy of this report has been sent to <strong>{submission.contactEmail}</strong></span>
        </div>

        {/* Risk score banner */}
        <div className={`${risk.bg} text-white overflow-hidden`}>
          <div className="px-8 py-10 text-center">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Overall Risk Score</div>
            <div className="text-7xl font-bold leading-none mb-3">{submission.overallRiskScore}</div>
            <div className="inline-flex items-center gap-2 bg-black/20 px-5 py-1.5 text-xl font-bold">
              {submission.overallRiskLevel} Risk
            </div>
            <div className="mt-3 text-xs opacity-60">Score range: 0 (lowest risk) — 10 (highest risk)</div>
          </div>
          <div className="h-1 bg-black/20" />
        </div>

        {/* Score breakdown + Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card">
            <h2 className="text-sm font-bold text-uob-dark mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-uob-navy flex items-center justify-center flex-shrink-0">
                <BarChartIcon className="w-3.5 h-3.5 text-white" />
              </span>
              Risk Score Breakdown
            </h2>
            <div className="space-y-5">
              {([
                { label: 'People',     raw: submission.peopleRawScore,     weighted: submission.peopleWeightedScore,     weight: '20%' },
                { label: 'Process',    raw: submission.processRawScore,    weighted: submission.processWeightedScore,    weight: '40%' },
                { label: 'Technology', raw: submission.technologyRawScore, weighted: submission.technologyWeightedScore, weight: '40%' },
              ] as const).map((cat) => {
                const cfg = CAT_CONFIG[cat.label as keyof typeof CAT_CONFIG]
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold flex items-center gap-1.5 ${cfg.color}`}>
                        <cfg.Icon className="w-3.5 h-3.5" />
                        {cat.label}
                        <span className="text-xs text-gray-400 font-normal">({cat.weight})</span>
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{cat.weighted}</span>
                        <span className="text-xs text-gray-400 ml-1">weighted</span>
                      </div>
                    </div>
                    <ScoreBar score={cat.raw} color={risk.barColor} />
                    <div className="text-xs text-gray-400 mt-0.5">Raw: {cat.raw}</div>
                  </div>
                )
              })}
            </div>
            <div className={`mt-5 flex justify-between items-center p-3 border-2 ${risk.border} ${risk.badge}`}>
              <span className="font-bold text-sm">Overall Weighted Score</span>
              <span className="text-2xl font-bold">{submission.overallRiskScore}</span>
            </div>
          </div>

          <div className={`card border-l-4 ${risk.border}`}>
            <h2 className="text-sm font-bold text-uob-dark mb-3 pb-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-6 h-6 bg-uob-navy flex items-center justify-center flex-shrink-0">
                <LightbulbIcon className="w-3.5 h-3.5 text-white" />
              </span>
              Recommendation
            </h2>
            <span className={`px-2.5 py-0.5 text-xs font-bold mb-3 inline-block ${risk.badge}`}>
              {submission.overallRiskLevel} Risk
            </span>
            <h3 className={`font-bold text-sm mb-3 ${risk.text}`}>{submission.recommendationTitle}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{submission.recommendationText}</p>
          </div>
        </div>

        {/* Website VA Section — only shown if website was provided */}
        {submission.website && (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-uob-border flex items-center gap-2 bg-white">
              <span className="w-6 h-6 bg-uob-navy flex items-center justify-center flex-shrink-0">
                <ScanIcon className="w-3.5 h-3.5 text-white" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-uob-dark">Website Vulnerability Assessment</h2>
                <p className="text-xs text-gray-400">{submission.website}</p>
              </div>
            </div>
            <div className="p-4">
              <VAResultCard result={vaResult} scanning={vaScanning} />
            </div>
          </div>
        )}

        {/* Company details */}
        <div className="card">
          <h2 className="text-sm font-bold text-uob-dark mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-uob-navy flex items-center justify-center flex-shrink-0">
              <BuildingIcon className="w-3.5 h-3.5 text-white" />
            </span>
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
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{label}</span>
                <span className="text-sm text-gray-900 font-medium break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment responses */}
        <div className="card">
          <h2 className="text-sm font-bold text-uob-dark mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
            <span className="w-6 h-6 bg-uob-navy flex items-center justify-center flex-shrink-0">
              <ClipboardIcon className="w-3.5 h-3.5 text-white" />
            </span>
            Assessment Responses
          </h2>
          {(['People', 'Process', 'Technology'] as const).map((cat) => {
            const catAnswers = answersByCategory[cat] || []
            if (catAnswers.length === 0) return null
            const cfg = CAT_CONFIG[cat]
            return (
              <div key={cat} className="mb-6 last:mb-0">
                <h3 className={`text-xs font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider ${cfg.color}`}>
                  <cfg.Icon className="w-3.5 h-3.5" /> {cat}
                </h3>
                <div className="space-y-2">
                  {catAnswers.map((a, idx) => (
                    <div key={a.id} className="bg-gray-50 p-4 border border-gray-100">
                      <div className="text-xs font-semibold text-gray-400 mb-1">Q{idx + 1}</div>
                      <div className="text-sm font-medium text-gray-800 mb-2">{a.questionTextSnapshot}</div>
                      <div className="flex items-start gap-2">
                        <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden pb-4">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" /> Print / Save as PDF
          </button>
          <button onClick={() => router.push('/')} className="btn-primary">
            Start New Assessment
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-uob-dark mt-4 print:hidden">
        <div className="max-w-5xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-uob-navy flex items-center justify-center" style={{ borderRadius: 2 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="text-gray-500 text-xs">Cybersecurity Risk Assessment</span>
          </div>
          <p className="text-gray-600 text-xs font-mono">Ref: {submission.reportReferenceNo}</p>
        </div>
      </footer>
    </div>
  )
}
