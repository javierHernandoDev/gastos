'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Receipt, FileText, Home, LogOut } from 'lucide-react'
import clsx from 'clsx'
import { removeToken, getStoredUser } from '@/lib/auth'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/facturas', label: 'Facturas', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = getStoredUser()

  function handleLogout() {
    removeToken()
    router.replace('/login')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 bg-slate-900 flex-col">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Mi Hogar</p>
            <p className="text-xs text-slate-400">Gastos</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800 space-y-3">
          {user && (
            <div className="px-3">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 flex items-center justify-between px-4 h-14 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Home className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-white">Mi Hogar</p>
        </div>
        {user && (
          <span className="text-xs text-slate-400 truncate max-w-[140px]">{user.name}</span>
        )}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex bottom-nav"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-xs font-medium transition-colors',
              isActive(href) ? 'text-indigo-400' : 'text-slate-500'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}
