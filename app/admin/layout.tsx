'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

/* ─── SVG Icons ─────────────────────────────────────────────────── */
const DashboardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)
const QuestionIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
)
const TargetIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const DocumentsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
)
const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
)
const LogOutIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
)
const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

/* ─── Nav config ────────────────────────────────────────────────── */
const NAV = [
  { href: '/admin',                 label: 'Dashboard',           Icon: DashboardIcon, exact: true },
  { href: '/admin/questions',       label: 'Question Bank',       Icon: QuestionIcon,  exact: false },
  { href: '/admin/recommendations', label: 'Risk Recommendations',Icon: TargetIcon,    exact: false },
  { href: '/admin/submissions',     label: 'Submitted Reports',   Icon: DocumentsIcon, exact: false },
]

function NavItem({ href, label, Icon, exact }: { href: string; label: string; Icon: () => JSX.Element; exact: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all border-l-2',
        active
          ? 'bg-uob-navy/20 text-white border-uob-navy'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
      )}
    >
      <span className="w-4 flex-shrink-0"><Icon /></span>
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
      {/* Top accent stripe */}
      <div className="h-0.5 bg-uob-navy flex-shrink-0" />

      {/* Brand */}
      <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-uob-red font-black text-2xl tracking-tight leading-none select-none">UOB</span>
          <div className="w-px h-6 bg-white/20" />
          <div>
            <div className="text-white text-xs font-semibold leading-tight">Cyber Risk</div>
            <div className="text-gray-500 text-xs leading-tight">Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-4 mb-2">
          <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Menu</span>
        </div>
        <div className="space-y-0.5">
          {NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom links */}
      <div className="border-t border-white/10 py-2 flex-shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all border-l-2 border-transparent"
        >
          <span className="w-4 flex-shrink-0"><GlobeIcon /></span>
          <span>Public Assessment</span>
          <span className="ml-auto text-xs opacity-50">↗</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-red-400 hover:bg-red-900/10 transition-all border-l-2 border-transparent text-left"
        >
          <span className="w-4 flex-shrink-0"><LogOutIcon /></span>
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-uob-dark px-4 py-3 shadow-md border-b border-uob-navy/40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            <MenuIcon />
          </button>
          <span className="text-uob-red font-black text-xl tracking-tight">UOB</span>
          <span className="text-gray-400 text-sm">Admin Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto bg-uob-light">
          {children}
        </main>
      </div>
    </div>
  )
}
