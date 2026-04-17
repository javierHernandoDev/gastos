'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt, FileText, Home } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: Receipt },
  { href: '/facturas', label: 'Facturas', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
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
              pathname === href
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">Gastos del Hogar v1.0</p>
      </div>
    </aside>
  )
}
