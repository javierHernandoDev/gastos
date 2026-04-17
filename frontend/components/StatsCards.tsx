'use client'

import { YearStats } from '@/lib/types'
import { TrendingUp, Receipt, CalendarDays, Euro } from 'lucide-react'

interface Props {
  stats: YearStats
}

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function StatsCards({ stats }: Props) {
  const monthsWithExpenses = stats.monthlyStats.filter(m => m.amount > 0).length
  const avgMonthly = monthsWithExpenses > 0 ? stats.totalAmount / monthsWithExpenses : 0
  const maxMonth = stats.monthlyStats.reduce(
    (acc, m) => (m.amount > acc.amount ? m : acc),
    stats.monthlyStats[0]
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="card flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
          <Euro className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Total anual</p>
          <p className="text-2xl font-bold text-slate-900">{formatEur(stats.totalAmount)}</p>
        </div>
      </div>

      <div className="card flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
          <Receipt className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Nº de gastos</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalExpenses}</p>
        </div>
      </div>

      <div className="card flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
          <TrendingUp className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Media mensual</p>
          <p className="text-2xl font-bold text-slate-900">{formatEur(avgMonthly)}</p>
        </div>
      </div>

      <div className="card flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
          <CalendarDays className="h-5 w-5 text-rose-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Mes más caro</p>
          <p className="text-2xl font-bold text-slate-900">{maxMonth?.monthName ?? '-'}</p>
          <p className="text-xs text-slate-400">{formatEur(maxMonth?.amount ?? 0)}</p>
        </div>
      </div>
    </div>
  )
}
