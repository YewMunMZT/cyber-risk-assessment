'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid credentials'); setLoading(false); return }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-uob-dark flex items-center justify-center px-4">

      {/* Background accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-uob-red" />

      <div className="w-full max-w-md">

        {/* UOB Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-5">
            <div className="text-uob-red font-black text-5xl tracking-tight leading-none">UOB</div>
          </div>
          <div className="w-16 h-0.5 bg-uob-red mx-auto mb-4" />
          <h2 className="text-white font-semibold text-lg">Cyber Risk Assessment</h2>
          <p className="text-gray-500 text-sm mt-1">Administrator Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded shadow-2xl overflow-hidden">
          {/* Card top accent */}
          <div className="h-1 bg-uob-red" />

          <div className="p-8">
            <h3 className="text-xl font-bold text-uob-dark mb-1">Sign In</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your administrator credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  autoComplete="email"
                  className="input-field"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-uob-red rounded text-sm text-uob-red-dark flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <a href="/" className="hover:text-gray-400 transition-colors">
            ← Back to public assessment
          </a>
        </p>
      </div>
    </div>
  )
}
