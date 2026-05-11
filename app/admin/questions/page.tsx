'use client'

import { useEffect, useState, useCallback } from 'react'

interface Question {
  id: number
  questionText: string
  category: string
  choice1Text: string; choice1Score: number
  choice2Text: string; choice2Score: number
  choice3Text: string; choice3Score: number
  choice4Text: string; choice4Score: number
  isActive: boolean
  displayOrder: number
}

const CATEGORIES = ['People', 'Process', 'Technology'] as const

const EMPTY_FORM = {
  questionText: '',
  category: 'People',
  choice1Text: '', choice1Score: '',
  choice2Text: '', choice2Score: '',
  choice3Text: '', choice3Score: '',
  choice4Text: '', choice4Score: '',
  isActive: true,
  displayOrder: '0',
}

const RISK_BADGE: Record<string, string> = {
  People:     'bg-red-100 text-red-900',
  Process:    'bg-gray-200 text-gray-800',
  Technology: 'bg-slate-200 text-slate-800',
}

type FormState = typeof EMPTY_FORM

function QuestionModal({
  question,
  onClose,
  onSave,
}: {
  question: Question | null
  onClose: () => void
  onSave: () => void
}) {
  const isEdit = !!question
  const [form, setForm] = useState<FormState>(
    question
      ? {
          questionText: question.questionText,
          category: question.category,
          choice1Text: question.choice1Text, choice1Score: String(question.choice1Score),
          choice2Text: question.choice2Text, choice2Score: String(question.choice2Score),
          choice3Text: question.choice3Text, choice3Score: String(question.choice3Score),
          choice4Text: question.choice4Text, choice4Score: String(question.choice4Score),
          isActive: question.isActive,
          displayOrder: String(question.displayOrder),
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setError('')
    if (!form.questionText.trim()) return setError('Question text is required')
    for (let i = 1; i <= 4; i++) {
      const t = form[`choice${i}Text` as keyof FormState] as string
      const s = form[`choice${i}Score` as keyof FormState] as string
      if (!t.trim()) return setError(`Choice ${i} text is required`)
      if (s === '' || isNaN(parseFloat(s))) return setError(`Choice ${i} score must be a valid number`)
    }

    setSaving(true)
    try {
      const url = isEdit ? `/api/questions/${question!.id}` : '/api/questions'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Save failed'); setSaving(false); return }
      onSave()
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Question' : 'Add New Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question Text <span className="text-red-500">*</span></label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Enter the question..."
              value={form.questionText}
              onChange={(e) => set('questionText', e.target.value)}
            />
          </div>

          {/* Category + Active + Order */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
              <input
                type="number"
                className="input-field"
                value={form.displayOrder}
                onChange={(e) => set('displayOrder', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <div className="flex items-center gap-3 h-10">
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-uob-red' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-sm font-medium ${form.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Choices */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Answer Choices <span className="text-red-500">*</span></label>
            <div className="space-y-3">
              {([1, 2, 3, 4] as const).map((i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-red-100 text-uob-red flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2.5">
                    {i}
                  </div>
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder={`Choice ${i} text`}
                    value={form[`choice${i}Text` as keyof FormState] as string}
                    onChange={(e) => set(`choice${i}Text` as keyof FormState, e.target.value)}
                  />
                  <div className="flex-shrink-0 w-24">
                    <input
                      type="number"
                      step="0.01"
                      className="input-field text-center"
                      placeholder="Score"
                      value={form[`choice${i}Score` as keyof FormState] as string}
                      onChange={(e) => set(`choice${i}Score` as keyof FormState, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pl-10">Higher score = higher risk. Typical range: 1 (most secure) to 9 (least secure)</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠ {error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalQuestion, setModalQuestion] = useState<Question | null | 'new'>('new' as const)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/questions')
    const data = await res.json()
    setQuestions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (q: Question) => {
    setTogglingId(q.id)
    await fetch(`/api/questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !q.isActive }),
    })
    await load()
    setTogglingId(null)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/questions/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    await load()
  }

  const filtered = questions.filter((q) => {
    const matchSearch = !search || q.questionText.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'all' || q.category === categoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {questions.filter((q) => q.isActive).length} active / {questions.length} total questions
          </p>
        </div>
        <button
          onClick={() => { setModalQuestion(null); setShowModal(true) }}
          className="btn-primary"
        >
          + Add Question
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          className="input-field sm:max-w-xs"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {['all', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-uob-red text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-red-200 border-t-uob-red rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading questions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          {search || categoryFilter !== 'all' ? 'No questions match your filters.' : 'No questions yet. Click "Add Question" to get started.'}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Question</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((q) => (
                  <tr key={q.id} className={`hover:bg-gray-50 transition-colors ${!q.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-4 text-gray-400 font-mono text-xs">{q.id}</td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900 line-clamp-2 max-w-md">{q.questionText}</p>
                      <div className="mt-1 flex gap-2 flex-wrap">
                        {[q.choice1Text, q.choice2Text, q.choice3Text, q.choice4Text].slice(0, 2).map((c, i) => (
                          <span key={i} className="text-xs text-gray-400 truncate max-w-[150px]">• {c}</span>
                        ))}
                        <span className="text-xs text-gray-300">+2 more</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${RISK_BADGE[q.category] || 'bg-gray-100 text-gray-700'}`}>
                        {q.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggle(q)}
                        disabled={togglingId === q.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${q.isActive ? 'bg-uob-red' : 'bg-gray-300'} disabled:opacity-50`}
                        title={q.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${q.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500">{q.displayOrder}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setModalQuestion(q); setShowModal(true) }}
                          className="px-3 py-1.5 text-xs font-medium text-uob-red bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(q.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {showModal && (
        <QuestionModal
          question={modalQuestion === 'new' ? null : modalQuestion}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load() }}
        />
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This question will be permanently deleted. Historical answers referencing this question will be retained.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
