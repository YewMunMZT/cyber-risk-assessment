'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Choice {
  text: string
  score: number
}

interface Question {
  id: number
  questionText: string
  category: 'People' | 'Process' | 'Technology'
  choice1Text: string
  choice1Score: number
  choice2Text: string
  choice2Score: number
  choice3Text: string
  choice3Score: number
  choice4Text: string
  choice4Score: number
  displayOrder: number
}

interface AnswerState {
  [questionId: number]: { choiceText: string; choiceScore: number }
}

const CATEGORIES = ['People', 'Process', 'Technology'] as const

const CATEGORY_CONFIG = {
  People: {
    icon: '👥',
    headerBg: 'bg-uob-red',
    sectionBg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-900',
    weight: '20%',
    description: 'Security culture, training, and access management',
  },
  Process: {
    icon: '⚙️',
    headerBg: 'bg-uob-dark-2',
    sectionBg: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-200 text-gray-800',
    weight: '40%',
    description: 'Policies, procedures, and operational practices',
  },
  Technology: {
    icon: '🖥️',
    headerBg: 'bg-uob-dark-3',
    sectionBg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-200 text-slate-800',
    weight: '40%',
    description: 'Security tools, infrastructure, and monitoring',
  },
}

function getChoices(q: Question): Choice[] {
  return [
    { text: q.choice1Text, score: q.choice1Score },
    { text: q.choice2Text, score: q.choice2Score },
    { text: q.choice3Text, score: q.choice3Score },
    { text: q.choice4Text, score: q.choice4Score },
  ]
}

