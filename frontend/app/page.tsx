'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { YearStats } from '@/lib/types'
import StatsCards from '@/components/StatsCards'
import YearSelector from '@/components/YearSelector'
import { TrendingUp } from 'lucide-react'

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [years, setYears] = useState<number[]>([])
  const [stats, setStats] = useState<YearStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.expenses.years().then(setYears).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    api.expenses.stats(year)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [year])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de gastos del hogar</p>
        </div>
        <YearSelector year={year} years={years} onChange={setYear} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : stats ? (
        <StatsCards stats={stats} />
      ) : null}

      {stats && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Desglose mensual {year}</h2>
          </div>
          <div className="space-y-3">
            {stats.monthlyStats.map(m => {
              const pct = stats.totalAmount > 0
                ? Math.round((m.amount / stats.totalAmount) * 100)
                : 0
              return (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-slate-600 flex-shrink-0">{m.monthName}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-28 text-sm font-medium text-slate-900 text-right">
                    {formatEur(m.amount)}
                  </span>
                  <span className="w-8 text-xs text-slate-400 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
