'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { href: '/admin/questions', label: 'Question Bank', icon: '📝', exact: false },
  { href: '/admin/recommendations', label: 'Risk Recommendations', icon: '🎯', exact: false },
  { href: '/admin/submissions', label: 'Submitted Reports', icon: '📋', exact: false },
]

function NavItem({ href, label, icon, exact }: { href: string; label: string; icon: string; exact: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
        active
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
          : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
      )}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  // Close sidebar on route change (mobile)
  const pathname = usePathname()
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner">
            🛡️
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Cyber Risk</div>
            <div className="text-indigo-400 text-xs">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* Bottom: Public link + Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
        >
          <span>🌐</span>
          <span>Public Assessment</span>
          <span className="ml-auto text-xs opacity-60">↗</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all text-left"
        >
          <span>🚪</span>
          <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 flex flex-col shadow-2xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-slate-900 px-4 py-3 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <span className="text-white font-bold text-sm">Cyber Risk Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
