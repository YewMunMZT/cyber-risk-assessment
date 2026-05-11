'use client'

import { useEffect, useState, useCallback } from 'react'

interface Range {
  id: number
  minScore: number
  maxScore: number
  riskLevelName: string
  recommendationTitle: string
  recommendationText: string
  isActive: boolean
}

const RISK_COLORS: Record<string, { badge: string; bg: string; border: string }> = {
  Low: { badge: 'bg-green-100 text-green-800', bg: 'bg-green-50', border: 'border-green-300' },
  Moderate: { badge: 'bg-amber-100 text-amber-800', bg: 'bg-amber-50', border: 'border-amber-300' },
  High: { badge: 'bg-orange-100 text-orange-800', bg: 'bg-orange-50', border: 'border-orange-300' },
  Critical: { badge: 'bg-red-100 text-red-800', bg: 'bg-red-50', border: 'border-red-300' },
}

function getRiskColor(name: string) {
  return RISK_COLORS[name] || { badge: 'bg-gray-100 text-gray-800', bg: 'bg-gray-50', border: 'border-gray-300' }
}

const EMPTY_FORM = {
  minScore: '',
  maxScore: '',
  riskLevelName: '',
  recommendationTitle: '',
  recommendationText: '',
  isActive: true,
}

type FormState = typeof EMPTY_FORM

function RangeModal({
  range,
  onClose,
  onSave,
}: {
  range: Range | null
  onClose: () => void
  onSave: () => void
}) {
  const isEdit = !!range
  const [form, setForm] = useState<FormState>(
    range
      ? {
          minScore: String(range.minScore),
          maxScore: String(range.maxScore),
          riskLevelName: range.riskLevelName,
          recommendationTitle: range.recommendationTitle,
          recommendationText: range.recommendationText,
          isActive: range.isActive,
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setError('')
    if (form.minScore === '' || form.maxScore === '') return setError('Min and max scores are required')
    if (parseFloat(form.minScore) > parseFloat(form.maxScore)) return setError('Min score cannot be greater than max score')
    if (!form.riskLevelName.trim()) return setError('Risk level name is required')
    if (!form.recommendationTitle.trim()) return setError('Recommendation title is required')
    if (!form.recommendationText.trim()) return setError('Recommendation text is required')

    setSaving(true)
    try {
      const url = isEdit ? `/api/recommendations/${range!.id}` : '/api/recommendations'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          minScore: parseFloat(form.minScore),
          maxScore: parseFloat(form.maxScore),
        }),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Edit Recommendation Range' : 'Add Score Range'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Score Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Min Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="e.g. 0"
                value={form.minScore}
                onChange={(e) => set('minScore', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Max Score <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                placeholder="e.g. 2.49"
                value={form.maxScore}
                onChange={(e) => set('maxScore', e.target.value)}
              />
            </div>
          </div>

          {/* Risk Level Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Risk Level Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Low, Moderate, High, Critical"
                value={form.riskLevelName}
                onChange={(e) => set('riskLevelName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <div className="flex items-center gap-3 h-10">
                <button
                  type="button"
                  onClick={() => set('isActive', !form.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-sm font-medium ${form.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recommendation Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Short, actionable title for this risk level"
              value={form.recommendationTitle}
              onChange={(e) => set('recommendationTitle', e.target.value)}
            />
          </div>

          {/* Recommendation Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Recommendation Text <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={5}
              placeholder="Detailed recommendation text shown to users in this risk band..."
              value={form.recommendationText}
              onChange={(e) => set('recommendationText', e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠ {error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Range'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RecommendationsPage() {
  const [ranges, setRanges] = useState<Range[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRange, setEditRange] = useState<Range | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/recommendations')
    const data = await res.json()
    setRanges(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (r: Range) => {
    setTogglingId(r.id)
    await fetch(`/api/recommendations/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !r.isActive }),
    })
    await load()
    setTogglingId(null)
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/recommendations/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    await load()
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Risk Recommendation Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define score bands and the recommendations shown to users for each risk level
          </p>
        </div>
        <button
          onClick={() => { setEditRange(null); setShowModal(true) }}
          className="btn-primary"
        >
          + Add Score Range
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800 flex items-start gap-2">
        <span className="text-base mt-0.5">ℹ️</span>
        <div>
          <strong>How scoring works:</strong> The overall weighted score (0–10) is matched against these ranges to determine risk level.
          People (20%) + Process (40%) + Technology (40%). Higher score = higher risk.
          Ensure ranges are non-overlapping and cover all possible scores.
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading ranges...</p>
        </div>
      ) : ranges.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No recommendation ranges defined yet. Click &quot;Add Score Range&quot; to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {ranges.map((r) => {
            const rc = getRiskColor(r.riskLevelName)
            return (
              <div
                key={r.id}
                className={`card border-l-4 ${rc.border} ${!r.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${rc.badge}`}>
                        {r.riskLevelName}
                      </span>
                      <span className="text-sm font-mono text-gray-500">
                        Score: {r.minScore} — {r.maxScore}
                      </span>
                      {!r.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{r.recommendationTitle}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{r.recommendationText}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(r)}
                      disabled={togglingId === r.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${r.isActive ? 'bg-indigo-600' : 'bg-gray-300'} disabled:opacity-50`}
                      title={r.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${r.isActive ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                    <button
                      onClick={() => { setEditRange(r); setShowModal(true) }}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <RangeModal
          range={editRange}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load() }}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Range?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This score range will be permanently deleted. Existing submissions will not be affected.
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
