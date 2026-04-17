'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Category, Expense } from '@/lib/types'
import YearSelector from '@/components/YearSelector'
import MonthTabs from '@/components/MonthTabs'
import ExpenseTable from '@/components/ExpenseTable'
import ExpenseModal from '@/components/ExpenseModal'
import { Plus, SlidersHorizontal } from 'lucide-react'

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

  useEffect(() => {
    api.expenses.years().then(setYears).catch(() => {})
    api.categories.list().then(setCategories).catch(() => {})
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
    <div className="p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gastos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {expenses.length} gastos · Total: <span className="font-semibold text-slate-900">{formatEur(total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <YearSelector year={year} years={years} onChange={y => { setYear(y); setMonth(null) }} />
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <MonthTabs selected={month} onChange={setMonth} />

        <select
          className="ml-auto rounded-lg border-0 bg-white py-1.5 px-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-indigo-600"
          value={categoryId ?? ''}
          onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

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
