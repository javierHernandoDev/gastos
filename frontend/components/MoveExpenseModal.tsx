'use client'

import { useState } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { Expense } from '@/lib/types'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

interface Props {
  expense: Expense
  onMoved: () => void
  onClose: () => void
}

export default function MoveExpenseModal({ expense, onMoved, onClose }: Props) {
  const [year, setYear] = useState(expense.year)
  const [month, setMonth] = useState(expense.month)
  const [loading, setLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  async function handleMove() {
    setLoading(true)
    try {
      await api.expenses.move(expense.id, { year, month })
      toast.success('Gasto movido correctamente')
      onMoved()
    } catch {
      toast.error('Error al mover el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Mover gasto</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Moviendo: <span className="font-medium text-slate-900">{expense.name}</span>
          </p>

          <div>
            <label className="label">Año destino</label>
            <select
              className="input"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Mes destino</label>
            <select
              className="input"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleMove} className="btn-primary" disabled={loading}>
            {loading ? 'Moviendo...' : 'Mover'}
          </button>
        </div>
      </div>
    </div>
  )
}
