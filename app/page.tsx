'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Choice { text: string; score: number }

interface Question {
  id: number
  questionText: string
  category: 'People' | 'Process' | 'Technology'
  choice1Text: string; choice1Score: number
  choice2Text: string; choice2Score: number
  choice3Text: string; choice3Score: number
  choice4Text: string; choice4Score: number
  displayOrder: number
}

interface AnswerState {
  [questionId: number]: { choiceText: string; choiceScore: number }
}

const CATEGORIES = ['People', 'Process', 'Technology'] as const

const CAT_META = {
  People:     { label: 'People',     weight: '20%', description: 'Security culture, training & access management' },
  Process:    { label: 'Process',    weight: '40%', description: 'Policies, procedures & operational practices' },
  Technology: { label: 'Technology', weight: '40%', description: 'Security tools, infrastructure & monitoring' },
}

function getChoices(q: Question): Choice[] {
  return [
    { text: q.choice1Text, score: q.choice1Score },
    { text: q.choice2Text, score: q.choice2Score },
    { text: q.choice3Text, score: q.choice3Score },
    { text: q.choice4Text, score: q.choice4Score },
  ]
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="0" />
    <path d="M9 22V12h6v10M3 9h18" />
  </svg>
)

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const CAT_ICONS = {
  People:     <UsersIcon />,
  Process:    <SettingsIcon />,
  Technology: <MonitorIcon />,
}

