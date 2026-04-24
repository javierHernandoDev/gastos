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
        const pct = Math.min(Math.round((total / budget) * 100), 100)
        const over = total >= budget
        return (
          <div className={`rounded-xl border px-4 py-3 ${over ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2">
                {over && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                <span className={`text-sm font-medium ${over ? 'text-red-700' : 'text-slate-700'}`}>
                  {over ? 'Límite mensual superado' : 'Presupuesto mensual'}
                </span>
              </div>
              <span className={`text-sm font-semibold ${over ? 'text-red-600' : 'text-slate-900'}`}>
                {formatEur(total)} <span className="font-normal text-slate-400">/ {formatEur(budget)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400 text-right">{pct}% utilizado</p>
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
