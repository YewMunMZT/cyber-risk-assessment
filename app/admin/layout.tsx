'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

const NAV = [
  { href: '/admin',             label: 'Dashboard',              icon: '📊', exact: true },
  { href: '/admin/questions',   label: 'Question Bank',          icon: '📝', exact: false },
  { href: '/admin/recommendations', label: 'Risk Recommendations', icon: '🎯', exact: false },
  { href: '/admin/submissions', label: 'Submitted Reports',      icon: '📋', exact: false },
]

function NavItem({ href, label, icon, exact }: { href: string; label: string; icon: string; exact: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2',
        active
          ? 'bg-uob-red/15 text-white border-uob-red'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
      )}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-uob-dark">

      {/* UOB Brand top accent */}
      <div className="h-1 bg-uob-red flex-shrink-0" />

      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-uob-red font-black text-2xl tracking-tight leading-none select-none">UOB</div>
          <div className="w-px h-6 bg-white/20" />
          <div>
            <div className="text-white text-xs font-semibold">Cyber Risk</div>
            <div className="text-gray-500 text-xs">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Menu</span>
        </div>
        <div className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="border-t border-white/10 py-3 flex-shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all border-l-2 border-transparent"
        >
          <span className="w-5 text-center">🌐</span>
          <span>Public Assessment</span>
          <span className="ml-auto text-xs opacity-50">↗</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-uob-red hover:bg-red-900/10 transition-all border-l-2 border-transparent text-left"
        >
          <span className="w-5 text-center">🚪</span>
          <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-uob-light overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 shadow-xl">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 flex flex-col shadow-2xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-uob-dark px-4 py-3 shadow-md border-b border-uob-red">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-uob-red font-black text-xl tracking-tight">UOB</div>
          <span className="text-gray-400 text-sm">Admin Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-uob-light">
          {children}
        </main>
      </div>
    </div>
  )
}
