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
    color: 'bg-violet-50 border-violet-200',
    headerColor: 'bg-violet-700',
    badge: 'bg-violet-100 text-violet-800',
    weight: '20%',
    description: 'Security culture, training, and access management',
  },
  Process: {
    icon: '⚙️',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    weight: '40%',
    description: 'Policies, procedures, and operational practices',
  },
  Technology: {
    icon: '🖥️',
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'bg-teal-700',
    badge: 'bg-teal-100 text-teal-800',
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
      if (!answers[q.id]) {
        newErrors[`q_${q.id}`] = 'Please select an answer'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form, answers, questions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')

    if (!validate()) {
      // Scroll to first error
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

      if (!res.ok) {
        setGlobalError(data.error || 'Submission failed. Please try again.')
        setSubmitting(false)
        return
      }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy-950 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
              🛡️
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cyber Risk Assessment</h1>
              <p className="text-indigo-300 mt-1 text-sm md:text-base">
                Understand your organisation&apos;s cybersecurity risk posture in minutes
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="bg-white/10 rounded-lg px-3 py-2">
                <div className="font-semibold text-white">{cat}</div>
                <div className="text-indigo-300 text-xs">{CATEGORY_CONFIG[cat].weight} weight</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} noValidate>

          {/* Company Details */}
          <section className="card mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-lg">🏢</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Company Details</h2>
                <p className="text-sm text-gray-500">Your information is used solely for this assessment report</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="md:col-span-2" data-error={!!errors.companyName}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.companyName ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  placeholder="e.g. Acme Corporation Pte. Ltd."
                  value={form.companyName}
                  onChange={(e) => updateForm('companyName', e.target.value)}
                />
                {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
              </div>

              {/* Contact Person */}
              <div data-error={!!errors.contactPersonName}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={`input-field ${errors.contactPersonName ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  placeholder="Full name"
                  value={form.contactPersonName}
                  onChange={(e) => updateForm('contactPersonName', e.target.value)}
                />
                {errors.contactPersonName && <p className="mt-1 text-xs text-red-600">{errors.contactPersonName}</p>}
              </div>

              {/* Contact Number */}
              <div data-error={!!errors.contactNumber}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-gray-700 min-w-[90px]"
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
                    className={`input-field flex-1 ${errors.contactNumber ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    placeholder="9123 4567"
                    value={form.contactNumber}
                    onChange={(e) => updateForm('contactNumber', e.target.value)}
                  />
                </div>
                {errors.contactNumber && <p className="mt-1 text-xs text-red-600">{errors.contactNumber}</p>}
              </div>

              {/* Email */}
              <div data-error={!!errors.contactEmail}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className={`input-field ${errors.contactEmail ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  placeholder="you@company.com"
                  value={form.contactEmail}
                  onChange={(e) => updateForm('contactEmail', e.target.value)}
                />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>}
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
                  Estimated No. of Endpoints <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={`input-field ${errors.estimatedEndpoints ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  placeholder="e.g. 250"
                  value={form.estimatedEndpoints}
                  onChange={(e) => updateForm('estimatedEndpoints', e.target.value)}
                />
                {errors.estimatedEndpoints && <p className="mt-1 text-xs text-red-600">{errors.estimatedEndpoints}</p>}
                <p className="mt-1 text-xs text-gray-400">Laptops, desktops, servers, mobile devices, etc.</p>
              </div>
            </div>
          </section>

          {/* Questionnaire */}
          {loading ? (
            <div className="card text-center py-16">
              <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Loading assessment questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              No active questions found. Please contact the administrator.
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Questionnaire Progress
                  </span>
                  <span className="text-sm font-bold text-indigo-700">
                    {answeredCount} / {questions.length} answered
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
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
                  <section key={cat} className={`mb-6 rounded-xl border-2 overflow-hidden ${cfg.color}`}>
                    <div className={`${cfg.headerColor} px-6 py-4 flex items-center gap-3`}>
                      <span className="text-2xl">{cfg.icon}</span>
                      <div className="flex-1">
                        <h2 className="text-white font-bold text-lg">{cat}</h2>
                        <p className="text-white/80 text-sm">{cfg.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-xs font-medium opacity-80">Risk Weight</div>
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
                            className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-colors ${
                              hasError ? 'border-red-300' : chosen ? 'border-green-200' : 'border-transparent'
                            }`}
                            data-error={hasError}
                          >
                            <p className="text-sm font-semibold text-gray-800 mb-4 leading-relaxed">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2 flex-shrink-0 ${cfg.headerColor}`}>
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
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                      isSelected
                                        ? 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-300'
                                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      className="mt-0.5 accent-indigo-600 flex-shrink-0"
                                      checked={isSelected}
                                      onChange={() => selectAnswer(q.id, choice.text, choice.score)}
                                    />
                                    <span className={`text-sm leading-snug ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                                      {choice.text}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>

                            {hasError && (
                              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">⚠</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* Submit */}
          {!loading && questions.length > 0 && (
            <div className="card mt-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  By submitting, a copy of your risk report will be emailed to you.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-lg px-12 py-4 shadow-lg shadow-indigo-200 w-full md:w-auto"
                >
                  {submitting ? (
                    <span className="flex items-center gap-3">
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Your Risk Report...
                    </span>
                  ) : (
                    '🛡️  Generate Risk Report'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-200 mt-8">
        Cyber Risk Assessment System &bull; All data is kept confidential
      </footer>
    </div>
  )
}
