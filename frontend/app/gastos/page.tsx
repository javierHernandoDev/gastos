'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Category, Expense, UserSettings } from '@/lib/types'
import YearSelector from '@/components/YearSelector'
import MonthTabs from '@/components/MonthTabs'
import ExpenseTable from '@/components/ExpenseTable'
import ExpenseModal from '@/components/ExpenseModal'
import { Plus, AlertTriangle } from 'lucide-react'

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function GastosPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [years, setYears] = useState<number[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  useEffect(() => {
    api.expenses.years().then(setYears).catch(() => {})
    api.categories.list().then(setCategories).catch(() => {})
    api.settings.get().then(setSettings).catch(() => {})
  }, [])

  const refresh = useCallback(() => {
    setLoading(true)
    api.expenses
      .list({ year, month: month ?? undefined, categoryId })
      .then(setExpenses)
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false))
    api.expenses.years().then(setYears).catch(() => {})
  }, [year, month, categoryId])

  useEffect(() => { refresh() }, [refresh])

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Gastos</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {expenses.length} gastos · <span className="font-semibold text-slate-900">{formatEur(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <YearSelector year={year} years={years} onChange={y => { setYear(y); setMonth(null) }} />
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo gasto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <MonthTabs selected={month} onChange={setMonth} />
        <select
          className="rounded-lg border-0 bg-white py-1.5 px-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
          value={categoryId ?? ''}
          onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Budget indicator — only when a month is selected and budget is set */}
      {month && settings?.monthlyBudget != null && (() => {
        const budget = settings.monthlyBudget!
        const rawPct = total / budget * 100
        const pct = Math.min(Math.round(rawPct), 100)
        const over = total >= budget
        const barColor = over ? '#ef4444' : rawPct >= 80 ? '#f59e0b' : '#6366f1'
        return (
          <div style={{ border: `1px solid ${over ? '#fecaca' : '#e2e8f0'}`, background: over ? '#fef2f2' : '#ffffff' }}
               className="rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2">
                {over && <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: '#ef4444' }} />}
                <span className="text-sm font-medium" style={{ color: over ? '#b91c1c' : '#374151' }}>
                  {over ? 'Límite mensual superado' : 'Presupuesto mensual'}
                </span>
              </div>
              <span className="text-sm font-semibold" style={{ color: over ? '#dc2626' : '#0f172a' }}>
                {formatEur(total)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ {formatEur(budget)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <p className="mt-1.5 text-xs text-right" style={{ color: '#94a3b8' }}>{pct}% utilizado</p>
          </div>
        )
      })()}

      {loading ? (
        <div className="card h-48 animate-pulse bg-slate-100" />
      ) : (
        <ExpenseTable expenses={expenses} categories={categories} onRefresh={refresh} />
      )}

      {showCreate && (
        <ExpenseModal
          categories={categories}
          onSaved={() => { setShowCreate(false); refresh() }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