export default function AssessmentPage() {
  const router = useRouter()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState('')

  const [form, setForm] = useState({
    companyName: '',
    contactPersonName: '',
    countryCode: '+65',
    contactNumber: '',
    contactEmail: '',
    website: '',
    estimatedEndpoints: '',
  })

  const [answers, setAnswers] = useState<AnswerState>({})

  useEffect(() => {
    fetch('/api/questions?activeOnly=true')
      .then((r) => r.json())
      .then((data) => {
        setQuestions(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const selectAnswer = (questionId: number, choiceText: string, choiceScore: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { choiceText, choiceScore } }))
    setErrors((prev) => ({ ...prev, [`q_${questionId}`]: '' }))
  }

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!form.contactPersonName.trim()) newErrors.contactPersonName = 'Contact person name is required'
    if (!form.contactNumber.trim()) newErrors.contactNumber = 'Contact number is required'
    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address'
    }
    if (!form.estimatedEndpoints.trim()) {
      newErrors.estimatedEndpoints = 'Estimated endpoints is required'
    } else if (parseInt(form.estimatedEndpoints) < 1) {
      newErrors.estimatedEndpoints = 'Endpoints must be a positive number'
    }
    for (const q of questions) {
      if (!answers[q.id]) newErrors[`q_${q.id}`] = 'Please select an answer'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form, answers, questions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    if (!validate()) {
      const firstError = document.querySelector('[data-error="true"]')
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
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
      }
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setGlobalError(data.error || 'Submission failed. Please try again.'); setSubmitting(false); return }
      router.push(`/result/${data.id}`)
    } catch {
      setGlobalError('Network error. Please check your connection and try again.')
      setSubmitting(false)
    }
  }

  const questionsByCategory = CATEGORIES.reduce<Record<string, Question[]>>((acc, cat) => {
    acc[cat] = questions.filter((q) => q.category === cat)
    return acc
  }, {} as Record<string, Question[]>)

  const answeredCount = Object.keys(answers).length
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-uob-light">

      {/* UOB Top Bar */}
      <div className="bg-uob-dark">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* UOB Logo text style */}
            <div className="text-uob-red font-black text-2xl tracking-tight leading-none select-none">UOB</div>
            <div className="w-px h-5 bg-gray-600" />
            <span className="text-gray-300 text-sm font-medium">Cyber Risk Assessment</span>
          </div>
          <div className="text-gray-500 text-xs">Confidential</div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="bg-uob-dark border-b-4 border-uob-red">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-uob-red flex items-center justify-center text-2xl shadow flex-shrink-0 rounded">
              🛡️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Cybersecurity Risk Assessment
              </h1>
              <p className="text-gray-400 mt-2 text-sm leading-relaxed max-w-xl">
                Assess your organisation&apos;s cybersecurity posture across three key risk dimensions.
                Complete the questionnaire below to receive your personalised risk report.
              </p>
            </div>
          </div>

          {/* Category weight pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5 text-xs">
                <span>{CATEGORY_CONFIG[cat].icon}</span>
                <span className="text-gray-300 font-medium">{cat}</span>
                <span className="text-uob-red font-bold">{CATEGORY_CONFIG[cat].weight}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Company Details ── */}
          <section className="card mb-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-uob-red flex items-center justify-center text-white text-sm font-bold rounded flex-shrink-0">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-uob-dark">Company Details</h2>
                <p className="text-xs text-gray-500">Your information is kept strictly confidential</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="md:col-span-2" data-error={!!errors.companyName}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Company Name <span className="text-uob-red">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.companyName ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                  placeholder="e.g. Acme Corporation Pte. Ltd."
                  value={form.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                />
                {errors.companyName && <p className="mt-1 text-xs text-uob-red">{errors.companyName}</p>}
              </div>

              {/* Contact Person */}
              <div data-error={!!errors.contactPersonName}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Person Name <span className="text-uob-red">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.contactPersonName ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                  placeholder="Full name"
                  value={form.contactPersonName}
                  onChange={(e) => updateForm('contactPersonName', e.target.value)}
                />
                {errors.contactPersonName && <p className="mt-1 text-xs text-uob-red">{errors.contactPersonName}</p>}
              </div>

              {/* Contact Number */}
              <div data-error={!!errors.contactNumber}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Number <span className="text-uob-red">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-uob-red bg-white text-sm font-medium text-gray-700 min-w-[90px]"
                    value={form.countryCode}
                    onChange={(e) => updateForm('countryCode', e.target.value)}
                  >
                    <option value="+65">+65 🇸🇬</option>
                    <option value="+60">+60 🇲🇾</option>
                    <option value="+62">+62 🇮🇩</option>
                    <option value="+63">+63 🇵🇭</option>
                    <option value="+66">+66 🇹🇭</option>
                    <option value="+84">+84 🇻🇳</option>
                    <option value="+61">+61 🇦🇺</option>
                    <option value="+64">+64 🇳🇿</option>
                    <option value="+1">+1 🇺🇸</option>
                    <option value="+44">+44 🇬🇧</option>
                    <option value="+91">+91 🇮🇳</option>
                    <option value="+852">+852 🇭🇰</option>
                    <option value="+81">+81 🇯🇵</option>
                    <option value="+82">+82 🇰🇷</option>
                    <option value="+86">+86 🇨🇳</option>
                  </select>
                  <input
                    type="tel"
                    className={`input-field flex-1 ${errors.contactNumber ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                    placeholder="9123 4567"
                    value={form.contactNumber}
                    onChange={(e) => updateForm('contactNumber', e.target.value)}
                  />
                </div>
                {errors.contactNumber && <p className="mt-1 text-xs text-uob-red">{errors.contactNumber}</p>}
              </div>

              {/* Email */}
              <div data-error={!!errors.contactEmail}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Email <span className="text-uob-red">*</span>
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.contactEmail ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                  placeholder="you@company.com"
                  value={form.contactEmail}
                  onChange={(e) => updateForm('contactEmail', e.target.value)}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-uob-red">{errors.contactEmail}</p>}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Website <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://www.company.com"
                  value={form.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                />
              </div>

              {/* Endpoints */}
              <div data-error={!!errors.estimatedEndpoints}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Estimated No. of Endpoints <span className="text-uob-red">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`input-field ${errors.estimatedEndpoints ? 'border-uob-red ring-1 ring-uob-red' : ''}`}
                  placeholder="e.g. 250"
                  value={form.estimatedEndpoints}
                  onChange={(e) => updateForm('estimatedEndpoints', e.target.value)}
                />
                {errors.estimatedEndpoints && <p className="mt-1 text-xs text-uob-red">{errors.estimatedEndpoints}</p>}
                <p className="mt-1 text-xs text-gray-400">Laptops, desktops, servers, mobile devices, etc.</p>
              </div>
            </div>
          </section>

          {/* ── Questionnaire ── */}
          {loading ? (
            <div className="card text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Loading assessment questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              No active questions found. Please contact the administrator.
            </div>
          ) : (
            <>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-uob-red flex items-center justify-center text-white text-sm font-bold rounded flex-shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-base font-bold text-uob-dark">Risk Assessment Questionnaire</h2>
                  <p className="text-xs text-gray-500">Select one answer per question</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-gray-500 font-medium">Progress</span>
                  <span className="text-xs font-bold text-uob-red">
                    {answeredCount} / {questions.length} answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-uob-red h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Questions by Category */}
              {CATEGORIES.map((cat) => {
                const catQuestions = questionsByCategory[cat] || []
                if (catQuestions.length === 0) return null
                const cfg = CATEGORY_CONFIG[cat]

                return (
                  <section key={cat} className={`mb-5 rounded border-2 overflow-hidden ${cfg.sectionBg}`}>
                    {/* Category header bar */}
                    <div className={`${cfg.headerBg} px-5 py-4 flex items-center gap-3`}>
                      <span className="text-2xl">{cfg.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base">{cat}</h3>
                        <p className="text-white/70 text-xs">{cfg.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-white/70 text-xs">Risk Weight</div>
                        <div className="text-white font-bold text-lg">{cfg.weight}</div>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {catQuestions.map((q, idx) => {
                        const chosen = answers[q.id]
                        const hasError = !!errors[`q_${q.id}`]

                        return (
                          <div
                            key={q.id}
                            className={`bg-white rounded border-2 p-5 transition-colors ${
                              hasError ? 'border-uob-red' : chosen ? 'border-green-300' : 'border-transparent'
                            }`}
                            data-error={hasError}
                          >
                            <p className="text-sm font-semibold text-gray-800 mb-4 leading-relaxed flex items-start gap-2">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white flex-shrink-0 mt-0.5 ${cfg.headerBg}`}>
                                {idx + 1}
                              </span>
                              {q.questionText}
                            </p>

                            <div className="space-y-2">
                              {getChoices(q).map((choice, ci) => {
                                const isSelected = chosen?.choiceText === choice.text
                                return (
                                  <label
                                    key={ci}
                                    className={`flex items-start gap-3 p-3 rounded cursor-pointer border transition-all ${
                                      isSelected
                                        ? 'bg-red-50 border-uob-red ring-1 ring-uob-red'
                                        : 'border-gray-200 hover:border-red-200 hover:bg-red-50/40'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      className="mt-0.5 flex-shrink-0 accent-uob-red"
                                      checked={isSelected}
                                      onChange={() => selectAnswer(q.id, choice.text, choice.score)}
                                    />
                                    <span className={`text-sm leading-snug ${isSelected ? 'text-uob-dark font-medium' : 'text-gray-700'}`}>
                                      {choice.text}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>

                            {hasError && (
                              <p className="mt-2 text-xs text-uob-red flex items-center gap-1">
                                <span>⚠</span> {errors[`q_${q.id}`]}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </>
          )}

          {/* Global error */}
          {globalError && (
            <div className="mb-4 p-4 bg-red-50 border border-uob-red rounded text-sm text-uob-red-dark flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* Submit */}
          {!loading && questions.length > 0 && (
            <div className="card mt-4 bg-gray-50 border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  By submitting, a copy of your risk report will be emailed to you.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-base px-12 py-4 w-full md:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center gap-3">
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Your Risk Report...
                    </span>
                  ) : (
                    '  Generate Risk Report'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-uob-dark mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-uob-red font-black text-lg">UOB</div>
            <span className="text-gray-500 text-xs">Cyber Risk Assessment</span>
          </div>
          <p className="text-gray-600 text-xs">All information provided is kept strictly confidential.</p>
        </div>
      </footer>
    </div>
  )
}
