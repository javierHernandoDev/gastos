'use client'

import { useState } from 'react'
import { Expense, Category } from '@/lib/types'
import { Pencil, Trash2, ArrowRightLeft, FileText, Upload } from 'lucide-react'
import DeleteConfirmModal from './DeleteConfirmModal'
import ExpenseModal from './ExpenseModal'
import MoveExpenseModal from './MoveExpenseModal'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onRefresh: () => void
}

function formatEur(n: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function ExpenseTable({ expenses, categories, onRefresh }: Props) {
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [moveExpense, setMoveExpense] = useState<Expense | null>(null)
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteExpense) return
    setDeleting(true)
    try {
      await api.expenses.delete(deleteExpense.id)
      toast.success('Gasto eliminado')
      onRefresh()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
      setDeleteExpense(null)
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">No hay gastos para este período</p>
        <p className="text-sm text-slate-400 mt-1">Crea tu primer gasto con el botón superior</p>
      </div>
    )
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 font-semibold text-slate-600">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Mes</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Importe</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Facturas</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-slate-900">{exp.name}</p>
                    {exp.description && (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{exp.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {exp.category ? (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: exp.category.color + '20',
                          color: exp.category.color || '#6366f1',
                        }}
                      >
                        {exp.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {MONTH_NAMES[exp.month]}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatEur(exp.amount)}
                  </td>
                  <td className="px-4 py-3">
                    {exp.invoices.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                        <FileText className="h-3.5 w-3.5" />
                        {exp.invoices.length}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setMoveExpense(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Mover"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditExpense(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteExpense(exp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editExpense && (
        <ExpenseModal
          expense={editExpense}
          categories={categories}
          onSaved={() => { setEditExpense(null); onRefresh() }}
          onClose={() => setEditExpense(null)}
        />
      )}

      {moveExpense && (
        <MoveExpenseModal
          expense={moveExpense}
          onMoved={() => { setMoveExpense(null); onRefresh() }}
          onClose={() => setMoveExpense(null)}
        />
      )}

      {deleteExpense && (
        <DeleteConfirmModal
          title="Eliminar gasto"
          message={`¿Seguro que quieres eliminar "${deleteExpense.name}"? También se eliminarán sus facturas.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteExpense(null)}
          loading={deleting}
        />
      )}
    </>
  )
}