export default function AssessmentPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  const [form, setForm] = useState({
    companyName: '', contactPersonName: '',
    countryCode: '+65', contactNumber: '',
    contactEmail: '', website: '', estimatedEndpoints: '',
  })

  const [answers, setAnswers] = useState<AnswerState>({})

  useEffect(() => {
    fetch('/api/questions?activeOnly=true')
      .then((r) => r.json())
      .then((d) => { setQuestions(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const updateForm = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }))
    setErrors((p) => ({ ...p, [field]: '' }))
  }

  const selectAnswer = (qId: number, text: string, score: number) => {
    setAnswers((p) => ({ ...p, [qId]: { choiceText: text, choiceScore: score } }))
    setErrors((p) => ({ ...p, [`q_${qId}`]: '' }))
  }

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!form.companyName.trim())       e.companyName = 'Company name is required'
    if (!form.contactPersonName.trim()) e.contactPersonName = 'Contact person name is required'
    if (!form.contactNumber.trim())     e.contactNumber = 'Contact number is required'
    if (!form.contactEmail.trim())      e.contactEmail = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) e.contactEmail = 'Enter a valid email address'
    if (!form.estimatedEndpoints.trim()) e.estimatedEndpoints = 'Number of endpoints is required'
    else if (parseInt(form.estimatedEndpoints) < 1) e.estimatedEndpoints = 'Must be a positive number'
    for (const q of questions) if (!answers[q.id]) e[`q_${q.id}`] = 'Please select a response'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form, answers, questions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    if (!validate()) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          contactPersonName: form.contactPersonName.trim(),
          countryCode: form.countryCode,
          contactNumber: form.contactNumber.trim(),
          contactEmail: form.contactEmail.trim(),
          website: form.website.trim() || null,
          estimatedEndpoints: parseInt(form.estimatedEndpoints),
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedChoiceText: answers[q.id].choiceText,
            selectedChoiceScore: answers[q.id].choiceScore,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setGlobalError(data.error || 'Submission failed. Please try again.'); setSubmitting(false); return }
      router.push(`/result/${data.id}`)
    } catch {
      setGlobalError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  const byCategory = CATEGORIES.reduce<Record<string, Question[]>>((acc, c) => {
    acc[c] = questions.filter((q) => q.category === c)
    return acc
  }, {} as Record<string, Question[]>)

  const answered = Object.keys(answers).length
  const progress = questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-uob-light" style={{ fontFamily: "'Inter', Arial, sans-serif" }}>

      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <nav className="bg-white border-b border-uob-border" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-0 flex items-center" style={{ height: 64 }}>
          {/* UOB Logo */}
          <div className="flex items-center gap-3 select-none">
            <span className="text-uob-red font-black tracking-tight" style={{ fontSize: 28, lineHeight: 1 }}>UOB</span>
            <div className="w-px bg-gray-200" style={{ height: 24 }} />
            <span className="text-uob-dark font-medium text-sm">Cybersecurity Risk Assessment</span>
          </div>
          <div className="ml-auto text-xs text-gray-400 font-medium hidden sm:block">
            Confidential &nbsp;|&nbsp; For Authorised Use Only
          </div>
        </div>
      </nav>

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <header className="bg-uob-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-white/10 flex items-center justify-center text-white" style={{ borderRadius: 2 }}>
              <ShieldIcon />
            </div>
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Risk Assessment Tool</p>
              <h1 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.01em' }}>
                Cybersecurity Risk Assessment
              </h1>
              <p className="text-blue-100 text-sm max-w-xl leading-relaxed" style={{ opacity: 0.85 }}>
                Complete the questionnaire below to evaluate your organisation&apos;s cybersecurity posture.
                Your results will be scored across three risk dimensions and a personalised report will be generated.
              </p>
            </div>
          </div>
        </div>
        {/* Navy-to-light gradient bar */}
        <div className="h-1 bg-uob-red" />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Section 1: Company Details ──────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 bg-uob-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ borderRadius: 2 }}>1</div>
              <div>
                <h2 className="text-base font-bold text-uob-dark">Company Information</h2>
                <p className="text-xs text-gray-500">All information is held in strict confidence</p>
              </div>
            </div>

            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="md:col-span-2" data-error={!!errors.companyName}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Company Name <span className="text-uob-red normal-case font-normal">*</span>
                  </label>
                  <input type="text" className={`input-field ${errors.companyName ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                    placeholder="Full registered company name"
                    value={form.companyName} onChange={(e) => updateForm('companyName', e.target.value)} />
                  {errors.companyName && <p className="mt-1.5 text-xs text-uob-red flex items-center gap-1"><AlertIcon />{errors.companyName}</p>}
                </div>

                <div data-error={!!errors.contactPersonName}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Contact Person <span className="text-uob-red normal-case font-normal">*</span>
                  </label>
                  <input type="text" className={`input-field ${errors.contactPersonName ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                    placeholder="Full name"
                    value={form.contactPersonName} onChange={(e) => updateForm('contactPersonName', e.target.value)} />
                  {errors.contactPersonName && <p className="mt-1.5 text-xs text-uob-red flex items-center gap-1"><AlertIcon />{errors.contactPersonName}</p>}
                </div>

                <div data-error={!!errors.contactNumber}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Contact Number <span className="text-uob-red normal-case font-normal">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select className="px-3 py-2.5 text-sm border border-gray-300 bg-white text-uob-dark focus:outline-none focus:ring-2 focus:ring-uob-navy min-w-[90px]"
                      style={{ borderRadius: 2 }} value={form.countryCode} onChange={(e) => updateForm('countryCode', e.target.value)}>
                      <option value="+65">+65 SG</option>
                      <option value="+60">+60 MY</option>
                      <option value="+62">+62 ID</option>
                      <option value="+63">+63 PH</option>
                      <option value="+66">+66 TH</option>
                      <option value="+84">+84 VN</option>
                      <option value="+61">+61 AU</option>
                      <option value="+1">+1 US</option>
                      <option value="+44">+44 GB</option>
                      <option value="+91">+91 IN</option>
                      <option value="+852">+852 HK</option>
                      <option value="+81">+81 JP</option>
                    </select>
                    <input type="tel" className={`input-field flex-1 ${errors.contactNumber ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                      placeholder="9123 4567" value={form.contactNumber} onChange={(e) => updateForm('contactNumber', e.target.value)} />
                  </div>
                  {errors.contactNumber && <p className="mt-1.5 text-xs text-uob-red flex items-center gap-1"><AlertIcon />{errors.contactNumber}</p>}
                </div>

                <div data-error={!!errors.contactEmail}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Email Address <span className="text-uob-red normal-case font-normal">*</span>
                  </label>
                  <input type="email" className={`input-field ${errors.contactEmail ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                    placeholder="contact@company.com"
                    value={form.contactEmail} onChange={(e) => updateForm('contactEmail', e.target.value)} />
                  {errors.contactEmail && <p className="mt-1.5 text-xs text-uob-red flex items-center gap-1"><AlertIcon />{errors.contactEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Website <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input type="url" className="input-field" placeholder="https://www.company.com"
                    value={form.website} onChange={(e) => updateForm('website', e.target.value)} />
                </div>

                <div data-error={!!errors.estimatedEndpoints}>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Estimated No. of Endpoints <span className="text-uob-red normal-case font-normal">*</span>
                  </label>
                  <input type="number" min="1" className={`input-field ${errors.estimatedEndpoints ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                    placeholder="e.g. 250"
                    value={form.estimatedEndpoints} onChange={(e) => updateForm('estimatedEndpoints', e.target.value)} />
                  {errors.estimatedEndpoints && <p className="mt-1.5 text-xs text-uob-red flex items-center gap-1"><AlertIcon />{errors.estimatedEndpoints}</p>}
                  <p className="mt-1 text-xs text-gray-400">Laptops, desktops, servers, mobile devices</p>
                </div>

              </div>
            </div>
          </div>

          {/* ── Section 2: Questionnaire ────────────────────────────── */}
          {loading ? (
            <div className="card text-center py-16">
              <div className="inline-block w-8 h-8 border-2 border-gray-200 border-t-uob-navy rounded-full animate-spin mb-4" />
              <p className="text-gray-500 text-sm">Loading assessment questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="card text-center py-12 text-gray-400 text-sm">No active questions found. Please contact the administrator.</div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 bg-uob-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ borderRadius: 2 }}>2</div>
                <div>
                  <h2 className="text-base font-bold text-uob-dark">Risk Assessment Questionnaire</h2>
                  <p className="text-xs text-gray-500">Select one response per question — all questions are mandatory</p>
                </div>
                <div className="ml-auto text-right hidden sm:block">
                  <div className="text-xs font-semibold text-uob-navy">{answered} / {questions.length}</div>
                  <div className="text-xs text-gray-400">answered</div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 h-1">
                  <div className="bg-uob-navy h-1 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Category sections */}
              {CATEGORIES.map((cat, catIdx) => {
                const qs = byCategory[cat] || []
                if (qs.length === 0) return null
                const meta = CAT_META[cat]

                return (
                  <div key={cat} className="mb-6">
                    {/* Category header */}
                    <div className="flex items-center gap-3 px-5 py-4 bg-white border border-uob-border border-b-0"
                      style={{ borderRadius: '2px 2px 0 0' }}>
                      <div className="w-8 h-8 bg-uob-navy/10 text-uob-navy flex items-center justify-center flex-shrink-0" style={{ borderRadius: 2 }}>
                        {CAT_ICONS[cat]}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-uob-dark">{meta.label}</h3>
                        <p className="text-xs text-gray-500">{meta.description}</p>
                      </div>
                      <div className="hidden sm:block text-right flex-shrink-0">
                        <div className="text-xs text-gray-400">Risk Weight</div>
                        <div className="text-sm font-bold text-uob-navy">{meta.weight}</div>
                      </div>
                    </div>

                    {/* Questions */}
                    <div className="border border-uob-border border-t-uob-navy bg-white divide-y divide-gray-100" style={{ borderTopWidth: 2, borderRadius: '0 0 2px 2px' }}>
                      {qs.map((q, idx) => {
                        const chosen = answers[q.id]
                        const hasError = !!errors[`q_${q.id}`]

                        return (
                          <div key={q.id} className={`p-5 ${hasError ? 'bg-red-50' : ''}`} data-error={hasError}>
                            <p className="text-sm font-semibold text-uob-dark mb-4 leading-relaxed">
                              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-uob-navy border border-uob-navy/30 bg-blue-50 mr-2 flex-shrink-0" style={{ borderRadius: 2 }}>
                                {catIdx * 4 + idx + 1}
                              </span>
                              {q.questionText}
                            </p>

                            <div className="space-y-2 pl-7">
                              {getChoices(q).map((choice, ci) => {
                                const isSelected = chosen?.choiceText === choice.text
                                return (
                                  <label key={ci}
                                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer border transition-all duration-100 ${
                                      isSelected
                                        ? 'border-uob-navy bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-uob-navy/40 hover:bg-blue-50/30'
                                    }`}
                                    style={{ borderRadius: 2 }}
                                  >
                                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                                      isSelected ? 'border-uob-navy bg-uob-navy' : 'border-gray-300 bg-white'
                                    }`}>
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <input type="radio" name={`q-${q.id}`} className="sr-only"
                                      checked={isSelected} onChange={() => selectAnswer(q.id, choice.text, choice.score)} />
                                    <span className={`text-sm leading-snug ${isSelected ? 'text-uob-navy font-medium' : 'text-gray-700'}`}>
                                      {choice.text}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>

                            {hasError && (
                              <p className="mt-2 pl-7 text-xs text-uob-red flex items-center gap-1">
                                <AlertIcon /> {errors[`q_${q.id}`]}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Global error */}
          {globalError && (
            <div className="mb-4 p-4 bg-red-50 border border-uob-red text-sm text-uob-red flex items-start gap-2" style={{ borderRadius: 2 }}>
              <AlertIcon /><span>{globalError}</span>
            </div>
          )}

          {/* Submit */}
          {!loading && questions.length > 0 && (
            <div className="card bg-gray-50 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-uob-dark">Ready to generate your risk report?</p>
                  <p className="text-xs text-gray-500 mt-0.5">A copy will be emailed to the address provided above.</p>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary px-10 py-3.5 text-sm flex-shrink-0">
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <ShieldIcon />
                      Generate Risk Report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-uob-dark text-gray-400 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-uob-red font-black text-xl" style={{ letterSpacing: '-0.02em' }}>UOB</span>
              <div className="w-px bg-gray-700 h-4" />
              <span className="text-xs text-gray-500">Cybersecurity Risk Assessment</span>
            </div>
            <p className="text-xs text-gray-600">
              All information is kept strictly confidential. &copy; {new Date().getFullYear()} United Overseas Bank Limited.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
